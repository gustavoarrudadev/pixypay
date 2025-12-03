import { supabase } from '../supabase'

/**
 * Busca dados detalhados de vendas para relatório
 */
export async function buscarDadosVendas(
  revendaId?: string,
  dataInicio?: string,
  dataFim?: string,
  status?: string,
  formaPagamento?: string,
  tipoEntrega?: string,
  unidadeId?: string | null
): Promise<{ dados: Array<Record<string, any>>; error: Error | null }> {
  try {
    let query = supabase
      .from('pedidos')
      .select(
        `
        id,
        valor_total,
        status,
        forma_pagamento,
        tipo_entrega,
        parcelas_total,
        criado_em,
        cliente:usuarios!pedidos_cliente_id_fkey (
          id,
          nome_completo,
          email
        ),
        revenda:revendas (
          id,
          nome_revenda
        ),
        transacao:transacoes_financeiras (
          valor_liquido
        )
      `
      )
      .order('criado_em', { ascending: false })

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

    if (status) {
      query = query.eq('status', status)
    }

    if (formaPagamento) {
      query = query.eq('forma_pagamento', formaPagamento)
    }

    if (tipoEntrega) {
      query = query.eq('tipo_entrega', tipoEntrega)
    }

    const { data, error } = await query

    if (error) {
      return { dados: [], error }
    }

    const dadosFormatados = (data || []).map((pedido: any) => {
      const cliente = Array.isArray(pedido.cliente) ? pedido.cliente[0] : pedido.cliente
      const revenda = Array.isArray(pedido.revenda) ? pedido.revenda[0] : pedido.revenda
      const transacao = Array.isArray(pedido.transacao) ? pedido.transacao[0] : pedido.transacao

      return {
        id: pedido.id,
        data: pedido.criado_em,
        cliente: cliente?.nome_completo || 'Cliente desconhecido',
        cliente_email: cliente?.email || '',
        revenda: revenda?.nome_revenda || '',
        valor_total: pedido.valor_total,
        valor_liquido: transacao?.valor_liquido || pedido.valor_total,
        status: pedido.status,
        forma_pagamento: pedido.forma_pagamento,
        tipo_entrega: pedido.tipo_entrega,
        parcelas: pedido.parcelas_total || 0,
      }
    })

    return { dados: dadosFormatados, error: null }
  } catch (error) {
    return { dados: [], error: error as Error }
  }
}

/**
 * Busca dados detalhados de produtos para relatório
 */
export async function buscarDadosProdutos(
  revendaId?: string,
  dataInicio?: string,
  dataFim?: string,
  unidadeId?: string | null
): Promise<{ dados: Array<Record<string, any>>; error: Error | null }> {
  try {
    // Buscar itens de pedido com informações do produto
    let query = supabase
      .from('itens_pedido')
      .select(
        `
        produto_id,
        quantidade,
        subtotal,
        preco_unitario,
        produto:produtos (
          id,
          nome,
          descricao,
          preco
        ),
        pedido:pedidos!inner (
          criado_em,
          revenda_id,
          unidade_id
        )
      `
      )

    if (revendaId) {
      query = query.eq('pedido.revenda_id', revendaId)
    }

    if (unidadeId) {
      query = query.eq('pedido.unidade_id', unidadeId)
    }

    if (dataInicio) {
      query = query.gte('pedido.criado_em', dataInicio)
    }

    if (dataFim) {
      query = query.lte('pedido.criado_em', dataFim)
    }

    const { data, error } = await query

    if (error) {
      return { dados: [], error }
    }

    // Agrupar por produto
    const produtosMap: Record<
      string,
      {
        produto_id: string
        nome: string
        descricao: string
        quantidade: number
        valor_total: number
        preco_unitario: number
      }
    > = {}

    ;(data || []).forEach((item: any) => {
      const produtoId = item.produto_id
      const produto = Array.isArray(item.produto) ? item.produto[0] : item.produto

      if (!produtosMap[produtoId]) {
        produtosMap[produtoId] = {
          produto_id: produtoId,
          nome: produto?.nome || 'Produto desconhecido',
          descricao: produto?.descricao || '',
          quantidade: 0,
          valor_total: 0,
          preco_unitario: Number(item.preco_unitario || 0),
        }
      }

      produtosMap[produtoId].quantidade += Number(item.quantidade || 0)
      produtosMap[produtoId].valor_total += Number(item.subtotal || 0)
    })

    const dadosFormatados = Object.values(produtosMap).map((produto) => ({
      produto_id: produto.produto_id,
      nome: produto.nome,
      descricao: produto.descricao,
      quantidade: produto.quantidade,
      valor_total: produto.valor_total,
      preco_medio: produto.quantidade > 0 ? produto.valor_total / produto.quantidade : 0,
    }))

    return { dados: dadosFormatados, error: null }
  } catch (error) {
    return { dados: [], error: error as Error }
  }
}

/**
 * Busca dados detalhados de clientes para relatório
 */
export async function buscarDadosClientes(
  revendaId?: string,
  dataInicio?: string,
  dataFim?: string,
  unidadeId?: string | null
): Promise<{ dados: Array<Record<string, any>>; error: Error | null }> {
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
      return { dados: [], error: pedidosError }
    }

    // Agrupar por cliente
    const clientesMap: Record<
      string,
      {
        cliente_id: string
        total_pedidos: number
        valor_total: number
        ultima_compra: string
      }
    > = {}

    ;(pedidos || []).forEach((pedido) => {
      const clienteId = pedido.cliente_id
      if (!clientesMap[clienteId]) {
        clientesMap[clienteId] = {
          cliente_id: clienteId,
          total_pedidos: 0,
          valor_total: 0,
          ultima_compra: pedido.criado_em,
        }
      }

      clientesMap[clienteId].total_pedidos += 1
      clientesMap[clienteId].valor_total += Number(pedido.valor_total || 0)

      if (pedido.criado_em > clientesMap[clienteId].ultima_compra) {
        clientesMap[clienteId].ultima_compra = pedido.criado_em
      }
    })

    // Buscar dados dos clientes
    const clienteIds = Object.keys(clientesMap)
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, nome_completo, email, telefone, cpf')
      .in('id', clienteIds)

    if (usuariosError) {
      return { dados: [], error: usuariosError }
    }

    const usuariosMap = new Map((usuarios || []).map((u) => [u.id, u]))

    const dadosFormatados = Object.values(clientesMap).map((c) => {
      const usuario = usuariosMap.get(c.cliente_id)
      return {
        cliente_id: c.cliente_id,
        nome: usuario?.nome_completo || 'Cliente desconhecido',
        email: usuario?.email || '',
        telefone: usuario?.telefone || '',
        cpf: usuario?.cpf || '',
        total_pedidos: c.total_pedidos,
        ticket_medio: c.total_pedidos > 0 ? c.valor_total / c.total_pedidos : 0,
        ultima_compra: c.ultima_compra,
      }
    })

    return { dados: dadosFormatados, error: null }
  } catch (error) {
    return { dados: [], error: error as Error }
  }
}

/**
 * Busca dados detalhados financeiros para relatório
 */
export async function buscarDadosFinanceiro(
  revendaId?: string,
  dataInicio?: string,
  dataFim?: string,
  status?: string,
  modalidade?: string,
  unidadeId?: string | null
): Promise<{ dados: Array<Record<string, any>>; error: Error | null }> {
  try {
    // Para transações financeiras, precisamos filtrar pelos pedidos da unidade
    let queryPedidos = supabase.from('pedidos').select('id').eq('revenda_id', revendaId || '')
    if (unidadeId) {
      queryPedidos = queryPedidos.eq('unidade_id', unidadeId)
    }
    const { data: pedidosUnidade } = await queryPedidos
    const pedidosIds = pedidosUnidade?.map(p => p.id) || []

    let query = supabase
      .from('transacoes_financeiras')
      .select(
        `
        *,
        pedido:pedidos (
          id,
          valor_total,
          unidade_id
        ),
        cliente:usuarios (
          id,
          nome_completo,
          email
        ),
        revenda:revendas (
          id,
          nome_revenda
        )
      `
      )
      .order('data_pagamento', { ascending: false })

    if (revendaId) {
      query = query.eq('revenda_id', revendaId)
    }

    if (unidadeId && pedidosIds.length > 0) {
      query = query.in('pedido_id', pedidosIds)
    } else if (unidadeId && pedidosIds.length === 0) {
      return { dados: [], error: null }
    }

    if (dataInicio) {
      query = query.gte('data_pagamento', dataInicio)
    }

    if (dataFim) {
      query = query.lte('data_pagamento', dataFim)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (modalidade) {
      query = query.eq('modalidade', modalidade)
    }

    const { data, error } = await query

    if (error) {
      return { dados: [], error }
    }

    const dadosFormatados = (data || []).map((transacao: any) => {
      const pedido = Array.isArray(transacao.pedido) ? transacao.pedido[0] : transacao.pedido
      const cliente = Array.isArray(transacao.cliente) ? transacao.cliente[0] : transacao.cliente
      const revenda = Array.isArray(transacao.revenda) ? transacao.revenda[0] : transacao.revenda

      return {
        id: transacao.id,
        pedido_id: transacao.pedido_id,
        cliente: cliente?.nome_completo || '',
        revenda: revenda?.nome_revenda || '',
        valor_bruto: transacao.valor_bruto,
        valor_liquido: transacao.valor_liquido,
        taxa_percentual: transacao.taxa_percentual,
        taxa_fixa: transacao.taxa_fixa,
        modalidade: transacao.modalidade,
        data_pagamento: transacao.data_pagamento,
        data_repasse_prevista: transacao.data_repasse_prevista,
        status: transacao.status,
      }
    })

    return { dados: dadosFormatados, error: null }
  } catch (error) {
    return { dados: [], error: error as Error }
  }
}

/**
 * Busca dados detalhados de parcelamentos para relatório
 */
export async function buscarDadosParcelamentos(
  revendaId?: string,
  dataInicio?: string,
  dataFim?: string,
  status?: string,
  unidadeId?: string | null
): Promise<{ dados: Array<Record<string, any>>; error: Error | null }> {
  try {
    let query = supabase
      .from('parcelamentos')
      .select(
        `
        *,
        pedido:pedidos!inner (
          id,
          revenda_id,
          criado_em,
          unidade_id,
          cliente:usuarios!pedidos_cliente_id_fkey (
            id,
            nome_completo
          )
        ),
        parcelas:parcelas (
          id,
          numero_parcela,
          valor_parcela,
          paga,
          data_vencimento
        )
      `
      )

    if (revendaId) {
      query = query.eq('pedido.revenda_id', revendaId)
    }

    if (unidadeId) {
      query = query.eq('pedido.unidade_id', unidadeId)
    }

    if (dataInicio) {
      query = query.gte('pedido.criado_em', dataInicio)
    }

    if (dataFim) {
      query = query.lte('pedido.criado_em', dataFim)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return { dados: [], error }
    }

    const dadosFormatados = (data || []).map((parcelamento: any) => {
      const pedido = Array.isArray(parcelamento.pedido) ? parcelamento.pedido[0] : parcelamento.pedido
      const cliente = Array.isArray(pedido?.cliente) ? pedido.cliente[0] : pedido?.cliente
      const parcelas = Array.isArray(parcelamento.parcelas) ? parcelamento.parcelas : []

      const parcelasPagas = parcelas.filter((p: any) => p.paga).length
      const parcelasPendentes = parcelas.filter((p: any) => !p.paga).length

      return {
        id: parcelamento.id,
        pedido_id: parcelamento.pedido_id,
        cliente: cliente?.nome_completo || 'Cliente desconhecido',
        total_parcelas: parcelamento.total_parcelas,
        valor_total: parcelamento.valor_total,
        valor_parcela: parcelamento.valor_parcela,
        parcelas_pagas: parcelasPagas,
        parcelas_pendentes: parcelasPendentes,
        status: parcelamento.status,
      }
    })

    return { dados: dadosFormatados, error: null }
  } catch (error) {
    return { dados: [], error: error as Error }
  }
}

/**
 * Lista todas as revendas (para Admin)
 */
export async function listarRevendas(): Promise<{ revendas: Array<{ id: string; nome: string }>; error: Error | null }> {
  try {
    const { data, error } = await supabase.from('revendas').select('id, nome_revenda').order('nome_revenda')

    if (error) {
      return { revendas: [], error }
    }

    const revendas = (data || []).map((r) => ({
      id: r.id,
      nome: r.nome_revenda,
    }))

    return { revendas, error: null }
  } catch (error) {
    return { revendas: [], error: error as Error }
  }
}

