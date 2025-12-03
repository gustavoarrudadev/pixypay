import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'

export interface Parcelamento {
  id: string
  pedido_id: string
  total_parcelas: number
  valor_total: number
  valor_parcela: number
  status: 'ativo' | 'quitado' | 'cancelado'
  criado_em: string
  atualizado_em: string
  pedido?: {
    id: string
    valor_total: number
    criado_em?: string
    dados_cliente?: any
    revenda?: {
      id: string
      nome_revenda: string
      nome_publico?: string | null
    }
    unidade?: {
      id: string
      nome: string
      nome_publico?: string | null
    }
    transacao_financeira?: {
      id: string
      valor_bruto: number
      valor_liquido: number
      taxa_percentual: number
      taxa_fixa: number
      modalidade: 'D+1' | 'D+15' | 'D+30'
      status: 'pendente' | 'liberado' | 'repassado' | 'cancelado'
      data_pagamento: string
      data_repasse_prevista: string
    }
  }
  parcelas?: Parcela[]
}

export interface Parcela {
  id: string
  parcelamento_id: string
  numero_parcela: number
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: 'pendente' | 'paga' | 'atrasada'
  pix_copia_cola: string | null
  criado_em: string
  atualizado_em: string
}

/**
 * Lista parcelamentos do cliente atual
 */
export async function listarParcelamentos(): Promise<{ parcelamentos: Parcelamento[]; error: Error | null }> {
  try {
    // Obtém o cliente_id considerando modo impersonation
    const { obterClienteUserId } = await import('./impersonation')
    const clienteUserId = await obterClienteUserId()
    
    // Se não está em modo impersonation, usa a sessão atual
    let clienteId = clienteUserId
    if (!clienteId) {
      const { data: sessionData } = await supabase.auth.getSession()
      clienteId = sessionData?.session?.user?.id
    }

    console.log('🔍 [listarParcelamentos] Iniciando busca', { clienteId, emImpersonation: !!clienteUserId })

    if (!clienteId) {
      console.warn('⚠️ [listarParcelamentos] Usuário não autenticado')
      return {
        parcelamentos: [],
        error: new Error('Usuário não autenticado'),
      }
    }

    // Primeiro, buscar apenas os parcelamentos básicos (sem relacionamentos)
    let queryBasica = supabase
      .from('parcelamentos')
      .select('*')
      .order('criado_em', { ascending: false })

    const { data: dataBasica, error: errorBasica } = await queryBasica

    if (errorBasica) {
      console.error('❌ [listarParcelamentos] Erro ao buscar parcelamentos básicos:', {
        message: errorBasica.message,
        details: (errorBasica as any).details,
        hint: (errorBasica as any).hint,
        code: (errorBasica as any).code,
      })
      return {
        parcelamentos: [],
        error: errorBasica,
      }
    }

    if (!dataBasica || dataBasica.length === 0) {
      console.log('ℹ️ [listarParcelamentos] Nenhum parcelamento encontrado no banco')
      return {
        parcelamentos: [],
        error: null,
      }
    }

    console.log('✅ [listarParcelamentos] Parcelamentos básicos encontrados:', dataBasica.length)

    // Buscar pedidos do cliente para filtrar
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id, forma_pagamento, parcelas_total, valor_total, dados_cliente, criado_em, revenda_id')
      .eq('cliente_id', clienteId)
      .eq('forma_pagamento', 'pix_parcelado')

    console.log('📦 [listarParcelamentos] Pedidos do cliente:', {
      total: pedidosData?.length || 0,
      erro: pedidosError,
    })

    if (pedidosError) {
      console.error('❌ [listarParcelamentos] Erro ao buscar pedidos do cliente:', pedidosError)
      return {
        parcelamentos: [],
        error: pedidosError,
      }
    }

    const pedidosIds = pedidosData?.map(p => p.id) || []

    if (pedidosIds.length === 0) {
      console.log('ℹ️ [listarParcelamentos] Cliente não tem pedidos parcelados')
      return {
        parcelamentos: [],
        error: null,
      }
    }

    // Filtrar parcelamentos pelos pedidos do cliente
    const pedidosIdsSet = new Set(pedidosIds)
    const parcelamentosFiltrados = dataBasica.filter(p => pedidosIdsSet.has(p.pedido_id))

    console.log('✅ [listarParcelamentos] Parcelamentos filtrados:', {
      totalBasicos: dataBasica.length,
      pedidosCliente: pedidosIds.length,
      parcelamentosFiltrados: parcelamentosFiltrados.length,
    })

    // Agora tentar buscar com relacionamentos completos
    const { data: dataCompleta, error: errorCompleta } = await supabase
      .from('parcelamentos')
      .select(`
        *,
        pedido:pedidos (
          id,
          valor_total,
          dados_cliente,
          criado_em,
          revenda:revendas (
            id,
            nome_revenda,
            nome_publico
          ),
          unidade:unidades_revenda (
            id,
            nome,
            nome_publico
          )
        ),
        parcelas:parcelas (*)
      `)
      .in('pedido_id', pedidosIds)
      .order('criado_em', { ascending: false })

    // Se a query completa funcionou, usar ela
    if (!errorCompleta && dataCompleta && dataCompleta.length > 0) {
      console.log('✅ [listarParcelamentos] Query completa OK:', {
        quantidade: dataCompleta.length,
      })
      
      // Processar e ordenar parcelamentos
      const parcelamentosOrdenados = (dataCompleta || [])
        .map((parcelamento: any) => {
          let parcelasArray = []
          if (parcelamento.parcelas) {
            if (Array.isArray(parcelamento.parcelas)) {
              parcelasArray = parcelamento.parcelas
            } else {
              parcelasArray = [parcelamento.parcelas]
            }
          }
          
          return {
            ...parcelamento,
            parcelas: parcelasArray.length > 0
              ? parcelasArray.sort((a: Parcela, b: Parcela) => a.numero_parcela - b.numero_parcela)
              : [],
          }
        })
        .sort((a: Parcelamento, b: Parcelamento) => {
          const dataA = a.pedido?.criado_em || a.criado_em
          const dataB = b.pedido?.criado_em || b.criado_em
          return new Date(dataB).getTime() - new Date(dataA).getTime()
        }) as Parcelamento[]

      console.log('✅ [listarParcelamentos] Parcelamentos ordenados:', {
        total: parcelamentosOrdenados.length,
        comParcelas: parcelamentosOrdenados.filter(p => p.parcelas && p.parcelas.length > 0).length,
      })

      return {
        parcelamentos: parcelamentosOrdenados,
        error: null,
      }
    }

    // Se a query completa falhou, usar dados básicos e buscar relacionamentos separadamente
    console.warn('⚠️ [listarParcelamentos] Query completa falhou, usando dados básicos:', errorCompleta)
    
    const parcelamentosComRelacionamentos = await Promise.all(
      parcelamentosFiltrados.map(async (parcelamento) => {
        const parcelamentoCompleto: any = { ...parcelamento }
        
        // Buscar pedido
        const pedido = pedidosData?.find(p => p.id === parcelamento.pedido_id)
        if (pedido) {
          parcelamentoCompleto.pedido = { ...pedido }
          
          // Buscar revenda se necessário
          if (pedido.revenda_id) {
            const { data: revenda } = await supabase
              .from('revendas')
              .select('id, nome_revenda')
              .eq('id', pedido.revenda_id)
              .single()
            if (revenda) {
              parcelamentoCompleto.pedido.revenda = revenda
            }
          }
        }
        
        // Buscar parcelas
        const { data: parcelasData } = await supabase
          .from('parcelas')
          .select('*')
          .eq('parcelamento_id', parcelamento.id)
          .order('numero_parcela', { ascending: true })
        
        if (parcelasData) {
          parcelamentoCompleto.parcelas = parcelasData
        } else {
          parcelamentoCompleto.parcelas = []
        }
        
        return parcelamentoCompleto
      })
    )

    // Ordenar parcelamentos
    const parcelamentosOrdenados = parcelamentosComRelacionamentos
      .sort((a: Parcelamento, b: Parcelamento) => {
        const dataA = a.pedido?.criado_em || a.criado_em
        const dataB = b.pedido?.criado_em || b.criado_em
        return new Date(dataB).getTime() - new Date(dataA).getTime()
      }) as Parcelamento[]

    console.log('✅ [listarParcelamentos] Parcelamentos finais:', {
      quantidade: parcelamentosOrdenados.length,
    })

    return {
      parcelamentos: parcelamentosOrdenados,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar parcelamentos:', error)
    return {
      parcelamentos: [],
      error: error instanceof Error ? error : new Error('Erro ao listar parcelamentos'),
    }
  }
}

/**
 * Lista parcelamentos de uma revenda
 */
export async function listarParcelamentosRevenda(
  revendaId: string,
  unidadeId?: string | null
): Promise<{ parcelamentos: Parcelamento[]; error: Error | null }> {
  try {
    console.log('🔍 [listarParcelamentosRevenda] Iniciando busca', { revendaId, unidadeId })

    // Primeiro, buscar apenas os parcelamentos básicos (sem relacionamentos)
    let queryBasica = supabase
      .from('parcelamentos')
      .select('*')
      .order('criado_em', { ascending: false })

    const { data: dataBasica, error: errorBasica } = await queryBasica

    if (errorBasica) {
      console.error('❌ [listarParcelamentosRevenda] Erro ao buscar parcelamentos básicos:', {
        message: errorBasica.message,
        details: (errorBasica as any).details,
        hint: (errorBasica as any).hint,
        code: (errorBasica as any).code,
      })
      return {
        parcelamentos: [],
        error: errorBasica,
      }
    }

    if (!dataBasica || dataBasica.length === 0) {
      console.log('ℹ️ [listarParcelamentosRevenda] Nenhum parcelamento encontrado no banco')
      return {
        parcelamentos: [],
        error: null,
      }
    }

    console.log('✅ [listarParcelamentosRevenda] Parcelamentos básicos encontrados:', dataBasica.length)

    // Buscar pedidos relacionados para filtrar por revenda e forma_pagamento
    const pedidosIds = dataBasica.map(p => p.pedido_id)
    
    let pedidosQuery = supabase
      .from('pedidos')
      .select('id, forma_pagamento, parcelas_total, revenda_id, unidade_id, valor_total, dados_cliente, status, criado_em')
      .in('id', pedidosIds)
      .eq('forma_pagamento', 'pix_parcelado')
      .eq('revenda_id', revendaId)

    // Se unidadeId for fornecido, filtra por unidade
    if (unidadeId) {
      pedidosQuery = pedidosQuery.eq('unidade_id', unidadeId)
    }

    const { data: pedidosData, error: pedidosError } = await pedidosQuery

    console.log('📦 [listarParcelamentosRevenda] Pedidos encontrados:', {
      totalPedidos: pedidosIds.length,
      pedidosParcelados: pedidosData?.length || 0,
      erro: pedidosError,
    })

    if (pedidosError) {
      console.error('❌ [listarParcelamentosRevenda] Erro ao buscar pedidos:', pedidosError)
      // Se falhar, retorna parcelamentos básicos sem filtro
      return {
        parcelamentos: dataBasica.map(p => ({
          ...p,
          pedido: undefined,
          parcelas: [],
        })) as Parcelamento[],
        error: null,
      }
    }

    // Filtrar parcelamentos pelos pedidos encontrados
    const pedidosIdsValidos = new Set(pedidosData?.map(p => p.id) || [])
    const parcelamentosFiltrados = dataBasica.filter(p => pedidosIdsValidos.has(p.pedido_id))

    console.log('✅ [listarParcelamentosRevenda] Parcelamentos filtrados:', {
      totalBasicos: dataBasica.length,
      pedidosEncontrados: pedidosData?.length || 0,
      parcelamentosFiltrados: parcelamentosFiltrados.length,
    })

    if (parcelamentosFiltrados.length === 0) {
      console.log('ℹ️ [listarParcelamentosRevenda] Nenhum parcelamento encontrado para esta revenda')
      return {
        parcelamentos: [],
        error: null,
      }
    }

    // Agora tentar buscar com relacionamentos completos
    let parcelamentosQuery = supabase
      .from('parcelamentos')
      .select(`
        *,
        pedido:pedidos!inner (
          id,
          valor_total,
          dados_cliente,
          status,
          criado_em,
          unidade_id,
          revenda:revendas (
            id,
            nome_revenda,
            nome_publico
          ),
          unidade:unidades_revenda (
            id,
            nome,
            nome_publico
          ),
          transacao_financeira:transacoes_financeiras!transacoes_financeiras_pedido_id_fkey (
            id,
            valor_bruto,
            valor_liquido,
            taxa_percentual,
            taxa_fixa,
            modalidade,
            status,
            data_pagamento,
            data_repasse_prevista
          )
        ),
        parcelas:parcelas (*)
      `)
      .eq('pedido.forma_pagamento', 'pix_parcelado')
      .eq('pedido.revenda_id', revendaId)

    // Se unidadeId for fornecido, filtra por unidade
    if (unidadeId) {
      parcelamentosQuery = parcelamentosQuery.eq('pedido.unidade_id', unidadeId)
    }

    const { data: dataCompleta, error: errorCompleta } = await parcelamentosQuery.order('criado_em', { ascending: false })

    // Se a query completa funcionou, usar ela
    if (!errorCompleta && dataCompleta && dataCompleta.length > 0) {
      console.log('✅ [listarParcelamentosRevenda] Query completa OK:', {
        quantidade: dataCompleta.length,
        primeiros3: dataCompleta.slice(0, 3).map(p => ({
          id: p.id,
          pedido_id: p.pedido_id,
          temTransacao: !!p.pedido?.transacao_financeira,
        })),
      })
      
      // Processar e ordenar parcelamentos
      const parcelamentosOrdenados = (dataCompleta || [])
        .map((parcelamento: any) => {
          let parcelasArray = []
          if (parcelamento.parcelas) {
            if (Array.isArray(parcelamento.parcelas)) {
              parcelasArray = parcelamento.parcelas
            } else {
              parcelasArray = [parcelamento.parcelas]
            }
          }
          
          // Processa transacao_financeira: pode vir como array ou objeto único
          let transacaoFinanceira = null
          if (parcelamento.pedido?.transacao_financeira) {
            if (Array.isArray(parcelamento.pedido.transacao_financeira)) {
              transacaoFinanceira = parcelamento.pedido.transacao_financeira[0] || null
            } else {
              transacaoFinanceira = parcelamento.pedido.transacao_financeira
            }
            
            // Converte valores de string para número (DECIMAL do PostgreSQL vem como string)
            if (transacaoFinanceira) {
              transacaoFinanceira = {
                ...transacaoFinanceira,
                valor_bruto: typeof transacaoFinanceira.valor_bruto === 'string' 
                  ? parseFloat(transacaoFinanceira.valor_bruto) 
                  : (transacaoFinanceira.valor_bruto || 0),
                valor_liquido: typeof transacaoFinanceira.valor_liquido === 'string' 
                  ? parseFloat(transacaoFinanceira.valor_liquido) 
                  : (transacaoFinanceira.valor_liquido || 0),
                taxa_percentual: typeof transacaoFinanceira.taxa_percentual === 'string' 
                  ? parseFloat(transacaoFinanceira.taxa_percentual) 
                  : (transacaoFinanceira.taxa_percentual || 0),
                taxa_fixa: typeof transacaoFinanceira.taxa_fixa === 'string' 
                  ? parseFloat(transacaoFinanceira.taxa_fixa) 
                  : (transacaoFinanceira.taxa_fixa || 0),
              }
            }
          }
          
          return {
            ...parcelamento,
            pedido: {
              ...parcelamento.pedido,
              transacao_financeira: transacaoFinanceira,
            },
            parcelas: parcelasArray.length > 0
              ? parcelasArray.sort((a: Parcela, b: Parcela) => a.numero_parcela - b.numero_parcela)
              : [],
          }
        })
        .sort((a: Parcelamento, b: Parcelamento) => {
          const dataA = a.pedido?.criado_em || a.criado_em
          const dataB = b.pedido?.criado_em || b.criado_em
          return new Date(dataB).getTime() - new Date(dataA).getTime()
        }) as Parcelamento[]

      return {
        parcelamentos: parcelamentosOrdenados,
        error: null,
      }
    }

    // Se a query completa falhou, usar dados básicos e buscar relacionamentos separadamente
    console.warn('⚠️ [listarParcelamentosRevenda] Query completa falhou, usando dados básicos:', errorCompleta)
    
    const parcelamentosComRelacionamentos = await Promise.all(
      parcelamentosFiltrados.map(async (parcelamento) => {
        const parcelamentoCompleto: any = { ...parcelamento }
        
        // Buscar pedido
        const pedido = pedidosData?.find(p => p.id === parcelamento.pedido_id)
        if (pedido) {
          parcelamentoCompleto.pedido = { ...pedido }
          
          // Buscar transação financeira separadamente
          const { data: transacaoData } = await supabase
            .from('transacoes_financeiras')
            .select('id, valor_bruto, valor_liquido, taxa_percentual, taxa_fixa, modalidade, status, data_pagamento, data_repasse_prevista')
            .eq('pedido_id', parcelamento.pedido_id)
            .maybeSingle()
          
          if (transacaoData) {
            // Converte valores de string para número
            parcelamentoCompleto.pedido.transacao_financeira = {
              ...transacaoData,
              valor_bruto: typeof transacaoData.valor_bruto === 'string' 
                ? parseFloat(transacaoData.valor_bruto) 
                : (transacaoData.valor_bruto || 0),
              valor_liquido: typeof transacaoData.valor_liquido === 'string' 
                ? parseFloat(transacaoData.valor_liquido) 
                : (transacaoData.valor_liquido || 0),
              taxa_percentual: typeof transacaoData.taxa_percentual === 'string' 
                ? parseFloat(transacaoData.taxa_percentual) 
                : (transacaoData.taxa_percentual || 0),
              taxa_fixa: typeof transacaoData.taxa_fixa === 'string' 
                ? parseFloat(transacaoData.taxa_fixa) 
                : (transacaoData.taxa_fixa || 0),
            }
          }
        }
        
        // Buscar parcelas
        const { data: parcelasData } = await supabase
          .from('parcelas')
          .select('*')
          .eq('parcelamento_id', parcelamento.id)
          .order('numero_parcela', { ascending: true })
        
        if (parcelasData) {
          parcelamentoCompleto.parcelas = parcelasData
        } else {
          parcelamentoCompleto.parcelas = []
        }
        
        return parcelamentoCompleto
      })
    )

    // Ordenar parcelamentos
    const parcelamentosOrdenados = parcelamentosComRelacionamentos
      .sort((a: Parcelamento, b: Parcelamento) => {
        const dataA = a.pedido?.criado_em || a.criado_em
        const dataB = b.pedido?.criado_em || b.criado_em
        return new Date(dataB).getTime() - new Date(dataA).getTime()
      }) as Parcelamento[]

    console.log('✅ [listarParcelamentosRevenda] Parcelamentos finais:', {
      quantidade: parcelamentosOrdenados.length,
      primeiros3: parcelamentosOrdenados.slice(0, 3).map(p => ({
        id: p.id,
        pedido_id: p.pedido_id,
        parcelas: p.parcelas?.length || 0,
      })),
    })

    return {
      parcelamentos: parcelamentosOrdenados,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar parcelamentos da revenda:', error)
    return {
      parcelamentos: [],
      error: error instanceof Error ? error : new Error('Erro ao listar parcelamentos'),
    }
  }
}

/**
 * Lista todos os parcelamentos (Admin) - com filtro opcional por revenda
 */
export async function listarParcelamentosAdmin(
  revendaId?: string,
  unidadeId?: string | null
): Promise<{ parcelamentos: Parcelamento[]; error: Error | null }> {
  try {
    console.log('🔍 [listarParcelamentosAdmin] Iniciando busca de parcelamentos', { revendaId, unidadeId })
    
    // Primeiro, buscar apenas os parcelamentos básicos (sem relacionamentos)
    let queryBasica = supabase
      .from('parcelamentos')
      .select('*')
      .order('criado_em', { ascending: false })

    const { data: dataBasica, error: errorBasica } = await queryBasica

    if (errorBasica) {
      console.error('❌ [listarParcelamentosAdmin] Erro ao buscar parcelamentos básicos:', {
        message: errorBasica.message,
        details: (errorBasica as any).details,
        hint: (errorBasica as any).hint,
        code: (errorBasica as any).code,
      })
      return {
        parcelamentos: [],
        error: errorBasica,
      }
    }

    if (!dataBasica || dataBasica.length === 0) {
      console.log('ℹ️ [listarParcelamentosAdmin] Nenhum parcelamento encontrado')
      return {
        parcelamentos: [],
        error: null,
      }
    }

    console.log('✅ [listarParcelamentosAdmin] Parcelamentos básicos encontrados:', dataBasica.length)

    // Buscar pedidos relacionados para filtrar por revenda, unidade e forma_pagamento
    const pedidosIds = dataBasica.map(p => p.pedido_id)
    
    let pedidosQuery = supabase
      .from('pedidos')
      .select('id, forma_pagamento, parcelas_total, revenda_id, unidade_id, valor_total, dados_cliente, status, criado_em')
      .in('id', pedidosIds)
      .eq('forma_pagamento', 'pix_parcelado')

    if (revendaId) {
      pedidosQuery = pedidosQuery.eq('revenda_id', revendaId)
      console.log('🔍 [listarParcelamentosAdmin] Filtrando por revenda:', revendaId)
    }

    if (unidadeId) {
      pedidosQuery = pedidosQuery.eq('unidade_id', unidadeId)
      console.log('🔍 [listarParcelamentosAdmin] Filtrando por unidade:', unidadeId)
    }

    const { data: pedidosData, error: pedidosError } = await pedidosQuery

    if (pedidosError) {
      console.error('❌ [listarParcelamentosAdmin] Erro ao buscar pedidos:', pedidosError)
      // Se falhar, retorna parcelamentos básicos sem filtro
      return {
        parcelamentos: dataBasica.map(p => ({
          ...p,
          pedido: undefined,
          parcelas: [],
        })) as Parcelamento[],
        error: null,
      }
    }

    // Filtrar parcelamentos pelos pedidos encontrados
    const pedidosIdsValidos = new Set(pedidosData?.map(p => p.id) || [])
    const parcelamentosFiltrados = dataBasica.filter(p => pedidosIdsValidos.has(p.pedido_id))

    console.log('✅ [listarParcelamentosAdmin] Parcelamentos filtrados:', {
      totalBasicos: dataBasica.length,
      pedidosEncontrados: pedidosData?.length || 0,
      parcelamentosFiltrados: parcelamentosFiltrados.length,
    })

    // Agora tentar buscar com relacionamentos completos
    let parcelamentosQuery = supabase
      .from('parcelamentos')
      .select(`
        *,
        pedido:pedidos!inner (
          id,
          valor_total,
          dados_cliente,
          status,
          criado_em,
          forma_pagamento,
          revenda_id,
          revenda:revendas (
            id,
            nome_revenda,
            nome_publico
          ),
          unidade:unidades_revenda (
            id,
            nome,
            nome_publico
          )
        ),
        parcelas:parcelas (*)
      `)
      .eq('pedido.forma_pagamento', 'pix_parcelado')

    if (revendaId) {
      parcelamentosQuery = parcelamentosQuery.eq('pedido.revenda_id', revendaId)
      console.log('🔍 [listarParcelamentosAdmin] Filtrando query completa por revenda:', revendaId)
    }

    if (unidadeId) {
      parcelamentosQuery = parcelamentosQuery.eq('pedido.unidade_id', unidadeId)
      console.log('🔍 [listarParcelamentosAdmin] Filtrando query completa por unidade:', unidadeId)
    }

    const { data: dataCompleta, error: errorCompleta } = await parcelamentosQuery.order('criado_em', { ascending: false })

    // Se a query completa funcionou, usar ela
    if (!errorCompleta && dataCompleta && dataCompleta.length > 0) {
      console.log('✅ [listarParcelamentosAdmin] Query completa OK:', {
        quantidade: dataCompleta.length,
        primeiros3: dataCompleta.slice(0, 3).map(p => ({
          id: p.id,
          pedido_id: p.pedido_id,
          revenda: (p as any).pedido?.revenda?.nome_revenda,
        })),
      })
      
      // Processar e ordenar parcelamentos
      const parcelamentosOrdenados = (dataCompleta || [])
        .map((parcelamento: any) => {
          let parcelasArray = []
          if (parcelamento.parcelas) {
            if (Array.isArray(parcelamento.parcelas)) {
              parcelasArray = parcelamento.parcelas
            } else {
              parcelasArray = [parcelamento.parcelas]
            }
          }
          
          return {
            ...parcelamento,
            parcelas: parcelasArray.length > 0
              ? parcelasArray.sort((a: Parcela, b: Parcela) => a.numero_parcela - b.numero_parcela)
              : [],
          }
        })
        .sort((a: Parcelamento, b: Parcelamento) => {
          const dataA = a.pedido?.criado_em || a.criado_em
          const dataB = b.pedido?.criado_em || b.criado_em
          return new Date(dataB).getTime() - new Date(dataA).getTime()
        }) as Parcelamento[]

      return {
        parcelamentos: parcelamentosOrdenados,
        error: null,
      }
    }

    // Se a query completa falhou, usar dados básicos e buscar relacionamentos separadamente
    console.warn('⚠️ [listarParcelamentosAdmin] Query completa falhou, usando dados básicos:', errorCompleta)
    
    const parcelamentosComRelacionamentos = await Promise.all(
      parcelamentosFiltrados.map(async (parcelamento) => {
        const parcelamentoCompleto: any = { ...parcelamento }
        
        // Buscar pedido
        const pedido = pedidosData?.find(p => p.id === parcelamento.pedido_id)
        if (pedido) {
          parcelamentoCompleto.pedido = { ...pedido }
          
          // Buscar revenda se necessário
          if (pedido.revenda_id) {
            const { data: revenda } = await supabase
              .from('revendas')
              .select('id, nome_revenda')
              .eq('id', pedido.revenda_id)
              .single()
            if (revenda) {
              parcelamentoCompleto.pedido.revenda = revenda
            }
          }
        }
        
        // Buscar parcelas
        const { data: parcelasData } = await supabase
          .from('parcelas')
          .select('*')
          .eq('parcelamento_id', parcelamento.id)
          .order('numero_parcela', { ascending: true })
        
        if (parcelasData) {
          parcelamentoCompleto.parcelas = parcelasData
        } else {
          parcelamentoCompleto.parcelas = []
        }
        
        return parcelamentoCompleto
      })
    )

    // Ordenar parcelamentos
    const parcelamentosOrdenados = parcelamentosComRelacionamentos
      .sort((a: Parcelamento, b: Parcelamento) => {
        const dataA = a.pedido?.criado_em || a.criado_em
        const dataB = b.pedido?.criado_em || b.criado_em
        return new Date(dataB).getTime() - new Date(dataA).getTime()
      }) as Parcelamento[]

    console.log('✅ [listarParcelamentosAdmin] Parcelamentos finais:', {
      quantidade: parcelamentosOrdenados.length,
      primeiros3: parcelamentosOrdenados.slice(0, 3).map(p => ({
        id: p.id,
        pedido_id: p.pedido_id,
        revenda: p.pedido?.revenda?.nome_revenda,
        parcelas: p.parcelas?.length || 0,
      })),
    })

    return {
      parcelamentos: parcelamentosOrdenados,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar parcelamentos (Admin):', error)
    return {
      parcelamentos: [],
      error: error instanceof Error ? error : new Error('Erro ao listar parcelamentos'),
    }
  }
}

/**
 * Busca um parcelamento por ID
 */
export async function buscarParcelamento(
  parcelamentoId: string
): Promise<{ parcelamento: Parcelamento | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('parcelamentos')
      .select(`
        *,
        pedido:pedidos (
          id,
          valor_total,
          dados_cliente
        ),
        parcelas:parcelas (*)
      `)
      .eq('id', parcelamentoId)
      .single()

    if (error) {
      console.error('❌ Erro ao buscar parcelamento:', error)
      return {
        parcelamento: null,
        error,
      }
    }

    // Ordena as parcelas por numero_parcela
    const parcelamentoOrdenado = {
      ...data,
      parcelas: data.parcelas
        ? [...data.parcelas].sort((a: Parcela, b: Parcela) => a.numero_parcela - b.numero_parcela)
        : undefined,
    } as Parcelamento

    return {
      parcelamento: parcelamentoOrdenado,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar parcelamento:', error)
    return {
      parcelamento: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar parcelamento'),
    }
  }
}

/**
 * Busca parcelas pendentes do cliente atual
 */
export async function listarParcelasPendentes(): Promise<{ parcelas: Parcela[]; error: Error | null }> {
  try {
    // Busca parcelamentos do cliente
    const { parcelamentos } = await listarParcelamentos()
    
    // Extrai todas as parcelas pendentes
    const parcelasPendentes: Parcela[] = []
    
    for (const parcelamento of parcelamentos) {
      if (parcelamento.parcelas) {
        const pendentes = parcelamento.parcelas.filter(
          p => p.status === 'pendente' || p.status === 'atrasada'
        )
        parcelasPendentes.push(...pendentes)
      }
    }

    // Ordena por data de vencimento
    parcelasPendentes.sort((a, b) => 
      new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
    )

    return {
      parcelas: parcelasPendentes,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar parcelas pendentes:', error)
    return {
      parcelas: [],
      error: error instanceof Error ? error : new Error('Erro ao listar parcelas pendentes'),
    }
  }
}

/**
 * Gera PIX para uma parcela pendente se ainda não tiver
 */
export async function gerarPixParaParcela(
  parcelaId: string,
  valor: number,
  descricao: string
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    console.log('🔍 Gerando PIX para parcela:', parcelaId)

    // Verifica se a parcela já tem PIX
    const { data: parcelaData, error: fetchError } = await supabase
      .from('parcelas')
      .select('pix_copia_cola')
      .eq('id', parcelaId)
      .single()

    if (fetchError) {
      console.error('❌ Erro ao buscar parcela:', fetchError)
      return {
        error: fetchError,
        mensagem: 'Erro ao buscar parcela',
      }
    }

    // Se já tem PIX, não precisa gerar novamente
    if (parcelaData?.pix_copia_cola) {
      console.log('ℹ️ Parcela já possui PIX copia e cola')
      return { error: null }
    }

    // Gera o PIX
    const { gerarPix, atualizarParcelaComPix } = await import('./gerarPix')
    const dadosPix = await gerarPix(valor, descricao)

    // Atualiza a parcela
    const { error: updateError } = await atualizarParcelaComPix(parcelaId, dadosPix)

    if (updateError) {
      console.error('❌ Erro ao atualizar parcela com PIX:', updateError)
      return {
        error: updateError,
        mensagem: 'Erro ao salvar código PIX',
      }
    }

    console.log('✅ PIX gerado com sucesso')
    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao gerar PIX:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao gerar PIX'),
      mensagem: 'Erro inesperado ao gerar PIX',
    }
  }
}

/**
 * Marca uma parcela como paga
 * ⚠️ APENAS ADMIN pode executar esta ação
 */
export async function marcarParcelaComoPaga(
  parcelaId: string
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    // Verificar se o usuário é admin
    const { obterSessao } = await import('@/lib/auth')
    const { obterRoleDeUsuario } = await import('@/lib/roles')
    
    const session = await obterSessao()
    if (!session?.user) {
      return {
        error: new Error('Não autenticado'),
        mensagem: 'É necessário estar autenticado',
      }
    }
    
    // Verificar role nos metadados primeiro
    let role = obterRoleDeUsuario(session.user)
    
    // Sempre buscar na tabela usuarios para garantir que temos o role correto
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    // Priorizar role da tabela usuarios (fonte de verdade)
    if (usuarioData?.role) {
      role = usuarioData.role as 'admin' | 'revenda' | 'cliente'
    }
    
    const ehAdmin = role === 'admin'
    
    console.log('🔍 Verificação de admin (dar baixa):', { 
      userId: session.user.id, 
      roleMetadados: obterRoleDeUsuario(session.user),
      roleTabela: usuarioData?.role,
      roleFinal: role,
      ehAdmin 
    })
    
    if (!ehAdmin) {
      console.error('❌ Acesso negado: apenas ADMIN pode dar baixa em parcelas. Role atual:', role)
      return {
        error: new Error('Acesso negado'),
        mensagem: 'Apenas administradores podem dar baixa em parcelas',
      }
    }

    console.log('🔍 Marcando parcela como paga:', parcelaId)

    const { error: updateError } = await supabase
      .from('parcelas')
      .update({
        status: 'paga',
        data_pagamento: new Date().toISOString().split('T')[0], // Formato DATE
      })
      .eq('id', parcelaId)

    if (updateError) {
      console.error('❌ Erro ao marcar parcela como paga:', updateError)
      return {
        error: updateError,
        mensagem: traduzirErro(updateError.message) || 'Erro ao marcar parcela como paga',
      }
    }

    console.log('✅ Parcela marcada como paga com sucesso')

    // Verifica se todas as parcelas foram pagas para atualizar o status do parcelamento
    const { data: parcelaData } = await supabase
      .from('parcelas')
      .select('parcelamento_id')
      .eq('id', parcelaId)
      .single()

    if (parcelaData) {
      const { data: todasParcelas } = await supabase
        .from('parcelas')
        .select('status')
        .eq('parcelamento_id', parcelaData.parcelamento_id)

      const todasPagas = todasParcelas?.every(p => p.status === 'paga') ?? false

      if (todasPagas) {
        console.log('✅ Todas as parcelas foram pagas, atualizando parcelamento')
        const { error: parcelamentoError } = await supabase
          .from('parcelamentos')
          .update({ status: 'quitado' })
          .eq('id', parcelaData.parcelamento_id)

        if (parcelamentoError) {
          console.error('❌ Erro ao atualizar status do parcelamento:', parcelamentoError)
        }
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao marcar parcela como paga:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao marcar parcela como paga'),
      mensagem: 'Erro inesperado ao marcar parcela como paga',
    }
  }
}

/**
 * Marca todas as parcelas de um parcelamento como pagas (dar baixa completa)
 * ⚠️ APENAS ADMIN pode executar esta ação
 */
export async function darBaixaCompletaParcelamento(
  parcelamentoId: string
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    // Verificar se o usuário é admin
    const { obterSessao } = await import('@/lib/auth')
    const { obterRoleDeUsuario } = await import('@/lib/roles')
    
    const session = await obterSessao()
    if (!session?.user) {
      return {
        error: new Error('Não autenticado'),
        mensagem: 'É necessário estar autenticado',
      }
    }
    
    // Verificar role nos metadados primeiro
    let role = obterRoleDeUsuario(session.user)
    
    // Sempre buscar na tabela usuarios para garantir que temos o role correto
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    // Priorizar role da tabela usuarios (fonte de verdade)
    if (usuarioData?.role) {
      role = usuarioData.role as 'admin' | 'revenda' | 'cliente'
    }
    
    const ehAdmin = role === 'admin'
    
    if (!ehAdmin) {
      console.error('❌ Acesso negado: apenas ADMIN pode dar baixa completa. Role atual:', role)
      return {
        error: new Error('Acesso negado'),
        mensagem: 'Apenas administradores podem dar baixa completa em parcelamentos',
      }
    }

    console.log('🔍 Dando baixa completa no parcelamento:', parcelamentoId)

    // Marca todas as parcelas pendentes como pagas
    const { error: parcelasError } = await supabase
      .from('parcelas')
      .update({
        status: 'paga',
        data_pagamento: new Date().toISOString().split('T')[0], // Formato DATE
      })
      .eq('parcelamento_id', parcelamentoId)
      .in('status', ['pendente', 'atrasada'])

    if (parcelasError) {
      console.error('❌ Erro ao dar baixa nas parcelas:', parcelasError)
      return {
        error: parcelasError,
        mensagem: traduzirErro(parcelasError.message) || 'Erro ao dar baixa nas parcelas',
      }
    }

    console.log('✅ Parcelas atualizadas com sucesso')

    // Atualiza o status do parcelamento para quitado
    const { error: parcelamentoError } = await supabase
      .from('parcelamentos')
      .update({ status: 'quitado' })
      .eq('id', parcelamentoId)

    if (parcelamentoError) {
      console.error('❌ Erro ao atualizar status do parcelamento:', parcelamentoError)
      return {
        error: parcelamentoError,
        mensagem: traduzirErro(parcelamentoError.message) || 'Erro ao atualizar status do parcelamento',
      }
    }

    console.log('✅ Parcelamento atualizado para quitado')
    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao dar baixa completa:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao dar baixa completa'),
      mensagem: 'Erro inesperado ao dar baixa completa',
    }
  }
}

/**
 * Marca uma parcela como vencida/atrasada
 * ⚠️ APENAS ADMIN pode executar esta ação
 */
export async function marcarParcelaComoVencida(
  parcelaId: string
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    // Verificar se o usuário é admin
    const { obterSessao } = await import('@/lib/auth')
    const { obterRoleDeUsuario } = await import('@/lib/roles')
    
    const session = await obterSessao()
    if (!session?.user) {
      return {
        error: new Error('Não autenticado'),
        mensagem: 'É necessário estar autenticado',
      }
    }
    
    // Verificar role nos metadados primeiro
    let role = obterRoleDeUsuario(session.user)
    
    // Sempre buscar na tabela usuarios para garantir que temos o role correto
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    // Priorizar role da tabela usuarios (fonte de verdade)
    if (usuarioData?.role) {
      role = usuarioData.role as 'admin' | 'revenda' | 'cliente'
    }
    
    const ehAdmin = role === 'admin'
    
    if (!ehAdmin) {
      console.error('❌ Acesso negado: apenas ADMIN pode marcar parcelas como vencidas. Role atual:', role)
      return {
        error: new Error('Acesso negado'),
        mensagem: 'Apenas administradores podem marcar parcelas como vencidas',
      }
    }

    console.log('🔍 Marcando parcela como vencida:', parcelaId)

    const { error: updateError } = await supabase
      .from('parcelas')
      .update({
        status: 'atrasada',
        data_pagamento: null, // Remove data de pagamento se houver
      })
      .eq('id', parcelaId)

    if (updateError) {
      console.error('❌ Erro ao marcar parcela como vencida:', updateError)
      return {
        error: updateError,
        mensagem: traduzirErro(updateError.message) || 'Erro ao marcar parcela como vencida',
      }
    }

    console.log('✅ Parcela marcada como vencida com sucesso')
    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao marcar parcela como vencida:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao marcar parcela como vencida'),
      mensagem: 'Erro inesperado ao marcar parcela como vencida',
    }
  }
}

/**
 * Reverte uma parcela paga para pendente ou vencida
 * ⚠️ APENAS ADMIN pode executar esta ação
 */
export async function reverterParcela(
  parcelaId: string,
  novoStatus: 'pendente' | 'atrasada' = 'pendente'
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    // Verificar se o usuário é admin
    const { obterSessao } = await import('@/lib/auth')
    const { obterRoleDeUsuario } = await import('@/lib/roles')
    
    const session = await obterSessao()
    if (!session?.user) {
      return {
        error: new Error('Não autenticado'),
        mensagem: 'É necessário estar autenticado',
      }
    }
    
    // Verificar role nos metadados primeiro
    let role = obterRoleDeUsuario(session.user)
    
    // Sempre buscar na tabela usuarios para garantir que temos o role correto
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    // Priorizar role da tabela usuarios (fonte de verdade)
    if (usuarioData?.role) {
      role = usuarioData.role as 'admin' | 'revenda' | 'cliente'
    }
    
    const ehAdmin = role === 'admin'
    
    if (!ehAdmin) {
      console.error('❌ Acesso negado: apenas ADMIN pode reverter parcelas. Role atual:', role)
      return {
        error: new Error('Acesso negado'),
        mensagem: 'Apenas administradores podem reverter parcelas',
      }
    }

    console.log('🔍 Revertendo parcela:', { parcelaId, novoStatus })

    const { error: updateError } = await supabase
      .from('parcelas')
      .update({
        status: novoStatus,
        data_pagamento: null, // Remove data de pagamento
      })
      .eq('id', parcelaId)

    if (updateError) {
      console.error('❌ Erro ao reverter parcela:', updateError)
      return {
        error: updateError,
        mensagem: traduzirErro(updateError.message) || 'Erro ao reverter parcela',
      }
    }

    console.log('✅ Parcela revertida com sucesso')
    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao reverter parcela:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao reverter parcela'),
      mensagem: 'Erro inesperado ao reverter parcela',
    }
  }
}

/**
 * Verifica se um cliente tem parcelas atrasadas (inadimplente)
 */
export async function verificarClienteInadimplente(clienteId: string): Promise<{ 
  inadimplente: boolean
  totalParcelasAtrasadas: number
  error: Error | null 
}> {
  try {
    // Busca pedidos do cliente
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id')
      .eq('cliente_id', clienteId)
      .eq('forma_pagamento', 'pix_parcelado')

    if (pedidosError) {
      console.error('❌ Erro ao buscar pedidos do cliente:', pedidosError)
      return {
        inadimplente: false,
        totalParcelasAtrasadas: 0,
        error: pedidosError,
      }
    }

    if (!pedidosData || pedidosData.length === 0) {
      return {
        inadimplente: false,
        totalParcelasAtrasadas: 0,
        error: null,
      }
    }

    const pedidosIds = pedidosData.map(p => p.id)

    // Busca parcelamentos dos pedidos
    const { data: parcelamentosData, error: parcelamentosError } = await supabase
      .from('parcelamentos')
      .select('id')
      .in('pedido_id', pedidosIds)

    if (parcelamentosError || !parcelamentosData || parcelamentosData.length === 0) {
      return {
        inadimplente: false,
        totalParcelasAtrasadas: 0,
        error: null,
      }
    }

    const parcelamentosIds = parcelamentosData.map(p => p.id)

    // Busca parcelas atrasadas
    const { data: parcelasAtrasadas, error: parcelasError } = await supabase
      .from('parcelas')
      .select('id')
      .in('parcelamento_id', parcelamentosIds)
      .eq('status', 'atrasada')

    if (parcelasError) {
      console.error('❌ Erro ao buscar parcelas atrasadas:', parcelasError)
      return {
        inadimplente: false,
        totalParcelasAtrasadas: 0,
        error: parcelasError,
      }
    }

    const totalAtrasadas = parcelasAtrasadas?.length || 0

    return {
      inadimplente: totalAtrasadas > 0,
      totalParcelasAtrasadas: totalAtrasadas,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao verificar inadimplência:', error)
    return {
      inadimplente: false,
      totalParcelasAtrasadas: 0,
      error: error instanceof Error ? error : new Error('Erro ao verificar inadimplência'),
    }
  }
}

/**
 * Verifica se um cliente pode excluir sua conta
 * Retorna false se houver parcelas pendentes, vencidas ou inadimplentes
 */
export async function verificarPodeExcluirConta(clienteId: string): Promise<{ 
  podeExcluir: boolean
  motivo?: string
  totalParcelasBloqueantes: number
  error: Error | null 
}> {
  try {
    // Busca pedidos do cliente com parcelamento
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id')
      .eq('cliente_id', clienteId)
      .eq('forma_pagamento', 'pix_parcelado')

    if (pedidosError) {
      console.error('❌ Erro ao buscar pedidos do cliente:', pedidosError)
      return {
        podeExcluir: false,
        motivo: 'Erro ao verificar pedidos',
        totalParcelasBloqueantes: 0,
        error: pedidosError,
      }
    }

    if (!pedidosData || pedidosData.length === 0) {
      // Cliente não tem pedidos parcelados, pode excluir
      return {
        podeExcluir: true,
        totalParcelasBloqueantes: 0,
        error: null,
      }
    }

    const pedidosIds = pedidosData.map(p => p.id)

    // Busca parcelamentos dos pedidos
    const { data: parcelamentosData, error: parcelamentosError } = await supabase
      .from('parcelamentos')
      .select('id')
      .in('pedido_id', pedidosIds)

    if (parcelamentosError) {
      console.error('❌ Erro ao buscar parcelamentos:', parcelamentosError)
      return {
        podeExcluir: false,
        motivo: 'Erro ao verificar parcelamentos',
        totalParcelasBloqueantes: 0,
        error: parcelamentosError,
      }
    }

    if (!parcelamentosData || parcelamentosData.length === 0) {
      // Não tem parcelamentos, pode excluir
      return {
        podeExcluir: true,
        totalParcelasBloqueantes: 0,
        error: null,
      }
    }

    const parcelamentosIds = parcelamentosData.map(p => p.id)

    // Busca parcelas pendentes ou atrasadas (bloqueantes)
    const { data: parcelasBloqueantes, error: parcelasError } = await supabase
      .from('parcelas')
      .select('id, status, data_vencimento')
      .in('parcelamento_id', parcelamentosIds)
      .in('status', ['pendente', 'atrasada'])

    if (parcelasError) {
      console.error('❌ Erro ao buscar parcelas:', parcelasError)
      return {
        podeExcluir: false,
        motivo: 'Erro ao verificar parcelas',
        totalParcelasBloqueantes: 0,
        error: parcelasError,
      }
    }

    const totalBloqueantes = parcelasBloqueantes?.length || 0

    if (totalBloqueantes > 0) {
      const pendentes = parcelasBloqueantes?.filter(p => p.status === 'pendente').length || 0
      const atrasadas = parcelasBloqueantes?.filter(p => p.status === 'atrasada').length || 0
      
      let motivo = 'Você possui '
      if (pendentes > 0 && atrasadas > 0) {
        motivo += `${pendentes} parcela(s) pendente(s) e ${atrasadas} parcela(s) vencida(s)`
      } else if (pendentes > 0) {
        motivo += `${pendentes} parcela(s) pendente(s)`
      } else {
        motivo += `${atrasadas} parcela(s) vencida(s)`
      }
      motivo += '. Quitte todas as parcelas antes de excluir sua conta.'

      return {
        podeExcluir: false,
        motivo,
        totalParcelasBloqueantes: totalBloqueantes,
        error: null,
      }
    }

    // Todas as parcelas foram pagas ou canceladas, pode excluir
    return {
      podeExcluir: true,
      totalParcelasBloqueantes: 0,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao verificar se pode excluir conta:', error)
    return {
      podeExcluir: false,
      motivo: 'Erro inesperado ao verificar',
      totalParcelasBloqueantes: 0,
      error: error instanceof Error ? error : new Error('Erro ao verificar se pode excluir conta'),
    }
  }
}

/**
 * Lista negociações (pedidos com parcelas atrasadas) do cliente atual
 */
export async function listarNegociacoes(): Promise<{ 
  negociacoes: Array<{
    pedido_id: string
    pedido: {
      id: string
      valor_total: number
      criado_em: string
      revenda: {
        id: string
        nome_revenda: string
      }
    }
    parcelamento_id: string
    parcelasAtrasadas: Parcela[]
  }>
  error: Error | null 
}> {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const clienteId = sessionData?.session?.user?.id

    if (!clienteId) {
      return {
        negociacoes: [],
        error: new Error('Usuário não autenticado'),
      }
    }

    // Busca pedidos parcelados do cliente
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select(`
        id,
        valor_total,
        criado_em,
        revenda:revendas (
          id,
          nome_revenda
        )
      `)
      .eq('cliente_id', clienteId)
      .eq('forma_pagamento', 'pix_parcelado')

    if (pedidosError || !pedidosData || pedidosData.length === 0) {
      return {
        negociacoes: [],
        error: null,
      }
    }

    const pedidosIds = pedidosData.map(p => p.id)

    // Busca parcelamentos
    const { data: parcelamentosData, error: parcelamentosError } = await supabase
      .from('parcelamentos')
      .select('id, pedido_id')
      .in('pedido_id', pedidosIds)

    if (parcelamentosError || !parcelamentosData || parcelamentosData.length === 0) {
      return {
        negociacoes: [],
        error: null,
      }
    }

    const parcelamentosIds = parcelamentosData.map(p => p.id)

    // Busca parcelas atrasadas
    const { data: parcelasAtrasadas, error: parcelasError } = await supabase
      .from('parcelas')
      .select('*')
      .in('parcelamento_id', parcelamentosIds)
      .eq('status', 'atrasada')
      .order('data_vencimento', { ascending: true })

    if (parcelasError) {
      console.error('❌ Erro ao buscar parcelas atrasadas:', parcelasError)
      return {
        negociacoes: [],
        error: parcelasError,
      }
    }

    if (!parcelasAtrasadas || parcelasAtrasadas.length === 0) {
      return {
        negociacoes: [],
        error: null,
      }
    }

    // Agrupa por pedido
    const negociacoesMap = new Map<string, {
      pedido_id: string
      pedido: any
      parcelamento_id: string
      parcelasAtrasadas: Parcela[]
    }>()

    parcelasAtrasadas.forEach((parcela: Parcela) => {
      const parcelamento = parcelamentosData.find(p => p.id === parcela.parcelamento_id)
      if (!parcelamento) return

      const pedido = pedidosData.find(p => p.id === parcelamento.pedido_id)
      if (!pedido) return

      if (!negociacoesMap.has(parcelamento.pedido_id)) {
        negociacoesMap.set(parcelamento.pedido_id, {
          pedido_id: parcelamento.pedido_id,
          pedido: pedido,
          parcelamento_id: parcelamento.id,
          parcelasAtrasadas: [],
        })
      }

      const negociacao = negociacoesMap.get(parcelamento.pedido_id)!
      negociacao.parcelasAtrasadas.push(parcela)
    })

    const negociacoes = Array.from(negociacoesMap.values())

    return {
      negociacoes,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar negociações:', error)
    return {
      negociacoes: [],
      error: error instanceof Error ? error : new Error('Erro ao listar negociações'),
    }
  }
}

/**
 * Lista todas as inadimplências com detalhes completos (Admin)
 */
export async function listarInadimplenciasAdmin(revendaId?: string, unidadeId?: string | null): Promise<{
  inadimplencias: Array<{
    cliente_id: string
    cliente: {
      id: string
      nome_completo: string | null
      email: string
      telefone: string | null
      cpf: string | null
    }
    pedido_id: string
    pedido: {
      id: string
      valor_total: number
      criado_em: string
      revenda: {
        id: string
        nome_revenda: string
      }
    }
    parcelamento_id: string
    parcelasAtrasadas: Parcela[]
    totalAtrasado: number
  }>
  error: Error | null
}> {
  try {
    // Busca pedidos parcelados
    let pedidosQuery = supabase
      .from('pedidos')
      .select(`
        id,
        cliente_id,
        valor_total,
        criado_em,
        revenda_id,
        revenda:revendas (
          id,
          nome_revenda,
          nome_publico
        ),
        unidade:unidades_revenda (
          id,
          nome,
          nome_publico
        )
      `)
      .eq('forma_pagamento', 'pix_parcelado')

    if (revendaId) {
      pedidosQuery = pedidosQuery.eq('revenda_id', revendaId)
    }

    if (unidadeId) {
      pedidosQuery = pedidosQuery.eq('unidade_id', unidadeId)
    }

    const { data: pedidosData, error: pedidosError } = await pedidosQuery

    if (pedidosError || !pedidosData || pedidosData.length === 0) {
      return {
        inadimplencias: [],
        error: null,
      }
    }

    const pedidosIds = pedidosData.map(p => p.id)

    // Busca parcelamentos
    const { data: parcelamentosData, error: parcelamentosError } = await supabase
      .from('parcelamentos')
      .select('id, pedido_id')
      .in('pedido_id', pedidosIds)

    if (parcelamentosError || !parcelamentosData || parcelamentosData.length === 0) {
      return {
        inadimplencias: [],
        error: null,
      }
    }

    const parcelamentosIds = parcelamentosData.map(p => p.id)

    // Busca parcelas atrasadas
    const { data: parcelasAtrasadas, error: parcelasError } = await supabase
      .from('parcelas')
      .select('*')
      .in('parcelamento_id', parcelamentosIds)
      .eq('status', 'atrasada')
      .order('data_vencimento', { ascending: true })

    if (parcelasError) {
      console.error('❌ Erro ao buscar parcelas atrasadas:', parcelasError)
      return {
        inadimplencias: [],
        error: parcelasError,
      }
    }

    if (!parcelasAtrasadas || parcelasAtrasadas.length === 0) {
      return {
        inadimplencias: [],
        error: null,
      }
    }

    // Busca dados dos clientes
    const clienteIds = [...new Set(pedidosData.map(p => p.cliente_id).filter(Boolean))]
    const { data: clientesData } = await supabase
      .from('usuarios')
      .select('id, nome_completo, email, telefone, cpf')
      .in('id', clienteIds)

    const clientesMap = new Map<string, any>()
    clientesData?.forEach(cliente => {
      clientesMap.set(cliente.id, cliente)
    })

    // Agrupa por cliente e pedido
    const inadimplenciasMap = new Map<string, {
      cliente_id: string
      cliente: any
      pedido_id: string
      pedido: any
      parcelamento_id: string
      parcelasAtrasadas: Parcela[]
      totalAtrasado: number
    }>()

    parcelasAtrasadas.forEach((parcela: Parcela) => {
      const parcelamento = parcelamentosData.find(p => p.id === parcela.parcelamento_id)
      if (!parcelamento) return

      const pedido = pedidosData.find(p => p.id === parcelamento.pedido_id)
      if (!pedido || !pedido.cliente_id) return

      const cliente = clientesMap.get(pedido.cliente_id)
      if (!cliente) return

      const key = `${pedido.cliente_id}_${pedido.id}`
      
      if (!inadimplenciasMap.has(key)) {
        inadimplenciasMap.set(key, {
          cliente_id: pedido.cliente_id,
          cliente: cliente,
          pedido_id: pedido.id,
          pedido: pedido,
          parcelamento_id: parcelamento.id,
          parcelasAtrasadas: [],
          totalAtrasado: 0,
        })
      }

      const inadimplencia = inadimplenciasMap.get(key)!
      inadimplencia.parcelasAtrasadas.push(parcela)
      inadimplencia.totalAtrasado += parseFloat(parcela.valor.toString())
    })

    const inadimplencias = Array.from(inadimplenciasMap.values())

    return {
      inadimplencias,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar inadimplências:', error)
    return {
      inadimplencias: [],
      error: error instanceof Error ? error : new Error('Erro ao listar inadimplências'),
    }
  }
}
