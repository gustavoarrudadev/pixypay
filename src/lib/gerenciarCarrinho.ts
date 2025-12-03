import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'

/**
 * Interface de item do carrinho
 */
export interface ItemCarrinho {
  id: string
  cliente_id: string | null
  sessao_id: string | null
  produto_id: string
  quantidade: number
  criado_em: string
  atualizado_em: string
  produto?: {
    id: string
    nome: string
    descricao: string | null
    preco: number
    imagem_url: string | null
    max_parcelas: number
    dias_segunda_parcela?: number | null
  }
}

/**
 * Dados para adicionar item ao carrinho
 */
export interface DadosItemCarrinho {
  produto_id: string
  quantidade: number
}

/**
 * Gera ou obtém ID de sessão para usuários não autenticados
 */
export function obterSessaoId(): string {
  let sessaoId = sessionStorage.getItem('carrinho_sessao_id')
  if (!sessaoId) {
    sessaoId = `sessao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('carrinho_sessao_id', sessaoId)
  }
  return sessaoId
}

/**
 * Lista itens do carrinho do cliente atual
 */
export async function listarCarrinho(): Promise<{ itens: ItemCarrinho[]; error: Error | null }> {
  try {
    // Obtém o cliente_id considerando modo impersonation
    const { obterClienteUserId } = await import('./impersonation')
    const clienteUserId = await obterClienteUserId()
    
    // Se não está em modo impersonation, usa a sessão atual
    let clienteId = clienteUserId
    if (!clienteId) {
      const { data: session } = await supabase.auth.getSession()
      clienteId = session?.data?.session?.user?.id || null
    }
    
    const sessaoId = clienteId ? null : obterSessaoId()

    let query = supabase
      .from('carrinho')
      .select(`
        *,
        produto:produtos (
          id,
          nome,
          descricao,
          preco,
          imagem_url
        )
      `)
      .order('criado_em', { ascending: false })

    if (clienteId) {
      query = query.eq('cliente_id', clienteId)
    } else if (sessaoId) {
      query = query.eq('sessao_id', sessaoId)
    } else {
      return { itens: [], error: null }
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erro ao listar carrinho:', error)
      return {
        itens: [],
        error,
      }
    }

    return {
      itens: (data || []) as ItemCarrinho[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar carrinho:', error)
    return {
      itens: [],
      error: error instanceof Error ? error : new Error('Erro ao listar carrinho'),
    }
  }
}

/**
 * Adiciona ou atualiza item no carrinho
 */
export async function adicionarAoCarrinho(
  dados: DadosItemCarrinho
): Promise<{ item: ItemCarrinho | null; error: Error | null; mensagem?: string }> {
  try {
    const { data: session } = await supabase.auth.getSession()
    const clienteId = session?.data?.session?.user?.id || null
    const sessaoId = clienteId ? null : obterSessaoId()

    // Verifica se o produto já está no carrinho
    let queryExistente = supabase
      .from('carrinho')
      .select('id, quantidade')

    if (clienteId) {
      queryExistente = queryExistente.eq('cliente_id', clienteId)
    } else {
      queryExistente = queryExistente.eq('sessao_id', sessaoId)
    }

    const { data: existente } = await queryExistente
      .eq('produto_id', dados.produto_id)
      .maybeSingle()

    if (existente) {
      // Atualiza quantidade
      const novaQuantidade = existente.quantidade + dados.quantidade
      const { data, error } = await supabase
        .from('carrinho')
        .update({ quantidade: novaQuantidade })
        .eq('id', existente.id)
        .select(`
          *,
          produto:produtos (
            id,
            nome,
            descricao,
            preco,
            imagem_url
          )
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao atualizar carrinho:', error)
        return {
          item: null,
          error,
          mensagem: traduzirErro(error.message) || 'Erro ao atualizar carrinho',
        }
      }

      return {
        item: data as ItemCarrinho,
        error: null,
      }
    }

    // Insere novo item
    const { data, error } = await supabase
      .from('carrinho')
      .insert({
        cliente_id: clienteId,
        sessao_id: sessaoId,
        produto_id: dados.produto_id,
        quantidade: dados.quantidade,
      })
      .select(`
        *,
        produto:produtos (
          id,
          nome,
          descricao,
          preco,
          imagem_url
        )
      `)
      .single()

    if (error) {
      console.error('❌ Erro ao adicionar ao carrinho:', error)
      return {
        item: null,
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao adicionar ao carrinho',
      }
    }

    return {
      item: data as ItemCarrinho,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao adicionar ao carrinho:', error)
    return {
      item: null,
      error: error instanceof Error ? error : new Error('Erro ao adicionar ao carrinho'),
      mensagem: 'Erro inesperado ao adicionar ao carrinho',
    }
  }
}

/**
 * Atualiza quantidade de um item no carrinho
 */
export async function atualizarQuantidadeCarrinho(
  itemId: string,
  quantidade: number
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    if (quantidade <= 0) {
      return {
        error: new Error('Quantidade deve ser maior que zero'),
        mensagem: 'Quantidade deve ser maior que zero',
      }
    }

    const { error } = await supabase
      .from('carrinho')
      .update({ quantidade })
      .eq('id', itemId)

    if (error) {
      console.error('❌ Erro ao atualizar quantidade:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao atualizar quantidade',
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar quantidade:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao atualizar quantidade'),
      mensagem: 'Erro inesperado ao atualizar quantidade',
    }
  }
}

/**
 * Remove item do carrinho
 */
export async function removerDoCarrinho(
  itemId: string
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    const { error } = await supabase
      .from('carrinho')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('❌ Erro ao remover do carrinho:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao remover do carrinho',
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao remover do carrinho:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao remover do carrinho'),
      mensagem: 'Erro inesperado ao remover do carrinho',
    }
  }
}

/**
 * Limpa todo o carrinho do cliente atual
 */
export async function limparCarrinho(): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    const { data: session } = await supabase.auth.getSession()
    const clienteId = session?.data?.session?.user?.id || null
    const sessaoId = clienteId ? null : obterSessaoId()

    let query = supabase.from('carrinho').delete()

    if (clienteId) {
      query = query.eq('cliente_id', clienteId)
    } else if (sessaoId) {
      query = query.eq('sessao_id', sessaoId)
    } else {
      return { error: null }
    }

    const { error } = await query

    if (error) {
      console.error('❌ Erro ao limpar carrinho:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao limpar carrinho',
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao limpar carrinho:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao limpar carrinho'),
      mensagem: 'Erro inesperado ao limpar carrinho',
    }
  }
}

/**
 * Migra carrinho de sessão para cliente ao fazer login
 */
export async function migrarCarrinhoSessaoParaCliente(
  clienteId: string
): Promise<{ error: Error | null }> {
  try {
    const sessaoId = obterSessaoId()

    // Busca itens da sessão
    const { data: itensSessao } = await supabase
      .from('carrinho')
      .select('*')
      .eq('sessao_id', sessaoId)

    if (!itensSessao || itensSessao.length === 0) {
      return { error: null }
    }

    // Para cada item da sessão, verifica se já existe no carrinho do cliente
    for (const item of itensSessao) {
      const { data: existente } = await supabase
        .from('carrinho')
        .select('id, quantidade')
        .eq('cliente_id', clienteId)
        .eq('produto_id', item.produto_id)
        .maybeSingle()

      if (existente) {
        // Atualiza quantidade
        await supabase
          .from('carrinho')
          .update({ quantidade: existente.quantidade + item.quantidade })
          .eq('id', existente.id)
        
        // Remove item da sessão
        await supabase
          .from('carrinho')
          .delete()
          .eq('id', item.id)
      } else {
        // Migra item para cliente
        await supabase
          .from('carrinho')
          .update({
            cliente_id: clienteId,
            sessao_id: null,
          })
          .eq('id', item.id)
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro ao migrar carrinho:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao migrar carrinho'),
    }
  }
}

