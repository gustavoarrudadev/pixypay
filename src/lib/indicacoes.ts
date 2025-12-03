import { supabase } from './supabase'

/**
 * Busca o código de indicação de um usuário
 */
export async function obterCodigoIndicacao(usuarioId: string): Promise<{ codigo: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('codigo_indicacao')
      .eq('id', usuarioId)
      .single()

    if (error) {
      return { codigo: null, error }
    }

    return { codigo: data?.codigo_indicacao || null, error: null }
  } catch (error) {
    return { codigo: null, error: error as Error }
  }
}

/**
 * Busca informações de indicação (total de amigos indicados)
 */
export async function obterInfoIndicacoes(usuarioId: string): Promise<{ totalIndicacoes: number; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('total_indicacoes')
      .eq('id', usuarioId)
      .single()

    if (error) {
      return { totalIndicacoes: 0, error }
    }

    return { totalIndicacoes: data?.total_indicacoes || 0, error: null }
  } catch (error) {
    return { totalIndicacoes: 0, error: error as Error }
  }
}

/**
 * Busca o ID do usuário que possui um código de indicação
 */
export async function buscarUsuarioPorCodigo(codigo: string): Promise<{ usuarioId: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id')
      .eq('codigo_indicacao', codigo.toUpperCase())
      .single()

    if (error) {
      return { usuarioId: null, error }
    }

    return { usuarioId: data?.id || null, error: null }
  } catch (error) {
    return { usuarioId: null, error: error as Error }
  }
}

/**
 * Registra que um usuário foi indicado por outro
 * Usa função RPC para garantir que funcione mesmo com RLS
 */
export async function registrarIndicacao(usuarioId: string, codigoIndicacao: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    console.log('🔍 Registrando indicação via RPC:', { usuarioId, codigo: codigoIndicacao })
    
    // Usa função RPC para garantir que funcione mesmo com RLS
    const { data, error: rpcError } = await supabase.rpc('registrar_indicacao_rpc', {
      usuario_id: usuarioId,
      codigo_indicacao: codigoIndicacao.toUpperCase().trim()
    })

    console.log('📊 Resultado do RPC:', { data, rpcError })

    if (rpcError) {
      console.error('❌ Erro no RPC:', rpcError)
      return { success: false, error: rpcError }
    }

    if (data && data.success) {
      console.log('✅ Indicação registrada com sucesso via RPC')
      return { success: true, error: null }
    } else {
      const errorMsg = (data as any)?.error || 'Erro desconhecido ao registrar indicação'
      console.error('❌ Erro ao registrar indicação:', errorMsg)
      return { success: false, error: new Error(errorMsg) }
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao registrar indicação:', error)
    return { success: false, error: error as Error }
  }
}

