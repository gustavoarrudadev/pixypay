import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'

/**
 * Tipo de repetição do agendamento
 */
export type TipoRepeticao = 'diario' | 'semanal' | 'mensal' | 'unico'

/**
 * Interface de agendamento
 */
export interface Agendamento {
  id: string
  revenda_id: string
  ativo: boolean
  tipo_repeticao: TipoRepeticao
  dias_semana: number[] | null
  hora_ativacao: string // formato HH:MM
  hora_desativacao: string // formato HH:MM
  data_inicio: string // formato YYYY-MM-DD
  data_fim: string | null // formato YYYY-MM-DD
  timezone: string
  criado_em: string
  atualizado_em: string
}

/**
 * Dados para criar/atualizar agendamento
 */
export interface DadosAgendamento {
  tipo_repeticao: TipoRepeticao
  dias_semana?: number[] | null
  hora_ativacao: string
  hora_desativacao: string
  data_inicio: string
  data_fim?: string | null
  timezone?: string
}

/**
 * Lista agendamentos de uma revenda
 */
export async function listarAgendamentos(
  revendaId: string
): Promise<{ agendamentos: Agendamento[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('agendamentos_loja_publica')
      .select('*')
      .eq('revenda_id', revendaId)
      .order('data_inicio', { ascending: true })

    if (error) {
      console.error('❌ Erro ao listar agendamentos:', error)
      return {
        agendamentos: [],
        error,
      }
    }

    return {
      agendamentos: (data || []) as Agendamento[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar agendamentos:', error)
    return {
      agendamentos: [],
      error: error instanceof Error ? error : new Error('Erro ao listar agendamentos'),
    }
  }
}

/**
 * Cria um novo agendamento
 */
export async function criarAgendamento(
  revendaId: string,
  dados: DadosAgendamento
): Promise<{ agendamento: Agendamento | null; error: Error | null; mensagem?: string }> {
  try {
    const { data, error } = await supabase
      .from('agendamentos_loja_publica')
      .insert({
        revenda_id: revendaId,
        tipo_repeticao: dados.tipo_repeticao,
        dias_semana: dados.dias_semana || null,
        hora_ativacao: dados.hora_ativacao,
        hora_desativacao: dados.hora_desativacao,
        data_inicio: dados.data_inicio,
        data_fim: dados.data_fim || null,
        timezone: dados.timezone || 'America/Sao_Paulo',
        ativo: true,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar agendamento:', error)
      return {
        agendamento: null,
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao criar agendamento',
      }
    }

    return {
      agendamento: data as Agendamento,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao criar agendamento:', error)
    return {
      agendamento: null,
      error: error instanceof Error ? error : new Error('Erro ao criar agendamento'),
      mensagem: 'Erro inesperado ao criar agendamento',
    }
  }
}

/**
 * Atualiza um agendamento
 */
export async function atualizarAgendamento(
  agendamentoId: string,
  dados: Partial<DadosAgendamento> & { ativo?: boolean }
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    const updateData: any = {}

    if (dados.tipo_repeticao !== undefined) updateData.tipo_repeticao = dados.tipo_repeticao
    if (dados.dias_semana !== undefined) updateData.dias_semana = dados.dias_semana
    if (dados.hora_ativacao !== undefined) updateData.hora_ativacao = dados.hora_ativacao
    if (dados.hora_desativacao !== undefined) updateData.hora_desativacao = dados.hora_desativacao
    if (dados.data_inicio !== undefined) updateData.data_inicio = dados.data_inicio
    if (dados.data_fim !== undefined) updateData.data_fim = dados.data_fim
    if (dados.timezone !== undefined) updateData.timezone = dados.timezone
    if (dados.ativo !== undefined) updateData.ativo = dados.ativo

    const { error } = await supabase
      .from('agendamentos_loja_publica')
      .update(updateData)
      .eq('id', agendamentoId)

    if (error) {
      console.error('❌ Erro ao atualizar agendamento:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao atualizar agendamento',
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar agendamento:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao atualizar agendamento'),
      mensagem: 'Erro inesperado ao atualizar agendamento',
    }
  }
}

/**
 * Deleta um agendamento
 */
export async function deletarAgendamento(
  agendamentoId: string
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    const { error } = await supabase
      .from('agendamentos_loja_publica')
      .delete()
      .eq('id', agendamentoId)

    if (error) {
      console.error('❌ Erro ao deletar agendamento:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao deletar agendamento',
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao deletar agendamento:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao deletar agendamento'),
      mensagem: 'Erro inesperado ao deletar agendamento',
    }
  }
}

/**
 * Atualiza o status da loja (link_publico_ativo) baseado nos agendamentos ativos
 * 
 * Lógica:
 * - Se não há agendamentos ativos: não altera o status (mantém manual)
 * - Se há agendamentos ativos:
 *   - Se algum está no período de ativação: define link_publico_ativo = true
 *   - Se nenhum está no período: define link_publico_ativo = false
 */
export async function atualizarStatusPorAgendamentos(
  revendaId: string
): Promise<{ atualizado: boolean; novoStatus: boolean | null; error: Error | null }> {
  try {
    // Primeiro verifica se há agendamentos
    const { agendamentos, error: listError } = await listarAgendamentos(revendaId)
    
    // Se não há agendamentos ou erro ao listar, não altera o status manual
    if (listError || !agendamentos || agendamentos.length === 0) {
      return { atualizado: false, novoStatus: null, error: null }
    }

    // Filtra apenas agendamentos ativos
    const agendamentosAtivos = agendamentos.filter(a => a.ativo)
    
    // Se não há agendamentos ativos, não altera o status manual
    if (agendamentosAtivos.length === 0) {
      return { atualizado: false, novoStatus: null, error: null }
    }

    // Agora verifica o status baseado nos agendamentos
    const { deveEstarAtiva } = await verificarStatusAgendamentos(revendaId)

    // Busca o status atual
    const { data: revendaData, error: revendaError } = await supabase
      .from('revendas')
      .select('link_publico_ativo')
      .eq('id', revendaId)
      .single()

    if (revendaError) {
      console.error('❌ Erro ao buscar status atual da revenda:', revendaError)
      return {
        atualizado: false,
        novoStatus: null,
        error: revendaError,
      }
    }

    const statusAtual = revendaData?.link_publico_ativo ?? true

    // Se o status já está correto, não precisa atualizar
    if (statusAtual === deveEstarAtiva) {
      return { atualizado: false, novoStatus: statusAtual, error: null }
    }

    // Atualiza o status
    const { error: updateError } = await supabase
      .from('revendas')
      .update({ link_publico_ativo: deveEstarAtiva })
      .eq('id', revendaId)

    if (updateError) {
      console.error('❌ Erro ao atualizar status por agendamento:', updateError)
      return {
        atualizado: false,
        novoStatus: null,
        error: updateError,
      }
    }

    console.log(`✅ Status atualizado por agendamento: ${deveEstarAtiva ? 'ATIVO' : 'INATIVO'} para revenda ${revendaId}`)
    return {
      atualizado: true,
      novoStatus: deveEstarAtiva,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar status por agendamentos:', error)
    return {
      atualizado: false,
      novoStatus: null,
      error: error instanceof Error ? error : new Error('Erro ao atualizar status'),
    }
  }
}

/**
 * Verifica se a loja deve estar ativa baseado nos agendamentos
 * 
 * Lógica:
 * - Se não há agendamentos: retorna true (loja deve estar ativa se link_publico_ativo = true)
 * - Se há agendamentos: verifica se algum está ativo no momento
 *   - Se sim: retorna true (loja deve estar ativa)
 *   - Se não: retorna false (loja deve estar desativada por agendamento)
 */
export async function verificarStatusAgendamentos(
  revendaId: string
): Promise<{ deveEstarAtiva: boolean; agendamentoAtivo: Agendamento | null }> {
  try {
    const { agendamentos, error } = await listarAgendamentos(revendaId)

    // Se não há agendamentos ou erro, loja deve seguir o status manual (link_publico_ativo)
    if (error || !agendamentos || agendamentos.length === 0) {
      return { deveEstarAtiva: true, agendamentoAtivo: null }
    }

    // Filtra apenas agendamentos ativos
    const agendamentosAtivos = agendamentos.filter(a => a.ativo)
    if (agendamentosAtivos.length === 0) {
      return { deveEstarAtiva: true, agendamentoAtivo: null }
    }

    const agora = new Date()
    const horaAtual = agora.getHours() * 60 + agora.getMinutes() // minutos desde meia-noite
    const diaSemanaAtual = agora.getDay() // 0 = domingo, 6 = sábado
    const dataAtual = agora.toISOString().split('T')[0] // YYYY-MM-DD

    // Verifica cada agendamento ativo para ver se algum está no período de ativação
    for (const agendamento of agendamentosAtivos) {
      // Verifica se está dentro do período de datas
      if (agendamento.data_inicio > dataAtual) continue
      if (agendamento.data_fim && agendamento.data_fim < dataAtual) continue

      // Converte horas para minutos
      const [horaAtivacao, minutoAtivacao] = agendamento.hora_ativacao.split(':').map(Number)
      const horaAtivacaoMinutos = horaAtivacao * 60 + minutoAtivacao

      const [horaDesativacao, minutoDesativacao] = agendamento.hora_desativacao.split(':').map(Number)
      const horaDesativacaoMinutos = horaDesativacao * 60 + minutoDesativacao

      // Verifica tipo de repetição
      let estaNoPeriodo = false

      if (agendamento.tipo_repeticao === 'diario') {
        // Diário: verifica apenas horário
        estaNoPeriodo = horaAtual >= horaAtivacaoMinutos && horaAtual < horaDesativacaoMinutos
      } else if (agendamento.tipo_repeticao === 'semanal') {
        // Semanal: verifica dia da semana e horário
        if (agendamento.dias_semana && agendamento.dias_semana.includes(diaSemanaAtual)) {
          estaNoPeriodo = horaAtual >= horaAtivacaoMinutos && horaAtual < horaDesativacaoMinutos
        }
      } else if (agendamento.tipo_repeticao === 'unico') {
        // Único: verifica data específica e horário
        if (agendamento.data_inicio === dataAtual) {
          estaNoPeriodo = horaAtual >= horaAtivacaoMinutos && horaAtual < horaDesativacaoMinutos
        }
      }
      // Mensal: implementar se necessário

      // Se encontrou um agendamento ativo no período, loja deve estar ativa
      if (estaNoPeriodo) {
        return { deveEstarAtiva: true, agendamentoAtivo: agendamento }
      }
    }

    // Se há agendamentos mas nenhum está ativo no momento, loja deve estar desativada
    return { deveEstarAtiva: false, agendamentoAtivo: null }
  } catch (error) {
    console.error('❌ Erro ao verificar status de agendamentos:', error)
    // Em caso de erro, assume que deve estar ativa (segue status manual)
    return { deveEstarAtiva: true, agendamentoAtivo: null }
  }
}

