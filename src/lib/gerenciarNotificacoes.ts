import { supabase } from './supabase'
import { obterSessao } from './auth'

/**
 * Tipos de notificações
 */
export type TipoNotificacao = 
  | 'novo_pedido'
  | 'status_pedido'
  | 'novo_parcelamento'
  | 'parcela_aberta'
  | 'parcela_atrasada'
  | 'agendamento'
  | 'repasse'

/**
 * Interface de notificação
 */
export interface Notificacao {
  id: string
  usuario_id: string
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
  link: string | null
  lida: boolean
  criado_em: string
  lida_em: string | null
  metadata: Record<string, any>
}

/**
 * Interface de preferências de notificações
 */
export interface PreferenciasNotificacoes {
  id: string
  usuario_id: string
  receber_notificacoes: boolean
  receber_pedidos: boolean
  receber_status_pedidos: boolean
  receber_parcelamentos: boolean
  receber_parcelas_abertas: boolean
  receber_parcelas_atrasadas: boolean
  receber_agendamentos: boolean
  receber_repasses: boolean
  som_notificacoes: boolean
  criado_em: string
  atualizado_em: string
}

/**
 * Busca todas as notificações do usuário logado
 */
export async function listarNotificacoes(
  apenasNaoLidas: boolean = false
): Promise<{ notificacoes: Notificacao[]; error: Error | null }> {
  try {
    const session = await obterSessao()
    if (!session?.user) {
      return { notificacoes: [], error: new Error('Usuário não autenticado') }
    }

    let query = supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', session.user.id)
      .order('criado_em', { ascending: false })
      .limit(100)

    if (apenasNaoLidas) {
      query = query.eq('lida', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erro ao listar notificações:', error)
      return { notificacoes: [], error }
    }

    return {
      notificacoes: (data || []) as Notificacao[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar notificações:', error)
    return {
      notificacoes: [],
      error: error instanceof Error ? error : new Error('Erro ao listar notificações'),
    }
  }
}

/**
 * Conta notificações não lidas
 */
export async function contarNotificacoesNaoLidas(): Promise<{ count: number; error: Error | null }> {
  try {
    const session = await obterSessao()
    if (!session?.user) {
      return { count: 0, error: null }
    }

    const { count, error } = await supabase
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', session.user.id)
      .eq('lida', false)

    if (error) {
      console.error('❌ Erro ao contar notificações:', error)
      return { count: 0, error }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao contar notificações:', error)
    return { count: 0, error: error instanceof Error ? error : new Error('Erro ao contar notificações') }
  }
}

/**
 * Marca notificação como lida
 */
export async function marcarComoLida(notificacaoId: string): Promise<{ error: Error | null }> {
  try {
    const session = await obterSessao()
    if (!session?.user) {
      return { error: new Error('Usuário não autenticado') }
    }

    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true, lida_em: new Date().toISOString() })
      .eq('id', notificacaoId)
      .eq('usuario_id', session.user.id)

    if (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao marcar notificação como lida:', error)
    return { error: error instanceof Error ? error : new Error('Erro ao marcar notificação como lida') }
  }
}

/**
 * Marca todas as notificações como lidas
 */
export async function marcarTodasComoLidas(): Promise<{ error: Error | null }> {
  try {
    const session = await obterSessao()
    if (!session?.user) {
      return { error: new Error('Usuário não autenticado') }
    }

    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true, lida_em: new Date().toISOString() })
      .eq('usuario_id', session.user.id)
      .eq('lida', false)

    if (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao marcar todas como lidas:', error)
    return { error: error instanceof Error ? error : new Error('Erro ao marcar todas como lidas') }
  }
}

/**
 * Deleta uma notificação
 */
export async function deletarNotificacao(notificacaoId: string): Promise<{ error: Error | null }> {
  try {
    const session = await obterSessao()
    if (!session?.user) {
      return { error: new Error('Usuário não autenticado') }
    }

    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', notificacaoId)
      .eq('usuario_id', session.user.id)

    if (error) {
      console.error('❌ Erro ao deletar notificação:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao deletar notificação:', error)
    return { error: error instanceof Error ? error : new Error('Erro ao deletar notificação') }
  }
}

/**
 * Limpa todas as notificações lidas
 */
export async function limparNotificacoesLidas(): Promise<{ error: Error | null }> {
  try {
    const session = await obterSessao()
    if (!session?.user) {
      return { error: new Error('Usuário não autenticado') }
    }

    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('usuario_id', session.user.id)
      .eq('lida', true)

    if (error) {
      console.error('❌ Erro ao limpar notificações lidas:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao limpar notificações lidas:', error)
    return { error: error instanceof Error ? error : new Error('Erro ao limpar notificações lidas') }
  }
}

/**
 * Busca preferências de notificações do usuário
 */
export async function buscarPreferenciasNotificacoes(): Promise<{
  preferencias: PreferenciasNotificacoes | null
  error: Error | null
}> {
  try {
    const session = await obterSessao()
    if (!session?.user) {
      return { preferencias: null, error: new Error('Usuário não autenticado') }
    }

    // Usar .select() sem .maybeSingle() para evitar erro 406 com RLS
    // O PostgREST pode retornar 406 quando usa .maybeSingle() com RLS e não há registro
    const { data, error } = await supabase
      .from('preferencias_notificacoes')
      .select('*')
      .eq('usuario_id', session.user.id)
      .limit(1)

    // Tratar erro 406 especificamente (Not Acceptable - geralmente relacionado a RLS)
    if (error) {
      // Se for erro 406, pode ser que não há registro ou problema de RLS
      if (error.message?.includes('406') || (error as any).status === 406 || (error as any).code === 'PGRST301') {
        console.log('ℹ️ Nenhuma preferência encontrada (406), será criada quando necessário')
        return { preferencias: null, error: null }
      }
      console.error('❌ Erro ao buscar preferências:', error)
      return { preferencias: null, error }
    }

    // Se não encontrou, retorna null (será criado quando necessário)
    if (!data || data.length === 0) {
      return { preferencias: null, error: null }
    }

    // Retorna o primeiro registro encontrado
    return {
      preferencias: data[0] as PreferenciasNotificacoes,
      error: null,
    }

    return {
      preferencias: data as PreferenciasNotificacoes,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar preferências:', error)
    return {
      preferencias: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar preferências'),
    }
  }
}

/**
 * Atualiza preferências de notificações
 */
export async function atualizarPreferenciasNotificacoes(
  preferencias: Partial<PreferenciasNotificacoes>
): Promise<{ error: Error | null }> {
  try {
    const session = await obterSessao()
    if (!session?.user) {
      return { error: new Error('Usuário não autenticado') }
    }

    // Verifica se já existe
    const { data: existente, error: checkError } = await supabase
      .from('preferencias_notificacoes')
      .select('id')
      .eq('usuario_id', session.user.id)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Erro ao verificar preferências existentes:', checkError)
      return { error: checkError }
    }

    if (existente) {
      // Atualiza
      const { error } = await supabase
        .from('preferencias_notificacoes')
        .update({
          ...preferencias,
          atualizado_em: new Date().toISOString(),
        })
        .eq('usuario_id', session.user.id)

      if (error) {
        console.error('❌ Erro ao atualizar preferências:', error)
        return { error }
      }
    } else {
      // Cria
      const { error } = await supabase
        .from('preferencias_notificacoes')
        .insert({
          usuario_id: session.user.id,
          ...preferencias,
        })

      if (error) {
        console.error('❌ Erro ao criar preferências:', error)
        return { error }
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar preferências:', error)
    return { error: error instanceof Error ? error : new Error('Erro ao atualizar preferências') }
  }
}

/**
 * Toca som de notificação (som mais agradável e audível)
 */
export function tocarSomNotificacao(): void {
  try {
    console.log('🔊 Iniciando reprodução de som...')
    
    // Tenta usar Audio element primeiro (mais compatível)
    try {
      // Cria um som usando Web Audio API de forma mais simples
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Resolve o contexto se estiver suspenso (requer interação do usuário)
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('✅ AudioContext resumido')
        }).catch((err) => {
          console.warn('⚠️ Erro ao resumir AudioContext:', err)
        })
      }
      
      const now = audioContext.currentTime
      
      // Primeira nota (mais alta e audível)
      const oscillator1 = audioContext.createOscillator()
      const gainNode1 = audioContext.createGain()
      oscillator1.connect(gainNode1)
      gainNode1.connect(audioContext.destination)
      
      oscillator1.frequency.value = 800
      oscillator1.type = 'sine'
      
      gainNode1.gain.setValueAtTime(0, now)
      gainNode1.gain.linearRampToValueAtTime(0.5, now + 0.05) // Volume maior
      gainNode1.gain.linearRampToValueAtTime(0, now + 0.25)
      
      oscillator1.start(now)
      oscillator1.stop(now + 0.25)
      
      // Segunda nota (mais baixa)
      const oscillator2 = audioContext.createOscillator()
      const gainNode2 = audioContext.createGain()
      oscillator2.connect(gainNode2)
      gainNode2.connect(audioContext.destination)
      
      oscillator2.frequency.value = 600
      oscillator2.type = 'sine'
      
      gainNode2.gain.setValueAtTime(0, now + 0.2)
      gainNode2.gain.linearRampToValueAtTime(0.5, now + 0.25)
      gainNode2.gain.linearRampToValueAtTime(0, now + 0.4)
      
      oscillator2.start(now + 0.2)
      oscillator2.stop(now + 0.4)
      
      console.log('✅ Som de notificação iniciado')
    } catch (webAudioError) {
      console.warn('⚠️ Erro com Web Audio API, tentando fallback:', webAudioError)
      // Fallback: usa elemento Audio HTML5
      const audio = new Audio()
      // Cria um som simples usando data URI
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.3)
      
      console.log('✅ Som de notificação (fallback) iniciado')
    }
  } catch (error) {
    console.error('❌ Erro ao tocar som de notificação:', error)
  }
}

