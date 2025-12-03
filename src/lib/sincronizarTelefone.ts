import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

/**
 * Sincroniza o telefone dos metadados para o campo phone do Supabase
 * Esta função deve ser chamada sempre que o usuário tiver uma sessão válida
 * Nota: Se não houver SMS provider configurado, apenas retorna true sem erro
 */
export async function sincronizarTelefone(user: User | null): Promise<boolean> {
  if (!user) return false

  const telefoneNosMetadados = user.user_metadata?.telefone
  
  // Se não há telefone nos metadados, não há nada para sincronizar
  if (!telefoneNosMetadados) {
    return true // Retorna true pois não há erro, apenas não há nada para sincronizar
  }

  // Se o telefone já está no campo phone, não precisa atualizar
  if (user.phone === telefoneNosMetadados) {
    return true
  }

  // Tenta atualizar o telefone apenas se houver SMS provider configurado
  // Caso contrário, apenas retorna true (telefone já está nos metadados)
  try {
    const { error } = await supabase.auth.updateUser({
      phone: telefoneNosMetadados,
    })

    if (error) {
      // Se o erro for relacionado a SMS provider, apenas ignora (telefone já está nos metadados)
      if (error.message && (error.message.includes('SMS provider') || error.message.includes('Unable to get SMS provider'))) {
        console.warn('⚠️ SMS provider não configurado. Telefone permanece apenas nos metadados.')
        return true // Retorna true pois não é um erro crítico
      }
      console.warn('Erro ao sincronizar telefone:', error)
      return false
    }

    console.log('Telefone sincronizado com sucesso')
    return true
  } catch (err) {
    console.warn('Erro ao tentar sincronizar telefone:', err)
    // Se o erro for relacionado a SMS provider, retorna true (não é crítico)
    if (err instanceof Error && (err.message.includes('SMS provider') || err.message.includes('Unable to get SMS provider'))) {
      return true
    }
    return false
  }
}

