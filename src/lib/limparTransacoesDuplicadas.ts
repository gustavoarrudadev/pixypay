import { supabase } from './supabase'

/**
 * Remove transações financeiras duplicadas, mantendo apenas a mais antiga de cada pedido
 */
export async function limparTransacoesDuplicadas(): Promise<{
  removidas: number
  error: Error | null
}> {
  try {
    console.log('🧹 [limparTransacoesDuplicadas] Iniciando limpeza de transações duplicadas...')

    // Buscar todos os pedidos com múltiplas transações
    const { data: pedidosDuplicados, error: queryError } = await supabase.rpc(
      'buscar_transacoes_duplicadas'
    ).catch(async () => {
      // Se a função RPC não existir, usar query SQL direta
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select('pedido_id, id, criado_em')
        .order('pedido_id')
        .order('criado_em', { ascending: true })

      if (error) throw error

      // Agrupar por pedido_id
      const grupos = new Map<string, Array<{ id: string; criado_em: string }>>()
      data?.forEach((t: any) => {
        if (!grupos.has(t.pedido_id)) {
          grupos.set(t.pedido_id, [])
        }
        grupos.get(t.pedido_id)!.push({ id: t.id, criado_em: t.criado_em })
      })

      // Filtrar apenas grupos com mais de 1 transação
      const duplicados: Array<{ pedido_id: string; transacoes: Array<{ id: string; criado_em: string }> }> = []
      grupos.forEach((transacoes, pedido_id) => {
        if (transacoes.length > 1) {
          duplicados.push({ pedido_id, transacoes })
        }
      })

      return { data: duplicados, error: null }
    })

    if (queryError) {
      console.error('❌ [limparTransacoesDuplicadas] Erro ao buscar duplicados:', queryError)
      return {
        removidas: 0,
        error: queryError,
      }
    }

    if (!pedidosDuplicados || pedidosDuplicados.length === 0) {
      console.log('✅ [limparTransacoesDuplicadas] Nenhuma transação duplicada encontrada')
      return {
        removidas: 0,
        error: null,
      }
    }

    console.log(`📊 [limparTransacoesDuplicadas] Encontrados ${pedidosDuplicados.length} pedido(s) com transações duplicadas`)

    let totalRemovidas = 0

    // Para cada pedido com duplicados, manter apenas a transação mais antiga
    for (const item of pedidosDuplicados) {
      const pedidoId = item.pedido_id || (item as any).pedido_id
      const transacoes = item.transacoes || (item as any).transacoes || []

      if (transacoes.length <= 1) continue

      // Ordenar por data de criação (mais antiga primeiro)
      const transacoesOrdenadas = [...transacoes].sort(
        (a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
      )

      // Manter a primeira (mais antiga), remover as demais
      const transacaoManter = transacoesOrdenadas[0]
      const transacoesRemover = transacoesOrdenadas.slice(1)

      console.log(`🔄 [limparTransacoesDuplicadas] Pedido ${pedidoId}: mantendo transação ${transacaoManter.id}, removendo ${transacoesRemover.length} duplicada(s)`)

      // Remover transações duplicadas
      const idsParaRemover = transacoesRemover.map((t) => t.id)
      const { error: deleteError } = await supabase
        .from('transacoes_financeiras')
        .delete()
        .in('id', idsParaRemover)

      if (deleteError) {
        console.error(`❌ [limparTransacoesDuplicadas] Erro ao remover duplicados do pedido ${pedidoId}:`, deleteError)
      } else {
        totalRemovidas += idsParaRemover.length
        console.log(`✅ [limparTransacoesDuplicadas] Removidas ${idsParaRemover.length} transação(ões) duplicada(s) do pedido ${pedidoId}`)
      }
    }

    console.log(`✅ [limparTransacoesDuplicadas] Limpeza concluída: ${totalRemovidas} transação(ões) removida(s)`)
    return {
      removidas: totalRemovidas,
      error: null,
    }
  } catch (error) {
    console.error('❌ [limparTransacoesDuplicadas] Erro inesperado:', error)
    return {
      removidas: 0,
      error: error instanceof Error ? error : new Error('Erro ao limpar transações duplicadas'),
    }
  }
}

