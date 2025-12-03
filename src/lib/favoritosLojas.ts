import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'

/**
 * Interface de Loja Favorita
 */
export interface LojaFavorita {
  id: string
  cliente_id: string
  revenda_id: string | null
  unidade_id: string | null
  criado_em: string
  // Dados da unidade (join) - prioridade sobre revenda
  unidade?: {
    id: string
    nome: string
    nome_publico: string | null
    descricao_loja: string | null
    logo_url: string | null
    link_publico: string | null
    revenda_id: string
  }
  // Dados da revenda (join) - apenas se não houver unidade
  revenda?: {
    id: string
    nome_revenda: string
    nome_publico: string | null
    descricao_loja: string | null
    logo_url: string | null
    link_publico: string | null
  }
}

/**
 * Verifica se uma loja/unidade está nos favoritos do cliente
 * 
 * @param clienteId ID do cliente
 * @param unidadeId ID da unidade (prioridade)
 * @param revendaId ID da revenda (fallback, apenas se unidadeId não fornecido)
 * @returns true se favoritada, false caso contrário
 */
export async function verificarLojaFavorita(
  clienteId: string,
  unidadeId?: string | null,
  revendaId?: string | null
): Promise<{ favoritada: boolean; error: Error | null }> {
  try {
    let query = supabase
      .from('lojas_favoritas')
      .select('id')
      .eq('cliente_id', clienteId)

    // Prioriza unidade_id se fornecido
    if (unidadeId) {
      query = query.eq('unidade_id', unidadeId)
    } else if (revendaId) {
      // Fallback para revenda_id se unidade_id não fornecido
      query = query.eq('revenda_id', revendaId).is('unidade_id', null)
    } else {
      return {
        favoritada: false,
        error: new Error('unidadeId ou revendaId deve ser fornecido'),
      }
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error('❌ Erro ao verificar loja favorita:', error)
      return {
        favoritada: false,
        error,
      }
    }

    return {
      favoritada: !!data,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao verificar loja favorita:', error)
    return {
      favoritada: false,
      error: error instanceof Error ? error : new Error('Erro ao verificar favorito'),
    }
  }
}

/**
 * Adiciona uma loja/unidade aos favoritos do cliente
 * 
 * @param clienteId ID do cliente
 * @param unidadeId ID da unidade (prioridade)
 * @param revendaId ID da revenda (fallback, apenas se unidadeId não fornecido)
 * @returns Sucesso ou erro
 */
export async function adicionarLojaFavorita(
  clienteId: string,
  unidadeId?: string | null,
  revendaId?: string | null
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    // Verifica se já está favoritada
    const { favoritada } = await verificarLojaFavorita(clienteId, unidadeId, revendaId)
    
    if (favoritada) {
      return {
        error: new Error('Loja já está nos favoritos'),
        mensagem: 'Esta loja já está nos seus favoritos.',
      }
    }

    // Prioriza unidade_id se fornecido
    let dadosInsert: { cliente_id: string; unidade_id?: string | null; revenda_id?: string | null } = {
      cliente_id: clienteId,
    }

    if (unidadeId) {
      // Se tem unidade_id, revenda_id deve ser NULL
      dadosInsert.unidade_id = unidadeId
      dadosInsert.revenda_id = null
    } else if (revendaId) {
      // Se tem revenda_id, unidade_id deve ser NULL
      dadosInsert.revenda_id = revendaId
      dadosInsert.unidade_id = null
    } else {
      return {
        error: new Error('unidadeId ou revendaId deve ser fornecido'),
        mensagem: 'ID da unidade ou revenda deve ser fornecido.',
      }
    }

    console.log('📤 Inserindo favorito:', dadosInsert)

    const { error } = await supabase
      .from('lojas_favoritas')
      .insert(dadosInsert)

    if (error) {
      console.error('❌ Erro ao adicionar loja favorita:', error)
      
      let mensagemErro = traduzirErro(error.message) || 'Erro ao adicionar aos favoritos.'
      
      if (error.message?.includes('relation "lojas_favoritas" does not exist')) {
        mensagemErro = 'Tabela de favoritos não encontrada. Execute a migration no Supabase.'
      } else if (error.message?.includes('new row violates row-level security')) {
        mensagemErro = 'Sem permissão para adicionar favorito. Verifique se você está logado como cliente.'
      }
      
      return {
        error,
        mensagem: mensagemErro,
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao adicionar loja favorita:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao adicionar favorito'),
      mensagem: 'Erro inesperado ao adicionar aos favoritos.',
    }
  }
}

/**
 * Remove uma loja/unidade dos favoritos do cliente
 * 
 * @param clienteId ID do cliente
 * @param unidadeId ID da unidade (prioridade)
 * @param revendaId ID da revenda (fallback, apenas se unidadeId não fornecido)
 * @returns Sucesso ou erro
 */
export async function removerLojaFavorita(
  clienteId: string,
  unidadeId?: string | null,
  revendaId?: string | null
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    let query = supabase
      .from('lojas_favoritas')
      .delete()
      .eq('cliente_id', clienteId)

    // Prioriza unidade_id se fornecido
    if (unidadeId) {
      query = query.eq('unidade_id', unidadeId)
    } else if (revendaId) {
      query = query.eq('revenda_id', revendaId).is('unidade_id', null)
    } else {
      return {
        error: new Error('unidadeId ou revendaId deve ser fornecido'),
        mensagem: 'ID da unidade ou revenda deve ser fornecido.',
      }
    }

    const { error } = await query

    if (error) {
      console.error('❌ Erro ao remover loja favorita:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao remover dos favoritos.',
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao remover loja favorita:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao remover favorito'),
      mensagem: 'Erro inesperado ao remover dos favoritos.',
    }
  }
}

/**
 * Lista todas as lojas favoritas do cliente
 * 
 * @param clienteId ID do cliente
 * @returns Lista de lojas favoritas ou erro
 */
export async function listarLojasFavoritas(
  clienteId: string
): Promise<{ lojas: LojaFavorita[]; error: Error | null }> {
  try {
    // Primeiro busca os favoritos
    const { data: favoritosData, error: favoritosError } = await supabase
      .from('lojas_favoritas')
      .select('id, cliente_id, revenda_id, unidade_id, criado_em')
      .eq('cliente_id', clienteId)
      .order('criado_em', { ascending: false })

    if (favoritosError) {
      console.error('❌ Erro ao listar lojas favoritas:', favoritosError)
      console.error('❌ Detalhes do erro:', {
        message: favoritosError.message,
        details: favoritosError.details,
        hint: favoritosError.hint,
        code: favoritosError.code,
      })
      
      // Log detalhado do erro
      if (favoritosError.message?.includes('relation "lojas_favoritas" does not exist') || 
          favoritosError.code === '42P01') {
        console.error('💡 A tabela lojas_favoritas não existe. Execute a migration no Supabase.')
        console.error('💡 SQL para executar está em: supabase/migrations/017_create_lojas_favoritas_table.sql')
      }
      
      return {
        lojas: [],
        error: favoritosError,
      }
    }

    if (!favoritosData || favoritosData.length === 0) {
      return {
        lojas: [],
        error: null,
      }
    }

    // Separa favoritos por unidade e por revenda
    const unidadesIds = favoritosData
      .map(f => f.unidade_id)
      .filter((id): id is string => id !== null && id !== undefined)
    const revendasIds = favoritosData
      .map(f => f.revenda_id)
      .filter((id): id is string => id !== null && id !== undefined)

    // Busca dados das unidades (prioridade)
    let unidadesData: any[] = []
    if (unidadesIds.length > 0) {
      const { data: unidadesDataResult } = await supabase
        .from('unidades_revenda')
        .select('id, nome, nome_publico, descricao_loja, logo_url, link_publico, revenda_id')
        .in('id', unidadesIds)
      unidadesData = unidadesDataResult || []
    }

    // Busca dados das revendas (fallback)
    let revendasData: any[] = []
    if (revendasIds.length > 0) {
      const { data: revendasDataResult } = await supabase
        .from('revendas')
        .select('id, nome_revenda, nome_publico, descricao_loja, logo_url, link_publico')
        .in('id', revendasIds)
      revendasData = revendasDataResult || []
    }

    // Cria mapas para lookup rápido
    const unidadesMap = new Map(
      unidadesData.map((unidade) => [unidade.id, unidade])
    )
    const revendasMap = new Map(
      revendasData.map((revenda) => [revenda.id, revenda])
    )

    // Processa os dados combinando favoritos com unidades/revendas
    const lojasProcessadas: LojaFavorita[] = favoritosData.map((item) => {
      // Prioriza unidade se disponível
      if (item.unidade_id) {
        const unidade = unidadesMap.get(item.unidade_id)
        return {
          id: item.id,
          cliente_id: item.cliente_id,
          revenda_id: item.revenda_id,
          unidade_id: item.unidade_id,
          criado_em: item.criado_em,
          unidade: unidade ? {
            id: unidade.id,
            nome: unidade.nome,
            nome_publico: unidade.nome_publico,
            descricao_loja: unidade.descricao_loja,
            logo_url: unidade.logo_url,
            link_publico: unidade.link_publico,
            revenda_id: unidade.revenda_id,
          } : undefined,
        }
      } else if (item.revenda_id) {
        // Fallback para revenda
        const revenda = revendasMap.get(item.revenda_id)
        return {
          id: item.id,
          cliente_id: item.cliente_id,
          revenda_id: item.revenda_id,
          unidade_id: null,
          criado_em: item.criado_em,
          revenda: revenda ? {
            id: revenda.id,
            nome_revenda: revenda.nome_revenda,
            nome_publico: revenda.nome_publico,
            descricao_loja: revenda.descricao_loja,
            logo_url: revenda.logo_url,
            link_publico: revenda.link_publico,
          } : undefined,
        }
      }
      
      // Caso sem unidade nem revenda (não deveria acontecer)
      return {
        id: item.id,
        cliente_id: item.cliente_id,
        revenda_id: item.revenda_id,
        unidade_id: item.unidade_id,
        criado_em: item.criado_em,
      }
    })

    return {
      lojas: lojasProcessadas,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar lojas favoritas:', error)
    return {
      lojas: [],
      error: error instanceof Error ? error : new Error('Erro ao listar favoritos'),
    }
  }
}

/**
 * Alterna status de favorito (adiciona se não está, remove se está)
 * 
 * @param clienteId ID do cliente
 * @param unidadeId ID da unidade (prioridade)
 * @param revendaId ID da revenda (fallback, apenas se unidadeId não fornecido)
 * @returns Novo status e erro
 */
export async function toggleLojaFavorita(
  clienteId: string,
  unidadeId?: string | null,
  revendaId?: string | null
): Promise<{ favoritada: boolean; error: Error | null; mensagem?: string }> {
  try {
    const { favoritada } = await verificarLojaFavorita(clienteId, unidadeId, revendaId)
    
    if (favoritada) {
      const { error } = await removerLojaFavorita(clienteId, unidadeId, revendaId)
      return {
        favoritada: false,
        error,
        mensagem: error ? undefined : 'Loja removida dos favoritos.',
      }
    } else {
      const { error } = await adicionarLojaFavorita(clienteId, unidadeId, revendaId)
      return {
        favoritada: true,
        error,
        mensagem: error ? undefined : 'Loja adicionada aos favoritos.',
      }
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao alternar favorito:', error)
    return {
      favoritada: false,
      error: error instanceof Error ? error : new Error('Erro ao alternar favorito'),
      mensagem: 'Erro inesperado ao alternar favorito.',
    }
  }
}

/**
 * Interface para favoritos com dados do cliente
 */
export interface FavoritoComCliente {
  id: string
  cliente_id: string
  revenda_id: string
  criado_em: string
  cliente?: {
    id: string
    email: string
    nome_completo: string | null
    display_name: string | null
  }
  revenda?: {
    id: string
    nome_revenda: string
    nome_publico: string | null
    descricao_loja: string | null
    logo_url: string | null
  }
}

/**
 * Lista todos os favoritos de clientes, opcionalmente filtrados por revenda
 * Usado no Admin para visualizar favoritos dos clientes
 * 
 * @param revendaId ID da revenda (opcional, filtra favoritos desta revenda)
 * @returns Lista de favoritos com dados do cliente e revenda
 */
export async function listarFavoritosAdmin(
  revendaId?: string
): Promise<{ favoritos: FavoritoComCliente[]; error: Error | null }> {
  try {
    let query = supabase
      .from('lojas_favoritas')
      .select('id, cliente_id, revenda_id, criado_em')
      .order('criado_em', { ascending: false })

    // Se revendaId for fornecido, filtra por essa revenda
    if (revendaId) {
      query = query.eq('revenda_id', revendaId)
    }

    const { data: favoritosData, error: favoritosError } = await query

    if (favoritosError) {
      console.error('❌ Erro ao listar favoritos admin:', favoritosError)
      return {
        favoritos: [],
        error: favoritosError,
      }
    }

    if (!favoritosData || favoritosData.length === 0) {
      return {
        favoritos: [],
        error: null,
      }
    }

    // Busca dados dos clientes
    const clienteIds = [...new Set(favoritosData.map(f => f.cliente_id))]
    const { data: clientesData } = await supabase
      .from('usuarios')
      .select('id, email, nome_completo, display_name')
      .in('id', clienteIds)

    // Busca dados das revendas
    const revendaIds = [...new Set(favoritosData.map(f => f.revenda_id))]
    const { data: revendasData } = await supabase
      .from('revendas')
      .select('id, nome_revenda, nome_publico, descricao_loja, logo_url')
      .in('id', revendaIds)

    // Cria mapas para lookup rápido
    const clientesMap = new Map(
      (clientesData || []).map((cliente) => [cliente.id, cliente])
    )
    const revendasMap = new Map(
      (revendasData || []).map((revenda) => [revenda.id, revenda])
    )

    // Processa os dados combinando favoritos com clientes e revendas
    const favoritosProcessados: FavoritoComCliente[] = favoritosData.map((item) => {
      const cliente = clientesMap.get(item.cliente_id)
      const revenda = revendasMap.get(item.revenda_id)
      
      return {
        id: item.id,
        cliente_id: item.cliente_id,
        revenda_id: item.revenda_id,
        criado_em: item.criado_em,
        cliente: cliente ? {
          id: cliente.id,
          email: cliente.email,
          nome_completo: cliente.nome_completo,
          display_name: cliente.display_name,
        } : undefined,
        revenda: revenda ? {
          id: revenda.id,
          nome_revenda: revenda.nome_revenda,
          nome_publico: revenda.nome_publico,
          descricao_loja: revenda.descricao_loja,
          logo_url: revenda.logo_url,
        } : undefined,
      }
    })

    return {
      favoritos: favoritosProcessados,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar favoritos admin:', error)
    return {
      favoritos: [],
      error: error instanceof Error ? error : new Error('Erro ao listar favoritos'),
    }
  }
}

