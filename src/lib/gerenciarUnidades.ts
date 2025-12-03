import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'
import { validarLinkPublico, gerarSlug } from './lojaPublica'

/**
 * Interface de unidade de revenda
 */
export interface UnidadeRevenda {
  id: string
  revenda_id: string
  nome: string
  ativo: boolean
  nome_publico?: string | null
  descricao_loja?: string | null
  logo_url?: string | null
  link_publico?: string | null
  link_publico_ativo: boolean
  taxa_entrega: number
  oferecer_entrega: boolean
  oferecer_retirada_local: boolean
  oferecer_agendamento: boolean
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  // Configurações financeiras
  conta_pix_nome_completo?: string | null
  conta_pix_cpf_cnpj?: string | null
  conta_pix_chave?: string | null
  conta_pix_tipo?: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'CHAVE_ALEATORIA' | null
  modalidade_repasse?: 'D+1' | 'D+15' | 'D+30' | null
  taxa_repasse_percentual?: number | null
  taxa_repasse_fixa?: number | null
  criado_em: string
  atualizado_em: string
}

/**
 * Dados para criar/atualizar unidade
 */
export interface DadosUnidade {
  nome: string
  nome_publico?: string | null
  descricao_loja?: string | null
  logo_url?: string | null
  link_publico?: string | null
  link_publico_ativo?: boolean
  taxa_entrega?: number
  oferecer_entrega?: boolean
  oferecer_retirada_local?: boolean
  oferecer_agendamento?: boolean
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  ativo?: boolean
  // Configurações financeiras
  conta_pix_nome_completo?: string | null
  conta_pix_cpf_cnpj?: string | null
  conta_pix_chave?: string | null
  conta_pix_tipo?: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'CHAVE_ALEATORIA' | null
  modalidade_repasse?: 'D+1' | 'D+15' | 'D+30' | null
  taxa_repasse_percentual?: number | null
  taxa_repasse_fixa?: number | null
}

/**
 * Lista todas as unidades de uma revenda
 */
export async function listarUnidades(revendaId: string): Promise<{ unidades: UnidadeRevenda[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('unidades_revenda')
      .select('*')
      .eq('revenda_id', revendaId)
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('❌ Erro ao listar unidades:', error)
      return {
        unidades: [],
        error,
      }
    }

    return {
      unidades: (data || []) as UnidadeRevenda[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar unidades:', error)
    return {
      unidades: [],
      error: error instanceof Error ? error : new Error('Erro ao listar unidades'),
    }
  }
}

/**
 * Busca uma unidade por ID
 */
export async function buscarUnidade(unidadeId: string): Promise<{ unidade: UnidadeRevenda | null; error: Error | null }> {
  try {
    console.log('🔍 [buscarUnidade] Buscando unidade:', unidadeId)
    
    const { data, error } = await supabase
      .from('unidades_revenda')
      .select('*')
      .eq('id', unidadeId)
      .single()

    if (error) {
      console.error('❌ Erro ao buscar unidade:', error)
      return {
        unidade: null,
        error,
      }
    }

    console.log('✅ [buscarUnidade] Unidade encontrada:', {
      id: data?.id,
      nome: data?.nome,
      oferecer_entrega: data?.oferecer_entrega,
      oferecer_retirada_local: data?.oferecer_retirada_local,
      oferecer_agendamento: data?.oferecer_agendamento,
      tipos: {
        oferecer_entrega: typeof data?.oferecer_entrega,
        oferecer_retirada_local: typeof data?.oferecer_retirada_local,
        oferecer_agendamento: typeof data?.oferecer_agendamento,
      }
    })

    return {
      unidade: data as UnidadeRevenda,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar unidade:', error)
    return {
      unidade: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar unidade'),
    }
  }
}

/**
 * Busca uma unidade por link público
 */
export async function buscarUnidadePorLink(linkPublico: string): Promise<{ unidade: UnidadeRevenda | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('unidades_revenda')
      .select('*')
      .eq('link_publico', linkPublico)
      .eq('ativo', true)
      .eq('link_publico_ativo', true)
      .single()

    if (error) {
      console.error('❌ Erro ao buscar unidade por link:', error)
      return {
        unidade: null,
        error,
      }
    }

    return {
      unidade: data as UnidadeRevenda,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar unidade por link:', error)
    return {
      unidade: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar unidade por link'),
    }
  }
}

/**
 * Valida se um link público de unidade é único
 */
export async function validarLinkPublicoUnidade(
  linkPublico: string,
  unidadeId?: string
): Promise<{ valido: boolean; error: Error | null }> {
  try {
    if (!linkPublico || linkPublico.trim().length === 0) {
      return {
        valido: false,
        error: new Error('Link público não pode estar vazio'),
      }
    }

    const linkLimpo = linkPublico.trim().toLowerCase()

    // Valida formato do link
    const formatoValido = validarLinkPublico(linkLimpo)
    if (!formatoValido) {
      console.log('❌ Formato inválido:', linkLimpo)
      return {
        valido: false,
        error: new Error('Link público inválido. Use apenas letras, números e hífens (3-50 caracteres)'),
      }
    }

    console.log('🔍 Validando link público:', { linkLimpo, unidadeId })

    // Busca se já existe outra unidade com este link
    let queryUnidades = supabase
      .from('unidades_revenda')
      .select('id')
      .eq('link_publico', linkLimpo)
      .limit(1) // Limita a 1 resultado para performance

    // Se estiver editando, exclui a própria unidade da busca
    if (unidadeId) {
      queryUnidades = queryUnidades.neq('id', unidadeId)
    }

    const { data: unidadesExistentes, error: errorUnidade } = await queryUnidades

    console.log('📊 Resultado busca unidade:', { unidadesExistentes, errorUnidade, count: unidadesExistentes?.length })

    if (errorUnidade) {
      console.error('❌ Erro ao validar link público em unidades:', errorUnidade)
      return {
        valido: false,
        error: errorUnidade,
      }
    }

    const unidadeExistente = unidadesExistentes && unidadesExistentes.length > 0 ? unidadesExistentes[0] : null

    // Se encontrou unidade com este link, já está em uso
    if (unidadeExistente) {
      console.log('❌ Link já está em uso por unidade:', unidadeExistente.id)
      return {
        valido: false,
        error: new Error('Este link público já está em uso por outra unidade'),
      }
    }

    // Também verifica se não está sendo usado por uma revenda (evita conflitos)
    const { data: revendasExistentes, error: errorRevenda } = await supabase
      .from('revendas')
      .select('id')
      .eq('link_publico', linkLimpo)
      .limit(1)

    console.log('📊 Resultado busca revenda:', { revendasExistentes, errorRevenda, count: revendasExistentes?.length })

    if (errorRevenda) {
      console.error('❌ Erro ao validar link público em revendas:', errorRevenda)
      return {
        valido: false,
        error: errorRevenda,
      }
    }

    const revendaExistente = revendasExistentes && revendasExistentes.length > 0 ? revendasExistentes[0] : null

    // Se encontrou revenda com este link, já está em uso
    if (revendaExistente) {
      console.log('❌ Link já está em uso por revenda:', revendaExistente.id)
      return {
        valido: false,
        error: new Error('Este link público já está em uso por uma revenda'),
      }
    }

    console.log('✅ Link válido e disponível:', linkLimpo)
    return {
      valido: true,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao validar link público:', error)
    return {
      valido: false,
      error: error instanceof Error ? error : new Error('Erro ao validar link público'),
    }
  }
}

/**
 * Cria uma nova unidade
 */
export async function criarUnidade(
  revendaId: string,
  dados: DadosUnidade
): Promise<{ unidade: UnidadeRevenda | null; error: Error | null }> {
  try {
    // Valida link público se fornecido
    if (dados.link_publico) {
      const { valido, error: validacaoError } = await validarLinkPublicoUnidade(dados.link_publico)
      if (!valido) {
        return {
          unidade: null,
          error: validacaoError || new Error('Link público inválido'),
        }
      }
    }

    // Garantir que valores booleanos sejam sempre explícitos
    const oferecerEntrega = dados.oferecer_entrega !== undefined ? Boolean(dados.oferecer_entrega) : true
    const oferecerRetiradaLocal = dados.oferecer_retirada_local !== undefined ? Boolean(dados.oferecer_retirada_local) : true
    const oferecerAgendamento = dados.oferecer_agendamento !== undefined ? Boolean(dados.oferecer_agendamento) : true
    
    console.log('🔍 [criarUnidade] Valores booleanos:', {
      oferecer_entrega: oferecerEntrega,
      oferecer_retirada_local: oferecerRetiradaLocal,
      oferecer_agendamento: oferecerAgendamento,
      valoresOriginais: {
        oferecer_entrega: dados.oferecer_entrega,
        oferecer_retirada_local: dados.oferecer_retirada_local,
        oferecer_agendamento: dados.oferecer_agendamento,
      }
    })
    
    const { data, error } = await supabase
      .from('unidades_revenda')
      .insert({
        revenda_id: revendaId,
        nome: dados.nome.trim(),
        nome_publico: dados.nome_publico?.trim() || null,
        descricao_loja: dados.descricao_loja?.trim() || null,
        logo_url: dados.logo_url || null,
        link_publico: dados.link_publico?.trim().toLowerCase() || null,
        link_publico_ativo: dados.link_publico_ativo ?? true,
        taxa_entrega: dados.taxa_entrega ?? 0.00,
        oferecer_entrega: oferecerEntrega,
        oferecer_retirada_local: oferecerRetiradaLocal,
        oferecer_agendamento: oferecerAgendamento,
        cep: dados.cep?.trim() || null,
        logradouro: dados.logradouro?.trim() || null,
        numero: dados.numero?.trim() || null,
        complemento: dados.complemento?.trim() || null,
        bairro: dados.bairro?.trim() || null,
        cidade: dados.cidade?.trim() || null,
        estado: dados.estado?.trim() || null,
        ativo: dados.ativo ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar unidade:', error)
      return {
        unidade: null,
        error,
      }
    }

    return {
      unidade: data as UnidadeRevenda,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao criar unidade:', error)
    return {
      unidade: null,
      error: error instanceof Error ? error : new Error('Erro ao criar unidade'),
    }
  }
}

/**
 * Atualiza uma unidade existente
 */
export async function atualizarUnidade(
  unidadeId: string,
  dados: Partial<DadosUnidade>
): Promise<{ error: Error | null }> {
  try {
    // Valida link público se estiver sendo alterado
    if (dados.link_publico !== undefined) {
      const { valido, error: validacaoError } = await validarLinkPublicoUnidade(dados.link_publico, unidadeId)
      if (!valido) {
        return {
          error: validacaoError || new Error('Link público inválido'),
        }
      }
    }

    const dadosAtualizacao: any = {}

    if (dados.nome !== undefined) dadosAtualizacao.nome = dados.nome.trim()
    if (dados.nome_publico !== undefined) dadosAtualizacao.nome_publico = dados.nome_publico?.trim() || null
    if (dados.descricao_loja !== undefined) dadosAtualizacao.descricao_loja = dados.descricao_loja?.trim() || null
    if (dados.logo_url !== undefined) dadosAtualizacao.logo_url = dados.logo_url || null
    if (dados.link_publico !== undefined) dadosAtualizacao.link_publico = dados.link_publico?.trim().toLowerCase() || null
    if (dados.link_publico_ativo !== undefined) dadosAtualizacao.link_publico_ativo = dados.link_publico_ativo
    if (dados.taxa_entrega !== undefined) dadosAtualizacao.taxa_entrega = dados.taxa_entrega
    // Garantir que valores booleanos sejam sempre salvos explicitamente
    // IMPORTANTE: Sempre salvar os valores, mesmo quando são false
    if (dados.oferecer_entrega !== undefined) {
      dadosAtualizacao.oferecer_entrega = dados.oferecer_entrega === true
    }
    if (dados.oferecer_retirada_local !== undefined) {
      dadosAtualizacao.oferecer_retirada_local = dados.oferecer_retirada_local === true
    }
    if (dados.oferecer_agendamento !== undefined) {
      dadosAtualizacao.oferecer_agendamento = dados.oferecer_agendamento === true
    }
    
    console.log('🔍 [atualizarUnidade] Dados de atualização:', {
      unidadeId,
      dadosAtualizacao,
      oferecer_entrega: dadosAtualizacao.oferecer_entrega,
      oferecer_retirada_local: dadosAtualizacao.oferecer_retirada_local,
      oferecer_agendamento: dadosAtualizacao.oferecer_agendamento,
    })
    if (dados.cep !== undefined) dadosAtualizacao.cep = dados.cep?.trim() || null
    if (dados.logradouro !== undefined) dadosAtualizacao.logradouro = dados.logradouro?.trim() || null
    if (dados.numero !== undefined) dadosAtualizacao.numero = dados.numero?.trim() || null
    if (dados.complemento !== undefined) dadosAtualizacao.complemento = dados.complemento?.trim() || null
    if (dados.bairro !== undefined) dadosAtualizacao.bairro = dados.bairro?.trim() || null
    if (dados.cidade !== undefined) dadosAtualizacao.cidade = dados.cidade?.trim() || null
    if (dados.estado !== undefined) dadosAtualizacao.estado = dados.estado?.trim() || null
    if (dados.ativo !== undefined) dadosAtualizacao.ativo = dados.ativo

    console.log('📤 [atualizarUnidade] Enviando atualização para Supabase:', {
      unidadeId,
      dadosAtualizacao,
      keys: Object.keys(dadosAtualizacao)
    })
    
    const { data, error } = await supabase
      .from('unidades_revenda')
      .update(dadosAtualizacao)
      .eq('id', unidadeId)
      .select('id, oferecer_entrega, oferecer_retirada_local, oferecer_agendamento')

    console.log('📥 [atualizarUnidade] Resposta do Supabase:', {
      data,
      error
    })

    if (error) {
      console.error('❌ Erro ao atualizar unidade:', error)
      return {
        error,
      }
    }
    
    // Verificar se os valores foram salvos corretamente
    if (data && data.length > 0) {
      console.log('✅ [atualizarUnidade] Valores salvos:', {
        oferecer_entrega: data[0].oferecer_entrega,
        oferecer_retirada_local: data[0].oferecer_retirada_local,
        oferecer_agendamento: data[0].oferecer_agendamento,
      })
    }

    return {
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar unidade:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao atualizar unidade'),
    }
  }
}

/**
 * Deleta uma unidade
 */
export async function deletarUnidade(unidadeId: string): Promise<{ error: Error | null }> {
  try {
    // Verificar se há produtos associados
    const { data: produtos, error: produtosError } = await supabase
      .from('produtos')
      .select('id')
      .eq('unidade_id', unidadeId)
      .limit(1)

    if (produtosError) {
      console.error('❌ Erro ao verificar produtos:', produtosError)
      return {
        error: produtosError,
      }
    }

    if (produtos && produtos.length > 0) {
      return {
        error: new Error('Não é possível excluir unidade com produtos associados. Remova ou transfira os produtos primeiro.'),
      }
    }

    // Verificar se há pedidos associados
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id')
      .eq('unidade_id', unidadeId)
      .limit(1)

    if (pedidosError) {
      console.error('❌ Erro ao verificar pedidos:', pedidosError)
      return {
        error: pedidosError,
      }
    }

    if (pedidos && pedidos.length > 0) {
      return {
        error: new Error('Não é possível excluir unidade com pedidos associados.'),
      }
    }

    const { error } = await supabase
      .from('unidades_revenda')
      .delete()
      .eq('id', unidadeId)

    if (error) {
      console.error('❌ Erro ao deletar unidade:', error)
      return {
        error,
      }
    }

    return {
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao deletar unidade:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao deletar unidade'),
    }
  }
}

/**
 * Sugere um link público baseado no nome da unidade
 */
export function sugerirLinkPublicoUnidade(nomeUnidade: string): string {
  return gerarSlug(nomeUnidade)
}

/**
 * Conta produtos associados a uma unidade
 */
export async function contarProdutosUnidade(unidadeId: string): Promise<{ total: number; error: Error | null }> {
  try {
    const { count, error } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('unidade_id', unidadeId)

    if (error) {
      console.error('❌ Erro ao contar produtos:', error)
      return {
        total: 0,
        error,
      }
    }

    return {
      total: count || 0,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao contar produtos:', error)
    return {
      total: 0,
      error: error instanceof Error ? error : new Error('Erro ao contar produtos'),
    }
  }
}

/**
 * Atualiza configurações financeiras de uma unidade (PIX, modalidade de repasse e taxas)
 */
export async function atualizarConfiguracaoFinanceiraUnidade(
  unidadeId: string,
  dados: {
    conta_pix_nome_completo?: string | null
    conta_pix_cpf_cnpj?: string | null
    conta_pix_chave?: string | null
    conta_pix_tipo?: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'CHAVE_ALEATORIA' | null
    modalidade_repasse?: 'D+1' | 'D+15' | 'D+30' | null
    taxa_repasse_percentual?: number | null
    taxa_repasse_fixa?: number | null
  }
): Promise<{ error: Error | null }> {
  try {
    const dadosAtualizacao: any = {}

    if (dados.conta_pix_nome_completo !== undefined) {
      dadosAtualizacao.conta_pix_nome_completo = dados.conta_pix_nome_completo?.trim() || null
    }
    if (dados.conta_pix_cpf_cnpj !== undefined) {
      dadosAtualizacao.conta_pix_cpf_cnpj = dados.conta_pix_cpf_cnpj?.trim() || null
    }
    if (dados.conta_pix_chave !== undefined) {
      dadosAtualizacao.conta_pix_chave = dados.conta_pix_chave?.trim() || null
    }
    if (dados.conta_pix_tipo !== undefined) {
      dadosAtualizacao.conta_pix_tipo = dados.conta_pix_tipo || null
    }
    if (dados.modalidade_repasse !== undefined) {
      dadosAtualizacao.modalidade_repasse = dados.modalidade_repasse || null
    }
    if (dados.taxa_repasse_percentual !== undefined) {
      // Se for null, define como null (para limpar o campo)
      if (dados.taxa_repasse_percentual === null) {
        dadosAtualizacao.taxa_repasse_percentual = null
      } else {
        // Converte para número e valida
        const valor = typeof dados.taxa_repasse_percentual === 'string' 
          ? parseFloat(dados.taxa_repasse_percentual)
          : Number(dados.taxa_repasse_percentual)
        
        if (isNaN(valor) || valor < 0 || valor > 100) {
          return {
            error: new Error('Taxa percentual deve ser um número entre 0 e 100'),
          }
        }
        dadosAtualizacao.taxa_repasse_percentual = valor
      }
    }
    if (dados.taxa_repasse_fixa !== undefined) {
      // Se for null, define como null (para limpar o campo)
      if (dados.taxa_repasse_fixa === null) {
        dadosAtualizacao.taxa_repasse_fixa = null
      } else {
        // Converte para número e valida
        const valor = typeof dados.taxa_repasse_fixa === 'string'
          ? parseFloat(dados.taxa_repasse_fixa)
          : Number(dados.taxa_repasse_fixa)
        
        if (isNaN(valor) || valor < 0) {
          return {
            error: new Error('Taxa fixa deve ser um número maior ou igual a 0'),
          }
        }
        dadosAtualizacao.taxa_repasse_fixa = valor
      }
    }

    // Se não há dados para atualizar, retorna sucesso
    if (Object.keys(dadosAtualizacao).length === 0) {
      console.log('⚠️ [atualizarConfiguracaoFinanceiraUnidade] Nenhum dado para atualizar')
      return {
        error: null,
      }
    }

    // Log para debug
    console.log('🔍 [atualizarConfiguracaoFinanceiraUnidade] Dados de atualização:', {
      unidadeId,
      dadosAtualizacao,
      keys: Object.keys(dadosAtualizacao),
    })

    const { error, data } = await supabase
      .from('unidades_revenda')
      .update(dadosAtualizacao)
      .eq('id', unidadeId)
      .select('id, taxa_repasse_percentual, taxa_repasse_fixa, modalidade_repasse')

    if (error) {
      console.error('❌ Erro ao atualizar configuração financeira da unidade:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        dadosAtualizacao,
      })
      
      // Mensagem de erro mais amigável
      let mensagemErro = 'Erro ao atualizar configuração financeira'
      if (error.message) {
        mensagemErro = error.message
      } else if (error.details) {
        mensagemErro = error.details
      } else if (error.hint) {
        mensagemErro = error.hint
      }
      
      // Se o erro indica que a coluna não existe, sugere aplicar a migration
      if (error.message?.includes('column') || error.message?.includes('does not exist')) {
        mensagemErro = 'Campos de taxas não encontrados. Verifique se a migration 070 foi aplicada.'
      }
      
      return {
        error: new Error(mensagemErro),
      }
    }

    console.log('✅ [atualizarConfiguracaoFinanceiraUnidade] Atualização realizada com sucesso:', {
      data,
      valoresSalvos: data?.[0] ? {
        taxa_repasse_percentual: data[0].taxa_repasse_percentual,
        taxa_repasse_fixa: data[0].taxa_repasse_fixa,
      } : null,
    })

    return {
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar configuração financeira:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao atualizar configuração financeira'),
    }
  }
}

