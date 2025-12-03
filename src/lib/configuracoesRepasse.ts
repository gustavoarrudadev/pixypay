import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'

export interface ConfiguracaoRepasse {
  id: string
  revenda_id: string
  modalidade: 'D+1' | 'D+15' | 'D+30'
  taxa_percentual: number
  taxa_fixa: number
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface DadosConfiguracaoRepasse {
  modalidade: 'D+1' | 'D+15' | 'D+30'
  taxa_percentual: number
  taxa_fixa: number
}

/**
 * Busca a configuração de repasse ativa de uma revenda
 */
export async function buscarConfiguracaoRepasseAtiva(
  revendaId: string
): Promise<{ configuracao: ConfiguracaoRepasse | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('configuracoes_repasse_revenda')
      .select('*')
      .eq('revenda_id', revendaId)
      .eq('ativo', true)
      .maybeSingle() // Usa maybeSingle ao invés de single para não dar erro 406 se não existir

    // Se não encontrou configuração, não é um erro crítico - apenas retorna null
    if (error) {
      // Se for erro PGRST116 (nenhum resultado), não é um erro crítico
      if ((error as any).code === 'PGRST116') {
        console.warn('⚠️ Configuração de repasse não encontrada para revenda:', revendaId)
        return {
          configuracao: null,
          error: null, // Não retorna erro se simplesmente não encontrou
        }
      }
      console.error('❌ Erro ao buscar configuração de repasse:', error)
      return {
        configuracao: null,
        error,
      }
    }

    return {
      configuracao: data as ConfiguracaoRepasse | null,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar configuração de repasse:', error)
    return {
      configuracao: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar configuração de repasse'),
    }
  }
}

/**
 * Lista todas as configurações de repasse de uma revenda
 */
export async function listarConfiguracoesRepasse(
  revendaId: string
): Promise<{ configuracoes: ConfiguracaoRepasse[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('configuracoes_repasse_revenda')
      .select('*')
      .eq('revenda_id', revendaId)
      .order('modalidade', { ascending: true })

    if (error) {
      console.error('❌ Erro ao listar configurações de repasse:', error)
      return {
        configuracoes: [],
        error,
      }
    }

    return {
      configuracoes: (data || []) as ConfiguracaoRepasse[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar configurações de repasse:', error)
    return {
      configuracoes: [],
      error: error instanceof Error ? error : new Error('Erro ao listar configurações de repasse'),
    }
  }
}

/**
 * Altera a modalidade de repasse de uma revenda
 */
export async function alterarModalidadeRepasse(
  revendaId: string,
  novaModalidade: 'D+1' | 'D+15' | 'D+30'
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    console.log('🔄 [alterarModalidadeRepasse] Iniciando alteração:', { revendaId, novaModalidade })

    // PRIMEIRO: Verificar se a configuração existe para esta modalidade
    const { data: configExistente, error: buscarError } = await supabase
      .from('configuracoes_repasse_revenda')
      .select('id, modalidade, ativo')
      .eq('revenda_id', revendaId)
      .eq('modalidade', novaModalidade)
      .maybeSingle()

    if (buscarError) {
      console.error('❌ [alterarModalidadeRepasse] Erro ao buscar configuração:', buscarError)
      return {
        error: buscarError,
        mensagem: 'Erro ao verificar configuração existente',
      }
    }

    if (!configExistente) {
      console.error('❌ [alterarModalidadeRepasse] Configuração não encontrada para modalidade:', novaModalidade)
      return {
        error: new Error('Configuração não encontrada'),
        mensagem: `Configuração para modalidade ${novaModalidade} não encontrada. Entre em contato com o suporte.`,
      }
    }

    console.log('✅ [alterarModalidadeRepasse] Configuração encontrada:', configExistente)

    // Tenta usar a função RPC primeiro (com SECURITY DEFINER)
    console.log('🔄 [alterarModalidadeRepasse] Tentando usar função RPC...')
    const { data: rpcResult, error: rpcError } = await supabase.rpc('alterar_modalidade_repasse_revenda', {
      p_revenda_id: revendaId,
      p_nova_modalidade: novaModalidade,
    })

    if (!rpcError && rpcResult && (rpcResult as any).success) {
      console.log('✅ [alterarModalidadeRepasse] Modalidade alterada via RPC:', rpcResult)
      
      // Verificar se realmente foi atualizado
      const { data: verificacao, error: verificarError } = await supabase
        .from('configuracoes_repasse_revenda')
        .select('id, modalidade, ativo')
        .eq('revenda_id', revendaId)
        .eq('modalidade', novaModalidade)
        .single()
      
      if (verificarError) {
        console.warn('⚠️ [alterarModalidadeRepasse] Erro ao verificar atualização:', verificarError)
      } else {
        console.log('✅ [alterarModalidadeRepasse] Verificação pós-atualização:', verificacao)
        if (!verificacao.ativo) {
          console.error('❌ [alterarModalidadeRepasse] ATENÇÃO: Configuração ainda está inativa após atualização!')
        }
      }
      
      return { error: null }
    }

    // Fallback: tentar UPDATE direto se RPC não funcionar
    console.warn('⚠️ [alterarModalidadeRepasse] RPC não disponível, tentando UPDATE direto...', rpcError)
    
    // Desativa todas as configurações da revenda
    console.log('🔄 [alterarModalidadeRepasse] Desativando todas as configurações da revenda...')
    const { error: desativarError, count: desativarCount } = await supabase
      .from('configuracoes_repasse_revenda')
      .update({ ativo: false })
      .eq('revenda_id', revendaId)

    if (desativarError) {
      console.error('❌ [alterarModalidadeRepasse] Erro ao desativar configurações:', {
        error: desativarError,
        message: desativarError.message,
        details: (desativarError as any).details,
        hint: (desativarError as any).hint,
        code: (desativarError as any).code,
      })
      return {
        error: desativarError,
        mensagem: `Erro ao desativar configuração anterior: ${desativarError.message || 'Sem permissão para atualizar'}`,
      }
    }

    console.log(`✅ [alterarModalidadeRepasse] ${desativarCount || 0} configuração(ões) desativada(s)`)

    // Ativa a nova modalidade
    console.log(`🔄 [alterarModalidadeRepasse] Ativando modalidade ${novaModalidade}...`)
    const { error: ativarError, count: ativarCount } = await supabase
      .from('configuracoes_repasse_revenda')
      .update({ ativo: true })
      .eq('revenda_id', revendaId)
      .eq('modalidade', novaModalidade)

    if (ativarError) {
      console.error('❌ [alterarModalidadeRepasse] Erro ao ativar nova modalidade:', {
        error: ativarError,
        message: ativarError.message,
        details: (ativarError as any).details,
        hint: (ativarError as any).hint,
        code: (ativarError as any).code,
      })
      return {
        error: ativarError,
        mensagem: `Erro ao ativar nova modalidade: ${ativarError.message || 'Sem permissão para atualizar. Aplique a migration 053 no banco de dados.'}`,
      }
    }

    console.log(`✅ [alterarModalidadeRepasse] Modalidade ${novaModalidade} ativada com sucesso (${ativarCount || 0} registro(s) atualizado(s))`)
    
    // Verificar se realmente foi atualizado
    const { data: verificacao, error: verificarError } = await supabase
      .from('configuracoes_repasse_revenda')
      .select('id, modalidade, ativo')
      .eq('revenda_id', revendaId)
      .eq('modalidade', novaModalidade)
      .single()
    
    if (verificarError) {
      console.warn('⚠️ [alterarModalidadeRepasse] Erro ao verificar atualização:', verificarError)
    } else {
      console.log('✅ [alterarModalidadeRepasse] Verificação pós-atualização:', verificacao)
      if (!verificacao.ativo) {
        console.error('❌ [alterarModalidadeRepasse] ATENÇÃO: Configuração ainda está inativa após atualização!')
        return {
          error: new Error('Configuração não foi ativada'),
          mensagem: 'A atualização não foi aplicada. Verifique as permissões RLS ou aplique a migration 053.',
        }
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ [alterarModalidadeRepasse] Erro inesperado:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao alterar modalidade'),
      mensagem: 'Erro inesperado ao alterar modalidade',
    }
  }
}

/**
 * Atualiza taxas de uma configuração de repasse (Admin)
 */
export async function atualizarTaxasRepasse(
  configuracaoId: string,
  taxaPercentual: number,
  taxaFixa: number
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    // Validações
    if (taxaPercentual < 0 || taxaPercentual > 100) {
      return {
        error: new Error('Taxa percentual deve estar entre 0 e 100'),
        mensagem: 'Taxa percentual inválida',
      }
    }

    if (taxaFixa < 0) {
      return {
        error: new Error('Taxa fixa não pode ser negativa'),
        mensagem: 'Taxa fixa inválida',
      }
    }

    const { error } = await supabase
      .from('configuracoes_repasse_revenda')
      .update({
        taxa_percentual: taxaPercentual,
        taxa_fixa: taxaFixa,
      })
      .eq('id', configuracaoId)

    if (error) {
      console.error('❌ Erro ao atualizar taxas:', error)
      return {
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao atualizar taxas',
      }
    }

    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar taxas:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao atualizar taxas'),
      mensagem: 'Erro inesperado ao atualizar taxas',
    }
  }
}

/**
 * Lista todas as configurações de repasse (Admin)
 */
export async function listarTodasConfiguracoesRepasse(): Promise<{
  configuracoes: ConfiguracaoRepasse[];
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('configuracoes_repasse_revenda')
      .select('*')
      .order('revenda_id', { ascending: true })
      .order('modalidade', { ascending: true })

    if (error) {
      console.error('❌ Erro ao listar todas as configurações:', error)
      return {
        configuracoes: [],
        error,
      }
    }

    return {
      configuracoes: (data || []) as ConfiguracaoRepasse[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar configurações:', error)
    return {
      configuracoes: [],
      error: error instanceof Error ? error : new Error('Erro ao listar configurações'),
    }
  }
}

/**
 * Atualiza taxas em massa para todas as revendas de uma modalidade específica
 */
export async function atualizarTaxasEmMassa(
  modalidade: 'D+1' | 'D+15' | 'D+30',
  taxaPercentual: number,
  taxaFixa: number,
  aplicarEmTodas: boolean = true
): Promise<{ atualizadas: number; error: Error | null; mensagem?: string }> {
  try {
    console.log('🔄 [atualizarTaxasEmMassa] Iniciando atualização em massa:', {
      modalidade,
      taxaPercentual,
      taxaFixa,
      aplicarEmTodas,
    })

    // Validações
    if (taxaPercentual < 0 || taxaPercentual > 100) {
      return {
        atualizadas: 0,
        error: new Error('Taxa percentual deve estar entre 0 e 100'),
        mensagem: 'Taxa percentual inválida',
      }
    }

    if (taxaFixa < 0) {
      return {
        atualizadas: 0,
        error: new Error('Taxa fixa não pode ser negativa'),
        mensagem: 'Taxa fixa inválida',
      }
    }

    // Taxa fixa já vem em reais do banco, mas pode vir em centavos da UI
    // Se for >= 1, assume que está em centavos e converte para reais
    // Se for < 1, assume que já está em reais
    const taxaFixaReais = taxaFixa >= 1 && taxaFixa < 1000 ? taxaFixa / 100 : taxaFixa

    const { count, error } = await supabase
      .from('configuracoes_repasse_revenda')
      .update({
        taxa_percentual: taxaPercentual,
        taxa_fixa: taxaFixaReais,
      })
      .eq('modalidade', modalidade)

    if (error) {
      console.error('❌ [atualizarTaxasEmMassa] Erro ao atualizar taxas:', error)
      return {
        atualizadas: 0,
        error,
        mensagem: traduzirErro(error.message) || 'Erro ao atualizar taxas em massa',
      }
    }

    console.log(`✅ [atualizarTaxasEmMassa] ${count || 0} configuração(ões) atualizada(s)`)

    return {
      atualizadas: count || 0,
      error: null,
    }
  } catch (error) {
    console.error('❌ [atualizarTaxasEmMassa] Erro inesperado:', error)
    return {
      atualizadas: 0,
      error: error instanceof Error ? error : new Error('Erro ao atualizar taxas em massa'),
      mensagem: 'Erro inesperado ao atualizar taxas em massa',
    }
  }
}

/**
 * Busca taxas padrão de uma modalidade (pega a primeira configuração encontrada como referência)
 */
export async function buscarTaxasPadraoModalidade(
  modalidade: 'D+1' | 'D+15' | 'D+30'
): Promise<{ taxaPercentual: number; taxaFixa: number; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('configuracoes_repasse_revenda')
      .select('taxa_percentual, taxa_fixa')
      .eq('modalidade', modalidade)
      .limit(1)
      .single()

    if (error || !data) {
      // Valores padrão se não encontrar
      const padroes: Record<'D+1' | 'D+15' | 'D+30', { taxaPercentual: number; taxaFixa: number }> = {
        'D+1': { taxaPercentual: 8.0, taxaFixa: 0.5 },
        'D+15': { taxaPercentual: 6.5, taxaFixa: 0.5 },
        'D+30': { taxaPercentual: 5.0, taxaFixa: 0.5 },
      }
      return {
        ...padroes[modalidade],
        error: null,
      }
    }

    return {
      taxaPercentual: data.taxa_percentual,
      taxaFixa: data.taxa_fixa,
      error: null,
    }
  } catch (error) {
    console.error('❌ [buscarTaxasPadraoModalidade] Erro:', error)
    const padroes: Record<'D+1' | 'D+15' | 'D+30', { taxaPercentual: number; taxaFixa: number }> = {
      'D+1': { taxaPercentual: 8.0, taxaFixa: 0.5 },
      'D+15': { taxaPercentual: 6.5, taxaFixa: 0.5 },
      'D+30': { taxaPercentual: 5.0, taxaFixa: 0.5 },
    }
    return {
      ...padroes[modalidade],
      error: error instanceof Error ? error : new Error('Erro ao buscar taxas padrão'),
    }
  }
}

