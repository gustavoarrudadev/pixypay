import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'
import { obterSessao } from './auth'
import { criarTransacaoFinanceira } from './financeiro'

export interface Repasse {
  id: string
  revenda_id: string
  valor_total: number
  quantidade_transacoes: number
  data_repasse: string
  observacoes?: string | null
  criado_em: string
  criado_por?: string | null
  revenda?: {
    id: string
    nome_revenda: string
    nome_publico: string | null
  }
  transacoes?: Array<{
    id: string
    pedido_id: string
    valor_liquido: number
    antecipado?: boolean
    data_repasse_antecipada?: string | null
    data_repasse_prevista?: string
    modalidade?: 'D+1' | 'D+15' | 'D+30'
    pedido?: {
      id: string
      valor_total: number
    }
    cliente?: {
      id: string
      nome_completo: string | null
      email: string
    }
  }>
}

export interface DadosRepasse {
  revendaId: string
  transacaoIds: string[]
  observacoes?: string
}

/**
 * Lista repasses de uma revenda
 */
export async function listarRepassesRevenda(
  revendaId: string,
  filtros?: {
    dataInicio?: string
    dataFim?: string
    unidadeId?: string | null
  }
): Promise<{ repasses: Repasse[]; error: Error | null }> {
  try {
    // Se unidadeId for fornecido, primeiro busca os pedidos da unidade
    let pedidosIds: string[] | null = null
    if (filtros?.unidadeId) {
      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('id')
        .eq('revenda_id', revendaId)
        .eq('unidade_id', filtros.unidadeId)
      
      pedidosIds = pedidosData?.map(p => p.id) || []
      if (pedidosIds.length === 0) {
        return { repasses: [], error: null }
      }
    }

    let query = supabase
      .from('repasses')
      .select(`
        *,
        revenda:revendas (
          id,
          nome_revenda,
          nome_publico
        )
      `)
      .eq('revenda_id', revendaId)
      .order('data_repasse', { ascending: false })

    if (filtros?.dataInicio) {
      query = query.gte('data_repasse', filtros.dataInicio)
    }

    if (filtros?.dataFim) {
      query = query.lte('data_repasse', filtros.dataFim)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erro ao listar repasses:', error)
      return {
        repasses: [],
        error,
      }
    }

    // Busca transações de cada repasse
    const repassesComTransacoes = await Promise.all(
      (data || []).map(async (repasse) => {
        let queryTransacoes = supabase
          .from('repasses_transacoes')
          .select(`
            transacao:transacoes_financeiras (
              id,
              pedido_id,
              valor_liquido,
              pedido:pedidos (
                id,
                valor_total,
                unidade_id
              ),
              cliente:usuarios (
                id,
                nome_completo,
                email
              )
            )
          `)
          .eq('repasse_id', repasse.id)

        const { data: transacoesData } = await queryTransacoes

        // Se unidadeId foi fornecido, filtra transações pelos pedidos da unidade
        let transacoesFiltradas = transacoesData?.map((rt: any) => rt.transacao) || []
        if (pedidosIds && pedidosIds.length > 0) {
          transacoesFiltradas = transacoesFiltradas.filter((t: any) => 
            t?.pedido_id && pedidosIds?.includes(t.pedido_id)
          )
        }

        // Se não há transações após filtro, não inclui o repasse
        if (pedidosIds && transacoesFiltradas.length === 0) {
          return null
        }

        // Recalcula valor_total e quantidade_transacoes baseado nas transações filtradas
        const valorTotalFiltrado = transacoesFiltradas.reduce((sum: number, t: any) => {
          const valor = typeof t.valor_liquido === 'string' ? parseFloat(t.valor_liquido) : (t.valor_liquido || 0)
          return sum + valor
        }, 0)

        return {
          ...repasse,
          valor_total: valorTotalFiltrado,
          quantidade_transacoes: transacoesFiltradas.length,
          transacoes: transacoesFiltradas,
        }
      })
    )

    // Remove repasses nulos (que não têm transações da unidade)
    const repassesFiltrados = repassesComTransacoes.filter((r): r is Repasse => r !== null)

    return {
      repasses: repassesFiltrados as Repasse[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar repasses:', error)
    return {
      repasses: [],
      error: error instanceof Error ? error : new Error('Erro ao listar repasses'),
    }
  }
}

/**
 * Lista todos os repasses (Admin)
 */
export async function listarTodosRepasses(
  filtros?: {
    revendaId?: string
    unidadeId?: string | null
    dataInicio?: string
    dataFim?: string
  }
): Promise<{ repasses: Repasse[]; error: Error | null }> {
  try {
    console.log('📊 [listarTodosRepasses] Iniciando busca com filtros:', filtros)
    
    // Se unidadeId for fornecido, primeiro busca os pedidos da unidade
    // Isso deve ser feito ANTES de buscar os repasses para otimizar a busca
    let pedidosIdsUnidade: string[] | null = null
    let repassesIdsFiltrados: string[] | null = null
    
    if (filtros?.unidadeId) {
      let queryPedidos = supabase
        .from('pedidos')
        .select('id')
        .eq('unidade_id', filtros.unidadeId)
      
      // Se também há revendaId, filtra por revenda também
      if (filtros?.revendaId) {
        queryPedidos = queryPedidos.eq('revenda_id', filtros.revendaId)
      }
      
      const { data: pedidosData } = await queryPedidos
      
      pedidosIdsUnidade = pedidosData?.map(p => p.id) || []
      console.log('📊 [listarTodosRepasses] Pedidos da unidade encontrados:', {
        unidadeId: filtros.unidadeId,
        revendaId: filtros?.revendaId || 'todas',
        quantidadePedidos: pedidosIdsUnidade.length,
      })
      
      if (pedidosIdsUnidade.length === 0) {
        console.log('ℹ️ [listarTodosRepasses] Nenhum pedido encontrado para a unidade, retornando vazio')
        return { repasses: [], error: null }
      }
      
      // Buscar repasses que têm transações desses pedidos
      const { data: transacoesComRepasse } = await supabase
        .from('transacoes_financeiras')
        .select('repasse_id')
        .in('pedido_id', pedidosIdsUnidade)
        .not('repasse_id', 'is', null)
      
      repassesIdsFiltrados = [...new Set(transacoesComRepasse?.map(t => t.repasse_id).filter(Boolean) || [])] as string[]
      
      console.log('📊 [listarTodosRepasses] Repasses com transações da unidade:', {
        quantidadeRepasses: repassesIdsFiltrados.length,
      })
      
      if (repassesIdsFiltrados.length === 0) {
        console.log('ℹ️ [listarTodosRepasses] Nenhum repasse encontrado com transações da unidade, retornando vazio')
        return { repasses: [], error: null }
      }
    }
    
    // Primeiro, buscar apenas os repasses básicos (sem relacionamentos)
    let queryBasica = supabase
      .from('repasses')
      .select('*')
      .order('data_repasse', { ascending: false })

    if (filtros?.revendaId) {
      queryBasica = queryBasica.eq('revenda_id', filtros.revendaId)
    }
    
    // Se há repasses filtrados por unidade, usar apenas esses
    if (repassesIdsFiltrados && repassesIdsFiltrados.length > 0) {
      queryBasica = queryBasica.in('id', repassesIdsFiltrados)
    }

    if (filtros?.dataInicio) {
      queryBasica = queryBasica.gte('data_repasse', filtros.dataInicio)
    }

    if (filtros?.dataFim) {
      queryBasica = queryBasica.lte('data_repasse', filtros.dataFim)
    }

    const { data: dataBasica, error: errorBasica } = await queryBasica

    if (errorBasica) {
      console.error('❌ Erro ao listar repasses básicos:', {
        message: errorBasica.message,
        details: (errorBasica as any).details,
        hint: (errorBasica as any).hint,
        code: (errorBasica as any).code,
      })
      return {
        repasses: [],
        error: errorBasica,
      }
    }

    if (!dataBasica || dataBasica.length === 0) {
      console.log('ℹ️ [listarTodosRepasses] Nenhum repasse encontrado')
      return {
        repasses: [],
        error: null,
      }
    }

    console.log('✅ [listarTodosRepasses] Repasses básicos encontrados:', dataBasica.length)

    // Agora tentar buscar com relacionamentos
    let queryCompleta = supabase
      .from('repasses')
      .select(`
        *,
        revenda:revendas (
          id,
          nome_revenda,
          nome_publico
        )
      `)
      .order('data_repasse', { ascending: false })

    if (filtros?.revendaId) {
      queryCompleta = queryCompleta.eq('revenda_id', filtros.revendaId)
    }
    
    // Se há repasses filtrados por unidade, usar apenas esses
    if (repassesIdsFiltrados && repassesIdsFiltrados.length > 0) {
      queryCompleta = queryCompleta.in('id', repassesIdsFiltrados)
    }
    
    if (filtros?.dataInicio) {
      queryCompleta = queryCompleta.gte('data_repasse', filtros.dataInicio)
    }
    if (filtros?.dataFim) {
      queryCompleta = queryCompleta.lte('data_repasse', filtros.dataFim)
    }

    const { data: dataCompleta, error: errorCompleta } = await queryCompleta

    // Se a query completa funcionou, usar ela
    let repassesComRelacionamentos = dataCompleta || []
    
    // Se a query completa falhou, usar dados básicos e buscar relacionamentos separadamente
    if (errorCompleta || !dataCompleta || dataCompleta.length === 0) {
      console.warn('⚠️ [listarTodosRepasses] Query completa falhou, usando dados básicos:', errorCompleta)
      
      // Buscar relacionamentos separadamente
      repassesComRelacionamentos = await Promise.all(
        dataBasica.map(async (repasse) => {
          const repasseCompleto: any = { ...repasse }
          
          // Buscar revenda
          const { data: revenda } = await supabase
            .from('revendas')
            .select('id, nome_revenda, nome_publico')
            .eq('id', repasse.revenda_id)
            .single()
          if (revenda) repasseCompleto.revenda = revenda
          
          return repasseCompleto
        })
      )
    }

    console.log('✅ [listarTodosRepasses] Repasses com relacionamentos:', {
      quantidade: repassesComRelacionamentos.length,
      primeiros3: repassesComRelacionamentos.slice(0, 3).map(r => ({
        id: r.id,
        revenda: r.revenda?.nome_revenda,
        valor_total: r.valor_total,
      })),
    })

    // pedidosIdsUnidade já foi definido anteriormente quando há filtro de unidade
    // Se não foi definido, significa que não há filtro de unidade

    // Busca transações de cada repasse (incluindo campo antecipado)
    const repassesComTransacoes = await Promise.all(
      repassesComRelacionamentos.map(async (repasse) => {
        const { data: transacoesData } = await supabase
          .from('repasses_transacoes')
          .select(`
            transacao:transacoes_financeiras (
              id,
              pedido_id,
              valor_liquido,
              antecipado,
              data_repasse_antecipada,
              data_repasse_prevista,
              modalidade,
              pedido:pedidos (
                id,
                valor_total,
                unidade_id
              ),
              cliente:usuarios (
                id,
                nome_completo,
                email
              )
            )
          `)
          .eq('repasse_id', repasse.id)

        // Filtrar transações por unidade se necessário
        let transacoes = transacoesData?.map((rt: any) => rt.transacao).filter((t: any) => t !== null) || []
        
        if (pedidosIdsUnidade && pedidosIdsUnidade.length > 0) {
          // Filtrar apenas transações dos pedidos da unidade
          transacoes = transacoes.filter((t: any) => 
            t?.pedido_id && pedidosIdsUnidade!.includes(t.pedido_id)
          )
          
          console.log('📊 [listarTodosRepasses] Filtro de unidade aplicado no repasse:', {
            repasseId: repasse.id,
            transacoesAntes: transacoesData?.length || 0,
            transacoesDepois: transacoes.length,
            pedidosIdsUnidade: pedidosIdsUnidade.length,
          })
          
          // Se não há transações após filtro, não inclui o repasse
          if (transacoes.length === 0) {
            console.log('⚠️ [listarTodosRepasses] Repasse sem transações da unidade, excluindo:', repasse.id)
            return null
          }
          
          // Recalcula valor_total e quantidade_transacoes baseado apenas nas transações filtradas
          const valorTotalFiltrado = transacoes.reduce((sum: number, t: any) => {
            const valor = typeof t.valor_liquido === 'string' ? parseFloat(t.valor_liquido) : (t.valor_liquido || 0)
            return sum + valor
          }, 0)
          
          return {
            ...repasse,
            valor_total: valorTotalFiltrado,
            quantidade_transacoes: transacoes.length,
            transacoes,
          }
        }

        return {
          ...repasse,
          transacoes,
        }
      })
    )

    // Remove repasses nulos (que não têm transações da unidade)
    const repassesFiltrados = repassesComTransacoes.filter((r): r is Repasse => r !== null)

    console.log('✅ [listarTodosRepasses] Repasses finais:', {
      quantidade: repassesFiltrados.length,
      primeiros3: repassesFiltrados.slice(0, 3).map(r => ({
        id: r.id,
        revenda: r.revenda?.nome_revenda,
        valor_total: r.valor_total,
        transacoes: r.transacoes?.length || 0,
      })),
    })

    return {
      repasses: repassesFiltrados as Repasse[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar repasses:', error)
    return {
      repasses: [],
      error: error instanceof Error ? error : new Error('Erro ao listar repasses'),
    }
  }
}

/**
 * Lista transações liberadas para repasse (Admin)
 * Busca diretamente dos pedidos da revenda e cria transações financeiras automaticamente se necessário
 */
export async function listarTransacoesLiberadas(
  revendaId?: string,
  incluirPendentes?: boolean,
  criarTransacoesAutomaticamente: boolean = true,
  unidadeId?: string | null
): Promise<{
  transacoes: Array<{
    id: string
    pedido_id: string
    revenda_id: string
    valor_bruto: number
    valor_liquido: number
    taxa_percentual: number
    taxa_fixa: number
    modalidade: 'D+1' | 'D+15' | 'D+30'
    data_repasse_prevista: string
    bloqueado: boolean
    bloqueado_motivo?: string | null
    antecipado: boolean
    data_repasse_antecipada?: string | null
    status?: string
    repasse_id?: string | null
    pedido?: {
      id: string
      valor_total: number
    }
    cliente?: {
      id: string
      nome_completo: string | null
      email: string
    }
    revenda?: {
      id: string
      nome_revenda: string
    }
  }>;
  error: Error | null;
}> {
  try {
    console.log('🔍 [listarTransacoesLiberadas] Iniciando busca...', { revendaId, incluirPendentes, unidadeId })
    
    // PRIMEIRO: Buscar pedidos da revenda e garantir que todos tenham transações financeiras
    let queryPedidos = supabase
      .from('pedidos')
      .select('id, revenda_id, cliente_id, valor_total, criado_em, forma_pagamento, parcelas_total, unidade_id')
    
    if (revendaId) {
      queryPedidos = queryPedidos.eq('revenda_id', revendaId)
    }

    if (unidadeId) {
      queryPedidos = queryPedidos.eq('unidade_id', unidadeId)
    }
    
    const { data: pedidos, error: pedidosError } = await queryPedidos
    
    if (pedidosError) {
      console.error('❌ [listarTransacoesLiberadas] Erro ao buscar pedidos:', pedidosError)
      return {
        transacoes: [],
        error: pedidosError,
      }
    }
    
    if (!pedidos || pedidos.length === 0) {
      console.log('ℹ️ [listarTransacoesLiberadas] Nenhum pedido encontrado')
      return {
        transacoes: [],
        error: null,
      }
    }
    
    console.log(`📦 [listarTransacoesLiberadas] Encontrados ${pedidos.length} pedido(s)`, { 
      unidadeId, 
      revendaId,
      pedidosIds: pedidos.map(p => p.id).slice(0, 5) 
    })
    
    // Obter IDs dos pedidos filtrados ANTES de criar transações
    const pedidosIds = pedidos.map(p => p.id)
    
    // Verificar quais pedidos não têm transação financeira e criar automaticamente
    // Apenas se criarTransacoesAutomaticamente for true (carregamento inicial da página)
    if (criarTransacoesAutomaticamente) {
      // PRIMEIRO: Limpar transações duplicadas antes de criar novas
      const { limparTransacoesDuplicadas } = await import('./limparTransacoesDuplicadas')
      const { removidas } = await limparTransacoesDuplicadas()
      if (removidas > 0) {
        console.log(`🧹 [listarTransacoesLiberadas] ${removidas} transação(ões) duplicada(s) removida(s)`)
      }

      // Buscar pedidos com suas parcelas para entender melhor a estrutura
      const pedidosComParcelas = await Promise.all(
        pedidos.map(async (pedido) => {
          // Buscar parcelas do pedido
          const { data: parcelamento } = await supabase
            .from('parcelamentos')
            .select('id')
            .eq('pedido_id', pedido.id)
            .maybeSingle()

          let parcelasCount = 0
          if (parcelamento) {
            const { count } = await supabase
              .from('parcelas')
              .select('*', { count: 'exact', head: true })
              .eq('parcelamento_id', parcelamento.id)
            parcelasCount = count || 0
          }

          return {
            ...pedido,
            parcelas_total: parcelasCount,
            forma_pagamento: (pedido as any).forma_pagamento || 'pix_vista',
          }
        })
      )

      // Buscar transações existentes APENAS dos pedidos filtrados
      let queryTransacoes = supabase
        .from('transacoes_financeiras')
        .select('pedido_id')
      
      // Filtrar apenas pelos pedidos da unidade/revenda selecionada
      if (pedidosIds.length > 0) {
        queryTransacoes = queryTransacoes.in('pedido_id', pedidosIds)
      }
      
      const { data: todasTransacoes } = await queryTransacoes
      
      console.log('📊 [listarTransacoesLiberadas] Transações existentes encontradas:', {
        total: todasTransacoes?.length || 0,
        pedidosIds: pedidosIds.length,
      })
      
      const pedidosComTransacao = new Set(
        todasTransacoes?.map((t) => t.pedido_id) || []
      )
      
      // Filtrar apenas pedidos sem transação
      // Para pedidos parcelados: criar apenas 1 transação (para entrada/primeira parcela)
      // Para pedidos à vista: criar 1 transação
      const pedidosSemTransacao = pedidosComParcelas.filter(
        (pedido) => !pedidosComTransacao.has(pedido.id)
      )
      
      console.log(`📊 [listarTransacoesLiberadas] ${pedidosSemTransacao.length} pedido(s) sem transação financeira`)
      
      // Criar transações apenas para pedidos que realmente não têm
      for (const pedido of pedidosSemTransacao) {
        console.log(`🔄 [listarTransacoesLiberadas] Criando transação financeira para pedido ${pedido.id}...`)
        const dataPagamento = pedido.criado_em || new Date().toISOString()
        
        // Para pedidos parcelados, usar valor_total (entrada)
        // Para pedidos à vista, usar valor_total
        const valorBruto = pedido.valor_total
        
        const { error: criarError } = await criarTransacaoFinanceira(
          pedido.id,
          pedido.revenda_id,
          pedido.cliente_id,
          valorBruto,
          dataPagamento,
          pedido.unidade_id || null
        )
        
        if (criarError) {
          console.error(`❌ [listarTransacoesLiberadas] Erro ao criar transação para pedido ${pedido.id}:`, criarError)
        } else {
          console.log(`✅ [listarTransacoesLiberadas] Transação criada para pedido ${pedido.id}`)
        }
      }
    }
    
    // Se incluirPendentes for true, busca transações liberadas E pendentes
    // Caso contrário, busca apenas liberadas
    const statusFiltro = incluirPendentes ? ['liberado', 'pendente'] : ['liberado']
    
    // Tenta usar função RPC primeiro (bypass RLS para admin) - apenas para liberadas
    // Se incluirPendentes for true OU unidadeId for fornecido, pula a RPC e vai direto para query normal
    // (RPC não suporta filtro de unidade)
    if (!incluirPendentes && !unidadeId) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('listar_transacoes_liberadas_admin', {
          p_revenda_id: revendaId || null
        })

        if (!rpcError && rpcData && rpcData.length > 0) {
          console.log('✅ [listarTransacoesLiberadas] RPC funcionou:', { count: rpcData.length })
          
          const transacoesProcessadas = rpcData.map((t: any) => ({
            id: t.id,
            pedido_id: t.pedido_id,
            revenda_id: t.revenda_id,
            valor_liquido: typeof t.valor_liquido === 'string' ? parseFloat(t.valor_liquido) : (t.valor_liquido || 0),
            data_repasse_prevista: t.data_repasse_prevista,
            bloqueado: t.bloqueado ?? false,
            bloqueado_motivo: t.bloqueado_motivo ?? null,
            antecipado: t.antecipado ?? false,
            data_repasse_antecipada: t.data_repasse_antecipada ?? null,
            status: 'liberado', // RPC sempre retorna liberadas
            pedido: t.pedido_valor_total ? {
              id: t.pedido_id,
              valor_total: typeof t.pedido_valor_total === 'string' ? parseFloat(t.pedido_valor_total) : t.pedido_valor_total
            } : null,
            cliente: t.cliente_email ? {
              id: t.cliente_id,
              nome_completo: t.cliente_nome,
              email: t.cliente_email
            } : null,
            revenda: t.revenda_nome ? {
              id: t.revenda_id,
              nome_revenda: t.revenda_nome
            } : null,
          }))

          console.log('✅ [listarTransacoesLiberadas] Transações processadas via RPC:', {
            count: transacoesProcessadas.length,
            ids: transacoesProcessadas.map((t: any) => t.id)
          })

          return {
            transacoes: transacoesProcessadas as any[],
            error: null,
          }
        } else if (rpcError) {
          console.warn('⚠️ [listarTransacoesLiberadas] RPC não disponível ou erro:', {
            message: rpcError.message,
            details: (rpcError as any).details,
            hint: (rpcError as any).hint,
            code: (rpcError as any).code
          })
          // Continua com query normal (fallback)
        } else if (!rpcData || rpcData.length === 0) {
          console.log('ℹ️ [listarTransacoesLiberadas] RPC retornou vazio, continuando com query normal')
          // Continua com query normal para buscar transações
        }
      } catch (rpcErr) {
        console.warn('⚠️ [listarTransacoesLiberadas] Erro ao tentar RPC, usando query normal:', rpcErr)
        // Continua com query normal
      }
    }
    
    // Query normal - busca transações liberadas e/ou pendentes conforme statusFiltro
    
    // Usa os IDs dos pedidos já filtrados (definido anteriormente)
    // pedidosIds já foi definido acima
    
    // Primeiro testa query básica sem relacionamentos para verificar RLS
    let queryBasica = supabase
      .from('transacoes_financeiras')
      .select('id, pedido_id, revenda_id, cliente_id, valor_bruto, valor_liquido, taxa_percentual, taxa_fixa, modalidade, data_repasse_prevista, bloqueado, bloqueado_motivo, antecipado, data_repasse_antecipada, status')
      .in('status', statusFiltro)

    // SEMPRE filtra por pedidos quando há pedidos filtrados (seja por unidade ou revenda)
    // Isso garante que apenas transações dos pedidos corretos sejam retornadas
    if (pedidosIds.length > 0) {
      queryBasica = queryBasica.in('pedido_id', pedidosIds)
      console.log('📊 [listarTransacoesLiberadas] Filtro aplicado na query básica via pedidosIds:', {
        quantidadePedidos: pedidosIds.length,
        unidadeId: unidadeId || 'todas',
        revendaId: revendaId || 'todas',
        primeirosPedidos: pedidosIds.slice(0, 5),
      })
    } else if (revendaId) {
      // Se não há pedidosIds mas há revendaId, filtra por revenda
      queryBasica = queryBasica.eq('revenda_id', revendaId)
      console.log('📊 [listarTransacoesLiberadas] Filtro aplicado por revendaId:', revendaId)
    }

    const { data: dataBasica, error: errorBasica } = await queryBasica
    
    console.log('📊 [listarTransacoesLiberadas] Query básica (sem relacionamentos):', {
      dataLength: dataBasica?.length || 0,
      error: errorBasica ? {
        message: errorBasica.message,
        code: (errorBasica as any).code,
        details: (errorBasica as any).details,
        hint: (errorBasica as any).hint
      } : null
    })

    if (errorBasica) {
      console.error('❌ [listarTransacoesLiberadas] Erro na query básica (possível problema de RLS):', errorBasica)
      return {
        transacoes: [],
        error: errorBasica,
      }
    }

    if (!dataBasica || dataBasica.length === 0) {
      console.log('ℹ️ [listarTransacoesLiberadas] Nenhuma transação encontrada (query básica retornou vazio)')
      return {
        transacoes: [],
        error: null,
      }
    }

    console.log('✅ [listarTransacoesLiberadas] Query básica OK, buscando relacionamentos...')
    
    // Se a query básica funcionou, agora busca com relacionamentos
    let query = supabase
      .from('transacoes_financeiras')
      .select(`
        id,
        pedido_id,
        revenda_id,
        valor_bruto,
        valor_liquido,
        taxa_percentual,
        taxa_fixa,
        modalidade,
        data_repasse_prevista,
        bloqueado,
        bloqueado_motivo,
        antecipado,
        data_repasse_antecipada,
        status,
        repasse_id,
        pedido:pedidos (
          id,
          valor_total
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
      `)
      .in('status', statusFiltro)
      .order('data_repasse_prevista', { ascending: true })

    // SEMPRE filtra por pedidos quando há pedidos filtrados (seja por unidade ou revenda)
    // Isso garante que apenas transações dos pedidos corretos sejam retornadas
    if (pedidosIds.length > 0) {
      query = query.in('pedido_id', pedidosIds)
      console.log('📊 [listarTransacoesLiberadas] Filtro aplicado na query completa via pedidosIds:', {
        quantidadePedidos: pedidosIds.length,
        unidadeId: unidadeId || 'todas',
        revendaId: revendaId || 'todas',
        primeirosPedidos: pedidosIds.slice(0, 5),
      })
    } else if (revendaId) {
      // Se não há pedidosIds mas há revendaId, filtra por revenda
      query = query.eq('revenda_id', revendaId)
      console.log('📊 [listarTransacoesLiberadas] Filtro aplicado na query completa por revendaId:', revendaId)
    }

    const { data, error } = await query
    
    console.log('📊 [listarTransacoesLiberadas] Resultado da query completa:', {
      dataLength: data?.length || 0,
      error: error ? {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint
      } : null
    })

    // Se a query completa falhar mas a básica funcionou, usa os dados básicos e busca relacionamentos separadamente
    if (error && dataBasica && dataBasica.length > 0) {
      console.warn('⚠️ [listarTransacoesLiberadas] Query completa falhou, usando dados básicos e buscando relacionamentos separadamente...')
      
      // Filtrar dataBasica por pedidos filtrados (unidade ou revenda)
      let dataBasicaFiltrada = dataBasica
      if (pedidosIds.length > 0) {
        dataBasicaFiltrada = dataBasica.filter((t: any) => pedidosIds.includes(t.pedido_id))
        console.log('📊 [listarTransacoesLiberadas] Dados básicos filtrados:', {
          antes: dataBasica.length,
          depois: dataBasicaFiltrada.length,
          unidadeId: unidadeId || 'todas',
          pedidosIds: pedidosIds.length,
        })
      }
      
      const transacoesComRelacionamentos = await Promise.all(
        dataBasicaFiltrada.map(async (t: any) => {
          const [pedidoResult, clienteResult, revendaResult] = await Promise.all([
            supabase.from('pedidos').select('id, valor_total').eq('id', t.pedido_id).maybeSingle(),
            supabase.from('usuarios').select('id, nome_completo, email').eq('id', t.cliente_id).maybeSingle(),
            supabase.from('revendas').select('id, nome_revenda').eq('id', t.revenda_id).maybeSingle(),
          ])

          return {
            ...t,
            pedido: pedidoResult.data || null,
            cliente: clienteResult.data || null,
            revenda: revendaResult.data || null,
          }
        })
      )

      const transacoesProcessadas = transacoesComRelacionamentos.map((t: any) => {
        const valorLiquido = typeof t.valor_liquido === 'string' 
          ? parseFloat(t.valor_liquido) 
          : (t.valor_liquido || 0)
        
        const valorBruto = typeof t.valor_bruto === 'string' 
          ? parseFloat(t.valor_bruto) 
          : (t.valor_bruto || 0)
        
        return {
          ...t,
          valor_bruto: valorBruto,
          valor_liquido: valorLiquido,
          taxa_percentual: t.taxa_percentual ?? null,
          taxa_fixa: t.taxa_fixa ?? null,
          modalidade: t.modalidade ?? null,
          bloqueado: t.bloqueado ?? false,
          bloqueado_motivo: t.bloqueado_motivo ?? null,
          antecipado: t.antecipado ?? false,
          data_repasse_antecipada: t.data_repasse_antecipada ?? null,
          status: t.status || 'pendente',
        }
      })

      console.log('✅ [listarTransacoesLiberadas] Transações processadas (fallback):', {
        count: transacoesProcessadas.length,
        ids: transacoesProcessadas.map((t: any) => t.id)
      })

      return {
        transacoes: transacoesProcessadas as any[],
        error: null,
      }
    }

    // Se não houver erro e houver dados, processa normalmente
    if (!error && data && data.length > 0) {
      const transacoesProcessadas = data.map((t: any) => {
        const valorLiquido = typeof t.valor_liquido === 'string' 
          ? parseFloat(t.valor_liquido) 
          : (t.valor_liquido || 0)
        
        const valorBruto = typeof t.valor_bruto === 'string' 
          ? parseFloat(t.valor_bruto) 
          : (t.valor_bruto || 0)
        
        return {
          ...t,
          valor_bruto: valorBruto,
          valor_liquido: valorLiquido,
          taxa_percentual: t.taxa_percentual ?? null,
          taxa_fixa: t.taxa_fixa ?? null,
          modalidade: t.modalidade ?? null,
          bloqueado: t.bloqueado ?? false,
          bloqueado_motivo: t.bloqueado_motivo ?? null,
          antecipado: t.antecipado ?? false,
          data_repasse_antecipada: t.data_repasse_antecipada ?? null,
          status: t.status || 'pendente',
        }
      })

      console.log('✅ [listarTransacoesLiberadas] Transações processadas (sucesso):', {
        count: transacoesProcessadas.length,
        ids: transacoesProcessadas.map((t: any) => t.id)
      })

      return {
        transacoes: transacoesProcessadas as any[],
        error: null,
      }
    }

    // Se erro for relacionado a colunas não existentes, tenta sem os novos campos
    if (error && (
      error.message?.includes('column "bloqueado" does not exist') ||
      error.message?.includes('column "antecipado" does not exist') ||
      (error as any).code === '42703'
    )) {
      console.warn('⚠️ Campos de bloqueio/antecipação não existem ainda. Buscando sem esses campos...')
      
      // Busca sem os novos campos (fallback para antes da migration 050)
      let fallbackQuery = supabase
        .from('transacoes_financeiras')
        .select(`
          id,
          pedido_id,
          revenda_id,
          valor_liquido,
          data_repasse_prevista,
          pedido:pedidos (
            id,
            valor_total
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
        `)
        .eq('status', 'liberado')
        .order('data_repasse_prevista', { ascending: true })

      if (revendaId) {
        fallbackQuery = fallbackQuery.eq('revenda_id', revendaId)
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery

      if (fallbackError) {
        console.error('❌ Erro ao listar transações liberadas (fallback):', fallbackError)
        return {
          transacoes: [],
          error: fallbackError,
        }
      }

      // Adiciona valores padrão para campos que não existem
      const transacoesComDefaults = (fallbackData || []).map((t: any) => ({
        ...t,
        bloqueado: false,
        bloqueado_motivo: null,
        antecipado: false,
        data_repasse_antecipada: null,
      }))

      return {
        transacoes: transacoesComDefaults as any[],
        error: null,
      }
    }

    if (error) {
      console.error('❌ Erro ao listar transações liberadas:', error)
      console.error('❌ Detalhes:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return {
        transacoes: [],
        error,
      }
    }

    // Garante valores padrão caso algum campo seja null
    const transacoesComDefaults = (data || []).map((t: any) => {
      // Converter valores numeric para number se necessário
      const valorLiquido = typeof t.valor_liquido === 'string' 
        ? parseFloat(t.valor_liquido) 
        : (t.valor_liquido || 0)
      
      return {
        ...t,
        valor_liquido: valorLiquido,
        bloqueado: t.bloqueado ?? false,
        bloqueado_motivo: t.bloqueado_motivo ?? null,
        antecipado: t.antecipado ?? false,
        data_repasse_antecipada: t.data_repasse_antecipada ?? null,
      }
    })

    console.log('✅ [listarTransacoesLiberadas] Transações processadas:', {
      count: transacoesComDefaults.length,
      ids: transacoesComDefaults.map(t => t.id)
    })

    return {
      transacoes: transacoesComDefaults as any[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar transações liberadas:', error)
    return {
      transacoes: [],
      error: error instanceof Error ? error : new Error('Erro ao listar transações liberadas'),
    }
  }
}

/**
 * Cria um repasse agrupando transações
 */
export async function criarRepasse(
  dados: DadosRepasse
): Promise<{ repasse: Repasse | null; error: Error | null; mensagem?: string }> {
  try {
    // Validações
    if (!dados.transacaoIds || dados.transacaoIds.length === 0) {
      return {
        repasse: null,
        error: new Error('Nenhuma transação selecionada'),
        mensagem: 'Selecione pelo menos uma transação',
      }
    }

    // Busca transações (apenas liberadas e não bloqueadas)
    const { data: transacoesData, error: transacoesError } = await supabase
      .from('transacoes_financeiras')
      .select('id, valor_liquido, revenda_id, bloqueado')
      .in('id', dados.transacaoIds)
      .eq('status', 'liberado')
      .eq('bloqueado', false)

    if (transacoesError || !transacoesData || transacoesData.length === 0) {
      return {
        repasse: null,
        error: transacoesError || new Error('Transações não encontradas'),
        mensagem: 'Erro ao buscar transações',
      }
    }

    // Verifica se todas as transações são da mesma revenda
    const revendaIds = [...new Set(transacoesData.map(t => t.revenda_id))]
    if (revendaIds.length > 1) {
      return {
        repasse: null,
        error: new Error('Transações de revendas diferentes'),
        mensagem: 'Todas as transações devem ser da mesma revenda',
      }
    }

    const revendaId = revendaIds[0]
    if (dados.revendaId && dados.revendaId !== revendaId) {
      return {
        repasse: null,
        error: new Error('Revenda não corresponde às transações'),
        mensagem: 'Revenda não corresponde às transações selecionadas',
      }
    }

    // Calcula valor total
    const valorTotal = transacoesData.reduce((sum, t) => sum + (t.valor_liquido || 0), 0)

    // Obtém ID do admin atual
    const sessao = await obterSessao()
    const criadoPor = sessao?.user?.id || null

    // Cria repasse
    const { data: repasseData, error: repasseError } = await supabase
      .from('repasses')
      .insert({
        revenda_id: revendaId,
        valor_total: Math.round(valorTotal * 100) / 100,
        quantidade_transacoes: transacoesData.length,
        data_repasse: new Date().toISOString().split('T')[0],
        observacoes: dados.observacoes || null,
        criado_por: criadoPor,
      })
      .select()
      .single()

    if (repasseError || !repasseData) {
      console.error('❌ Erro ao criar repasse:', repasseError)
      return {
        repasse: null,
        error: repasseError || new Error('Erro ao criar repasse'),
        mensagem: 'Erro ao criar repasse',
      }
    }

    // Cria relacionamentos repasse-transações
    const relacionamentos = transacoesData.map(t => ({
      repasse_id: repasseData.id,
      transacao_id: t.id,
    }))

    const { error: relacionamentosError } = await supabase
      .from('repasses_transacoes')
      .insert(relacionamentos)

    if (relacionamentosError) {
      console.error('❌ Erro ao criar relacionamentos:', relacionamentosError)
      // Tenta remover o repasse criado
      await supabase.from('repasses').delete().eq('id', repasseData.id)
      return {
        repasse: null,
        error: relacionamentosError,
        mensagem: 'Erro ao vincular transações ao repasse',
      }
    }

    // Atualiza status das transações para 'repassado'
    const { error: updateError } = await supabase
      .from('transacoes_financeiras')
      .update({ status: 'repassado', repasse_id: repasseData.id })
      .in('id', dados.transacaoIds)

    if (updateError) {
      console.error('❌ Erro ao atualizar status das transações:', updateError)
      // Não falha o repasse, mas registra o erro
    }

    // Busca repasse completo
    const { data: repasseCompleto, error: buscaError } = await supabase
      .from('repasses')
      .select(`
        *,
        revenda:revendas (
          id,
          nome_revenda,
          nome_publico
        )
      `)
      .eq('id', repasseData.id)
      .single()

    if (buscaError) {
      return {
        repasse: repasseData as Repasse,
        error: null,
      }
    }

    return {
      repasse: repasseCompleto as Repasse,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao criar repasse:', error)
    return {
      repasse: null,
      error: error instanceof Error ? error : new Error('Erro ao criar repasse'),
      mensagem: 'Erro inesperado ao criar repasse',
    }
  }
}

/**
 * Bloqueia uma transação financeira para repasse
 */
export async function bloquearRepasse(
  transacaoId: string,
  motivo: string
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    const { error } = await supabase
      .from('transacoes_financeiras')
      .update({
        bloqueado: true,
        bloqueado_motivo: motivo,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', transacaoId)
      .eq('status', 'liberado') // Só pode bloquear transações liberadas

    if (error) {
      console.error('❌ Erro ao bloquear repasse:', error)
      return {
        error,
        mensagem: traduzirErro(error.message),
      }
    }

    return {
      error: null,
      mensagem: 'Repasse bloqueado com sucesso',
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao bloquear repasse:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao bloquear repasse'),
      mensagem: 'Erro inesperado ao bloquear repasse',
    }
  }
}

/**
 * Desbloqueia uma transação financeira para repasse
 */
export async function desbloquearRepasse(
  transacaoId: string
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    const { error } = await supabase
      .from('transacoes_financeiras')
      .update({
        bloqueado: false,
        bloqueado_motivo: null,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', transacaoId)

    if (error) {
      console.error('❌ Erro ao desbloquear repasse:', error)
      return {
        error,
        mensagem: traduzirErro(error.message),
      }
    }

    return {
      error: null,
      mensagem: 'Repasse desbloqueado com sucesso',
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao desbloquear repasse:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao desbloquear repasse'),
      mensagem: 'Erro inesperado ao desbloquear repasse',
    }
  }
}

/**
 * Antecipa a data de repasse de uma transação financeira
 */
export async function anteciparRepasse(
  transacaoId: string,
  novaData: string
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    // Buscar transação completa para validar
    const { data: transacao, error: fetchError } = await supabase
      .from('transacoes_financeiras')
      .select('data_repasse_prevista, status')
      .eq('id', transacaoId)
      .single()

    if (fetchError || !transacao) {
      return {
        error: fetchError || new Error('Transação não encontrada'),
        mensagem: 'Erro ao buscar transação',
      }
    }

    const dataNova = new Date(novaData + 'T00:00:00')
    const dataOriginal = new Date(transacao.data_repasse_prevista + 'T00:00:00')
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataNovaNormalizada = new Date(dataNova)
    dataNovaNormalizada.setHours(0, 0, 0, 0)
    const hojeNormalizado = new Date(hoje)
    hojeNormalizado.setHours(0, 0, 0, 0)

    console.log('📅 [anteciparRepasse] Validando datas:', {
      dataNova: dataNova.toISOString(),
      dataOriginal: dataOriginal.toISOString(),
      hoje: hoje.toISOString(),
      statusAtual: transacao.status,
      isHoje: dataNovaNormalizada.getTime() === hojeNormalizado.getTime()
    })

    // Se a nova data for hoje, sempre permite e libera imediatamente
    const isAntecipacaoParaHoje = dataNovaNormalizada.getTime() === hojeNormalizado.getTime()
    
    // Se não for hoje, valida que seja anterior à data original
    if (!isAntecipacaoParaHoje && dataNova.getTime() >= dataOriginal.getTime()) {
      console.log('❌ [anteciparRepasse] Data de antecipação deve ser anterior à data original')
      return {
        error: new Error('Data de antecipação deve ser anterior à data original'),
        mensagem: 'A data de antecipação deve ser anterior à data prevista original',
      }
    }

    // Preparar dados de atualização
    const dadosUpdate: any = {
      antecipado: true,
      data_repasse_antecipada: novaData,
      data_repasse_prevista: novaData,
      atualizado_em: new Date().toISOString(),
    }

    // Se for antecipação para hoje, libera imediatamente
    if (isAntecipacaoParaHoje) {
      dadosUpdate.status = 'liberado'
      console.log('✅ [anteciparRepasse] Antecipação para HOJE - liberando imediatamente')
    } else {
      console.log('✅ [anteciparRepasse] Antecipação para data futura - mantendo status atual')
    }

    // Permite antecipar transações liberadas ou pendentes
    const { error } = await supabase
      .from('transacoes_financeiras')
      .update(dadosUpdate)
      .eq('id', transacaoId)
      .in('status', ['liberado', 'pendente']) // Permite antecipar transações liberadas ou pendentes

    if (error) {
      console.error('❌ Erro ao antecipar repasse:', error)
      return {
        error,
        mensagem: traduzirErro(error.message),
      }
    }

    const mensagemSucesso = isAntecipacaoParaHoje 
      ? 'Repasse antecipado e liberado para hoje com sucesso!'
      : 'Repasse antecipado com sucesso'

    console.log('✅ [anteciparRepasse] Sucesso:', { isAntecipacaoParaHoje, mensagemSucesso })

    return {
      error: null,
      mensagem: mensagemSucesso,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao antecipar repasse:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao antecipar repasse'),
      mensagem: 'Erro inesperado ao antecipar repasse',
    }
  }
}

/**
 * Exclui um repasse específico
 */
export async function excluirRepasse(
  repasseId: string
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    console.log('🗑️ [excluirRepasse] Excluindo repasse:', repasseId)

    // Primeiro, verificar se o repasse existe
    const { data: repasseExistente, error: erroVerificacao } = await supabase
      .from('repasses')
      .select('id')
      .eq('id', repasseId)
      .single()

    if (erroVerificacao || !repasseExistente) {
      console.error('❌ Repasse não encontrado:', erroVerificacao)
      return {
        error: erroVerificacao || new Error('Repasse não encontrado'),
        mensagem: 'Repasse não encontrado',
      }
    }

    console.log('✅ [excluirRepasse] Repasse encontrado, iniciando exclusão...')

    // Primeiro, excluir as relações na tabela repasses_transacoes
    const { error: errorTransacoes, data: transacoesExcluidas } = await supabase
      .from('repasses_transacoes')
      .delete()
      .eq('repasse_id', repasseId)
      .select()

    if (errorTransacoes) {
      console.error('❌ Erro ao excluir relações de transações:', errorTransacoes)
      console.error('❌ Detalhes do erro:', {
        message: errorTransacoes.message,
        code: (errorTransacoes as any).code,
        details: (errorTransacoes as any).details,
        hint: (errorTransacoes as any).hint,
      })
      return {
        error: errorTransacoes,
        mensagem: `Erro ao excluir relações de transações: ${errorTransacoes.message || 'Erro desconhecido'}`,
      }
    }

    console.log(`✅ [excluirRepasse] ${transacoesExcluidas?.length || 0} relação(ões) excluída(s)`)

    // Depois, excluir o repasse
    const { error, data: repasseExcluido } = await supabase
      .from('repasses')
      .delete()
      .eq('id', repasseId)
      .select()

    if (error) {
      console.error('❌ Erro ao excluir repasse:', error)
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
      })
      return {
        error,
        mensagem: `Erro ao excluir repasse: ${traduzirErro(error.message) || error.message || 'Erro desconhecido'}`,
      }
    }

    if (!repasseExcluido || repasseExcluido.length === 0) {
      console.warn('⚠️ [excluirRepasse] Nenhum repasse foi excluído (pode não ter permissão RLS)')
      return {
        error: new Error('Repasse não foi excluído - verifique as políticas RLS'),
        mensagem: 'Repasse não foi excluído. Verifique se você tem permissão ou se a migration 054 foi aplicada.',
      }
    }

    console.log('✅ [excluirRepasse] Repasse excluído com sucesso:', repasseExcluido[0].id)
    return {
      error: null,
      mensagem: 'Repasse excluído com sucesso',
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao excluir repasse:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao excluir repasse'),
      mensagem: 'Erro inesperado ao excluir repasse',
    }
  }
}

/**
 * Limpa todos os repasses de uma revenda (ou de todas as revendas se admin)
 */
export async function limparTodosRepasses(
  revendaId?: string
): Promise<{ excluidos: number; error: Error | null; mensagem?: string }> {
  try {
    console.log('🗑️ [limparTodosRepasses] Limpando repasses...', { revendaId })

    // Primeiro, buscar todos os repasses que serão excluídos
    let query = supabase
      .from('repasses')
      .select('id')

    if (revendaId) {
      query = query.eq('revenda_id', revendaId)
    }

    const { data: repasses, error: fetchError } = await query

    if (fetchError) {
      console.error('❌ Erro ao buscar repasses:', fetchError)
      return {
        excluidos: 0,
        error: fetchError,
        mensagem: 'Erro ao buscar repasses',
      }
    }

    if (!repasses || repasses.length === 0) {
      return {
        excluidos: 0,
        error: null,
        mensagem: 'Nenhum repasse encontrado para excluir',
      }
    }

    const repasseIds = repasses.map(r => r.id)

    // Excluir todas as relações na tabela repasses_transacoes
    const { error: errorTransacoes, data: transacoesExcluidas } = await supabase
      .from('repasses_transacoes')
      .delete()
      .in('repasse_id', repasseIds)
      .select()

    if (errorTransacoes) {
      console.error('❌ Erro ao excluir relações de transações:', errorTransacoes)
      return {
        excluidos: 0,
        error: errorTransacoes,
        mensagem: `Erro ao excluir relações de transações: ${errorTransacoes.message || 'Erro desconhecido'}`,
      }
    }

    console.log(`✅ [limparTodosRepasses] ${transacoesExcluidas?.length || 0} relação(ões) excluída(s)`)

    // Excluir todos os repasses
    let deleteQuery = supabase
      .from('repasses')
      .delete()

    if (revendaId) {
      deleteQuery = deleteQuery.eq('revenda_id', revendaId)
    }

    const { error, data: repassesExcluidos } = await deleteQuery.select()

    if (error) {
      console.error('❌ Erro ao limpar repasses:', error)
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
      })
      return {
        excluidos: 0,
        error,
        mensagem: `Erro ao limpar repasses: ${traduzirErro(error.message) || error.message || 'Erro desconhecido'}`,
      }
    }

    const excluidos = repassesExcluidos?.length || 0
    
    if (excluidos === 0) {
      console.warn('⚠️ [limparTodosRepasses] Nenhum repasse foi excluído (pode não ter permissão RLS)')
      return {
        excluidos: 0,
        error: new Error('Nenhum repasse foi excluído - verifique as políticas RLS'),
        mensagem: 'Nenhum repasse foi excluído. Verifique se você tem permissão ou se a migration 054 foi aplicada.',
      }
    }

    console.log(`✅ [limparTodosRepasses] ${excluidos} repasse(s) excluído(s) com sucesso`)

    return {
      excluidos,
      error: null,
      mensagem: `${excluidos} repasse(s) excluído(s) com sucesso`,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao limpar repasses:', error)
    return {
      excluidos: 0,
      error: error instanceof Error ? error : new Error('Erro ao limpar repasses'),
      mensagem: 'Erro inesperado ao limpar repasses',
    }
  }
}

/**
 * Reverte a antecipação de uma transação financeira, restaurando a data original
 */
export async function reverterAntecipacao(
  transacaoId: string
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    console.log('🔄 [reverterAntecipacao] Iniciando reversão...', { transacaoId })

    // Buscar transação para verificar se está antecipada e obter a data original
    const { data: transacao, error: fetchError } = await supabase
      .from('transacoes_financeiras')
      .select('antecipado, data_repasse_antecipada, data_repasse_prevista, status')
      .eq('id', transacaoId)
      .single()

    if (fetchError || !transacao) {
      return {
        error: fetchError || new Error('Transação não encontrada'),
        mensagem: 'Erro ao buscar transação',
      }
    }

    if (!transacao.antecipado) {
      return {
        error: new Error('Transação não está antecipada'),
        mensagem: 'Esta transação não está antecipada',
      }
    }

    // Buscar dados completos da transação para calcular a data original
    const { data: transacaoCompleta, error: transacaoCompletaError } = await supabase
      .from('transacoes_financeiras')
      .select('modalidade, data_pagamento, pedido_id')
      .eq('id', transacaoId)
      .single()

    if (transacaoCompletaError || !transacaoCompleta) {
      return {
        error: transacaoCompletaError || new Error('Erro ao buscar dados da transação'),
        mensagem: 'Erro ao buscar dados da transação',
      }
    }

    // Buscar a data de criação do pedido para calcular a data original corretamente
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .select('criado_em')
      .eq('id', transacaoCompleta.pedido_id)
      .single()

    if (pedidoError || !pedidoData) {
      console.warn('⚠️ [reverterAntecipacao] Não foi possível buscar data do pedido, usando data_pagamento')
    }

    // Usar data_pagamento (data da transação) ou data de criação do pedido
    const dataBase = pedidoData?.criado_em 
      ? new Date(pedidoData.criado_em) 
      : new Date(transacaoCompleta.data_pagamento)
    
    // Calcular a data original baseada na modalidade
    let diasAdicionar = 0
    
    if (transacaoCompleta.modalidade === 'D+1') {
      diasAdicionar = 1
    } else if (transacaoCompleta.modalidade === 'D+15') {
      diasAdicionar = 15
    } else if (transacaoCompleta.modalidade === 'D+30') {
      diasAdicionar = 30
    }

    const dataOriginal = new Date(dataBase)
    dataOriginal.setDate(dataOriginal.getDate() + diasAdicionar)
    const dataOriginalFormatada = dataOriginal.toISOString().split('T')[0]

    console.log('📅 [reverterAntecipacao] Calculando data original:', {
      modalidade: transacaoCompleta.modalidade,
      dataBase: dataBase.toISOString(),
      diasAdicionar,
      dataOriginalFormatada
    })

    // Determinar o status correto baseado na data original
    // IMPORTANTE: Se a transação já estava liberada, mantém como liberada
    // mesmo que a data original ainda não tenha chegado (para não sumir da lista)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataOriginalDate = new Date(dataOriginalFormatada + 'T00:00:00')
    
    // Se a transação já estava liberada, mantém como liberada
    // Caso contrário, usa a lógica baseada na data
    const novoStatus = transacao.status === 'liberado' 
      ? 'liberado' // Mantém liberado se já estava liberado
      : (dataOriginalDate <= hoje ? 'liberado' : 'pendente') // Caso contrário, calcula baseado na data

    console.log('📊 [reverterAntecipacao] Novo status:', {
      statusAtual: transacao.status,
      dataOriginalDate: dataOriginalDate.toISOString(),
      hoje: hoje.toISOString(),
      novoStatus,
      motivo: transacao.status === 'liberado' ? 'Mantido como liberado (já estava liberado)' : 'Calculado baseado na data original'
    })

    // Reverter a antecipação
    const { error } = await supabase
      .from('transacoes_financeiras')
      .update({
        antecipado: false,
        data_repasse_antecipada: null,
        data_repasse_prevista: dataOriginalFormatada,
        status: novoStatus,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', transacaoId)
      .eq('antecipado', true) // Só reverte se estiver antecipada

    if (error) {
      console.error('❌ Erro ao reverter antecipação:', error)
      return {
        error,
        mensagem: traduzirErro(error.message),
      }
    }

    console.log('✅ [reverterAntecipacao] Antecipação revertida com sucesso')

    return {
      error: null,
      mensagem: 'Antecipação revertida com sucesso. Data original restaurada.',
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao reverter antecipação:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao reverter antecipação'),
      mensagem: 'Erro inesperado ao reverter antecipação',
    }
  }
}

