import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'

/**
 * Interface de configuração de agendamento da revenda
 */
export interface ConfiguracaoAgendamento {
  agendamento_entrega_livre: boolean
  agendamento_horarios_disponiveis: string[] // Array de horários no formato "HH:MM"
  agendamento_dias_disponiveis: number[] // Array de dias da semana (0=domingo, 1=segunda, ..., 6=sábado)
}

/**
 * Busca configuração de agendamento de uma revenda ou unidade
 * @param revendaId ID da revenda (obrigatório)
 * @param unidadeId ID da unidade (opcional - se fornecido, busca configuração da unidade)
 */
export async function buscarConfiguracaoAgendamento(
  revendaId: string,
  unidadeId?: string | null
): Promise<{ configuracao: ConfiguracaoAgendamento | null; error: Error | null }> {
  try {
    console.log('🔍 [buscarConfiguracaoAgendamento] Buscando configuração:', { revendaId, unidadeId })
    
    // Se unidadeId for fornecido, busca configuração da unidade primeiro
    if (unidadeId) {
      const { data: unidadeData, error: unidadeError } = await supabase
        .from('unidades_revenda')
        .select('agendamento_entrega_livre, agendamento_horarios_disponiveis, agendamento_dias_disponiveis')
        .eq('id', unidadeId)
        .eq('revenda_id', revendaId)
        .maybeSingle()

      console.log('📊 [buscarConfiguracaoAgendamento] Dados da unidade:', {
        unidadeData,
        unidadeError,
        unidadeId,
        revendaId
      })

      if (!unidadeError && unidadeData) {
        // Sempre retorna a configuração da unidade (mesmo que seja valores padrão)
        // Isso permite que cada unidade tenha sua própria configuração
        const configuracao: ConfiguracaoAgendamento = {
          agendamento_entrega_livre: unidadeData.agendamento_entrega_livre ?? true,
          agendamento_horarios_disponiveis: (unidadeData.agendamento_horarios_disponiveis as string[]) || [],
          agendamento_dias_disponiveis: (unidadeData.agendamento_dias_disponiveis as number[]) || [0, 1, 2, 3, 4, 5, 6],
        }

        console.log('✅ [buscarConfiguracaoAgendamento] Configuração da unidade encontrada:', configuracao)
        return {
          configuracao,
          error: null,
        }
      } else if (unidadeError) {
        console.error('❌ [buscarConfiguracaoAgendamento] Erro ao buscar unidade:', unidadeError)
        // Continua para buscar da revenda mesmo com erro na unidade
      } else {
        console.log('⚠️ [buscarConfiguracaoAgendamento] Unidade não encontrada, buscando da revenda')
      }
    }
    
    // Busca configuração da revenda (fallback ou quando não há unidade)
    const { data, error } = await supabase
      .from('revendas')
      .select('agendamento_entrega_livre, agendamento_horarios_disponiveis, agendamento_dias_disponiveis')
      .eq('id', revendaId)
      .maybeSingle()

    console.log('📊 [buscarConfiguracaoAgendamento] Resultado:', {
      data,
      error,
      revendaId,
      unidadeId
    })

    if (error) {
      console.error('❌ Erro ao buscar configuração de agendamento:', error)
      return {
        configuracao: null,
        error,
      }
    }

    if (!data) {
      console.log('⚠️ [buscarConfiguracaoAgendamento] Revenda não encontrada ou sem configuração')
      // Retorna configuração padrão ao invés de null
      return {
        configuracao: {
          agendamento_entrega_livre: true,
          agendamento_horarios_disponiveis: [],
          agendamento_dias_disponiveis: [0, 1, 2, 3, 4, 5, 6],
        },
        error: null,
      }
    }

    const configuracao: ConfiguracaoAgendamento = {
      agendamento_entrega_livre: data.agendamento_entrega_livre ?? true,
      agendamento_horarios_disponiveis: (data.agendamento_horarios_disponiveis as string[]) || [],
      agendamento_dias_disponiveis: (data.agendamento_dias_disponiveis as number[]) || [0, 1, 2, 3, 4, 5, 6],
    }

    console.log('✅ [buscarConfiguracaoAgendamento] Configuração processada:', configuracao)

    return {
      configuracao,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar configuração de agendamento:', error)
    // Retorna configuração padrão ao invés de null em caso de erro
    return {
      configuracao: {
        agendamento_entrega_livre: true,
        agendamento_horarios_disponiveis: [],
        agendamento_dias_disponiveis: [0, 1, 2, 3, 4, 5, 6],
      },
      error: error instanceof Error ? error : new Error('Erro ao buscar configuração'),
    }
  }
}

/**
 * Atualiza configuração de agendamento de uma revenda ou unidade
 * @param revendaId ID da revenda (obrigatório)
 * @param configuracao Configuração a ser atualizada
 * @param unidadeId ID da unidade (opcional - se fornecido, atualiza configuração da unidade)
 */
export async function atualizarConfiguracaoAgendamento(
  revendaId: string,
  configuracao: Partial<ConfiguracaoAgendamento>,
  unidadeId?: string | null
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    const updateData: any = {}

    if (configuracao.agendamento_entrega_livre !== undefined) {
      updateData.agendamento_entrega_livre = configuracao.agendamento_entrega_livre
    }

    if (configuracao.agendamento_horarios_disponiveis !== undefined) {
      updateData.agendamento_horarios_disponiveis = configuracao.agendamento_horarios_disponiveis
    }

    if (configuracao.agendamento_dias_disponiveis !== undefined) {
      updateData.agendamento_dias_disponiveis = configuracao.agendamento_dias_disponiveis
    }

    // Se unidadeId for fornecido, atualiza na tabela unidades_revenda
    if (unidadeId) {
      const { error } = await supabase
        .from('unidades_revenda')
        .update(updateData)
        .eq('id', unidadeId)
        .eq('revenda_id', revendaId)

      if (error) {
        console.error('❌ Erro ao atualizar configuração de agendamento da unidade:', error)
        return {
          error,
          mensagem: traduzirErro(error.message) || 'Erro ao atualizar configuração',
        }
      }

      console.log('✅ [atualizarConfiguracaoAgendamento] Configuração da unidade atualizada:', { unidadeId, updateData })
      return { error: null }
    }

    // Caso contrário, atualiza na tabela revendas (compatibilidade)
    const { error } = await supabase
      .from('revendas')
      .update(updateData)
      .eq('id', revendaId)

    if (error) {
      console.error('❌ Erro ao atualizar configuração de agendamento:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao atualizar configuração',
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar configuração de agendamento:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao atualizar configuração'),
      mensagem: 'Erro inesperado ao atualizar configuração',
    }
  }
}

/**
 * Lista agendamentos de entrega de uma revenda ou unidade
 * @param revendaId ID da revenda (obrigatório)
 * @param unidadeId ID da unidade (opcional - se fornecido, filtra agendamentos da unidade)
 */
export async function listarAgendamentosEntregaRevenda(
  revendaId: string,
  unidadeId?: string | null
): Promise<{ agendamentos: any[]; error: Error | null }> {
  try {
    if (!revendaId) {
      return {
        agendamentos: [],
        error: new Error('revendaId é obrigatório'),
      }
    }

    let query = supabase
      .from('agendamentos_entrega')
      .select(`
        *,
        pedido:pedidos!agendamentos_entrega_pedido_id_fkey (
          id,
          valor_total,
          dados_cliente,
          status,
          unidade_id,
          tipo_entrega,
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
        cliente:usuarios!agendamentos_entrega_cliente_id_fkey (
          id,
          nome_completo,
          email
        )
      `)
      .eq('revenda_id', revendaId)

    // Se unidadeId for fornecido, filtra diretamente por unidade_id na tabela agendamentos_entrega
    if (unidadeId) {
      query = query.eq('unidade_id', unidadeId)
    }

    const { data, error } = await query
      .order('data_agendamento', { ascending: true })
      .order('horario', { ascending: true })

    if (error) {
      console.error('❌ Erro ao buscar agendamentos:', error)
      return {
        agendamentos: [],
        error,
      }
    }

    // Filtra no cliente caso o filtro não tenha funcionado corretamente (fallback)
    let agendamentosFiltrados = data || []
    if (unidadeId) {
      agendamentosFiltrados = agendamentosFiltrados.filter(
        (ag) => ag.unidade_id === unidadeId || ag.pedido?.unidade_id === unidadeId
      )
    }

    console.log('✅ [listarAgendamentosEntregaRevenda] Agendamentos encontrados:', {
      total: agendamentosFiltrados.length,
      unidadeId,
      revendaId,
      agendamentos: agendamentosFiltrados.map(a => ({
        id: a.id,
        pedido_id: a.pedido_id,
        unidade_id: a.unidade_id,
        pedido_unidade_id: a.pedido?.unidade_id
      }))
    })

    return {
      agendamentos: agendamentosFiltrados,
      error: null,
    }
  } catch (error) {
    return {
      agendamentos: [],
      error: error instanceof Error ? error : new Error('Erro ao listar agendamentos'),
    }
  }
}

/**
 * Lista todos os agendamentos de entrega (Admin) - com filtro opcional por revenda
 */
export async function listarAgendamentosEntregaAdmin(
  revendaId?: string,
  unidadeId?: string | null
): Promise<{ agendamentos: any[]; error: Error | null }> {
  try {
    let query = supabase
      .from('agendamentos_entrega')
      .select(`
        *,
        pedido:pedidos!agendamentos_entrega_pedido_id_fkey (
          id,
          valor_total,
          dados_cliente,
          status,
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
        cliente:usuarios!agendamentos_entrega_cliente_id_fkey (
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
      .order('data_agendamento', { ascending: true })
      .order('horario', { ascending: true })

    if (revendaId) {
      query = query.eq('revenda_id', revendaId)
    }

    if (unidadeId) {
      // Filtrar por unidade através do pedido
      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('id')
        .eq('revenda_id', revendaId || '')
        .eq('unidade_id', unidadeId)
      
      const pedidosIds = pedidosData?.map(p => p.id) || []
      if (pedidosIds.length === 0) {
        return { agendamentos: [], error: null }
      }
      query = query.in('pedido_id', pedidosIds)
    }

    const { data, error } = await query

    if (error) {
      return {
        agendamentos: [],
        error,
      }
    }

    return {
      agendamentos: data || [],
      error: null,
    }
  } catch (error) {
    return {
      agendamentos: [],
      error: error instanceof Error ? error : new Error('Erro ao listar agendamentos'),
    }
  }
}

