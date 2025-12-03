import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'
import { buscarConfiguracaoRepasseAtiva } from './configuracoesRepasse'

export interface TransacaoFinanceira {
  id: string
  pedido_id: string
  revenda_id: string
  cliente_id: string
  valor_bruto: number
  taxa_percentual: number
  taxa_fixa: number
  valor_liquido: number
  modalidade: 'D+1' | 'D+15' | 'D+30'
  data_pagamento: string
  data_repasse_prevista: string
  status: 'pendente' | 'liberado' | 'repassado' | 'cancelado'
  repasse_id?: string | null
  bloqueado: boolean
  bloqueado_motivo?: string | null
  antecipado: boolean
  data_repasse_antecipada?: string | null
  criado_em: string
  atualizado_em: string
  pedido?: {
    id: string
    valor_total: number
    status: string
    criado_em: string
  }
  cliente?: {
    id: string
    nome_completo: string | null
    email: string
  }
  revenda?: {
    id: string
    nome_revenda: string
    nome_publico: string | null
  }
}

/**
 * Busca taxas de repasse considerando unidade (se houver taxas personalizadas) ou revenda
 */
async function buscarTaxasRepasse(
  revendaId: string,
  modalidade: 'D+1' | 'D+15' | 'D+30',
  unidadeId?: string | null
): Promise<{ taxaPercentual: number; taxaFixa: number; error: Error | null }> {
  try {
    console.log('🔍 [buscarTaxasRepasse] Buscando taxas:', { revendaId, modalidade, unidadeId })
    
    // Se unidadeId foi fornecido, primeiro tenta buscar taxas da unidade
    if (unidadeId) {
      const { data: unidadeData, error: unidadeError } = await supabase
        .from('unidades_revenda')
        .select('taxa_repasse_percentual, taxa_repasse_fixa, modalidade_repasse')
        .eq('id', unidadeId)
        .eq('revenda_id', revendaId)
        .maybeSingle()

      console.log('🔍 [buscarTaxasRepasse] Dados da unidade:', { unidadeData, unidadeError })

      if (!unidadeError && unidadeData) {
        // Se a unidade tem modalidade definida e corresponde à modalidade solicitada
        // E se tem taxas personalizadas, usa elas
        if (unidadeData.modalidade_repasse === modalidade) {
          if (unidadeData.taxa_repasse_percentual !== null && unidadeData.taxa_repasse_percentual !== undefined) {
            console.log('✅ [buscarTaxasRepasse] Usando taxas personalizadas da unidade:', {
              unidadeId,
              taxaPercentual: unidadeData.taxa_repasse_percentual,
              taxaFixa: unidadeData.taxa_repasse_fixa || 0.5,
            })
            return {
              taxaPercentual: Number(unidadeData.taxa_repasse_percentual),
              taxaFixa: unidadeData.taxa_repasse_fixa !== null && unidadeData.taxa_repasse_fixa !== undefined 
                ? Number(unidadeData.taxa_repasse_fixa) 
                : 0.5,
              error: null,
            }
          } else {
            console.log('ℹ️ [buscarTaxasRepasse] Unidade tem modalidade mas não tem taxas personalizadas, buscando da revenda')
          }
        } else {
          console.log('ℹ️ [buscarTaxasRepasse] Modalidade da unidade não corresponde à solicitada:', {
            modalidadeUnidade: unidadeData.modalidade_repasse,
            modalidadeSolicitada: modalidade
          })
        }
      }
    }

    // Busca a configuração específica da modalidade solicitada na revenda
    console.log('🔍 [buscarTaxasRepasse] Buscando configuração da revenda para modalidade:', modalidade)
    const { data: configModalidade, error: configModalidadeError } = await supabase
      .from('configuracoes_repasse_revenda')
      .select('taxa_percentual, taxa_fixa')
      .eq('revenda_id', revendaId)
      .eq('modalidade', modalidade)
      .maybeSingle()

    console.log('🔍 [buscarTaxasRepasse] Configuração da modalidade:', { configModalidade, configModalidadeError })

    if (!configModalidadeError && configModalidade) {
      const taxaPercentual = Number(configModalidade.taxa_percentual)
      const taxaFixa = Number(configModalidade.taxa_fixa)
      
      console.log('✅ [buscarTaxasRepasse] Usando taxas da configuração da revenda:', {
        modalidade,
        taxaPercentual,
        taxaFixa,
      })
      
      return {
        taxaPercentual,
        taxaFixa,
        error: null,
      }
    }

    // Fallback: busca configuração ativa da revenda
    console.log('⚠️ [buscarTaxasRepasse] Configuração específica não encontrada, buscando configuração ativa')
    const { configuracao, error: configError } = await buscarConfiguracaoRepasseAtiva(revendaId)
    
    if (configError || !configuracao) {
      // Se não encontrou, usa valores padrão conforme a modalidade
      const padroes: Record<'D+1' | 'D+15' | 'D+30', { taxaPercentual: number; taxaFixa: number }> = {
        'D+1': { taxaPercentual: 8.0, taxaFixa: 0.5 },
        'D+15': { taxaPercentual: 6.5, taxaFixa: 0.5 },
        'D+30': { taxaPercentual: 5.0, taxaFixa: 0.5 },
      }
      console.log('⚠️ [buscarTaxasRepasse] Usando taxas padrão:', padroes[modalidade])
      return {
        ...padroes[modalidade],
        error: configError || new Error('Configuração não encontrada'),
      }
    }

    // Se não encontrou configuração específica, usa a ativa
    console.log('✅ [buscarTaxasRepasse] Usando taxas da configuração ativa:', {
      modalidadeAtiva: configuracao.modalidade,
      modalidadeSolicitada: modalidade,
      taxaPercentual: configuracao.taxa_percentual,
      taxaFixa: configuracao.taxa_fixa,
    })
    
    return {
      taxaPercentual: configuracao.taxa_percentual,
      taxaFixa: configuracao.taxa_fixa,
      error: null,
    }
  } catch (error) {
    console.error('❌ [buscarTaxasRepasse] Erro inesperado:', error)
    const padroes: Record<'D+1' | 'D+15' | 'D+30', { taxaPercentual: number; taxaFixa: number }> = {
      'D+1': { taxaPercentual: 8.0, taxaFixa: 0.5 },
      'D+15': { taxaPercentual: 6.5, taxaFixa: 0.5 },
      'D+30': { taxaPercentual: 5.0, taxaFixa: 0.5 },
    }
    return {
      ...padroes[modalidade],
      error: error instanceof Error ? error : new Error('Erro ao buscar taxas'),
    }
  }
}

/**
 * Cria uma transação financeira para um pedido
 */
export async function criarTransacaoFinanceira(
  pedidoId: string,
  revendaId: string,
  clienteId: string,
  valorBruto: number,
  dataPagamento: string,
  unidadeId?: string | null
): Promise<{ transacao: TransacaoFinanceira | null; error: Error | null; mensagem?: string }> {
  try {
    console.log('📊 [criarTransacaoFinanceira] Iniciando criação:', {
      pedidoId,
      revendaId,
      clienteId,
      valorBruto,
      dataPagamento,
    })

    // PRIMEIRO: Verificar se já existe transação financeira para este pedido
    // Usar COUNT para verificar se há transações, depois buscar a mais antiga se existir
    const { count, error: countError } = await supabase
      .from('transacoes_financeiras')
      .select('*', { count: 'exact', head: true })
      .eq('pedido_id', pedidoId)

    if (countError) {
      console.error('❌ [criarTransacaoFinanceira] Erro ao verificar transação existente:', countError)
      return {
        transacao: null,
        error: countError,
        mensagem: 'Erro ao verificar se transação já existe',
      }
    }

    if (count && count > 0) {
      // Buscar a transação mais antiga (primeira criada)
      const { data: transacoesExistentes, error: buscarError } = await supabase
        .from('transacoes_financeiras')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('criado_em', { ascending: true })
        .limit(1)

      if (buscarError) {
        console.error('❌ [criarTransacaoFinanceira] Erro ao buscar transação existente:', buscarError)
        return {
          transacao: null,
          error: buscarError,
          mensagem: 'Erro ao buscar transação existente',
        }
      }

      if (transacoesExistentes && transacoesExistentes.length > 0) {
        const transacaoExistente = transacoesExistentes[0]
        console.log('ℹ️ [criarTransacaoFinanceira] Transação já existe para este pedido:', {
          transacaoId: transacaoExistente.id,
          pedidoId: transacaoExistente.pedido_id,
          totalTransacoes: count,
        })

        // Se há múltiplas transações, avisar mas retornar a primeira
        if (count > 1) {
          console.warn(`⚠️ [criarTransacaoFinanceira] ATENÇÃO: Pedido ${pedidoId} tem ${count} transações! Deve ser limpo.`)
        }

        return {
          transacao: transacaoExistente as TransacaoFinanceira,
          error: null,
          mensagem: count > 1 ? `Transação já existe (${count} transações encontradas, use limparTransacoesDuplicadas)` : 'Transação já existe para este pedido',
        }
      }
    }

    // PRIMEIRO: Verifica se a unidade tem modalidade específica definida
    let modalidadeFinal: 'D+1' | 'D+15' | 'D+30' = 'D+1'
    let configuracao = null
    
    if (unidadeId) {
      console.log('🔍 [criarTransacaoFinanceira] Verificando modalidade da unidade:', unidadeId)
      const { data: unidadeData, error: unidadeError } = await supabase
        .from('unidades_revenda')
        .select('modalidade_repasse')
        .eq('id', unidadeId)
        .eq('revenda_id', revendaId)
        .maybeSingle()

      if (!unidadeError && unidadeData && unidadeData.modalidade_repasse) {
        modalidadeFinal = unidadeData.modalidade_repasse as 'D+1' | 'D+15' | 'D+30'
        console.log('✅ [criarTransacaoFinanceira] Usando modalidade da unidade:', modalidadeFinal)
        
        // Busca configuração da revenda para a modalidade da unidade (para obter taxas padrão se não houver taxas personalizadas)
        const { configuracao: configModalidadeUnidade } = await buscarConfiguracaoRepasseAtiva(revendaId)
        configuracao = configModalidadeUnidade
      } else {
        console.log('ℹ️ [criarTransacaoFinanceira] Unidade não tem modalidade específica, usando modalidade ativa da revenda')
        // Se unidade não tem modalidade específica, busca configuração ativa da revenda
        const { configuracao: configAtiva } = await buscarConfiguracaoRepasseAtiva(revendaId)
        configuracao = configAtiva
        
        if (configAtiva) {
          modalidadeFinal = configAtiva.modalidade
          console.log('✅ [criarTransacaoFinanceira] Usando modalidade ativa da revenda:', modalidadeFinal)
        }
      }
    } else {
      // Se não há unidadeId, busca configuração ativa da revenda
      const { configuracao: configAtiva } = await buscarConfiguracaoRepasseAtiva(revendaId)
      configuracao = configAtiva
      
      if (configAtiva) {
        modalidadeFinal = configAtiva.modalidade
        console.log('✅ [criarTransacaoFinanceira] Usando modalidade ativa da revenda:', modalidadeFinal)
      }
    }

    // Se não encontrou configuração, usa valores padrão baseado na modalidade final
    if (!configuracao) {
      console.warn('⚠️ [criarTransacaoFinanceira] Configuração de repasse não encontrada, usando valores padrão:', {
        revendaId,
        modalidadeFinal,
      })
      
      // Usa valores padrão baseado na modalidade final (que pode ser da unidade)
      const padroesPorModalidade: Record<'D+1' | 'D+15' | 'D+30', { taxaPercentual: number; taxaFixa: number }> = {
        'D+1': { taxaPercentual: 8.0, taxaFixa: 0.5 },
        'D+15': { taxaPercentual: 6.5, taxaFixa: 0.5 },
        'D+30': { taxaPercentual: 5.0, taxaFixa: 0.5 },
      }
      const padroes = {
        ...padroesPorModalidade[modalidadeFinal],
        modalidade: modalidadeFinal,
      }
      
      const taxaPercentualValor = (valorBruto * padroes.taxaPercentual) / 100
      const valorLiquido = Math.max(0, valorBruto - taxaPercentualValor - padroes.taxaFixa)
      
      const dataPagamentoDate = new Date(dataPagamento)
      const dataRepassePrevista = new Date(dataPagamentoDate)
      if (modalidadeFinal === 'D+1') {
        dataRepassePrevista.setDate(dataRepassePrevista.getDate() + 1)
      } else if (modalidadeFinal === 'D+15') {
        dataRepassePrevista.setDate(dataRepassePrevista.getDate() + 15)
      } else {
        dataRepassePrevista.setDate(dataRepassePrevista.getDate() + 30)
      }
      
      const dadosInsercao = {
        pedido_id: pedidoId,
        revenda_id: revendaId,
        cliente_id: clienteId,
        valor_bruto: valorBruto,
        taxa_percentual: padroes.taxaPercentual,
        taxa_fixa: padroes.taxaFixa,
        valor_liquido: Math.round(valorLiquido * 100) / 100,
        modalidade: padroes.modalidade,
        data_pagamento: dataPagamento,
        data_repasse_prevista: dataRepassePrevista.toISOString().split('T')[0],
        status: 'pendente' as const,
      }
      
      console.log('📤 [criarTransacaoFinanceira] Criando com valores padrão:', dadosInsercao)
      
      // Tenta criar usando INSERT direto
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .insert(dadosInsercao)
        .select()
        .single()

      if (error) {
        console.error('❌ [criarTransacaoFinanceira] Erro ao criar transação com valores padrão:', error)
        return {
          transacao: null,
          error,
          mensagem: `Erro ao criar transação financeira: ${error.message || 'Erro desconhecido'}`,
        }
      }

      console.log('✅ [criarTransacaoFinanceira] Transação criada com valores padrão:', {
        transacaoId: data?.id,
        valorBruto: data?.valor_bruto,
        valorLiquido: data?.valor_liquido,
        modalidade: data?.modalidade,
        status: data?.status,
      })

      return {
        transacao: data as TransacaoFinanceira,
        error: null,
      }
    }

    // Busca taxas considerando unidade (se houver taxas personalizadas) ou revenda
    // Usa modalidadeFinal que pode ser da unidade ou da revenda
    const { taxaPercentual, taxaFixa, error: taxasError } = await buscarTaxasRepasse(
      revendaId,
      modalidadeFinal,
      unidadeId
    )

    if (taxasError) {
      console.warn('⚠️ [criarTransacaoFinanceira] Erro ao buscar taxas, usando configuração padrão:', taxasError)
    }

    // Validação: garante que as taxas são válidas
    const taxaPercentualValida = typeof taxaPercentual === 'number' && !isNaN(taxaPercentual) && taxaPercentual >= 0 ? taxaPercentual : 0
    const taxaFixaValida = typeof taxaFixa === 'number' && !isNaN(taxaFixa) && taxaFixa >= 0 ? taxaFixa : 0.5

    // Calcula data de repasse prevista (precisa ser feito antes de criar dadosInsercao)
    // Usa modalidadeFinal que pode ser da unidade ou da revenda
    const dataPagamentoDate = new Date(dataPagamento)
    let diasParaRepasse = 30 // Padrão D+30
    
    if (modalidadeFinal === 'D+1') {
      diasParaRepasse = 1
    } else if (modalidadeFinal === 'D+15') {
      diasParaRepasse = 15
    }

    const dataRepassePrevista = new Date(dataPagamentoDate)
    dataRepassePrevista.setDate(dataRepassePrevista.getDate() + diasParaRepasse)

    let dadosInsercao: any

    if (taxaPercentualValida === 0 && taxaFixaValida === 0) {
      console.error('❌ [criarTransacaoFinanceira] ATENÇÃO: Taxas inválidas (ambas zero)! Usando valores padrão.')
      const padroes: Record<'D+1' | 'D+15' | 'D+30', { taxaPercentual: number; taxaFixa: number }> = {
        'D+1': { taxaPercentual: 8.0, taxaFixa: 0.5 },
        'D+15': { taxaPercentual: 6.5, taxaFixa: 0.5 },
        'D+30': { taxaPercentual: 5.0, taxaFixa: 0.5 },
      }
      const padrao = padroes[modalidadeFinal]
      const taxaPercentualFinal = padrao.taxaPercentual
      const taxaFixaFinal = padrao.taxaFixa
      
      console.log('✅ [criarTransacaoFinanceira] Usando taxas padrão:', {
        modalidade: modalidadeFinal,
        taxaPercentual: taxaPercentualFinal,
        taxaFixa: taxaFixaFinal,
      })
      
      const taxaPercentualValor = (valorBruto * taxaPercentualFinal) / 100
      const valorLiquido = Math.max(0, valorBruto - taxaPercentualValor - taxaFixaFinal)
      
      console.log('📊 [criarTransacaoFinanceira] Valores calculados (com taxas padrão):', {
        valorBruto,
        taxaPercentualValor,
        taxaFixa: taxaFixaFinal,
        valorLiquido,
      })
      
      dadosInsercao = {
        pedido_id: pedidoId,
        revenda_id: revendaId,
        cliente_id: clienteId,
        valor_bruto: valorBruto,
        taxa_percentual: taxaPercentualFinal,
        taxa_fixa: taxaFixaFinal,
        valor_liquido: Math.round(valorLiquido * 100) / 100,
        modalidade: modalidadeFinal,
        data_pagamento: dataPagamento,
        data_repasse_prevista: dataRepassePrevista.toISOString().split('T')[0],
        status: 'pendente' as const,
      }
    } else {
      console.log('✅ [criarTransacaoFinanceira] Taxas encontradas:', {
        revendaId,
        unidadeId,
        modalidade: modalidadeFinal,
        taxa_percentual: taxaPercentualValida,
        taxa_fixa: taxaFixaValida,
        usandoTaxasUnidade: unidadeId && !taxasError,
      })
      
      // Calcula taxas
      const taxaPercentualValor = (valorBruto * taxaPercentualValida) / 100
      const valorLiquido = Math.max(0, valorBruto - taxaPercentualValor - taxaFixaValida)
      
      console.log('📊 [criarTransacaoFinanceira] Valores calculados:', {
        valorBruto,
        taxaPercentualValor,
        taxaFixa: taxaFixaValida,
        valorLiquido,
      })
      
      dadosInsercao = {
        pedido_id: pedidoId,
        revenda_id: revendaId,
        cliente_id: clienteId,
        valor_bruto: valorBruto,
        taxa_percentual: taxaPercentualValida,
        taxa_fixa: taxaFixaValida,
        valor_liquido: Math.round(valorLiquido * 100) / 100,
        modalidade: modalidadeFinal,
        data_pagamento: dataPagamento,
        data_repasse_prevista: dataRepassePrevista.toISOString().split('T')[0],
        status: 'pendente' as const,
      }
    }

    console.log('📤 [criarTransacaoFinanceira] Dados para inserção:', dadosInsercao)

    // Tenta criar usando função SQL com SECURITY DEFINER primeiro
    // Usa os valores de dadosInsercao que já foram validados e processados
    console.log('🔄 [criarTransacaoFinanceira] Chamando função RPC criar_transacao_financeira...')
    const { data: rpcData, error: rpcError } = await supabase.rpc('criar_transacao_financeira', {
      p_pedido_id: pedidoId,
      p_revenda_id: revendaId,
      p_cliente_id: clienteId,
      p_valor_bruto: dadosInsercao.valor_bruto,
      p_taxa_percentual: dadosInsercao.taxa_percentual,
      p_taxa_fixa: dadosInsercao.taxa_fixa,
      p_valor_liquido: dadosInsercao.valor_liquido,
      p_modalidade: dadosInsercao.modalidade,
      p_data_pagamento: dadosInsercao.data_pagamento,
      p_data_repasse_prevista: dadosInsercao.data_repasse_prevista,
    })

    console.log('📊 [criarTransacaoFinanceira] Resposta da função RPC:', {
      rpcData,
      rpcError,
      hasError: !!rpcError,
      hasData: !!rpcData,
    })

    if (rpcError) {
      console.warn('⚠️ [criarTransacaoFinanceira] Erro ao usar função RPC, tentando INSERT direto:', {
        error: rpcError,
        message: rpcError.message,
        details: (rpcError as any).details,
        hint: (rpcError as any).hint,
        code: (rpcError as any).code,
      })
      
      // Fallback: tenta inserção direta
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .insert(dadosInsercao)
        .select()
        .single()

      if (error) {
        console.error('❌ [criarTransacaoFinanceira] Erro ao criar transação financeira:', {
          rpcError,
          insertError: error,
          message: error.message,
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
          dadosInsercao,
        })
        return {
          transacao: null,
          error,
          mensagem: `Erro ao criar transação financeira: ${error.message || traduzirErro(error.message) || 'Erro desconhecido'}`,
        }
      }

      console.log('✅ [criarTransacaoFinanceira] Transação criada com sucesso (INSERT direto):', {
        transacaoId: data?.id,
        valorBruto: data?.valor_bruto,
        valorLiquido: data?.valor_liquido,
        modalidade: data?.modalidade,
        status: data?.status,
      })

      return {
        transacao: data as TransacaoFinanceira,
        error: null,
      }
    }

    // Se RPC funcionou, busca a transação criada
    const { data: transacaoData, error: buscaError } = await supabase
      .from('transacoes_financeiras')
      .select('*')
      .eq('id', rpcData)
      .single()

    if (buscaError || !transacaoData) {
      console.error('❌ [criarTransacaoFinanceira] Erro ao buscar transação criada:', buscaError)
      return {
        transacao: null,
        error: buscaError || new Error('Transação criada mas não encontrada'),
        mensagem: 'Erro ao buscar transação criada',
      }
    }

    console.log('✅ [criarTransacaoFinanceira] Transação criada com sucesso (RPC):', {
      transacaoId: transacaoData?.id,
      valorBruto: transacaoData?.valor_bruto,
      valorLiquido: transacaoData?.valor_liquido,
      modalidade: transacaoData?.modalidade,
      status: transacaoData?.status,
    })

    return {
      transacao: transacaoData as TransacaoFinanceira,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao criar transação financeira:', error)
    return {
      transacao: null,
      error: error instanceof Error ? error : new Error('Erro ao criar transação financeira'),
      mensagem: 'Erro inesperado ao criar transação financeira',
    }
  }
}

/**
 * Lista transações financeiras de uma revenda
 */
export async function listarTransacoesRevenda(
  revendaId: string,
  filtros?: {
    status?: 'pendente' | 'liberado' | 'repassado' | 'cancelado'
    modalidade?: 'D+1' | 'D+15' | 'D+30'
    dataInicio?: string
    dataFim?: string
    unidadeId?: string | null
  }
): Promise<{ transacoes: TransacaoFinanceira[]; error: Error | null }> {
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
        return { transacoes: [], error: null }
      }
    }

    // Especificar o relacionamento correto usando cliente_id
    // O Supabase precisa saber qual foreign key usar quando há múltiplas relações
    let query = supabase
      .from('transacoes_financeiras')
      .select(`
        *,
        pedido:pedidos (
          id,
          valor_total,
          status,
          criado_em,
          unidade_id
        ),
        cliente:usuarios!cliente_id (
          id,
          nome_completo,
          email
        )
      `)
      .eq('revenda_id', revendaId)
      .order('criado_em', { ascending: false })

    if (pedidosIds && pedidosIds.length > 0) {
      query = query.in('pedido_id', pedidosIds)
    }

    if (filtros?.status) {
      query = query.eq('status', filtros.status)
    }

    if (filtros?.modalidade) {
      query = query.eq('modalidade', filtros.modalidade)
    }

    if (filtros?.dataInicio) {
      query = query.gte('data_repasse_prevista', filtros.dataInicio)
    }

    if (filtros?.dataFim) {
      query = query.lte('data_repasse_prevista', filtros.dataFim)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erro ao listar transações:', {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
        revendaId,
        filtros,
        pedidosIds: pedidosIds?.length || 0,
      })
      return {
        transacoes: [],
        error: error instanceof Error ? error : new Error(error.message || 'Erro ao listar transações'),
      }
    }

    return {
      transacoes: (data || []) as TransacaoFinanceira[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar transações:', error)
    return {
      transacoes: [],
      error: error instanceof Error ? error : new Error('Erro ao listar transações'),
    }
  }
}

/**
 * Lista todas as transações financeiras (Admin)
 */
export async function listarTodasTransacoes(
  filtros?: {
    revendaId?: string
    unidadeId?: string | null
    status?: 'pendente' | 'liberado' | 'repassado' | 'cancelado'
    modalidade?: 'D+1' | 'D+15' | 'D+30'
    dataInicio?: string
    dataFim?: string
  }
): Promise<{ transacoes: TransacaoFinanceira[]; error: Error | null }> {
  try {
    console.log('📊 [listarTodasTransacoes] Iniciando busca com filtros:', filtros)
    
    // Se unidadeId for fornecido, primeiro busca os pedidos da unidade
    let pedidosIds: string[] | null = null
    if (filtros?.unidadeId && filtros?.revendaId) {
      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('id')
        .eq('revenda_id', filtros.revendaId)
        .eq('unidade_id', filtros.unidadeId)
      
      pedidosIds = pedidosData?.map(p => p.id) || []
      if (pedidosIds.length === 0) {
        return { transacoes: [], error: null }
      }
    }

    // Primeiro, tentar buscar apenas as transações básicas (sem relacionamentos)
    // Isso garante que mesmo se houver problema com RLS nos relacionamentos, ainda conseguimos os dados
    let queryBasica = supabase
      .from('transacoes_financeiras')
      .select('*')
      .order('criado_em', { ascending: false })

    if (filtros?.revendaId) {
      queryBasica = queryBasica.eq('revenda_id', filtros.revendaId)
      console.log('📊 [listarTodasTransacoes] Filtro revendaId aplicado:', filtros.revendaId)
    }

    if (pedidosIds && pedidosIds.length > 0) {
      queryBasica = queryBasica.in('pedido_id', pedidosIds)
      console.log('📊 [listarTodasTransacoes] Filtro unidadeId aplicado via pedidosIds:', pedidosIds.length)
    }

    if (filtros?.status) {
      queryBasica = queryBasica.eq('status', filtros.status)
      console.log('📊 [listarTodasTransacoes] Filtro status aplicado:', filtros.status)
    }

    if (filtros?.modalidade) {
      queryBasica = queryBasica.eq('modalidade', filtros.modalidade)
      console.log('📊 [listarTodasTransacoes] Filtro modalidade aplicado:', filtros.modalidade)
    }

    if (filtros?.dataInicio) {
      queryBasica = queryBasica.gte('data_repasse_prevista', filtros.dataInicio)
      console.log('📊 [listarTodasTransacoes] Filtro dataInicio aplicado:', filtros.dataInicio)
    }

    if (filtros?.dataFim) {
      queryBasica = queryBasica.lte('data_repasse_prevista', filtros.dataFim)
      console.log('📊 [listarTodasTransacoes] Filtro dataFim aplicado:', filtros.dataFim)
    }

    const { data: dataBasica, error: errorBasica } = await queryBasica

    if (errorBasica) {
      console.error('❌ Erro ao listar transações básicas:', {
        message: errorBasica.message,
        details: (errorBasica as any).details,
        hint: (errorBasica as any).hint,
        code: (errorBasica as any).code,
      })
      return {
        transacoes: [],
        error: errorBasica,
      }
    }

    if (!dataBasica || dataBasica.length === 0) {
      console.log('ℹ️ [listarTodasTransacoes] Nenhuma transação encontrada')
      return {
        transacoes: [],
        error: null,
      }
    }

    console.log('✅ [listarTodasTransacoes] Transações básicas encontradas:', dataBasica.length)

    // Agora tentar buscar com relacionamentos
    let queryCompleta = supabase
      .from('transacoes_financeiras')
      .select(`
        *,
        pedido:pedidos (
          id,
          valor_total,
          status,
          criado_em,
          unidade_id,
          unidade:unidades_revenda (
            id,
            nome,
            nome_publico
          )
        ),
        cliente:usuarios (
          id,
          nome_completo,
          email
        ),
        revenda:revendas (
          id,
          nome_revenda,
          nome_publico
        )
      `)
      .order('criado_em', { ascending: false })

    if (filtros?.revendaId) {
      queryCompleta = queryCompleta.eq('revenda_id', filtros.revendaId)
    }

    if (pedidosIds && pedidosIds.length > 0) {
      queryCompleta = queryCompleta.in('pedido_id', pedidosIds)
    }
    if (filtros?.status) {
      queryCompleta = queryCompleta.eq('status', filtros.status)
    }
    if (filtros?.modalidade) {
      queryCompleta = queryCompleta.eq('modalidade', filtros.modalidade)
    }
    if (filtros?.dataInicio) {
      queryCompleta = queryCompleta.gte('data_repasse_prevista', filtros.dataInicio)
    }
    if (filtros?.dataFim) {
      queryCompleta = queryCompleta.lte('data_repasse_prevista', filtros.dataFim)
    }

    const { data: dataCompleta, error: errorCompleta } = await queryCompleta

    // Se a query completa funcionou, usar ela
    if (!errorCompleta && dataCompleta) {
      console.log('✅ [listarTodasTransacoes] Query completa OK:', {
        quantidade: dataCompleta.length,
        primeiras3: dataCompleta.slice(0, 3).map(t => ({
          id: t.id,
          modalidade: (t as any).modalidade,
          valor: (t as any).valor_bruto,
          revenda: (t as any).revenda?.nome_revenda,
        })),
      })
      return {
        transacoes: (dataCompleta || []) as TransacaoFinanceira[],
        error: null,
      }
    }

    // Se a query completa falhou, usar dados básicos e buscar relacionamentos separadamente
    console.warn('⚠️ [listarTodasTransacoes] Query completa falhou, usando dados básicos:', errorCompleta)
    
    // Buscar relacionamentos separadamente para as primeiras transações
    const transacoesComRelacionamentos: TransacaoFinanceira[] = []
    
    for (const transacao of dataBasica.slice(0, 100)) { // Limitar a 100 para performance
      const transacaoCompleta: any = { ...transacao }
      
      // Buscar pedido
      const { data: pedido } = await supabase
        .from('pedidos')
        .select('id, valor_total, status, criado_em')
        .eq('id', transacao.pedido_id)
        .single()
      if (pedido) transacaoCompleta.pedido = pedido
      
      // Buscar cliente
      const { data: cliente } = await supabase
        .from('usuarios')
        .select('id, nome_completo, email')
        .eq('id', transacao.cliente_id)
        .single()
      if (cliente) transacaoCompleta.cliente = cliente
      
      // Buscar revenda
      const { data: revenda } = await supabase
        .from('revendas')
        .select('id, nome_revenda, nome_publico')
        .eq('id', transacao.revenda_id)
        .single()
      if (revenda) transacaoCompleta.revenda = revenda
      
      transacoesComRelacionamentos.push(transacaoCompleta as TransacaoFinanceira)
    }

    console.log('✅ [listarTodasTransacoes] Transações com relacionamentos montados:', {
      quantidade: transacoesComRelacionamentos.length,
      primeiras3: transacoesComRelacionamentos.slice(0, 3).map(t => ({
        id: t.id,
        modalidade: t.modalidade,
        valor: t.valor_bruto,
        revenda: t.revenda?.nome_revenda,
      })),
    })

    return {
      transacoes: transacoesComRelacionamentos,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar transações:', error)
    return {
      transacoes: [],
      error: error instanceof Error ? error : new Error('Erro ao listar transações'),
    }
  }
}

/**
 * Calcula métricas financeiras para uma revenda
 */
export async function calcularMetricasRevenda(
  revendaId: string,
  unidadeId?: string | null
): Promise<{
  valoresRecebidosHoje: number
  valoresLiberados: number
  valoresPendentes: number
  valoresBloqueados: number
  totalEmProcessamento: number
  error: Error | null
}> {
  try {
    const hoje = new Date().toISOString().split('T')[0]

    // Se unidadeId for fornecido, busca os pedidos da unidade
    let pedidosIds: string[] | null = null
    if (unidadeId) {
      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('id')
        .eq('revenda_id', revendaId)
        .eq('unidade_id', unidadeId)
      
      pedidosIds = pedidosData?.map(p => p.id) || []
      if (pedidosIds.length === 0) {
        return {
          valoresRecebidosHoje: 0,
          valoresLiberados: 0,
          valoresPendentes: 0,
          valoresBloqueados: 0,
          totalEmProcessamento: 0,
          error: null,
        }
      }
    }

    // Valores recebidos hoje (repassados hoje)
    let queryRecebidosHoje = supabase
      .from('transacoes_financeiras')
      .select('valor_liquido')
      .eq('revenda_id', revendaId)
      .eq('status', 'repassado')
      .gte('atualizado_em', hoje + 'T00:00:00Z')
      .lt('atualizado_em', new Date(new Date(hoje).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00Z')
    
    if (pedidosIds && pedidosIds.length > 0) {
      queryRecebidosHoje = queryRecebidosHoje.in('pedido_id', pedidosIds)
    }
    
    const { data: recebidosHoje } = await queryRecebidosHoje

    // Valores liberados (disponíveis para repasse, excluindo bloqueados)
    // Primeiro tenta buscar excluindo bloqueados, se o campo existir
    let liberados: any[] = []
    try {
      let queryLiberados = supabase
        .from('transacoes_financeiras')
        .select('valor_liquido')
        .eq('revenda_id', revendaId)
        .eq('status', 'liberado')
        .eq('bloqueado', false)
      
      if (pedidosIds && pedidosIds.length > 0) {
        queryLiberados = queryLiberados.in('pedido_id', pedidosIds)
      }
      
      const { data: liberadosData, error: liberadosError } = await queryLiberados
      
      if (!liberadosError) {
        liberados = liberadosData || []
      } else if (liberadosError.message?.includes('column "bloqueado" does not exist')) {
        // Fallback: busca sem filtro de bloqueado se campo não existir
        let queryLiberadosFallback = supabase
          .from('transacoes_financeiras')
          .select('valor_liquido')
          .eq('revenda_id', revendaId)
          .eq('status', 'liberado')
        
        if (pedidosIds && pedidosIds.length > 0) {
          queryLiberadosFallback = queryLiberadosFallback.in('pedido_id', pedidosIds)
        }
        
        const { data: liberadosFallback } = await queryLiberadosFallback
        liberados = liberadosFallback || []
      } else {
        console.error('❌ Erro ao buscar valores liberados:', liberadosError)
        liberados = []
      }
    } catch (error) {
      console.error('❌ Erro ao buscar valores liberados:', error)
      liberados = []
    }

    // Valores pendentes (aguardando prazo)
    let queryPendentes = supabase
      .from('transacoes_financeiras')
      .select('valor_liquido')
      .eq('revenda_id', revendaId)
      .eq('status', 'pendente')
    
    if (pedidosIds && pedidosIds.length > 0) {
      queryPendentes = queryPendentes.in('pedido_id', pedidosIds)
    }
    
    const { data: pendentes } = await queryPendentes

    // Valores bloqueados (tenta buscar com fallback se campo não existir)
    let bloqueados: any[] = []
    try {
      let queryBloqueados = supabase
        .from('transacoes_financeiras')
        .select('valor_liquido')
        .eq('revenda_id', revendaId)
        .eq('bloqueado', true)
        .in('status', ['liberado', 'pendente'])
      
      if (pedidosIds && pedidosIds.length > 0) {
        queryBloqueados = queryBloqueados.in('pedido_id', pedidosIds)
      }
      
      const { data: bloqueadosData, error: bloqueadosError } = await queryBloqueados
      
      console.log('🔍 [calcularMetricasRevenda] Buscando valores bloqueados:', {
        revendaId,
        bloqueadosCount: bloqueadosData?.length || 0,
        bloqueadosData,
        error: bloqueadosError
      })
      
      if (!bloqueadosError) {
        bloqueados = bloqueadosData || []
        console.log('✅ [calcularMetricasRevenda] Valores bloqueados encontrados:', bloqueados.length)
      } else if (bloqueadosError.message?.includes('column "bloqueado" does not exist')) {
        console.warn('⚠️ Campo bloqueado não existe ainda, valores bloqueados serão 0')
        bloqueados = []
      } else {
        console.error('❌ Erro ao buscar valores bloqueados:', bloqueadosError)
        bloqueados = []
      }
    } catch (error) {
      console.error('❌ Erro ao buscar valores bloqueados:', error)
      bloqueados = []
    }

    const valoresRecebidosHoje = recebidosHoje?.reduce((sum, t) => sum + (parseFloat(String(t.valor_liquido)) || 0), 0) || 0
    const valoresLiberados = liberados.reduce((sum, t) => sum + (parseFloat(String(t.valor_liquido)) || 0), 0)
    const valoresPendentes = pendentes?.reduce((sum, t) => sum + (parseFloat(String(t.valor_liquido)) || 0), 0) || 0
    const valoresBloqueados = bloqueados.reduce((sum, t) => sum + (parseFloat(String(t.valor_liquido)) || 0), 0)
    const totalEmProcessamento = valoresLiberados + valoresPendentes

    console.log('📊 [calcularMetricasRevenda] Métricas calculadas:', {
      valoresRecebidosHoje,
      valoresLiberados,
      valoresPendentes,
      valoresBloqueados,
      totalEmProcessamento
    })

    return {
      valoresRecebidosHoje: Math.round(valoresRecebidosHoje * 100) / 100,
      valoresLiberados: Math.round(valoresLiberados * 100) / 100,
      valoresPendentes: Math.round(valoresPendentes * 100) / 100,
      valoresBloqueados: Math.round(valoresBloqueados * 100) / 100,
      totalEmProcessamento: Math.round(totalEmProcessamento * 100) / 100,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro ao calcular métricas:', error)
    return {
      valoresRecebidosHoje: 0,
      valoresLiberados: 0,
      valoresPendentes: 0,
      valoresBloqueados: 0,
      totalEmProcessamento: 0,
      error: error instanceof Error ? error : new Error('Erro ao calcular métricas'),
    }
  }
}

/**
 * Calcula métricas financeiras gerais (Admin)
 */
export async function calcularMetricasGerais(
  filtros?: {
    revendaId?: string
    unidadeId?: string
    dataInicio?: string
    dataFim?: string
  }
): Promise<{
  receitaTotal: number
  totalTransacoes: number
  repassesRealizados: number
  repassesPendentes: number
  taxaMedia: number
  error: Error | null
}> {
  try {
    console.log('📊 [calcularMetricasGerais] Iniciando com filtros:', filtros)
    
    // Se unidadeId for fornecido, primeiro busca os pedidos da unidade
    let pedidosIds: string[] | null = null
    if (filtros?.unidadeId && filtros?.revendaId) {
      console.log('📊 [calcularMetricasGerais] Buscando pedidos da unidade:', { unidadeId: filtros.unidadeId, revendaId: filtros.revendaId })
      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos')
        .select('id')
        .eq('revenda_id', filtros.revendaId)
        .eq('unidade_id', filtros.unidadeId)
      
      if (pedidosError) {
        console.error('❌ [calcularMetricasGerais] Erro ao buscar pedidos:', pedidosError)
      }
      
      pedidosIds = pedidosData?.map(p => p.id) || []
      console.log('📊 [calcularMetricasGerais] Pedidos encontrados:', pedidosIds.length)
      
      if (pedidosIds.length === 0) {
        console.log('ℹ️ [calcularMetricasGerais] Nenhum pedido encontrado para a unidade, retornando métricas zeradas')
        return {
          receitaTotal: 0,
          totalTransacoes: 0,
          repassesRealizados: 0,
          repassesPendentes: 0,
          taxaMedia: 0,
          error: null,
        }
      }
    }

    let query = supabase
      .from('transacoes_financeiras')
      .select('valor_bruto, taxa_percentual, taxa_fixa, valor_liquido, status')

    if (filtros?.revendaId) {
      query = query.eq('revenda_id', filtros.revendaId)
    }

    if (pedidosIds && pedidosIds.length > 0) {
      query = query.in('pedido_id', pedidosIds)
    }

    if (filtros?.dataInicio) {
      query = query.gte('data_pagamento', filtros.dataInicio)
    }

    if (filtros?.dataFim) {
      query = query.lte('data_pagamento', filtros.dataFim)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erro ao calcular métricas gerais:', error)
      return {
        receitaTotal: 0,
        totalTransacoes: 0,
        repassesRealizados: 0,
        repassesPendentes: 0,
        taxaMedia: 0,
        error,
      }
    }

    const transacoes = data || []
    console.log('📊 [calcularMetricasGerais] Transações encontradas:', {
      quantidade: transacoes.length,
      temFiltroUnidade: !!pedidosIds,
      pedidosIdsCount: pedidosIds?.length || 0,
    })
    
    const receitaTotal = transacoes.reduce((sum, t) => {
      const taxaPercentualValor = ((t.valor_bruto || 0) * (t.taxa_percentual || 0)) / 100
      return sum + taxaPercentualValor + (t.taxa_fixa || 0)
    }, 0)
    const totalTransacoes = transacoes.length
    const repassesRealizados = transacoes.filter(t => t.status === 'repassado').length
    const repassesPendentes = transacoes.filter(t => t.status === 'liberado').length
    const somaTaxas = transacoes.reduce((sum, t) => sum + (t.taxa_percentual || 0), 0)
    const taxaMedia = totalTransacoes > 0 ? somaTaxas / totalTransacoes : 0

    return {
      receitaTotal: Math.round(receitaTotal * 100) / 100,
      totalTransacoes,
      repassesRealizados,
      repassesPendentes,
      taxaMedia: Math.round(taxaMedia * 100) / 100,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao calcular métricas gerais:', error)
    return {
      receitaTotal: 0,
      totalTransacoes: 0,
      repassesRealizados: 0,
      repassesPendentes: 0,
      taxaMedia: 0,
      error: error instanceof Error ? error : new Error('Erro ao calcular métricas'),
    }
  }
}


