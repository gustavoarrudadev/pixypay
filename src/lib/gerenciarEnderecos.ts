import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'

/**
 * Interface de endereço de entrega
 */
export interface EnderecoEntrega {
  id: string
  cliente_id: string
  nome_endereco: string | null
  cep: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  criado_em: string
  atualizado_em: string
}

/**
 * Dados para criar/atualizar endereço
 */
export interface DadosEndereco {
  nome_endereco?: string | null
  cep: string
  logradouro: string
  numero: string
  complemento?: string | null
  bairro: string
  cidade: string
  estado: string
}

/**
 * Lista endereços do cliente atual
 */
export async function listarEnderecos(): Promise<{ enderecos: EnderecoEntrega[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('enderecos_entrega')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('❌ Erro ao listar endereços:', error)
      return {
        enderecos: [],
        error,
      }
    }

    return {
      enderecos: (data || []) as EnderecoEntrega[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar endereços:', error)
    return {
      enderecos: [],
      error: error instanceof Error ? error : new Error('Erro ao listar endereços'),
    }
  }
}

/**
 * Busca um endereço por ID
 */
export async function buscarEndereco(
  enderecoId: string
): Promise<{ endereco: EnderecoEntrega | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('enderecos_entrega')
      .select('*')
      .eq('id', enderecoId)
      .single()

    if (error) {
      console.error('❌ Erro ao buscar endereço:', error)
      return {
        endereco: null,
        error,
      }
    }

    return {
      endereco: data as EnderecoEntrega,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar endereço:', error)
    return {
      endereco: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar endereço'),
    }
  }
}

/**
 * Cria um novo endereço
 */
export async function criarEndereco(
  dados: DadosEndereco
): Promise<{ endereco: EnderecoEntrega | null; error: Error | null; mensagem?: string }> {
  try {
    // Obter o cliente_id da sessão atual
    const { data: sessionData } = await supabase.auth.getSession()
    const clienteId = sessionData?.session?.user?.id

    if (!clienteId) {
      const error = new Error('Usuário não autenticado')
      console.error('❌ Erro ao criar endereço:', error)
      return {
        endereco: null,
        error,
        mensagem: 'É necessário estar autenticado para criar endereço',
      }
    }

    console.log('🔍 [criarEndereco] Criando endereço para cliente:', clienteId)

    const { data, error } = await supabase
      .from('enderecos_entrega')
      .insert({
        cliente_id: clienteId,
        nome_endereco: dados.nome_endereco || null,
        cep: dados.cep,
        logradouro: dados.logradouro,
        numero: dados.numero,
        complemento: dados.complemento || null,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar endereço:', error)
      return {
        endereco: null,
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao criar endereço',
      }
    }

    console.log('✅ [criarEndereco] Endereço criado com sucesso:', data?.id)

    return {
      endereco: data as EnderecoEntrega,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao criar endereço:', error)
    return {
      endereco: null,
      error: error instanceof Error ? error : new Error('Erro ao criar endereço'),
      mensagem: 'Erro inesperado ao criar endereço',
    }
  }
}

/**
 * Atualiza um endereço
 */
export async function atualizarEndereco(
  enderecoId: string,
  dados: DadosEndereco
): Promise<{ endereco: EnderecoEntrega | null; error: Error | null; mensagem?: string }> {
  try {
    const { data, error } = await supabase
      .from('enderecos_entrega')
      .update({
        nome_endereco: dados.nome_endereco || null,
        cep: dados.cep,
        logradouro: dados.logradouro,
        numero: dados.numero,
        complemento: dados.complemento || null,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
      })
      .eq('id', enderecoId)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao atualizar endereço:', error)
      return {
        endereco: null,
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao atualizar endereço',
      }
    }

    return {
      endereco: data as EnderecoEntrega,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar endereço:', error)
    return {
      endereco: null,
      error: error instanceof Error ? error : new Error('Erro ao atualizar endereço'),
      mensagem: 'Erro inesperado ao atualizar endereço',
    }
  }
}

/**
 * Deleta um endereço
 */
export async function deletarEndereco(
  enderecoId: string
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    // Verifica se há pedidos usando este endereço
    const { count, error: countError } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('endereco_entrega_id', enderecoId)

    if (countError) {
      console.error('❌ Erro ao verificar pedidos:', countError)
      return {
        error: countError,
        mensagem: 'Erro ao verificar se o endereço está em uso',
      }
    }

    if (count && count > 0) {
      return {
        error: new Error('Endereço em uso'),
        mensagem: `Este endereço não pode ser excluído pois está sendo usado em ${count} pedido${count > 1 ? 's' : ''}. Para excluir, primeiro remova ou altere o endereço desses pedidos.`,
      }
    }

    // Se não há pedidos usando o endereço, pode deletar
    const { error } = await supabase
      .from('enderecos_entrega')
      .delete()
      .eq('id', enderecoId)

    if (error) {
      console.error('❌ Erro ao deletar endereço:', error)
      
      // Verifica se é erro de constraint
      if (error.code === '23503') {
        return {
          error,
          mensagem: 'Este endereço não pode ser excluído pois está sendo usado em pedidos. Para excluir, primeiro remova ou altere o endereço desses pedidos.',
        }
      }
      
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao deletar endereço',
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao deletar endereço:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao deletar endereço'),
      mensagem: 'Erro inesperado ao deletar endereço',
    }
  }
}

