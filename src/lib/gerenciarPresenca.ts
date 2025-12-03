import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'
import { validarLinkPublico, gerarSlug } from './lojaPublica'

/**
 * Dados de presença na loja
 */
export interface DadosPresenca {
  link_publico?: string | null
  nome_publico?: string | null
  descricao_loja?: string | null
  logo_url?: string | null
  link_publico_ativo?: boolean
  taxa_entrega?: number | null
  oferecer_entrega?: boolean
  oferecer_retirada_local?: boolean
  oferecer_agendamento?: boolean
}

/**
 * Valida se um link público é único (não está sendo usado por outra revenda)
 * 
 * @param linkPublico Link a validar
 * @param revendaId ID da revenda atual (para excluir da verificação)
 * @returns true se único, false caso contrário
 */
export async function validarLinkUnico(
  linkPublico: string | null,
  revendaId: string
): Promise<{ unico: boolean; mensagem?: string }> {
  try {
    // Se link for null ou vazio, é válido (opcional)
    if (!linkPublico || linkPublico.trim().length === 0) {
      return { unico: true }
    }

    // Valida formato
    if (!validarLinkPublico(linkPublico)) {
      return {
        unico: false,
        mensagem: 'Link público inválido. Use apenas letras minúsculas, números e hífens (3-50 caracteres).',
      }
    }

    // Verifica se já existe outra revenda com o mesmo link
    const { data, error } = await supabase
      .from('revendas')
      .select('id')
      .eq('link_publico', linkPublico)
      .neq('id', revendaId)
      .maybeSingle()

    if (error) {
      console.error('❌ Erro ao validar link único:', error)
      // Mensagem mais específica
      let mensagemErro = 'Erro ao validar link público. Tente novamente.'
      
      if (error.message?.includes('relation "revendas" does not exist')) {
        mensagemErro = 'Tabela de revendas não encontrada. Verifique as migrations.'
      } else if (error.message?.includes('column "link_publico" does not exist')) {
        mensagemErro = 'Campo link_publico não encontrado. Execute a migration 016 no Supabase.'
      }
      
      return {
        unico: false,
        mensagem: mensagemErro,
      }
    }

    if (data) {
      return {
        unico: false,
        mensagem: 'Este link público já está sendo usado por outra revenda.',
      }
    }

    return { unico: true }
  } catch (error) {
    console.error('❌ Erro inesperado ao validar link único:', error)
    return {
      unico: false,
      mensagem: 'Erro inesperado ao validar link público.',
    }
  }
}

/**
 * Atualiza dados de presença na loja de uma revenda
 * 
 * @param revendaId ID da revenda
 * @param dados Dados de presença
 * @returns Sucesso ou erro
 */
export async function atualizarPresencaRevenda(
  revendaId: string,
  dados: DadosPresenca
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    // Valida link público se fornecido
    if (dados.link_publico !== undefined && dados.link_publico !== null) {
      const validacao = await validarLinkUnico(dados.link_publico, revendaId)
      if (!validacao.unico) {
        return {
          error: new Error('Link público inválido ou já em uso'),
          mensagem: validacao.mensagem || 'Link público inválido ou já em uso.',
        }
      }
    }

    const updateData: any = {}

    if (dados.link_publico !== undefined) {
      // Se for string vazia, define como null
      updateData.link_publico = dados.link_publico && dados.link_publico.trim().length > 0
        ? dados.link_publico.trim()
        : null
    }

    if (dados.nome_publico !== undefined) {
      updateData.nome_publico = dados.nome_publico && dados.nome_publico.trim().length > 0
        ? dados.nome_publico.trim()
        : null
    }

    if (dados.logo_url !== undefined) {
      updateData.logo_url = dados.logo_url || null
    }

    if (dados.descricao_loja !== undefined) {
      updateData.descricao_loja = dados.descricao_loja && dados.descricao_loja.trim().length > 0
        ? dados.descricao_loja.trim()
        : null
    }

    if (dados.link_publico_ativo !== undefined) {
      updateData.link_publico_ativo = dados.link_publico_ativo
    }

    if (dados.taxa_entrega !== undefined) {
      updateData.taxa_entrega = dados.taxa_entrega !== null ? Number(dados.taxa_entrega) : 0.00
    }

    if (dados.oferecer_entrega !== undefined) {
      updateData.oferecer_entrega = dados.oferecer_entrega
    }

    if (dados.oferecer_retirada_local !== undefined) {
      updateData.oferecer_retirada_local = dados.oferecer_retirada_local
    }

    if (dados.oferecer_agendamento !== undefined) {
      updateData.oferecer_agendamento = dados.oferecer_agendamento
    }

    const { error } = await supabase
      .from('revendas')
      .update(updateData)
      .eq('id', revendaId)

    if (error) {
      console.error('❌ Erro ao atualizar presença:', error)
      // Mensagem mais específica
      let mensagemErro = traduzirErro(error.message) || 'Erro ao atualizar presença na loja.'
      
      if (error.message?.includes('column "link_publico" does not exist') || 
          error.message?.includes('column "nome_publico" does not exist') ||
          error.message?.includes('column "logo_url" does not exist')) {
        mensagemErro = 'Campos de presença não encontrados. Execute a migration 016 no Supabase.'
      } else if (error.message?.includes('new row violates row-level security')) {
        mensagemErro = 'Sem permissão para atualizar. Verifique se você está logado como revenda.'
      } else if (error.message?.includes('unique constraint')) {
        mensagemErro = 'Este link público já está sendo usado por outra revenda.'
      }
      
      return {
        error,
        mensagem: mensagemErro,
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar presença:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao atualizar presença'),
      mensagem: 'Erro inesperado ao atualizar presença na loja.',
    }
  }
}

/**
 * Sugere um link público baseado no nome da revenda
 * 
 * @param nomeRevenda Nome da revenda
 * @returns Slug sugerido
 */
export function sugerirLinkPublico(nomeRevenda: string): string {
  return gerarSlug(nomeRevenda)
}

/**
 * Busca dados de presença de uma revenda
 * 
 * @param revendaId ID da revenda
 * @returns Dados de presença ou erro
 */
export async function buscarPresencaRevenda(
  revendaId: string
): Promise<{ presenca: DadosPresenca | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('revendas')
      .select('link_publico, nome_publico, descricao_loja, logo_url, link_publico_ativo, taxa_entrega, oferecer_entrega, oferecer_retirada_local, oferecer_agendamento')
      .eq('id', revendaId)
      .single()

    if (error) {
      console.error('❌ Erro ao buscar presença:', error)
      return {
        presenca: null,
        error,
      }
    }

    return {
      presenca: {
        link_publico: data?.link_publico || null,
        nome_publico: data?.nome_publico || null,
        descricao_loja: data?.descricao_loja || null,
        logo_url: data?.logo_url || null,
        link_publico_ativo: data?.link_publico_ativo ?? true,
        taxa_entrega: data?.taxa_entrega ?? 0.00,
        oferecer_entrega: data?.oferecer_entrega ?? true,
        oferecer_retirada_local: data?.oferecer_retirada_local ?? true,
        oferecer_agendamento: data?.oferecer_agendamento ?? true,
      },
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar presença:', error)
    return {
      presenca: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar presença'),
    }
  }
}

