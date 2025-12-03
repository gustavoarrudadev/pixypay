import { supabase } from './supabase'
import { criarTransacaoFinanceira } from './financeiro'

/**
 * Processa pedidos existentes e cria transações financeiras retroativas
 * Usa a modalidade padrão (D+30) ou a modalidade atual da revenda
 */
export async function processarPedidosExistentes(
  revendaId?: string
): Promise<{
  processados: number
  erros: number
  detalhes: Array<{ pedidoId: string; sucesso: boolean; erro?: string }>
  error: Error | null
}> {
  try {
    // Busca pedidos que não têm transação financeira associada
    let query = supabase
      .from('pedidos')
      .select(`
        id,
        revenda_id,
        cliente_id,
        valor_total,
        criado_em,
        forma_pagamento,
        parcelas_total
      `)
      .order('criado_em', { ascending: true })

    if (revendaId) {
      query = query.eq('revenda_id', revendaId)
    }

    const { data: pedidos, error: pedidosError } = await query

    if (pedidosError) {
      console.error('❌ Erro ao buscar pedidos:', pedidosError)
      return {
        processados: 0,
        erros: 0,
        detalhes: [],
        error: pedidosError,
      }
    }

    if (!pedidos || pedidos.length === 0) {
      return {
        processados: 0,
        erros: 0,
        detalhes: [],
        error: null,
      }
    }

    // Busca quais pedidos já têm transação financeira
    const { data: transacoesExistentes } = await supabase
      .from('transacoes_financeiras')
      .select('pedido_id')

    const pedidosComTransacao = new Set(
      transacoesExistentes?.map((t) => t.pedido_id) || []
    )

    // Filtra pedidos sem transação financeira
    const pedidosParaProcessar = pedidos.filter(
      (pedido) => !pedidosComTransacao.has(pedido.id)
    )

    if (pedidosParaProcessar.length === 0) {
      return {
        processados: 0,
        erros: 0,
        detalhes: [],
        error: null,
      }
    }

    console.log(`📊 Processando ${pedidosParaProcessar.length} pedidos...`)

    const detalhes: Array<{ pedidoId: string; sucesso: boolean; erro?: string }> = []
    let processados = 0
    let erros = 0

    // Processa cada pedido
    for (const pedido of pedidosParaProcessar) {
      try {
        // Usa a data de criação do pedido como data de pagamento
        const dataPagamento = pedido.criado_em || new Date().toISOString()

        const { error: transacaoError } = await criarTransacaoFinanceira(
          pedido.id,
          pedido.revenda_id,
          pedido.cliente_id,
          pedido.valor_total,
          dataPagamento,
          pedido.unidade_id || null
        )

        if (transacaoError) {
          console.error(`❌ Erro ao processar pedido ${pedido.id}:`, transacaoError)
          detalhes.push({
            pedidoId: pedido.id,
            sucesso: false,
            erro: transacaoError.message,
          })
          erros++
        } else {
          console.log(`✅ Pedido ${pedido.id} processado com sucesso`)
          detalhes.push({
            pedidoId: pedido.id,
            sucesso: true,
          })
          processados++
        }
      } catch (error) {
        console.error(`❌ Erro inesperado ao processar pedido ${pedido.id}:`, error)
        detalhes.push({
          pedidoId: pedido.id,
          sucesso: false,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        })
        erros++
      }
    }

    console.log(`✅ Processamento concluído: ${processados} sucessos, ${erros} erros`)

    return {
      processados,
      erros,
      detalhes,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao processar pedidos existentes:', error)
    return {
      processados: 0,
      erros: 0,
      detalhes: [],
      error: error instanceof Error ? error : new Error('Erro ao processar pedidos'),
    }
  }
}

/**
 * Processa um pedido específico
 */
export async function processarPedidoEspecifico(
  pedidoId: string
): Promise<{ sucesso: boolean; error: Error | null; mensagem?: string }> {
  try {
    // Verifica se já existe transação financeira
    const { data: transacaoExistente } = await supabase
      .from('transacoes_financeiras')
      .select('id')
      .eq('pedido_id', pedidoId)
      .single()

    if (transacaoExistente) {
      return {
        sucesso: false,
        error: new Error('Pedido já possui transação financeira'),
        mensagem: 'Este pedido já possui uma transação financeira associada',
      }
    }

    // Busca dados do pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('id, revenda_id, cliente_id, valor_total, criado_em')
      .eq('id', pedidoId)
      .single()

    if (pedidoError || !pedido) {
      return {
        sucesso: false,
        error: pedidoError || new Error('Pedido não encontrado'),
        mensagem: 'Erro ao buscar pedido',
      }
    }

    // Cria transação financeira
    const dataPagamento = pedido.criado_em || new Date().toISOString()
    const { error: transacaoError } = await criarTransacaoFinanceira(
      pedido.id,
      pedido.revenda_id,
      pedido.cliente_id,
      pedido.valor_total,
      dataPagamento,
      pedido.unidade_id || null
    )

    if (transacaoError) {
      return {
        sucesso: false,
        error: transacaoError,
        mensagem: 'Erro ao criar transação financeira',
      }
    }

    return {
      sucesso: true,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao processar pedido:', error)
    return {
      sucesso: false,
      error: error instanceof Error ? error : new Error('Erro ao processar pedido'),
      mensagem: 'Erro inesperado ao processar pedido',
    }
  }
}

