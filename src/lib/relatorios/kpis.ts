import { supabase } from '../supabase'

/**
 * Interface para KPIs de vendas
 */
export interface KPIVendas {
  totalVendasBruto: number
  totalVendasLiquido: number
  numeroPedidos: number
  ticketMedio: number
  vendasPorStatus: Record<string, number>
  vendasPorFormaPagamento: Record<string, number>
  vendasPorTipoEntrega: Record<string, number>
}

/**
 * Interface para KPIs de produtos
 */
export interface KPIProdutos {
  totalProdutos: number
  produtosMaisVendidos: Array<{
    produto_id: string
    nome: string
    quantidade: number
    valor_total: number
  }>
  produtosMenosVendidos: Array<{
    produto_id: string
    nome: string
    quantidade: number
    valor_total: number
  }>
}

/**
 * Interface para KPIs de clientes
 */
export interface KPIClientes {
  totalClientes: number
  clientesMaisFrequentes: Array<{
    cliente_id: string
    nome: string
    email: string
    total_pedidos: number
    ticket_medio: number
  }>
  clientesMaiorTicketMedio: Array<{
    cliente_id: string
    nome: string
    email: string
    ticket_medio: number
    total_pedidos: number
  }>
  novosClientes: number
}

/**
 * Interface para KPIs financeiros
 */
export interface KPIFinanceiro {
  receitaBruta: number
  receitaLiquida: number
  taxasTotais: number
  repassesPendentes: number
  repassesRealizados: number
  inadimplencia: number
}

/**
 * Interface para KPIs de parcelamentos
 */
export interface KPIParcelamentos {
  totalParcelamentosAtivos: number
  valorTotalParcelamentos: number
  parcelasPagas: number
  parcelasPendentes: number
  taxaInadimplencia: number
}

/**
 * Interface para KPIs de agendamentos
 */
export interface KPIAgendamentos {
  totalAgendamentos: number
  taxaConclusao: number
  agendamentosPorTipo: Record<string, number>
}

/**
 * Calcula KPIs de vendas
 */
export async function calcularKPIVendas(
  revendaId?: string,
  dataInicio?: string,
  dataFim?: string,
  unidadeId?: string | null
): Promise<{ kpis: KPIVendas; error: Error | null }> {
  try {
    let query = supabase
      .from('pedidos')
      .select('id, valor_total, status, forma_pagamento, tipo_entrega, criado_em')

    if (revendaId) {
      query = query.eq('revenda_id', revendaId)
    }

    if (unidadeId) {
      query = query.eq('unidade_id', unidadeId)
    }

    if (dataInicio) {
      query = query.gte('criado_em', dataInicio)
    }

    if (dataFim) {
      query = query.lte('criado_em', dataFim)
    }

    const { data: pedidos, error } = await query

    if (error) {
      return {
        kpis: {
          totalVendasBruto: 0,
          totalVendasLiquido: 0,
          numeroPedidos: 0,
          ticketMedio: 0,
          vendasPorStatus: {},
          vendasPorFormaPagamento: {},
          vendasPorTipoEntrega: {},
        },
        error,
      }
    }

    const pedidosArray = pedidos || []

    // Calcular valores brutos
    const totalVendasBruto = pedidosArray.reduce((acc, p) => acc + Number(p.valor_total || 0), 0)

    // Buscar transações financeiras para calcular líquido
    let queryTransacoes = supabase.from('transacoes_financeiras').select('valor_liquido')

    if (revendaId) {
      queryTransacoes = queryTransacoes.eq('revenda_id', revendaId)
    }

    if (dataInicio) {
      queryTransacoes = queryTransacoes.gte('data_pagamento', dataInicio)
    }

    if (dataFim) {
      queryTransacoes = queryTransacoes.lte('data_pagamento', dataFim)
    }

    const { data: transacoes } = await queryTransacoes
    const totalVendasLiquido = (transacoes || []).reduce(
      (acc, t) => acc + Number(t.valor_liquido || 0),
      0
    )

    // Agrupar por status
    const vendasPorStatus: Record<string, number> = {}
    pedidosArray.forEach((p) => {
      const status = p.status || 'desconhecido'
      vendasPorStatus[status] = (vendasPorStatus[status] || 0) + Number(p.valor_total || 0)
    })

    // Agrupar por forma de pagamento
    const vendasPorFormaPagamento: Record<string, number> = {}
    pedidosArray.forEach((p) => {
      const forma = p.forma_pagamento || 'desconhecido'
      vendasPorFormaPagamento[forma] =
        (vendasPorFormaPagamento[forma] || 0) + Number(p.valor_total || 0)
    })

    // Agrupar por tipo de entrega
    const vendasPorTipoEntrega: Record<string, number> = {}
    pedidosArray.forEach((p) => {
      const tipo = p.tipo_entrega || 'desconhecido'
      vendasPorTipoEntrega[tipo] = (vendasPorTipoEntrega[tipo] || 0) + Number(p.valor_total || 0)
    })

    const numeroPedidos = pedidosArray.length
    const ticketMedio = numeroPedidos > 0 ? totalVendasBruto / numeroPedidos : 0

    return {
      kpis: {
        totalVendasBruto,
        totalVendasLiquido,
        numeroPedidos,
        ticketMedio,
        vendasPorStatus,
        vendasPorFormaPagamento,
        vendasPorTipoEntrega,
      },
      error: null,
    }
  } catch (error) {
    return {
      kpis: {
        totalVendasBruto: 0,
        totalVendasLiquido: 0,
        numeroPedidos: 0,
        ticketMedio: 0,
        vendasPorStatus: {},
        vendasPorFormaPagamento: {},
        vendasPorTipoEntrega: {},
      },
      error: error as Error,
    }
  }
}

/**
 * Calcula KPIs de produtos
 */
export async function calcularKPIProdutos(
  revendaId?: string,
  dataInicio?: string,
  dataFim?: string,
  topN: number = 10,
  unidadeId?: string | null
): Promise<{ kpis: KPIProdutos; error: Error | null }> {
  try {
    // Buscar produtos
    let queryProdutos = supabase.from('produtos').select('id, nome')

    if (revendaId) {
      queryProdutos = queryProdutos.eq('revenda_id', revendaId)
    }

    if (unidadeId) {
      queryProdutos = queryProdutos.eq('unidade_id', unidadeId)
    }

    const { data: produtos, error: produtosError } = await queryProdutos

    if (produtosError) {
      return {
        kpis: {
          totalProdutos: 0,
          produtosMaisVendidos: [],
          produtosMenosVendidos: [],
        },
        error: produtosError,
      }
    }

    // Buscar itens de pedido
    let queryItens = supabase
      .from('itens_pedido')
      .select(
        `
        quantidade,
        subtotal,
        produto_id,
        produto:produtos(id, nome),
        pedido:pedidos!inner(criado_em, revenda_id, unidade_id)
      `
      )

    if (revendaId) {
      queryItens = queryItens.eq('pedido.revenda_id', revendaId)
    }

    if (unidadeId) {
      queryItens = queryItens.eq('pedido.unidade_id', unidadeId)
    }

    if (dataInicio) {
      queryItens = queryItens.gte('pedido.criado_em', dataInicio)
    }

    if (dataFim) {
      queryItens = queryItens.lte('pedido.criado_em', dataFim)
    }

    const { data: itens, error: itensError } = await queryItens

    if (itensError) {
      return {
        kpis: {
          totalProdutos: produtos?.length || 0,
          produtosMaisVendidos: [],
          produtosMenosVendidos: [],
        },
        error: itensError,
      }
    }

    // Agrupar por produto
    const produtosMap: Record<
      string,
      { produto_id: string; nome: string; quantidade: number; valor_total: number }
    > = {}

    ;(itens || []).forEach((item: any) => {
      const produtoId = item.produto_id
      const produto = Array.isArray(item.produto) ? item.produto[0] : item.produto
      const nome = produto?.nome || 'Produto desconhecido'

      if (!produtosMap[produtoId]) {
        produtosMap[produtoId] = {
          produto_id: produtoId,
          nome,
          quantidade: 0,
          valor_total: 0,
        }
      }

      produtosMap[produtoId].quantidade += Number(item.quantidade || 0)
      produtosMap[produtoId].valor_total += Number(item.subtotal || 0)
    })

    const produtosArray = Object.values(produtosMap)

    // Ordenar por quantidade (mais vendidos)
    const produtosMaisVendidos = [...produtosArray]
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, topN)

    // Ordenar por quantidade (menos vendidos)
    const produtosMenosVendidos = [...produtosArray]
      .sort((a, b) => a.quantidade - b.quantidade)
      .slice(0, topN)

    return {
      kpis: {
        totalProdutos: produtos?.length || 0,
        produtosMaisVendidos,
        produtosMenosVendidos,
      },
      error: null,
    }
  } catch (error) {
    return {
      kpis: {
        totalProdutos: 0,
        produtosMaisVendidos: [],
        produtosMenosVendidos: [],
      },
      error: error as Error,
    }
  }
}

/**
 * Calcula KPIs de clientes
 */
export async function calcularKPIClientes(
  revendaId?: string,
  dataInicio?: string,
  dataFim?: string,
  topN: number = 10,
  unidadeId?: string | null
): Promise<{ kpis: KPIClientes; error: Error | null }> {
  try {
    // Buscar pedidos
    let queryPedidos = supabase
      .from('pedidos')
      .select('id, cliente_id, valor_total, criado_em, revenda_id, unidade_id')

    if (revendaId) {
      queryPedidos = queryPedidos.eq('revenda_id', revendaId)
    }

    if (unidadeId) {
      queryPedidos = queryPedidos.eq('unidade_id', unidadeId)
    }

    if (dataInicio) {
      queryPedidos = queryPedidos.gte('criado_em', dataInicio)
    }

    if (dataFim) {
      queryPedidos = queryPedidos.lte('criado_em', dataFim)
    }

    const { data: pedidos, error: pedidosError } = await queryPedidos

    if (pedidosError) {
      return {
        kpis: {
          totalClientes: 0,
          clientesMaisFrequentes: [],
          clientesMaiorTicketMedio: [],
          novosClientes: 0,
        },
        error: pedidosError,
      }
    }

    // Agrupar por cliente
    const clientesMap: Record<
      string,
      {
        cliente_id: string
        total_pedidos: number
        valor_total: number
        primeira_compra: string
      }
    > = {}

    ;(pedidos || []).forEach((pedido) => {
      const clienteId = pedido.cliente_id
      if (!clientesMap[clienteId]) {
        clientesMap[clienteId] = {
          cliente_id: clienteId,
          total_pedidos: 0,
          valor_total: 0,
          primeira_compra: pedido.criado_em,
        }
      }

      clientesMap[clienteId].total_pedidos += 1
      clientesMap[clienteId].valor_total += Number(pedido.valor_total || 0)

      if (pedido.criado_em < clientesMap[clienteId].primeira_compra) {
        clientesMap[clienteId].primeira_compra = pedido.criado_em
      }
    })

    // Buscar dados dos clientes
    const clienteIds = Object.keys(clientesMap)
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id, nome_completo, email')
      .in('id', clienteIds)

    const usuariosMap = new Map((usuarios || []).map((u) => [u.id, u]))

    // Calcular novos clientes
    const novosClientes = Object.values(clientesMap).filter((c) => {
      if (!dataInicio) return false
      return c.primeira_compra >= dataInicio
    }).length

    // Preparar arrays com dados completos
    const clientesCompletos = Object.values(clientesMap).map((c) => {
      const usuario = usuariosMap.get(c.cliente_id)
      return {
        cliente_id: c.cliente_id,
        nome: usuario?.nome_completo || 'Cliente desconhecido',
        email: usuario?.email || '',
        total_pedidos: c.total_pedidos,
        ticket_medio: c.valor_total / c.total_pedidos,
      }
    })

    // Clientes mais frequentes
    const clientesMaisFrequentes = [...clientesCompletos]
      .sort((a, b) => b.total_pedidos - a.total_pedidos)
      .slice(0, topN)

    // Clientes com maior ticket médio
    const clientesMaiorTicketMedio = [...clientesCompletos]
      .sort((a, b) => b.ticket_medio - a.ticket_medio)
      .slice(0, topN)

    return {
      kpis: {
        totalClientes: clienteIds.length,
        clientesMaisFrequentes,
        clientesMaiorTicketMedio,
        novosClientes,
      },
      error: null,
    }
  } catch (error) {
    return {
      kpis: {
        totalClientes: 0,
        clientesMaisFrequentes: [],
        clientesMaiorTicketMedio: [],
        novosClientes: 0,
      },
      error: error as Error,
    }
  }
}

/**
 * Calcula KPIs financeiros
 */
export async function calcularKPIFinanceiro(
  revendaId?: string,
  dataInicio?: string,
  dataFim?: string,
  unidadeId?: string | null
): Promise<{ kpis: KPIFinanceiro; error: Error | null }> {
  try {
    // Para transações financeiras, precisamos filtrar pelos pedidos da unidade
    let queryPedidos = supabase.from('pedidos').select('id').eq('revenda_id', revendaId || '')
    if (unidadeId) {
      queryPedidos = queryPedidos.eq('unidade_id', unidadeId)
    }
    const { data: pedidosUnidade } = await queryPedidos
    const pedidosIds = pedidosUnidade?.map(p => p.id) || []

    let query = supabase.from('transacoes_financeiras').select('*')

    if (revendaId) {
      query = query.eq('revenda_id', revendaId)
    }

    if (unidadeId && pedidosIds.length > 0) {
      query = query.in('pedido_id', pedidosIds)
    } else if (unidadeId && pedidosIds.length === 0) {
      // Se não há pedidos da unidade, retorna valores zerados
      return {
        kpis: {
          receitaBruta: 0,
          receitaLiquida: 0,
          taxasTotais: 0,
          repassesPendentes: 0,
          repassesRealizados: 0,
          inadimplencia: 0,
        },
        error: null,
      }
    }

    if (dataInicio) {
      query = query.gte('data_pagamento', dataInicio)
    }

    if (dataFim) {
      query = query.lte('data_pagamento', dataFim)
    }

    const { data: transacoes, error } = await query

    if (error) {
      return {
        kpis: {
          receitaBruta: 0,
          receitaLiquida: 0,
          taxasTotais: 0,
          repassesPendentes: 0,
          repassesRealizados: 0,
          inadimplencia: 0,
        },
        error,
      }
    }

    const transacoesArray = transacoes || []

    const receitaBruta = transacoesArray.reduce(
      (acc, t) => acc + Number(t.valor_bruto || 0),
      0
    )
    const receitaLiquida = transacoesArray.reduce(
      (acc, t) => acc + Number(t.valor_liquido || 0),
      0
    )
    const taxasTotais = receitaBruta - receitaLiquida

    const repassesPendentes = transacoesArray
      .filter((t) => t.status === 'pendente' || t.status === 'liberado')
      .reduce((acc, t) => acc + Number(t.valor_liquido || 0), 0)

    const repassesRealizados = transacoesArray
      .filter((t) => t.status === 'repassado')
      .reduce((acc, t) => acc + Number(t.valor_liquido || 0), 0)

    // Calcular inadimplência (parcelas vencidas)
    const { data: parcelas } = await supabase
      .from('parcelas')
      .select('valor_parcela, data_vencimento, paga')
      .eq('paga', false)
      .lt('data_vencimento', new Date().toISOString().split('T')[0])

    const inadimplencia = (parcelas || []).reduce(
      (acc, p) => acc + Number(p.valor_parcela || 0),
      0
    )

    return {
      kpis: {
        receitaBruta,
        receitaLiquida,
        taxasTotais,
        repassesPendentes,
        repassesRealizados,
        inadimplencia,
      },
      error: null,
    }
  } catch (error) {
    return {
      kpis: {
        receitaBruta: 0,
        receitaLiquida: 0,
        taxasTotais: 0,
        repassesPendentes: 0,
        repassesRealizados: 0,
        inadimplencia: 0,
      },
      error: error as Error,
    }
  }
}

/**
 * Calcula KPIs de parcelamentos
 */
export async function calcularKPIParcelamentos(
  revendaId?: string,
  dataInicio?: string,
  dataFim?: string,
  unidadeId?: string | null
): Promise<{ kpis: KPIParcelamentos; error: Error | null }> {
  try {
    // Buscar parcelamentos
    let queryParcelamentos = supabase
      .from('parcelamentos')
      .select(
        `
        id,
        valor_total,
        pedido:pedidos!inner(revenda_id, criado_em, unidade_id)
      `
      )
      .eq('status', 'ativo')

    if (revendaId) {
      queryParcelamentos = queryParcelamentos.eq('pedido.revenda_id', revendaId)
    }

    if (unidadeId) {
      queryParcelamentos = queryParcelamentos.eq('pedido.unidade_id', unidadeId)
    }

    if (dataInicio) {
      queryParcelamentos = queryParcelamentos.gte('pedido.criado_em', dataInicio)
    }

    if (dataFim) {
      queryParcelamentos = queryParcelamentos.lte('pedido.criado_em', dataFim)
    }

    const { data: parcelamentos, error: parcelamentosError } = await queryParcelamentos

    if (parcelamentosError) {
      return {
        kpis: {
          totalParcelamentosAtivos: 0,
          valorTotalParcelamentos: 0,
          parcelasPagas: 0,
          parcelasPendentes: 0,
          taxaInadimplencia: 0,
        },
        error: parcelamentosError,
      }
    }

    const parcelamentosArray = Array.isArray(parcelamentos) ? parcelamentos : [parcelamentos]
    const parcelamentoIds = parcelamentosArray.map((p: any) => p.id)

    // Buscar parcelas
    const { data: parcelas, error: parcelasError } = await supabase
      .from('parcelas')
      .select('id, valor_parcela, paga, data_vencimento')
      .in('parcelamento_id', parcelamentoIds)

    if (parcelasError) {
      return {
        kpis: {
          totalParcelamentosAtivos: parcelamentosArray.length,
          valorTotalParcelamentos: parcelamentosArray.reduce(
            (acc, p: any) => acc + Number(p.valor_total || 0),
            0
          ),
          parcelasPagas: 0,
          parcelasPendentes: 0,
          taxaInadimplencia: 0,
        },
        error: parcelasError,
      }
    }

    const parcelasArray = parcelas || []
    const parcelasPagas = parcelasArray.filter((p) => p.paga).length
    const parcelasPendentes = parcelasArray.filter((p) => !p.paga).length

    // Calcular inadimplência (parcelas vencidas não pagas)
    const hoje = new Date().toISOString().split('T')[0]
    const parcelasVencidas = parcelasArray.filter(
      (p) => !p.paga && p.data_vencimento < hoje
    )
    const valorInadimplencia = parcelasVencidas.reduce(
      (acc, p) => acc + Number(p.valor_parcela || 0),
      0
    )
    const valorTotalParcelas = parcelasArray.reduce(
      (acc, p) => acc + Number(p.valor_parcela || 0),
      0
    )
    const taxaInadimplencia =
      valorTotalParcelas > 0 ? (valorInadimplencia / valorTotalParcelas) * 100 : 0

    const valorTotalParcelamentos = parcelamentosArray.reduce(
      (acc, p: any) => acc + Number(p.valor_total || 0),
      0
    )

    return {
      kpis: {
        totalParcelamentosAtivos: parcelamentosArray.length,
        valorTotalParcelamentos,
        parcelasPagas,
        parcelasPendentes,
        taxaInadimplencia,
      },
      error: null,
    }
  } catch (error) {
    return {
      kpis: {
        totalParcelamentosAtivos: 0,
        valorTotalParcelamentos: 0,
        parcelasPagas: 0,
        parcelasPendentes: 0,
        taxaInadimplencia: 0,
      },
      error: error as Error,
    }
  }
}

/**
 * Calcula KPIs de agendamentos
 */
export async function calcularKPIAgendamentos(
  revendaId?: string,
  dataInicio?: string,
  dataFim?: string,
  unidadeId?: string | null
): Promise<{ kpis: KPIAgendamentos; error: Error | null }> {
  try {
    let query = supabase
      .from('agendamentos_entrega')
      .select('id, tipo_entrega, status, pedido:pedidos!inner(revenda_id, criado_em, unidade_id), unidade_id')

    if (revendaId) {
      query = query.eq('pedido.revenda_id', revendaId)
    }

    if (unidadeId) {
      query = query.eq('unidade_id', unidadeId)
    }

    if (dataInicio) {
      query = query.gte('pedido.criado_em', dataInicio)
    }

    if (dataFim) {
      query = query.lte('pedido.criado_em', dataFim)
    }

    const { data: agendamentos, error } = await query

    if (error) {
      return {
        kpis: {
          totalAgendamentos: 0,
          taxaConclusao: 0,
          agendamentosPorTipo: {},
        },
        error,
      }
    }

    const agendamentosArray = agendamentos || []
    const totalAgendamentos = agendamentosArray.length

    const agendamentosConcluidos = agendamentosArray.filter(
      (a) => a.status === 'concluido' || a.status === 'entregue'
    ).length

    const taxaConclusao = totalAgendamentos > 0 ? (agendamentosConcluidos / totalAgendamentos) * 100 : 0

    const agendamentosPorTipo: Record<string, number> = {}
    agendamentosArray.forEach((a) => {
      const tipo = a.tipo_entrega || 'desconhecido'
      agendamentosPorTipo[tipo] = (agendamentosPorTipo[tipo] || 0) + 1
    })

    return {
      kpis: {
        totalAgendamentos,
        taxaConclusao,
        agendamentosPorTipo,
      },
      error: null,
    }
  } catch (error) {
    return {
      kpis: {
        totalAgendamentos: 0,
        taxaConclusao: 0,
        agendamentosPorTipo: {},
      },
      error: error as Error,
    }
  }
}

