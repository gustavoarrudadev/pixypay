import { supabase } from './supabase'
import { traduzirErro } from './traduzirErro'
import { enviarMagicLink, recuperarSenha } from './auth'

export interface RevendaCompleta {
  id: string
  nome_revenda: string
  cnpj: string
  nome_responsavel: string
  cpf_responsavel: string
  telefone: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  marcas_trabalhadas: string[] | null
  criado_em: string
  atualizado_em: string
  // Dados do usuário associado
  user_id?: string | null
  email?: string | null
  email_confirmado?: boolean
  // Campos de banimento (vindos da tabela usuarios)
  esta_banido?: boolean
  banido_at?: string | null
  banido_ate?: string | null
  // Campos de conta PIX
  conta_pix_nome_completo?: string | null
  conta_pix_cpf_cnpj?: string | null
  conta_pix_chave?: string | null
  conta_pix_tipo?: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'CHAVE_ALEATORIA' | null
}

/**
 * Lista todas as revendas cadastradas
 */
export async function listarRevendas(): Promise<{ revendas: RevendaCompleta[]; error: Error | null }> {
  try {
    console.log('🔍 Buscando revendas...')
    
    // Usar função RPC para buscar revendas com email e status
    const { data, error } = await supabase
      .rpc('listar_revendas_com_email')

    if (error) {
      console.error('❌ Erro ao listar revendas:', error)
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return { revendas: [], error }
    }

    console.log('✅ Revendas encontradas:', data?.length || 0)

    // Mapear dados para garantir compatibilidade
    const revendasMapeadas = (data || []).map((revenda: any) => {
      // Converter marcas_trabalhadas de ARRAY para array de strings se necessário
      let marcas = null
      if (revenda.marcas_trabalhadas) {
        if (Array.isArray(revenda.marcas_trabalhadas)) {
          marcas = revenda.marcas_trabalhadas
        } else if (typeof revenda.marcas_trabalhadas === 'string') {
          try {
            marcas = JSON.parse(revenda.marcas_trabalhadas)
          } catch {
            marcas = [revenda.marcas_trabalhadas]
          }
        } else {
          marcas = revenda.marcas_trabalhadas
        }
      }

      return {
        ...revenda,
        criado_em: revenda.criado_em || revenda.created_at || new Date().toISOString(),
        atualizado_em: revenda.atualizado_em || revenda.updated_at || revenda.criado_em || revenda.created_at || new Date().toISOString(),
        marcas_trabalhadas: marcas,
        email: revenda.email || null,
        email_confirmado: revenda.email_confirmado || false,
        esta_banido: revenda.esta_banido || false,
        banido_at: revenda.banido_at || null,
        banido_ate: revenda.banido_ate || null,
        // Garantir que campos opcionais sejam null se não existirem
        cep: revenda.cep || null,
        logradouro: revenda.logradouro || null,
        numero: revenda.numero || null,
        complemento: revenda.complemento || null,
        bairro: revenda.bairro || null,
        cidade: revenda.cidade || null,
        estado: revenda.estado || null,
      }
    })

    console.log('✅ Revendas mapeadas:', revendasMapeadas.length)
    return { revendas: revendasMapeadas, error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar revendas:', error)
    return {
      revendas: [],
      error: error instanceof Error ? error : new Error('Erro ao listar revendas'),
    }
  }
}

/**
 * Busca detalhes completos de uma revenda específica
 */
export async function buscarDetalhesRevenda(revendaId: string): Promise<{ revenda: RevendaCompleta | null; error: Error | null }> {
  try {
    // Primeiro tenta usar a função RPC
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('buscar_detalhes_revenda', { revenda_id: revendaId })
      .single()

    if (!rpcError && rpcData) {
      // Processa marcas_trabalhadas se necessário
      let marcas = rpcData.marcas_trabalhadas
      if (marcas && typeof marcas === 'string') {
        try {
          marcas = JSON.parse(marcas)
        } catch {
          marcas = [marcas]
        }
      }
      
      // Busca dados de banimento da tabela usuarios se não vieram na RPC
      let estaBanido = rpcData.esta_banido || false
      let banidoAt = rpcData.banido_at || null
      let banidoAte = rpcData.banido_ate || null
      
      if (rpcData.user_id && (!estaBanido && !banidoAt && !banidoAte)) {
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('banido_at, banido_ate, esta_banido')
          .eq('id', rpcData.user_id)
          .single()
        
        if (usuarioData) {
          estaBanido = usuarioData.esta_banido || false
          banidoAt = usuarioData.banido_at || null
          banidoAte = usuarioData.banido_ate || null
        }
      }
      
      return { 
        revenda: {
          ...rpcData,
          marcas_trabalhadas: Array.isArray(marcas) ? marcas : null,
          esta_banido: estaBanido,
          banido_at: banidoAt,
          banido_ate: banidoAte,
        }, 
        error: null 
      }
    }

    // Se a RPC falhar, busca diretamente da tabela e faz join manual
    // Não loga erro se for apenas um 400 (função pode não existir ou ter problemas de permissão)
    if (rpcError && (rpcError as any).code !== 'P0001' && (rpcError as any).status !== 400) {
      console.warn('⚠️ RPC buscar_detalhes_revenda falhou, usando fallback:', rpcError)
    }
    
    // Tenta buscar diretamente da tabela - primeiro tenta apenas campos essenciais para evitar problemas de RLS
    // Se o usuário estiver autenticado, a política RLS permitirá acesso
    let revendaData = null
    let revendaError = null
    
    // Primeiro tenta buscar apenas campos essenciais (mais provável de passar pelo RLS)
    const { data: revendaEssencial, error: erroEssencial } = await supabase
      .from('revendas')
      .select('id, nome_revenda, nome_publico, descricao_loja, logo_url, ativo')
      .eq('id', revendaId)
      .maybeSingle()
    
    if (!erroEssencial && revendaEssencial) {
      // Se encontrou com busca essencial, tenta buscar campos completos
      const { data: revendaCompleta, error: erroCompleto } = await supabase
        .from('revendas')
        .select(`
          id,
          nome_revenda,
          nome_publico,
          descricao_loja,
          logo_url,
          link_publico,
          ativo,
          criado_em,
          atualizado_em,
          user_id,
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          telefone,
          marcas_trabalhadas,
          conta_pix_nome_completo,
          conta_pix_cpf_cnpj,
          conta_pix_chave,
          conta_pix_tipo,
          taxa_entrega,
          oferecer_entrega,
          oferecer_retirada_local,
          oferecer_agendamento,
          agendamento_entrega_livre,
          agendamento_horarios_disponiveis,
          agendamento_dias_disponiveis
        `)
        .eq('id', revendaId)
        .maybeSingle()
      
      if (!erroCompleto && revendaCompleta) {
        revendaData = revendaCompleta
      } else {
        // Se busca completa falhou, usa dados essenciais
        revendaData = revendaEssencial
      }
    } else {
      revendaError = erroEssencial
    }

    if (revendaError) {
      console.error('❌ Erro ao buscar revenda:', revendaError)
      // Se for erro 406 (Not Acceptable) ou qualquer erro, tenta buscar apenas campos essenciais
      console.warn('⚠️ Erro ao buscar revenda, tentando buscar apenas campos essenciais')
      // Tenta buscar apenas campos essenciais (que podem passar pelo RLS público)
      const { data: revendaMinima, error: erroMinimo } = await supabase
        .from('revendas')
        .select('id, nome_revenda, nome_publico, descricao_loja, logo_url, ativo')
        .eq('id', revendaId)
        .maybeSingle()
      
      if (!erroMinimo && revendaMinima) {
        console.log('✅ Revenda encontrada com busca mínima:', revendaMinima.id)
        return {
          revenda: {
            ...revendaMinima,
            cnpj: revendaMinima.cnpj || '',
            nome_responsavel: null,
            cpf_responsavel: null,
            telefone: null,
            cep: '',
            logradouro: '',
            numero: '',
            complemento: null,
            bairro: '',
            cidade: '',
            estado: '',
            marcas_trabalhadas: null,
            user_id: null,
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString(),
            email: null,
            email_confirmado: false,
            conta_pix_nome_completo: null,
            conta_pix_cpf_cnpj: null,
            conta_pix_chave: null,
            conta_pix_tipo: null,
            taxa_entrega: 0,
            oferecer_entrega: true,
            oferecer_retirada_local: true,
            oferecer_agendamento: true,
            agendamento_entrega_livre: true,
            agendamento_horarios_disponiveis: [],
            agendamento_dias_disponiveis: [0, 1, 2, 3, 4, 5, 6],
            link_publico: null,
          } as RevendaCompleta,
          error: null
        }
      }
      
      // Se mesmo a busca mínima falhou, retorna erro
      return { 
        revenda: null, 
        error: revendaError || new Error('Revenda não encontrada')
      }
    }

    if (!revendaData) {
      console.warn('⚠️ Revenda não encontrada, tentando busca mínima:', revendaId)
      // Tenta busca mínima como último recurso
      const { data: revendaMinima, error: erroMinimo } = await supabase
        .from('revendas')
        .select('id, nome_revenda, nome_publico, descricao_loja, logo_url, ativo')
        .eq('id', revendaId)
        .maybeSingle()
      
      if (!erroMinimo && revendaMinima) {
        console.log('✅ Revenda encontrada com busca mínima (fallback):', revendaMinima.id)
        return {
          revenda: {
            ...revendaMinima,
            cnpj: revendaMinima.cnpj || '',
            nome_responsavel: null,
            cpf_responsavel: null,
            telefone: null,
            cep: '',
            logradouro: '',
            numero: '',
            complemento: null,
            bairro: '',
            cidade: '',
            estado: '',
            marcas_trabalhadas: null,
            user_id: null,
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString(),
            email: null,
            email_confirmado: false,
            conta_pix_nome_completo: null,
            conta_pix_cpf_cnpj: null,
            conta_pix_chave: null,
            conta_pix_tipo: null,
            taxa_entrega: 0,
            oferecer_entrega: true,
            oferecer_retirada_local: true,
            oferecer_agendamento: true,
            agendamento_entrega_livre: true,
            agendamento_horarios_disponiveis: [],
            agendamento_dias_disponiveis: [0, 1, 2, 3, 4, 5, 6],
            link_publico: null,
          } as RevendaCompleta,
          error: null
        }
      }
      
      return { 
        revenda: null, 
        error: new Error('Revenda não encontrada')
      }
    }

    // Busca dados do usuário associado usando a função RPC listar_revendas_com_email para obter email e banimento
    let email = null
    let emailConfirmado = false
    let estaBanido = false
    let banidoAt = null
    let banidoAte = null
    
    if (revendaData.user_id) {
      // Usa a função RPC que já faz o join correto com auth.users
      try {
        const { data: revendasComEmail, error: rpcError } = await supabase
          .rpc('listar_revendas_com_email')
        
        if (!rpcError && revendasComEmail) {
          const revendaCompleta = revendasComEmail.find((r: any) => r.id === revendaId)
          
          if (revendaCompleta) {
            email = revendaCompleta.email || null
            emailConfirmado = revendaCompleta.email_confirmado || false
            estaBanido = revendaCompleta.esta_banido || false
            banidoAt = revendaCompleta.banido_at || null
            banidoAte = revendaCompleta.banido_ate || null
          }
        }
      } catch (rpcError) {
        console.warn('⚠️ Erro ao usar RPC listar_revendas_com_email, usando fallback:', rpcError)
      }
      
      // Fallback: busca da tabela usuarios se RPC não retornou dados
      if (!email) {
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('email, banido_at, banido_ate, esta_banido')
          .eq('id', revendaData.user_id)
          .single()
        
        if (usuarioData) {
          email = usuarioData.email || null
          estaBanido = usuarioData.esta_banido || false
          banidoAt = usuarioData.banido_at || null
          banidoAte = usuarioData.banido_ate || null
        }
      }
      
      // Se ainda não tem email, busca do auth.users diretamente (se for o próprio usuário)
      if (!email) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user && user.id === revendaData.user_id) {
            email = user.email || null
            emailConfirmado = !!user.email_confirmed_at
          }
        } catch {
          // Ignora erro
        }
      }
    }

    // Processa marcas_trabalhadas - pode vir como ARRAY, JSONB ou string
    let marcas = revendaData.marcas_trabalhadas
    if (marcas) {
      // Se for string, tenta fazer parse
      if (typeof marcas === 'string') {
        try {
          marcas = JSON.parse(marcas)
        } catch {
          // Se não conseguir fazer parse, trata como array com um único item
          marcas = [marcas]
        }
      }
      // Se for JSONB (objeto), converte para array
      if (marcas && typeof marcas === 'object' && !Array.isArray(marcas)) {
        marcas = Object.values(marcas)
      }
      // Se não for array válido, define como null
      if (!Array.isArray(marcas)) {
        marcas = null
      }
    } else {
      marcas = null
    }

    return { 
      revenda: {
        ...revendaData,
        marcas_trabalhadas: marcas,
        email: email,
        email_confirmado: emailConfirmado,
        esta_banido: estaBanido,
        banido_at: banidoAt,
        banido_ate: banidoAte,
        criado_em: revendaData.criado_em || revendaData.created_at || new Date().toISOString(),
        atualizado_em: revendaData.atualizado_em || revendaData.updated_at || revendaData.criado_em || revendaData.created_at || new Date().toISOString(),
      }, 
      error: null 
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar detalhes da revenda:', error)
    return {
      revenda: null,
      error: error instanceof Error ? error : new Error('Erro ao buscar detalhes da revenda'),
    }
  }
}

/**
 * Cria uma nova revenda
 * Cria tanto na tabela revendas quanto no auth.users
 */
export async function criarRevenda(
  dados: {
    nome_revenda: string
    cnpj: string
    nome_responsavel: string
    cpf_responsavel: string
    telefone?: string
    cep: string  // Obrigatório
    logradouro: string  // Obrigatório
    numero: string  // Obrigatório
    complemento?: string  // Opcional
    bairro: string  // Obrigatório
    cidade: string  // Obrigatório
    estado: string  // Obrigatório
    marcas_trabalhadas?: string[]
    email: string
    senha?: string
    enviar_magic_link?: boolean
  }
): Promise<{ error: Error | null; mensagem?: string; revenda?: RevendaCompleta }> {
  try {
    // Primeiro cria o usuário no Supabase Auth via Edge Function
    // Remove valores undefined do body
    const bodyUsuario: any = {
      email: dados.email.trim(),
      nome_completo: dados.nome_responsavel.trim(),
      role: 'revenda',
      enviar_magic_link: dados.enviar_magic_link || false,
    };

    // Adiciona apenas campos que existem e não são vazios
    if (dados.senha && dados.senha.trim() !== '') {
      bodyUsuario.password = dados.senha;
    }
    if (dados.telefone && dados.telefone.trim() !== '') {
      bodyUsuario.telefone = dados.telefone.trim();
    }
    if (dados.cpf_responsavel && dados.cpf_responsavel.trim() !== '') {
      bodyUsuario.cpf = dados.cpf_responsavel.trim();
    }

    console.log('📝 Criando usuário revenda:', {
      email: bodyUsuario.email,
      temSenha: !!bodyUsuario.password,
      temTelefone: !!bodyUsuario.telefone,
      temCpf: !!bodyUsuario.cpf,
    });

    // Usar fetch direto para ter melhor controle sobre erros
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return {
        error: new Error('Sessão não encontrada'),
        mensagem: 'Você precisa estar autenticado para criar uma revenda.',
      };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/criar-usuario-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify(bodyUsuario),
    });

    let responseData;
    try {
      responseData = await response.json();
      console.log('📋 Resposta completa da Edge Function:', JSON.stringify(responseData, null, 2));
    } catch (jsonError) {
      console.error('❌ Erro ao fazer parse do JSON da resposta:', jsonError);
      const textResponse = await response.text();
      console.error('❌ Resposta em texto:', textResponse);
      return {
        error: new Error(`Erro ao processar resposta da Edge Function (${response.status})`),
        mensagem: `Erro ao criar usuário da revenda (${response.status}): ${textResponse}`,
      };
    }

    if (!response.ok) {
      console.error('❌ Erro na Edge Function:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        dataString: JSON.stringify(responseData, null, 2),
      });
      
      // Extrair mensagem de erro detalhada
      let errorMessage = `Erro ao criar usuário da revenda (${response.status})`;
      
      if (responseData) {
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData.error) {
          if (typeof responseData.error === 'string') {
            errorMessage = responseData.error;
          } else if (responseData.error.message) {
            errorMessage = responseData.error.message;
          } else {
            errorMessage = JSON.stringify(responseData.error);
          }
        } else if (responseData.details) {
          if (typeof responseData.details === 'string') {
            errorMessage = responseData.details;
          } else if (responseData.details.message) {
            errorMessage = responseData.details.message;
          } else {
            errorMessage = JSON.stringify(responseData.details);
          }
        } else {
          errorMessage = JSON.stringify(responseData);
        }
      }
      
      return {
        error: new Error(errorMessage),
        mensagem: traduzirErro(errorMessage) || errorMessage,
      };
    }

    // Verifica se a resposta contém erro mesmo com status 200
    if (responseData?.error) {
      console.error('❌ Erro na resposta da Edge Function:', responseData.error);
      const errorMessage = responseData.details || responseData.error;
      return {
        error: new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)),
        mensagem: traduzirErro(errorMessage) || (typeof errorMessage === 'string' ? errorMessage : 'Erro ao criar usuário da revenda'),
      };
    }

    // Verifica se responseData existe e tem user
    if (!responseData || !responseData.user) {
      console.error('❌ Resposta inválida da Edge Function:', responseData);
      return {
        error: new Error('Resposta inválida da Edge Function'),
        mensagem: 'Resposta inválida da Edge Function. Usuário não foi criado.',
      };
    }

    const userId = responseData.user.id;

    if (!userId) {
      return {
        error: new Error('Usuário não foi criado'),
        mensagem: 'Erro ao criar usuário da revenda. Tente novamente.',
      };
    }

    console.log('✅ Usuário criado com sucesso:', userId);

    // Agora cria o registro na tabela revendas
    // Validação: todos os campos de endereço são obrigatórios exceto complemento
    if (!dados.cep || !dados.logradouro || !dados.numero || !dados.bairro || !dados.cidade || !dados.estado) {
      return {
        error: new Error('Campos de endereço incompletos'),
        mensagem: 'Todos os campos de endereço são obrigatórios (CEP, Logradouro, Número, Bairro, Cidade e Estado). Apenas Complemento é opcional.',
      }
    }

    const { data: revendaData, error: revendaError } = await supabase
      .from('revendas')
      .insert({
        nome_revenda: dados.nome_revenda,
        cnpj: dados.cnpj.replace(/\D/g, ''),
        nome_responsavel: dados.nome_responsavel,
        cpf_responsavel: dados.cpf_responsavel.replace(/\D/g, ''),
        telefone: dados.telefone ? dados.telefone.replace(/\D/g, '') : null,
        cep: dados.cep.replace(/\D/g, ''),
        logradouro: dados.logradouro.trim(),
        numero: dados.numero.trim(),
        complemento: dados.complemento ? dados.complemento.trim() : null,
        bairro: dados.bairro.trim(),
        cidade: dados.cidade.trim(),
        estado: dados.estado.trim().toUpperCase(),
        marcas_trabalhadas: dados.marcas_trabalhadas && dados.marcas_trabalhadas.length > 0 ? dados.marcas_trabalhadas : null,
        user_id: userId,
      })
      .select()
      .single()

    if (revendaError) {
      // Se falhar ao criar na tabela, tenta remover o usuário criado
      console.error('❌ Erro ao criar revenda na tabela:', revendaError)
      return {
        error: revendaError,
        mensagem: 'Usuário criado, mas erro ao criar registro da revenda. ' + (revendaError.message || ''),
      }
    }

    return { error: null, revenda: revendaData }
  } catch (error) {
    console.error('❌ Erro inesperado ao criar revenda:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao criar revenda'),
      mensagem: 'Erro inesperado ao criar revenda.',
    }
  }
}

/**
 * Atualiza dados de uma revenda
 */
export async function atualizarRevenda(
  revendaId: string,
  dados: {
    nome_revenda?: string
    cnpj?: string
    nome_responsavel?: string
    cpf_responsavel?: string
    telefone?: string
    cep?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
    marcas_trabalhadas?: string[]
    email?: string
    conta_pix_nome_completo?: string
    conta_pix_cpf_cnpj?: string
    conta_pix_chave?: string
    conta_pix_tipo?: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'CHAVE_ALEATORIA'
  }
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    const updateData: any = {}

    if (dados.nome_revenda !== undefined) updateData.nome_revenda = dados.nome_revenda.trim()
    if (dados.cnpj !== undefined) updateData.cnpj = dados.cnpj.replace(/\D/g, '')
    if (dados.nome_responsavel !== undefined) updateData.nome_responsavel = dados.nome_responsavel.trim()
    if (dados.cpf_responsavel !== undefined) updateData.cpf_responsavel = dados.cpf_responsavel.replace(/\D/g, '')
    if (dados.telefone !== undefined) updateData.telefone = dados.telefone ? dados.telefone.replace(/\D/g, '') : null
    if (dados.cep !== undefined) updateData.cep = dados.cep ? dados.cep.replace(/\D/g, '') : null
    if (dados.logradouro !== undefined) updateData.logradouro = dados.logradouro ? dados.logradouro.trim() : null
    if (dados.numero !== undefined) updateData.numero = dados.numero ? dados.numero.trim() : null
    if (dados.complemento !== undefined) updateData.complemento = dados.complemento ? dados.complemento.trim() : null
    if (dados.bairro !== undefined) updateData.bairro = dados.bairro ? dados.bairro.trim() : null
    if (dados.cidade !== undefined) updateData.cidade = dados.cidade ? dados.cidade.trim() : null
    if (dados.estado !== undefined) updateData.estado = dados.estado ? dados.estado.trim().toUpperCase() : null
    if (dados.marcas_trabalhadas !== undefined) updateData.marcas_trabalhadas = dados.marcas_trabalhadas && dados.marcas_trabalhadas.length > 0 ? dados.marcas_trabalhadas : null
    if (dados.conta_pix_nome_completo !== undefined) updateData.conta_pix_nome_completo = dados.conta_pix_nome_completo ? dados.conta_pix_nome_completo.trim() : null
    if (dados.conta_pix_cpf_cnpj !== undefined) updateData.conta_pix_cpf_cnpj = dados.conta_pix_cpf_cnpj ? dados.conta_pix_cpf_cnpj.replace(/\D/g, '') : null
    if (dados.conta_pix_chave !== undefined) updateData.conta_pix_chave = dados.conta_pix_chave ? dados.conta_pix_chave.trim() : null
    if (dados.conta_pix_tipo !== undefined) updateData.conta_pix_tipo = dados.conta_pix_tipo || null

    const { error } = await supabase
      .from('revendas')
      .update(updateData)
      .eq('id', revendaId)

    if (error) {
      return {
        error,
        mensagem: error.message || 'Erro ao atualizar revenda',
      }
    }

    // Se o email foi alterado OU outros campos que precisam sincronizar com auth.users
    if (dados.email || dados.nome_responsavel || dados.telefone || dados.cpf_responsavel) {
      // Busca o user_id da revenda
      const { data: revendaData } = await supabase
        .from('revendas')
        .select('user_id')
        .eq('id', revendaId)
        .single()

      if (revendaData?.user_id) {
        const updateUserBody: any = {}
        
        if (dados.email) {
          updateUserBody.email = dados.email
        }
        if (dados.nome_responsavel !== undefined) {
          updateUserBody.display_name = dados.nome_responsavel
          updateUserBody.nome_completo = dados.nome_responsavel
        }
        if (dados.telefone !== undefined) {
          updateUserBody.telefone = dados.telefone ? dados.telefone.replace(/\D/g, '') : null
        }
        if (dados.cpf_responsavel !== undefined) {
          updateUserBody.cpf = dados.cpf_responsavel.replace(/\D/g, '')
        }

        if (Object.keys(updateUserBody).length > 0) {
          const { error: updateUserError } = await supabase.functions.invoke('atualizar-usuario-admin', {
            body: {
              userId: revendaData.user_id,
              ...updateUserBody,
            },
          })

          if (updateUserError) {
            console.warn('⚠️ Erro ao atualizar dados no auth.users:', updateUserError)
            // Não falha a atualização se apenas o auth.users não puder ser atualizado
          }
        }
      }
    }

    return { error: null }
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Erro ao atualizar revenda'),
      mensagem: 'Erro inesperado ao atualizar revenda.',
    }
  }
}

/**
 * Exclui uma revenda
 */
/**
 * Bloqueia ou desbloqueia uma revenda
 */
export async function bloquearRevenda(
  revendaId: string,
  bloquear: boolean,
  tempoBanimento?: string
): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    console.log('🔒 Chamando Edge Function bloquear-usuario para revenda:', {
      revendaId,
      bloquear,
      tempoBanimento,
    })

    // Busca o user_id da revenda
    const { data: revendaData, error: revendaError } = await supabase
      .from('revendas')
      .select('user_id')
      .eq('id', revendaId)
      .single()

    if (revendaError || !revendaData || !revendaData.user_id) {
      return {
        error: new Error('Revenda não encontrada'),
        mensagem: 'Revenda não encontrada ou sem usuário associado.',
      }
    }

    // Verificar se o admin está autenticado
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('❌ Usuário não autenticado')
      return {
        error: new Error('Usuário não autenticado'),
        mensagem: 'Você precisa estar autenticado para realizar esta ação.',
      }
    }

    // Tenta bloquear via Edge Function usando o user_id
    const { data, error } = await supabase.functions.invoke('bloquear-usuario', {
      body: { 
        userId: revendaData.user_id, 
        bloquear,
        tempoBanimento: bloquear ? tempoBanimento : undefined,
      },
    })

    console.log('📊 Resposta da Edge Function:', { 
      data, 
      error,
      temData: !!data,
      temErro: !!error,
      erroMessage: error?.message,
      dataError: data?.error
    })

    if (error) {
      console.error('❌ Erro na chamada da Edge Function:', error)
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        return {
          error,
          mensagem: 'Edge Function "bloquear-usuario" não encontrada. Verifique se a função foi deployada corretamente no Supabase.',
        }
      }
      if (error.message?.includes('non-2xx') || error.message?.includes('status code')) {
        return {
          error,
          mensagem: data?.error || 'Erro ao processar banimento. Verifique os logs da Edge Function no Supabase.',
        }
      }
      return {
        error,
        mensagem: error.message || 'Erro ao chamar Edge Function de banimento. Verifique o console para mais detalhes.',
      }
    }

    if (data?.error) {
      console.error('❌ Erro retornado pela Edge Function:', data.error)
      return {
        error: new Error(data.error),
        mensagem: typeof data.error === 'string' ? data.error : 'Erro ao aplicar banimento. Verifique os logs da Edge Function.',
      }
    }

    if (data?.success === false) {
      console.error('❌ Operação falhou:', data)
      return {
        error: new Error('Operação falhou'),
        mensagem: data.error || 'Falha ao aplicar banimento.',
      }
    }

    console.log('✅ Banimento aplicado com sucesso')
    return { error: null }
  } catch (error) {
    console.error('❌ Erro inesperado ao bloquear revenda:', error)
    return {
      error: error instanceof Error ? error : new Error('Erro ao bloquear revenda'),
      mensagem: error instanceof Error ? error.message : 'Erro inesperado ao bloquear revenda. Verifique o console para mais detalhes.',
    }
  }
}

export async function excluirRevenda(revendaId: string): Promise<{ error: Error | null; mensagem?: string }> {
  try {
    // Busca o user_id antes de excluir
    const { data: revendaData } = await supabase
      .from('revendas')
      .select('user_id')
      .eq('id', revendaId)
      .single()

    // Exclui da tabela revendas
    const { error } = await supabase
      .from('revendas')
      .delete()
      .eq('id', revendaId)

    if (error) {
      return {
        error,
        mensagem: error.message || 'Erro ao excluir revenda',
      }
    }

    // Se houver user_id, tenta excluir o usuário também
    if (revendaData?.user_id) {
      const { error: deleteUserError } = await supabase.functions.invoke('excluir-usuario', {
        body: { userId: revendaData.user_id },
      })

      if (deleteUserError) {
        console.warn('⚠️ Erro ao excluir usuário do auth:', deleteUserError)
        // Não falha se apenas o usuário não puder ser excluído
      }
    }

    return { error: null }
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Erro ao excluir revenda'),
      mensagem: 'Erro inesperado ao excluir revenda.',
    }
  }
}

/**
 * Envia Magic Link para uma revenda específica
 */
export async function enviarMagicLinkRevenda(email: string): Promise<{ error: Error | null; mensagem?: string }> {
  return await enviarMagicLink(email)
}

/**
 * Envia email de redefinição de senha para uma revenda
 */
export async function enviarRedefinicaoSenhaRevenda(email: string): Promise<{ error: Error | null; mensagem?: string }> {
  return await recuperarSenha(email)
}

