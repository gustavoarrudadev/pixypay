import { createClient } from '@supabase/supabase-js'
import type { Produto } from './gerenciarProduto'
import { verificarStatusAgendamentos } from './gerenciarAgendamentos'
import type { UnidadeRevenda } from './gerenciarUnidades'

// Cliente Supabase público (sem autenticação) para acesso à loja pública
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

// Cliente público sem autenticação para acesso à loja pública
const supabasePublico = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

/**
 * Interface de dados públicos da revenda (para loja pública)
 */
export interface RevendaPublica {
  id: string
  nome_revenda: string
  nome_publico: string | null
  descricao_loja: string | null
  logo_url: string | null
  link_publico: string | null
}

/**
 * Valida formato de link público (slug)
 * 
 * @param link Link a validar
 * @returns true se válido, false caso contrário
 */
export function validarLinkPublico(link: string): boolean {
  // Apenas letras minúsculas, números e hífens
  // Mínimo 3 caracteres, máximo 50
  const regex = /^[a-z0-9-]{3,50}$/
  return regex.test(link)
}

/**
 * Gera slug a partir de um nome
 * 
 * @param nome Nome a converter
 * @returns Slug válido
 */
export function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
    .replace(/^-+|-+$/g, '') // Remove hífens do início e fim
    .substring(0, 50) // Limita tamanho
}

/**
 * Busca dados básicos de uma revenda mesmo quando desativada
 * Usado para exibir página de indisponível com logo e nome
 * 
 * @param linkPublico Link público da revenda
 * @returns Dados básicos da revenda ou null se não encontrada
 */
export async function buscarRevendaDesativada(
  linkPublico: string
): Promise<{ id: string; nome_revenda: string; nome_publico: string | null; logo_url: string | null } | null> {
  try {
    if (!validarLinkPublico(linkPublico)) {
      return null
    }

    const { data, error } = await supabasePublico
      .rpc('buscar_revenda_publica_desativada', { p_link_publico: linkPublico })

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      return null
    }

    const revendaData = data[0]
    return {
      id: revendaData.id,
      nome_revenda: revendaData.nome_revenda,
      nome_publico: revendaData.nome_publico,
      logo_url: revendaData.logo_url,
    }
  } catch (error) {
    console.error('❌ Erro ao buscar revenda desativada:', error)
    return null
  }
}

/**
 * Busca revenda por link público
 * 
 * @deprecated Links públicos de revendas foram desativados. Use buscarUnidadePorLink.
 * @param linkPublico Link público da revenda
 * @returns Dados públicos da revenda ou erro (sempre retorna erro pois links de revenda foram desativados)
 */
export async function buscarRevendaPorLink(
  linkPublico: string
): Promise<{ revenda: RevendaPublica | null; error: Error | null }> {
  // Links públicos de revendas foram desativados - apenas unidades têm links públicos agora
  console.warn('⚠️ Tentativa de buscar revenda por link público. Links de revendas foram desativados. Use links de unidades.')
  return {
    revenda: null,
    error: new Error('Links públicos de revendas foram desativados. Use o link da unidade específica.'),
  }
  try {
    if (!validarLinkPublico(linkPublico)) {
      return {
        revenda: null,
        error: new Error('Link público inválido'),
      }
    }

    // Usa função RPC para buscar revenda pública (bypassa RLS de forma segura)
    const { data, error } = await supabasePublico
      .rpc('buscar_revenda_publica', { p_link_publico: linkPublico })

    if (error) {
      console.error('❌ Erro ao buscar revenda por link:', error)
      console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2))
      return {
        revenda: null,
        error,
      }
    }

    // A função RPC retorna um array, pega o primeiro resultado
    const revendaData = Array.isArray(data) && data.length > 0 ? data[0] : null

    if (!revendaData) {
      console.warn('⚠️ Revenda não encontrada para link:', linkPublico)
      return {
        revenda: null,
        error: new Error('Revenda não encontrada'),
      }
    }

    // Log para debug
    console.log('🔍 Dados da revenda encontrada:', {
      id: revendaData.id,
      link_publico: revendaData.link_publico,
      link_publico_ativo: revendaData.link_publico_ativo,
      tipo: typeof revendaData.link_publico_ativo,
    })

    // Verifica se link_publico_ativo está false (desativado manualmente)
    if (revendaData.link_publico_ativo === false) {
      console.log('🚫 Loja desativada manualmente para link:', linkPublico)
      return {
        revenda: null,
        error: new Error('LOJA_INDISPONIVEL'),
      }
    }

    // Verifica agendamentos para ver se há algum que deve desativar a loja agora
    // Se link_publico_ativo for true mas houver agendamento que indica desativação no momento,
    // a loja deve estar indisponível
    try {
      const { deveEstarAtiva } = await verificarStatusAgendamentos(revendaData.id)
      
      if (!deveEstarAtiva && revendaData.link_publico_ativo === true) {
        // Loja está configurada como ativa, mas agendamento indica que deve estar desativada agora
        console.log('🚫 Loja desativada por agendamento para link:', linkPublico)
        return {
          revenda: null,
          error: new Error('LOJA_INDISPONIVEL'),
        }
      }
    } catch (error) {
      // Se houver erro ao verificar agendamentos, ignora e continua com o status manual
      console.warn('⚠️ Erro ao verificar agendamentos, usando status manual:', error)
    }
    
    console.log('✅ Loja ativa, retornando dados para link:', linkPublico)

    return {
      revenda: {
        id: revendaData.id,
        nome_revenda: revendaData.nome_revenda,
        nome_publico: revendaData.nome_publico,
        descricao_loja: revendaData.descricao_loja,
        logo_url: revendaData.logo_url,
        link_publico: revendaData.link_publico,
      },
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar revenda por link:', error)
    return {
      revenda: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar revenda'),
    }
  }
}

/**
 * Busca unidade por link público
 * 
 * @param linkPublico Link público da unidade
 * @returns Dados da unidade ou erro
 */
export async function buscarUnidadePorLink(
  linkPublico: string
): Promise<{ unidade: UnidadeRevenda | null; error: Error | null }> {
  try {
    console.log('🔍 Buscando unidade por link público:', linkPublico)
    
    if (!validarLinkPublico(linkPublico)) {
      console.log('❌ Link público inválido:', linkPublico)
      return {
        unidade: null,
        error: new Error('Link público inválido'),
      }
    }

    const linkLimpo = linkPublico.toLowerCase().trim()
    
    // Primeiro tenta buscar diretamente na tabela (mesmo método usado para produtos)
    console.log('📤 Buscando unidade diretamente na tabela:', linkLimpo)
    const { data: dataDireto, error: errorDireto } = await supabasePublico
      .from('unidades_revenda')
      .select('*')
      .eq('link_publico', linkLimpo)
      .eq('ativo', true)
      .eq('link_publico_ativo', true)
      .maybeSingle()

    console.log('📊 Resultado busca direta:', { 
      dataDireto, 
      errorDireto,
      hasData: !!dataDireto,
      hasId: dataDireto?.id
    })

    if (!errorDireto && dataDireto && dataDireto.id) {
      console.log('✅ Unidade encontrada diretamente:', dataDireto.id, dataDireto.nome)
      return {
        unidade: dataDireto as UnidadeRevenda,
        error: null,
      }
    }

    // Se não encontrou, tenta via RPC como fallback
    console.log('🔄 Tentando busca via RPC como fallback...')
    const { data: dataRPC, error: errorRPC } = await supabasePublico.rpc('buscar_unidade_publica', {
      p_link_publico: linkLimpo,
    })

    console.log('📊 Resultado busca RPC:', { 
      dataRPC, 
      errorRPC,
      dataType: typeof dataRPC,
      isArray: Array.isArray(dataRPC),
      dataLength: Array.isArray(dataRPC) ? dataRPC.length : 'N/A'
    })

    if (!errorRPC && dataRPC) {
      // A função RPC pode retornar um array ou um objeto único
      let unidadeData = null
      
      if (Array.isArray(dataRPC)) {
        unidadeData = dataRPC.length > 0 ? dataRPC[0] : null
      } else if (dataRPC && typeof dataRPC === 'object') {
        unidadeData = dataRPC
      }

      if (unidadeData && unidadeData.id) {
        console.log('✅ Unidade encontrada via RPC:', unidadeData.id, unidadeData.nome)
        return {
          unidade: unidadeData as UnidadeRevenda,
          error: null,
        }
      }
    }

    console.log('⚠️ Unidade não encontrada para link:', linkPublico)
    return {
      unidade: null,
      error: new Error('Unidade não encontrada'),
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar unidade por link:', error)
    return {
      unidade: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar unidade'),
    }
  }
}

/**
 * Lista produtos públicos (ativos) de uma unidade ou revenda
 * 
 * @param revendaId ID da revenda
 * @param unidadeId ID da unidade (opcional, se fornecido filtra por unidade)
 * @returns Lista de produtos ativos ou erro
 */
export async function listarProdutosPublicos(
  revendaId: string,
  unidadeId?: string | null
): Promise<{ produtos: Produto[]; error: Error | null }> {
  try {
    console.log('🔍 Listando produtos públicos:', { revendaId, unidadeId })
    
    let query = supabasePublico
      .from('produtos')
      .select('*')
      .eq('revenda_id', revendaId)
      .eq('ativo', true)

    // Se unidadeId for fornecido, filtra por unidade
    if (unidadeId) {
      console.log('📌 Filtrando por unidade:', unidadeId)
      query = query.eq('unidade_id', unidadeId)
    } else {
      console.log('⚠️ Nenhuma unidade fornecida, listando todos os produtos da revenda')
    }

    const { data, error } = await query.order('criado_em', { ascending: false })

    console.log('📦 Resultado listagem produtos:', { 
      produtos: data?.length || 0, 
      error,
      produtosIds: data?.map(p => ({ id: p.id, nome: p.nome, unidade_id: p.unidade_id }))
    })

    if (error) {
      console.error('❌ Erro ao listar produtos públicos:', error)
      console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2))
      return {
        produtos: [],
        error,
      }
    }

    return {
      produtos: data || [],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar produtos públicos:', error)
    return {
      produtos: [],
      error: error instanceof Error ? error : new Error('Erro ao listar produtos'),
    }
  }
}

/**
 * Gera URL completa da loja pública
 * 
 * Sempre usa window.location.origin para acompanhar dinamicamente a URL atual.
 * Isso garante que funciona em qualquer porta/domínio (dev, staging, produção).
 * 
 * @param linkPublico Link público da revenda
 * @returns URL completa baseada na URL atual do navegador
 */
export function gerarUrlLojaPublica(linkPublico: string): string {
  // Sempre usa window.location.origin para acompanhar dinamicamente a URL atual
  // Isso funciona em qualquer ambiente: localhost:5173, localhost:5174, produção, etc.
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (import.meta.env.VITE_APP_URL || '')
  return `${baseUrl}/loja/${linkPublico}`
}

/**
 * Gera URL completa do produto público
 * 
 * @param linkRevenda Link público da revenda
 * @param linkProduto Link público do produto
 * @returns URL completa do produto
 */
export function gerarUrlProdutoPublico(linkRevenda: string, linkProduto: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (import.meta.env.VITE_APP_URL || '')
  return `${baseUrl}/loja/${linkRevenda}/produto/${linkProduto}`
}

/**
 * Busca produto público por link da revenda e link do produto
 * 
 * @param linkRevenda Link público da revenda
 * @param linkProduto Link público do produto
 * @returns Dados do produto ou erro
 */
export async function buscarProdutoPublico(
  linkRevenda: string,
  linkProduto: string
): Promise<{ produto: Produto | null; revenda: RevendaPublica | null; error: Error | null }> {
  try {
    if (!validarLinkPublico(linkRevenda) || !validarLinkPublico(linkProduto)) {
      return {
        produto: null,
        revenda: null,
        error: new Error('Link inválido'),
      }
    }

    console.log('🔍 Buscando produto público:', { linkRevenda, linkProduto })
    
    const { data, error } = await supabasePublico
      .rpc('buscar_produto_publico', { 
        p_link_revenda_ou_unidade: linkRevenda,
        p_link_produto: linkProduto
      })

    console.log('📊 Resultado busca produto:', { data, error })

    if (error) {
      console.error('❌ Erro ao buscar produto público:', error)
      return {
        produto: null,
        revenda: null,
        error,
      }
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        produto: null,
        revenda: null,
        error: new Error('Produto não encontrado'),
      }
    }

    const produtoData = data[0]

    // Se encontrou unidade, usa dados da unidade, senão usa dados da revenda
    const nomeExibicao = produtoData.nome_unidade || produtoData.nome_revenda
    const linkPublicoExibicao = produtoData.link_publico_unidade || produtoData.link_publico_revenda

    console.log('✅ Produto encontrado:', produtoData.id, produtoData.nome, 'Unidade:', produtoData.nome_unidade)

    return {
      produto: {
        id: produtoData.id,
        revenda_id: produtoData.revenda_id,
        unidade_id: produtoData.unidade_id || null,
        nome: produtoData.nome,
        descricao: produtoData.descricao,
        preco: produtoData.preco,
        imagem_url: produtoData.imagem_url,
        ativo: produtoData.ativo,
        link_publico: produtoData.link_publico,
        max_parcelas: produtoData.max_parcelas || 1, // Usa valor do banco ou padrão 1
        dias_segunda_parcela: produtoData.dias_segunda_parcela || null,
        criado_em: produtoData.criado_em || '',
        atualizado_em: produtoData.atualizado_em || '',
      },
      revenda: {
        id: produtoData.revenda_id,
        nome_revenda: produtoData.nome_revenda,
        nome_publico: nomeExibicao,
        descricao_loja: null,
        logo_url: null,
        link_publico: linkPublicoExibicao,
      },
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar produto público:', error)
    return {
      produto: null,
      revenda: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar produto'),
    }
  }
}

