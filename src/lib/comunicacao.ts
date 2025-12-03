import { supabase } from './supabase'

export interface NotificacaoPush {
  id: string
  titulo: string
  descricao: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
  criado_por: string | null
  desativado_em: string | null
  exibir_para_revendas: boolean
  exibir_para_clientes: boolean
  exibir_para_colaboradores: boolean
  data_inicio: string | null
  data_fim: string | null
}

export interface BannerAlerta {
  id: string
  titulo: string
  descricao: string
  cor_bg: string
  cor_texto: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
  criado_por: string | null
  desativado_em: string | null
  exibir_para_revendas: boolean
  exibir_para_clientes: boolean
  exibir_para_colaboradores: boolean
  data_inicio: string | null
  data_fim: string | null
}

export interface CriarNotificacaoPushData {
  titulo: string
  descricao: string
  exibir_para_revendas: boolean
  exibir_para_clientes: boolean
  exibir_para_colaboradores: boolean
  data_inicio?: string | null
  data_fim?: string | null
}

export interface CriarBannerAlertaData {
  titulo: string
  descricao: string
  cor_bg: string
  cor_texto: string
  exibir_para_revendas: boolean
  exibir_para_clientes: boolean
  exibir_para_colaboradores: boolean
  data_inicio?: string | null
  data_fim?: string | null
}

/**
 * Lista todas as notificações push (admin)
 */
export async function listarNotificacoesPush(): Promise<{
  notificacoes: NotificacaoPush[]
  error: Error | null
}> {
  try {
    const { data, error } = await supabase
      .from('notificacoes_push')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('❌ Erro ao listar notificações push:', error)
      return { notificacoes: [], error }
    }

    return { notificacoes: data || [], error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar notificações push:', error)
    return {
      notificacoes: [],
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

/**
 * Lista notificações push ativas para o usuário atual
 */
export async function listarNotificacoesPushAtivas(): Promise<{
  notificacoes: NotificacaoPush[]
  error: Error | null
}> {
  try {
    const { data, error } = await supabase
      .from('notificacoes_push')
      .select('*')
      .eq('ativo', true)
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('❌ Erro ao listar notificações push ativas:', error)
      return { notificacoes: [], error }
    }

    // Filtrar por data e público-alvo (já filtrado pelo RLS, mas garantindo)
    const agora = new Date()
    const notificacoesFiltradas = (data || []).filter((notif) => {
      if (notif.data_inicio && new Date(notif.data_inicio) > agora) return false
      if (notif.data_fim && new Date(notif.data_fim) < agora) return false
      return true
    })

    return { notificacoes: notificacoesFiltradas, error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar notificações push ativas:', error)
    return {
      notificacoes: [],
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

/**
 * Cria uma nova notificação push
 */
export async function criarNotificacaoPush(
  dados: CriarNotificacaoPushData
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: new Error('Usuário não autenticado'),
      }
    }

    const { error } = await supabase.from('notificacoes_push').insert({
      titulo: dados.titulo,
      descricao: dados.descricao,
      exibir_para_revendas: dados.exibir_para_revendas,
      exibir_para_clientes: dados.exibir_para_clientes,
      exibir_para_colaboradores: dados.exibir_para_colaboradores,
      data_inicio: dados.data_inicio || null,
      data_fim: dados.data_fim || null,
      criado_por: user.id,
    })

    if (error) {
      console.error('❌ Erro ao criar notificação push:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao criar notificação push:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

/**
 * Atualiza uma notificação push
 */
export async function atualizarNotificacaoPush(
  id: string,
  dados: Partial<CriarNotificacaoPushData> & { ativo?: boolean }
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const updateData: any = {}
    if (dados.titulo !== undefined) updateData.titulo = dados.titulo
    if (dados.descricao !== undefined) updateData.descricao = dados.descricao
    if (dados.exibir_para_revendas !== undefined)
      updateData.exibir_para_revendas = dados.exibir_para_revendas
    if (dados.exibir_para_clientes !== undefined)
      updateData.exibir_para_clientes = dados.exibir_para_clientes
    if (dados.exibir_para_colaboradores !== undefined)
      updateData.exibir_para_colaboradores = dados.exibir_para_colaboradores
    if (dados.data_inicio !== undefined) updateData.data_inicio = dados.data_inicio
    if (dados.data_fim !== undefined) updateData.data_fim = dados.data_fim
    if (dados.ativo !== undefined) {
      updateData.ativo = dados.ativo
      if (!dados.ativo) {
        updateData.desativado_em = new Date().toISOString()
      } else {
        updateData.desativado_em = null
      }
    }

    const { error } = await supabase
      .from('notificacoes_push')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('❌ Erro ao atualizar notificação push:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar notificação push:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

/**
 * Remove uma notificação push
 */
export async function removerNotificacaoPush(
  id: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.from('notificacoes_push').delete().eq('id', id)

    if (error) {
      console.error('❌ Erro ao remover notificação push:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao remover notificação push:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

/**
 * Lista todos os banners de alerta (admin)
 */
export async function listarBannersAlerta(): Promise<{
  banners: BannerAlerta[]
  error: Error | null
}> {
  try {
    const { data, error } = await supabase
      .from('banners_alerta')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('❌ Erro ao listar banners de alerta:', error)
      return { banners: [], error }
    }

    return { banners: data || [], error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar banners de alerta:', error)
    return {
      banners: [],
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

/**
 * Lista banners de alerta ativos para o usuário atual
 */
export async function listarBannersAlertaAtivos(): Promise<{
  banners: BannerAlerta[]
  error: Error | null
}> {
  try {
    const { data, error } = await supabase
      .from('banners_alerta')
      .select('*')
      .eq('ativo', true)
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('❌ Erro ao listar banners de alerta ativos:', error)
      return { banners: [], error }
    }

    // Filtrar por data (já filtrado pelo RLS, mas garantindo)
    const agora = new Date()
    const bannersFiltrados = (data || []).filter((banner) => {
      if (banner.data_inicio && new Date(banner.data_inicio) > agora) return false
      if (banner.data_fim && new Date(banner.data_fim) < agora) return false
      return true
    })

    return { banners: bannersFiltrados, error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar banners de alerta ativos:', error)
    return {
      banners: [],
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

/**
 * Cria um novo banner de alerta
 */
export async function criarBannerAlerta(
  dados: CriarBannerAlertaData
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: new Error('Usuário não autenticado'),
      }
    }

    const { error } = await supabase.from('banners_alerta').insert({
      titulo: dados.titulo,
      descricao: dados.descricao,
      cor_bg: dados.cor_bg,
      cor_texto: dados.cor_texto,
      exibir_para_revendas: dados.exibir_para_revendas,
      exibir_para_clientes: dados.exibir_para_clientes,
      exibir_para_colaboradores: dados.exibir_para_colaboradores,
      data_inicio: dados.data_inicio || null,
      data_fim: dados.data_fim || null,
      criado_por: user.id,
    })

    if (error) {
      console.error('❌ Erro ao criar banner de alerta:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao criar banner de alerta:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

/**
 * Atualiza um banner de alerta
 */
export async function atualizarBannerAlerta(
  id: string,
  dados: Partial<CriarBannerAlertaData> & { ativo?: boolean }
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const updateData: any = {}
    if (dados.titulo !== undefined) updateData.titulo = dados.titulo
    if (dados.descricao !== undefined) updateData.descricao = dados.descricao
    if (dados.cor_bg !== undefined) updateData.cor_bg = dados.cor_bg
    if (dados.cor_texto !== undefined) updateData.cor_texto = dados.cor_texto
    if (dados.exibir_para_revendas !== undefined)
      updateData.exibir_para_revendas = dados.exibir_para_revendas
    if (dados.exibir_para_clientes !== undefined)
      updateData.exibir_para_clientes = dados.exibir_para_clientes
    if (dados.exibir_para_colaboradores !== undefined)
      updateData.exibir_para_colaboradores = dados.exibir_para_colaboradores
    if (dados.data_inicio !== undefined) updateData.data_inicio = dados.data_inicio
    if (dados.data_fim !== undefined) updateData.data_fim = dados.data_fim
    if (dados.ativo !== undefined) {
      updateData.ativo = dados.ativo
      if (!dados.ativo) {
        updateData.desativado_em = new Date().toISOString()
      } else {
        updateData.desativado_em = null
      }
    }

    const { error } = await supabase
      .from('banners_alerta')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('❌ Erro ao atualizar banner de alerta:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar banner de alerta:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

/**
 * Remove um banner de alerta
 */
export async function removerBannerAlerta(
  id: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.from('banners_alerta').delete().eq('id', id)

    if (error) {
      console.error('❌ Erro ao remover banner de alerta:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao remover banner de alerta:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

/**
 * Função auxiliar para verificar se um banner foi fechado pelo usuário
 * (armazenamento local - 1 hora)
 */
export function bannerFechado(bannerId: string): boolean {
  try {
    const fechados = localStorage.getItem('banners_fechados')
    if (!fechados) return false

    const fechadosObj = JSON.parse(fechados)
    const fechadoEm = fechadosObj[bannerId]

    if (!fechadoEm) return false

    // Verificar se passou 1 hora (3600000 ms)
    const umaHora = 60 * 60 * 1000
    const agora = Date.now()
    const tempoDecorrido = agora - fechadoEm

    // Se passou mais de 1 hora, pode mostrar novamente
    if (tempoDecorrido > umaHora) {
      // Remover do localStorage
      delete fechadosObj[bannerId]
      localStorage.setItem('banners_fechados', JSON.stringify(fechadosObj))
      return false
    }

    return true
  } catch (error) {
    console.error('❌ Erro ao verificar banner fechado:', error)
    return false
  }
}

/**
 * Marca um banner como fechado pelo usuário
 */
export function fecharBanner(bannerId: string): void {
  try {
    const fechados = localStorage.getItem('banners_fechados')
    const fechadosObj = fechados ? JSON.parse(fechados) : {}

    fechadosObj[bannerId] = Date.now()
    localStorage.setItem('banners_fechados', JSON.stringify(fechadosObj))
  } catch (error) {
    console.error('❌ Erro ao fechar banner:', error)
  }
}















