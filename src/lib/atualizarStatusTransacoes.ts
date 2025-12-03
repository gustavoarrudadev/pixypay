import { supabase } from './supabase'

/**
 * Executa manualmente a atualização de status de transações
 * Atualiza transações pendentes para liberado quando data_repasse_prevista é atingida
 */
export async function executarAtualizacaoStatusTransacoes(): Promise<{
  atualizadas: number
  error: Error | null
  mensagem?: string
}> {
  try {
    // Conta quantas transações serão atualizadas antes da execução
    const { count: antesCount } = await supabase
      .from('transacoes_financeiras')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')
      .lte('data_repasse_prevista', new Date().toISOString().split('T')[0])

    // Chama a função SQL que atualiza as transações
    const { error } = await supabase.rpc('atualizar_status_transacoes_liberadas')

    if (error) {
      console.error('❌ Erro ao atualizar status das transações:', error)
      return {
        atualizadas: 0,
        error,
        mensagem: 'Erro ao atualizar status das transações',
      }
    }

    return {
      atualizadas: antesCount || 0,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar status:', error)
    return {
      atualizadas: 0,
      error: error instanceof Error ? error : new Error('Erro ao atualizar status'),
      mensagem: 'Erro inesperado ao atualizar status das transações',
    }
  }
}

