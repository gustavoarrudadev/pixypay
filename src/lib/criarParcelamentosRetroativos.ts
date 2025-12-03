import { supabase } from './supabase'

/**
 * Cria parcelamentos para pedidos que foram criados sem parcelamento
 * Esta função corrige pedidos antigos que não tiveram parcelamento criado
 */
export async function criarParcelamentosRetroativos(): Promise<{ criados: number; erros: number }> {
  try {
    // Busca pedidos parcelados sem parcelamento usando uma subquery
    // Primeiro busca todos os pedidos parcelados
    const { data: todosPedidosParcelados, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id, valor_total, parcelas_total, forma_pagamento, criado_em')
      .eq('forma_pagamento', 'pix_parcelado')
      .not('parcelas_total', 'is', null)

    if (pedidosError) {
      console.error('❌ Erro ao buscar pedidos parcelados:', pedidosError)
      return { criados: 0, erros: 0 }
    }

    if (!todosPedidosParcelados || todosPedidosParcelados.length === 0) {
      return { criados: 0, erros: 0 }
    }

    // Busca todos os parcelamentos existentes
    const { data: parcelamentosExistentes, error: parcelamentosError } = await supabase
      .from('parcelamentos')
      .select('pedido_id')

    if (parcelamentosError) {
      console.error('❌ Erro ao buscar parcelamentos existentes:', parcelamentosError)
      return { criados: 0, erros: 0 }
    }

    const pedidosIdsComParcelamento = new Set(
      (parcelamentosExistentes || []).map(p => p.pedido_id)
    )

    // Filtra apenas os pedidos que não têm parcelamento
    const pedidosSemParcelamento = todosPedidosParcelados.filter(
      pedido => !pedidosIdsComParcelamento.has(pedido.id)
    )

    if (pedidosError) {
      console.error('❌ Erro ao buscar pedidos sem parcelamento:', pedidosError)
      return { criados: 0, erros: 0 }
    }

    if (!pedidosSemParcelamento || pedidosSemParcelamento.length === 0) {
      return { criados: 0, erros: 0 }
    }

    let criados = 0
    let erros = 0

    for (const pedido of pedidosSemParcelamento) {
      try {
        const valorTotal = Number(pedido.valor_total)
        const totalParcelas = pedido.parcelas_total || 1
        const valorParcela = valorTotal / totalParcelas

        // Cria o parcelamento
        const { data: parcelamentoData, error: parcelamentoError } = await supabase
          .from('parcelamentos')
          .insert({
            pedido_id: pedido.id,
            total_parcelas: totalParcelas,
            valor_total: valorTotal,
            valor_parcela: valorParcela,
            status: 'ativo',
          })
          .select()
          .single()

        if (parcelamentoError) {
          console.error(`❌ Erro ao criar parcelamento para pedido ${pedido.id}:`, parcelamentoError)
          erros++
          continue
        }

        // Cria as parcelas com regras fixas da plataforma:
        // 2x: Entrada (data criação) + última parcela em 15 dias
        // 3x: Entrada (data criação) + uma em 15 dias + outra em 30 dias
        const dataCriacaoPedido = new Date(pedido.criado_em)
        const parcelasParaInserir = []

        for (let i = 1; i <= totalParcelas; i++) {
          const dataVencimento = new Date(dataCriacaoPedido)
          
          if (i === 1) {
            // Primeira parcela (entrada) - vencimento na data de criação do pedido
            dataVencimento.setDate(dataCriacaoPedido.getDate())
          } else if (i === 2 && totalParcelas === 2) {
            // Segunda parcela em 2x - sempre 15 dias
            dataVencimento.setDate(dataCriacaoPedido.getDate() + 15)
          } else if (i === 2 && totalParcelas === 3) {
            // Segunda parcela em 3x - 15 dias
            dataVencimento.setDate(dataCriacaoPedido.getDate() + 15)
          } else if (i === 3) {
            // Terceira parcela em 3x - 30 dias
            dataVencimento.setDate(dataCriacaoPedido.getDate() + 30)
          }

          parcelasParaInserir.push({
            parcelamento_id: parcelamentoData.id,
            numero_parcela: i,
            valor: valorParcela,
            data_vencimento: dataVencimento.toISOString().split('T')[0],
            status: i === 1 ? 'paga' : 'pendente',
            data_pagamento: i === 1 ? dataVencimento.toISOString().split('T')[0] : null, // Formato DATE
          })
        }

        const { error: parcelasError } = await supabase
          .from('parcelas')
          .insert(parcelasParaInserir)

        if (parcelasError) {
          console.error(`❌ Erro ao criar parcelas para pedido ${pedido.id}:`, parcelasError)
          erros++
          continue
        }

        criados++
      } catch (error) {
        console.error(`❌ Erro inesperado ao processar pedido ${pedido.id}:`, error)
        erros++
      }
    }

    return { criados, erros }
  } catch (error) {
    console.error('❌ Erro inesperado ao criar parcelamentos retroativos:', error)
    return { criados: 0, erros: 0 }
  }
}

