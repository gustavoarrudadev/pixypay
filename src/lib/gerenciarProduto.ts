import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'
import { deletarImagem } from './storage'

/**
 * Interface de Produto
 */
export interface Produto {
  id: string
  revenda_id: string
  unidade_id?: string | null
  nome: string
  descricao: string | null
  preco: number
  imagem_url: string | null
  ativo: boolean
  max_parcelas: number
  dias_segunda_parcela?: number | null
  link_publico: string | null
  criado_em: string
  atualizado_em: string
}

/**
 * Dados para criar/atualizar produto
 */
export interface DadosProduto {
  nome: string
  descricao?: string
  preco: number
  imagem_url?: string | null
  ativo?: boolean
  unidade_id?: string | null
}

/**
 * Lista todos os produtos de uma revenda
 * 
 * @param revendaId ID da revenda
 * @param unidadeId ID da unidade (opcional, filtra produtos da unidade)
 * @returns Lista de produtos ou erro
 */
export async function listarProdutos(revendaId: string, unidadeId?: string | null): Promise<{ produtos: Produto[]; error: Error | null }> {
  try {
    let query = supabase
      .from('produtos')
      .select('*')
      .eq('revenda_id', revendaId)
    
    // Se unidadeId for fornecido, filtra por unidade
    // Se unidadeId for null explícito, mostra apenas produtos sem unidade (legado)
    // Se unidadeId não for fornecido, mostra todos os produtos
    if (unidadeId !== undefined) {
      if (unidadeId === null) {
        // Mostra apenas produtos sem unidade (legado)
        query = query.is('unidade_id', null)
      } else {
        // Mostra produtos da unidade específica
        query = query.eq('unidade_id', unidadeId)
      }
    }
    
    const { data, error } = await query.order('criado_em', { ascending: false })

    if (error) {
      console.error('❌ Erro ao listar produtos:', error)
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
    console.error('❌ Erro inesperado ao listar produtos:', error)
    return {
      produtos: [],
      error: error instanceof Error ? error : new Error('Erro ao listar produtos'),
    }
  }
}

/**
 * Busca um produto específico
 * 
 * @param produtoId ID do produto
 * @returns Produto ou erro
 */
export async function buscarProduto(produtoId: string): Promise<{ produto: Produto | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', produtoId)
      .single()

    if (error) {
      console.error('❌ Erro ao buscar produto:', error)
      return {
        produto: null,
        error,
      }
    }

    return {
      produto: data,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar produto:', error)
    return {
      produto: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar produto'),
    }
  }
}

/**
 * Cria um novo produto
 * 
 * @param revendaId ID da revenda
 * @param dados Dados do produto
 * @returns Produto criado ou erro
 */
export async function criarProduto(
  revendaId: string,
  dados: DadosProduto
): Promise<{ produto: Produto | null; error: Error | null; mensagem?: string }> {
  try {
    // Validações
    if (!dados.nome || dados.nome.trim().length === 0) {
      return {
        produto: null,
        error: new Error('Nome é obrigatório'),
        mensagem: 'Nome do produto é obrigatório.',
      }
    }

    if (!dados.preco || dados.preco < 0) {
      return {
        produto: null,
        error: new Error('Preço inválido'),
        mensagem: 'Preço deve ser maior ou igual a zero.',
      }
    }

    const { data, error } = await supabase
      .from('produtos')
      .insert({
        revenda_id: revendaId,
        unidade_id: dados.unidade_id || null,
        nome: dados.nome.trim(),
        descricao: dados.descricao?.trim() || null,
        preco: dados.preco,
        imagem_url: dados.imagem_url || null,
        ativo: dados.ativo !== undefined ? dados.ativo : true,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar produto:', error)
      // Mensagem mais específica baseada no tipo de erro
      let mensagemErro = traduzirErro(error.message) || 'Erro ao criar produto.'
      
      if (error.message?.includes('relation "produtos" does not exist')) {
        mensagemErro = 'Tabela de produtos não encontrada. Execute a migration 015 no Supabase.'
      } else if (error.message?.includes('new row violates row-level security')) {
        mensagemErro = 'Sem permissão para criar produto. Verifique se você está logado como revenda.'
      } else if (error.message?.includes('foreign key')) {
        mensagemErro = 'Revenda não encontrada. Verifique se a revenda existe.'
      }
      
      return {
        produto: null,
        error,
        mensagem: mensagemErro,
      }
    }

    return {
      produto: data,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao criar produto:', error)
    return {
      produto: null,
      error: error instanceof Error ? error : new Error('Erro ao criar produto'),
      mensagem: 'Erro inesperado ao criar produto.',
    }
  }
}

/**
 * Atualiza um produto existente
 * 
 * @param produtoId ID do produto
 * @param dados Dados para atualizar
 * @returns Produto atualizado ou erro
 */
export async function atualizarProduto(
  produtoId: string,
  dados: Partial<DadosProduto>
): Promise<{ produto: Produto | null; error: Error | null; mensagem?: string }> {
  try {
    // Busca produto atual para verificar imagem anterior
    const { data: produtoAtual, error: erroBusca } = await supabase
      .from('produtos')
      .select('imagem_url')
      .eq('id', produtoId)
      .single()

    if (erroBusca) {
      console.error('❌ Erro ao buscar produto atual:', erroBusca)
    }

    const updateData: any = {}

    if (dados.nome !== undefined) {
      if (!dados.nome || dados.nome.trim().length === 0) {
        return {
          produto: null,
          error: new Error('Nome é obrigatório'),
          mensagem: 'Nome do produto é obrigatório.',
        }
      }
      updateData.nome = dados.nome.trim()
    }

    if (dados.descricao !== undefined) {
      updateData.descricao = dados.descricao?.trim() || null
    }

    if (dados.preco !== undefined) {
      if (dados.preco < 0) {
        return {
          produto: null,
          error: new Error('Preço inválido'),
          mensagem: 'Preço deve ser maior ou igual a zero.',
        }
      }
      updateData.preco = dados.preco
    }

    // Se a imagem está sendo alterada, deleta a anterior
    if (dados.imagem_url !== undefined) {
      const imagemAnterior = produtoAtual?.imagem_url
      const novaImagem = dados.imagem_url

      // Se havia uma imagem anterior e está sendo substituída por uma nova
      if (imagemAnterior && novaImagem && imagemAnterior !== novaImagem) {
        try {
          const { error: deleteError } = await deletarImagem(imagemAnterior)
          if (deleteError) {
            console.warn('⚠️ Aviso: Não foi possível deletar a imagem anterior:', deleteError)
            // Continua mesmo se não conseguir deletar
          } else {
            console.log('✅ Imagem anterior do produto deletada com sucesso')
          }
        } catch (error) {
          console.warn('⚠️ Aviso: Erro ao tentar deletar imagem anterior:', error)
          // Continua mesmo se não conseguir deletar
        }
      }
      // Se a imagem está sendo removida (novaImagem é null), também deleta a anterior
      else if (imagemAnterior && !novaImagem) {
        try {
          const { error: deleteError } = await deletarImagem(imagemAnterior)
          if (deleteError) {
            console.warn('⚠️ Aviso: Não foi possível deletar a imagem removida:', deleteError)
          } else {
            console.log('✅ Imagem removida do produto deletada com sucesso')
          }
        } catch (error) {
          console.warn('⚠️ Aviso: Erro ao tentar deletar imagem removida:', error)
        }
      }

      updateData.imagem_url = novaImagem || null
    }

    if (dados.ativo !== undefined) {
      updateData.ativo = dados.ativo
    }

    if (dados.unidade_id !== undefined) {
      updateData.unidade_id = dados.unidade_id || null
    }

    const { data, error } = await supabase
      .from('produtos')
      .update(updateData)
      .eq('id', produtoId)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao atualizar produto:', error)
      return {
        produto: null,
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao atualizar produto.',
      }
    }

    return {
      produto: data,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar produto:', error)
    return {
      produto: null,
      error: error instanceof Error ? error : new Error('Erro ao atualizar produto'),
      mensagem: 'Erro inesperado ao atualizar produto.',
    }
  }
}

/**
 * Deleta um produto
 * 
 * @param produtoId ID do produto
 * @returns Sucesso ou erro
 */
export async function deletarProduto(produtoId: string): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    // Busca produto para deletar a imagem antes de deletar o produto
    const { data: produto, error: erroBusca } = await supabase
      .from('produtos')
      .select('imagem_url')
      .eq('id', produtoId)
      .single()

    if (erroBusca) {
      console.warn('⚠️ Aviso: Não foi possível buscar produto para deletar imagem:', erroBusca)
    }

    // Deleta a imagem do produto se existir
    if (produto?.imagem_url) {
      try {
        const { error: deleteError } = await deletarImagem(produto.imagem_url)
        if (deleteError) {
          console.warn('⚠️ Aviso: Não foi possível deletar a imagem do produto:', deleteError)
          // Continua mesmo se não conseguir deletar a imagem
        } else {
          console.log('✅ Imagem do produto deletada com sucesso')
        }
      } catch (error) {
        console.warn('⚠️ Aviso: Erro ao tentar deletar imagem do produto:', error)
        // Continua mesmo se não conseguir deletar a imagem
      }
    }

    // Deleta o produto
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', produtoId)

    if (error) {
      console.error('❌ Erro ao deletar produto:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao deletar produto.',
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao deletar produto:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao deletar produto'),
      mensagem: 'Erro inesperado ao deletar produto.',
    }
  }
}

/**
 * Alterna status ativo/inativo de um produto
 * 
 * @param produtoId ID do produto
 * @param ativo Novo status
 * @returns Produto atualizado ou erro
 */
export async function toggleAtivoProduto(
  produtoId: string,
  ativo: boolean
): Promise<{ produto: Produto | null; error: Error | null; mensagem?: string }> {
  return await atualizarProduto(produtoId, { ativo })
}

/**
 * Gera link público para um produto que não tem link_publico
 * 
 * @param produtoId ID do produto
 * @returns Link público gerado ou erro
 */
export async function gerarLinkProdutoExistente(
  produtoId: string
): Promise<{ linkPublico: string | null; error: Error | null }> {
  try {
    // Primeiro tenta usar a função RPC (se a migration 063 foi aplicada)
    const { data: rpcData, error: rpcError } = await supabase.rpc('gerar_link_produto_existente', {
      p_produto_id: produtoId,
    })

    // Se a função RPC não existe (migration não aplicada), usa método alternativo
    if (rpcError && rpcError.code === 'PGRST202') {
      console.log('⚠️ Função RPC não encontrada, usando método alternativo...')
      
      // Busca o produto atual
      const { data: produtoData, error: buscaError } = await supabase
        .from('produtos')
        .select('revenda_id, nome, link_publico')
        .eq('id', produtoId)
        .single()

      if (buscaError || !produtoData) {
        console.error('❌ Erro ao buscar produto:', buscaError)
        return {
          linkPublico: null,
          error: buscaError || new Error('Produto não encontrado'),
        }
      }

      // Se já tem link, retorna ele
      if (produtoData.link_publico) {
        return {
          linkPublico: produtoData.link_publico,
          error: null,
        }
      }

      // Gera slug baseado no nome
      const gerarSlug = (nome: string): string => {
        let slug = nome.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
          .replace(/\s+/g, '-') // Substitui espaços por hífen
          .replace(/-+/g, '-') // Remove hífens duplicados
          .trim()
          .replace(/^-+|-+$/g, '') // Remove hífens do início/fim
        
        // Limita tamanho
        if (slug.length > 200) {
          slug = slug.substring(0, 200).replace(/-+$/, '')
        }
        
        return slug || 'produto'
      }

      // Verifica se já existe produto com esse link na mesma revenda
      let baseSlug = gerarSlug(produtoData.nome)
      let finalSlug = baseSlug
      let counter = 0

      while (true) {
        const { data: existeData, error: existeError } = await supabase
          .from('produtos')
          .select('id')
          .eq('revenda_id', produtoData.revenda_id)
          .eq('link_publico', finalSlug)
          .neq('id', produtoId)
          .limit(1)

        if (existeError) {
          console.error('❌ Erro ao verificar slug:', existeError)
          break
        }

        if (!existeData || existeData.length === 0) {
          // Slug único encontrado
          break
        }

        // Slug já existe, adiciona número
        counter++
        finalSlug = `${baseSlug}-${counter}`
      }

      // Atualiza o produto com o link gerado
      const { data: updateData, error: updateError } = await supabase
        .from('produtos')
        .update({ link_publico: finalSlug })
        .eq('id', produtoId)
        .select('link_publico')
        .single()

      if (updateError) {
        console.error('❌ Erro ao atualizar produto com link:', updateError)
        return {
          linkPublico: null,
          error: updateError,
        }
      }

      return {
        linkPublico: updateData?.link_publico || finalSlug,
        error: null,
      }
    }

    // Se houve outro erro na RPC
    if (rpcError) {
      console.error('❌ Erro ao gerar link do produto via RPC:', rpcError)
      return {
        linkPublico: null,
        error: rpcError,
      }
    }

    // Sucesso com RPC
    return {
      linkPublico: rpcData || null,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao gerar link do produto:', error)
    return {
      linkPublico: null,
      error: error instanceof Error ? error : new Error('Erro ao gerar link do produto'),
    }
  }
}

