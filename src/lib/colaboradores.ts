import { supabase } from '@/lib/supabase'

export interface Colaborador {
  id: string
  usuario_id: string
  nome_completo: string
  email: string
  ativo: boolean
  criado_em: string
  criado_por_nome?: string
  unidade_id?: string | null // null = acesso a todas unidades, string = acesso apenas àquela unidade
  nome_unidade?: string // Nome da unidade (quando unidade_id não é null)
}

export interface Permissao {
  funcionalidade: string
  pode_visualizar: boolean
  pode_criar: boolean
  pode_editar: boolean
  pode_excluir: boolean
}

export interface PermissaoForm {
  funcionalidade: string
  pode_visualizar: boolean
  pode_criar: boolean
  pode_editar: boolean
  pode_excluir: boolean
}

export interface CriarColaboradorData {
  nome_completo: string
  email: string
  senha: string
  unidade_id?: string | null // null = todas as unidades, string = unidade específica (apenas para revenda)
}

export interface CriarColaboradorResponse {
  success: boolean
  usuario_id?: string
  colaborador_id?: string
  email?: string
  senha?: string
  error?: string
}

/**
 * Lista colaboradores admin
 */
export async function listarColaboradoresAdmin(): Promise<{
  colaboradores: Colaborador[]
  error: Error | null
}> {
  try {
    const { data, error } = await supabase.rpc('listar_colaboradores_admin')

    if (error) {
      console.error('❌ Erro ao listar colaboradores admin:', error)
      return {
        colaboradores: [],
        error,
      }
    }

    return {
      colaboradores: (data || []) as Colaborador[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar colaboradores admin:', error)
    return {
      colaboradores: [],
      error: error instanceof Error ? error : new Error('Erro ao listar colaboradores'),
    }
  }
}

/**
 * Lista colaboradores de uma revenda
 */
export async function listarColaboradoresRevenda(
  revendaId: string
): Promise<{
  colaboradores: Colaborador[]
  error: Error | null
}> {
  try {
    if (!revendaId) {
      return {
        colaboradores: [],
        error: new Error('ID da revenda não fornecido'),
      }
    }

    console.log('🔍 Chamando listar_colaboradores_revenda com revendaId:', revendaId)
    
    const { data, error } = await supabase.rpc('listar_colaboradores_revenda', {
      p_revenda_id: revendaId,
    })

    if (error) {
      console.error('❌ Erro ao listar colaboradores revenda:', error)
      console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2))
      return {
        colaboradores: [],
        error: error instanceof Error ? error : new Error(error.message || 'Erro ao listar colaboradores'),
      }
    }

    console.log('✅ Colaboradores carregados:', data?.length || 0)

    return {
      colaboradores: (data || []) as Colaborador[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao listar colaboradores revenda:', error)
    return {
      colaboradores: [],
      error: error instanceof Error ? error : new Error('Erro ao listar colaboradores'),
    }
  }
}

/**
 * Busca permissões de um colaborador
 */
export async function buscarPermissoesColaborador(
  colaboradorId: string
): Promise<{
  permissoes: Permissao[]
  error: Error | null
}> {
  try {
    const { data, error } = await supabase.rpc('buscar_permissoes_colaborador', {
      p_colaborador_id: colaboradorId,
    })

    if (error) {
      console.error('❌ Erro ao buscar permissões:', error)
      return {
        permissoes: [],
        error,
      }
    }

    return {
      permissoes: (data || []) as Permissao[],
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar permissões:', error)
    return {
      permissoes: [],
      error: error instanceof Error ? error : new Error('Erro ao buscar permissões'),
    }
  }
}

/**
 * Cria um colaborador admin
 */
export async function criarColaboradorAdmin(
  dados: CriarColaboradorData
): Promise<CriarColaboradorResponse> {
  try {
    console.log('🔍 Criando colaborador admin:', {
      email: dados.email,
    })

    // Chama Edge Function para criar usuário com email confirmado
    // Usa fetch direto para ter melhor controle sobre erros
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return {
        success: false,
        error: 'Sessão não encontrada. Faça login novamente.',
      }
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/criar-usuario-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        email: dados.email,
        password: dados.senha,
        nome_completo: dados.nome_completo,
        role: 'admin',
        email_confirmado: true,
      }),
    })

    let responseData
    try {
      responseData = await response.json()
    } catch (jsonError) {
      console.error('❌ Erro ao fazer parse do JSON da resposta:', jsonError)
      const textResponse = await response.text()
      console.error('❌ Resposta em texto:', textResponse)
      return {
        success: false,
        error: `Erro ao processar resposta da Edge Function (${response.status})`,
      }
    }

    if (!response.ok) {
      console.error('❌ Erro na Edge Function:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      })
      console.error('❌ ResponseData completo:', JSON.stringify(responseData, null, 2))
      const errorMessage = responseData?.error || responseData?.details || `Erro ao criar usuário (${response.status})`
      const finalError = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
      console.error('❌ Mensagem de erro final:', finalError)
      return {
        success: false,
        error: finalError,
      }
    }

    // Verifica se a resposta contém erro
    if (responseData.error) {
      console.error('❌ Erro na resposta da Edge Function:', responseData.error)
      return {
        success: false,
        error: typeof responseData.error === 'string' ? responseData.error : responseData.error?.message || 'Erro ao criar usuário',
      }
    }

    // Verifica se responseData existe e tem user
    if (!responseData || !responseData.user) {
      console.error('❌ Resposta inválida da Edge Function:', responseData)
      return {
        success: false,
        error: 'Resposta inválida da Edge Function. Usuário não foi criado.',
      }
    }

    const userId = responseData.user.id

    if (!userId) {
      return {
        success: false,
        error: 'Usuário não foi criado',
      }
    }

    console.log('✅ Usuário criado com sucesso:', userId)

    // Criar registro em colaboradores
    const { data: colaboradorData, error: colaboradorError } = await supabase
      .from('colaboradores')
      .insert({
        usuario_id: userId,
        tipo_colaborador: 'admin',
        criado_por: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single()

    if (colaboradorError) {
      console.error('❌ Erro ao criar colaborador:', colaboradorError)
      return {
        success: false,
        error: colaboradorError.message || 'Erro ao criar registro de colaborador',
      }
    }

    // Não criar permissões de menus - colaborador vê todos os menus
    // Admin colaboradores têm acesso completo

    return {
      success: true,
      usuario_id: userId,
      colaborador_id: colaboradorData.id,
      email: dados.email,
      senha: dados.senha,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao criar colaborador admin:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado',
    }
  }
}

/**
 * Cria um colaborador de revenda
 */
export async function criarColaboradorRevenda(
  revendaId: string,
  dados: CriarColaboradorData
): Promise<CriarColaboradorResponse> {
  try {
    console.log('🔍 Criando colaborador revenda:', {
      email: dados.email,
      revendaId,
      unidade_id: dados.unidade_id,
    })

    // Obter sessão atual
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return {
        success: false,
        error: 'Sessão não encontrada. Faça login novamente.',
      }
    }

    // Chama Edge Function para criar usuário com email confirmado
    // Usa fetch direto para ter melhor controle sobre erros
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/criar-usuario-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        email: dados.email,
        password: dados.senha,
        nome_completo: dados.nome_completo,
        role: 'colaborador_revenda',
        email_confirmado: true,
        revenda_id: revendaId,
      }),
    })

    let responseData
    try {
      responseData = await response.json()
    } catch (jsonError) {
      console.error('❌ Erro ao fazer parse do JSON da resposta:', jsonError)
      const textResponse = await response.text()
      console.error('❌ Resposta em texto:', textResponse)
      return {
        success: false,
        error: `Erro ao processar resposta da Edge Function (${response.status})`,
      }
    }

    if (!response.ok) {
      console.error('❌ Erro na Edge Function:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      })
      console.error('❌ ResponseData completo:', JSON.stringify(responseData, null, 2))
      const errorMessage = responseData?.error || responseData?.details || `Erro ao criar usuário (${response.status})`
      const finalError = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
      console.error('❌ Mensagem de erro final:', finalError)
      return {
        success: false,
        error: finalError,
      }
    }

    // Verifica se a resposta contém erro
    if (responseData.error) {
      console.error('❌ Erro na resposta da Edge Function:', responseData.error)
      return {
        success: false,
        error: typeof responseData.error === 'string' ? responseData.error : responseData.error?.message || 'Erro ao criar usuário',
      }
    }

    // Verifica se responseData existe e tem user
    if (!responseData || !responseData.user) {
      console.error('❌ Resposta inválida da Edge Function:', responseData)
      return {
        success: false,
        error: 'Resposta inválida da Edge Function. Usuário não foi criado.',
      }
    }

    const userId = responseData.user.id

    if (!userId) {
      return {
        success: false,
        error: 'Usuário não foi criado',
      }
    }

    console.log('✅ Usuário criado com sucesso:', userId)

    // Criar registro em colaboradores
    const { data: colaboradorData, error: colaboradorError } = await supabase
      .from('colaboradores')
      .insert({
        usuario_id: userId,
        tipo_colaborador: 'revenda',
        revenda_id: revendaId,
        unidade_id: dados.unidade_id || null, // Opcional: unidade específica
        criado_por: session.user.id,
      })
      .select()
      .single()

    if (colaboradorError) {
      console.error('❌ Erro ao criar colaborador:', colaboradorError)
      return {
        success: false,
        error: colaboradorError.message || 'Erro ao criar registro de colaborador',
      }
    }

    // Não criar permissões de menus - colaborador vê todos os menus
    // O acesso aos dados é controlado pelo unidade_id:
    // - Se unidade_id é NULL: acesso a todas as unidades
    // - Se unidade_id tem valor: acesso apenas àquela unidade específica

    return {
      success: true,
      usuario_id: userId,
      colaborador_id: colaboradorData.id,
      email: dados.email,
      senha: dados.senha,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao criar colaborador revenda:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado',
    }
  }
}

/**
 * Atualiza permissões de um colaborador
 */
export async function atualizarPermissoesColaborador(
  colaboradorId: string,
  permissoes: PermissaoForm[]
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Deletar permissões existentes
    const { error: deleteError } = await supabase
      .from('permissoes_colaborador')
      .delete()
      .eq('colaborador_id', colaboradorId)

    if (deleteError) {
      return {
        success: false,
        error: deleteError,
      }
    }

    // Inserir novas permissões
    if (permissoes && permissoes.length > 0) {
      const permissoesInsert = permissoes.map((perm) => ({
        colaborador_id: colaboradorId,
        funcionalidade: perm.funcionalidade,
        pode_visualizar: perm.pode_visualizar,
        pode_criar: perm.pode_criar,
        pode_editar: perm.pode_editar,
        pode_excluir: perm.pode_excluir,
      }))

      const { error: insertError } = await supabase
        .from('permissoes_colaborador')
        .insert(permissoesInsert)

      if (insertError) {
        return {
          success: false,
          error: insertError,
        }
      }
    }

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

/**
 * Ativa/desativa um colaborador
 */
export async function atualizarStatusColaborador(
  colaboradorId: string,
  ativo: boolean
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('colaboradores')
      .update({ ativo })
      .eq('id', colaboradorId)

    if (error) {
      return {
        success: false,
        error,
      }
    }

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

/**
 * Atualiza dados de um colaborador (email, senha, nome, unidade_id)
 */
export async function atualizarColaborador(
  colaboradorId: string,
  dados: {
    nome_completo?: string
    email?: string
    senha?: string
    unidade_id?: string | null
  }
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Buscar colaborador para obter usuario_id
    const { data: colaboradorData, error: colaboradorError } = await supabase
      .from('colaboradores')
      .select('usuario_id')
      .eq('id', colaboradorId)
      .single()

    if (colaboradorError || !colaboradorData) {
      return {
        success: false,
        error: colaboradorError || new Error('Colaborador não encontrado'),
      }
    }

    const userId = colaboradorData.usuario_id

    // Se precisa atualizar email, senha ou nome_completo, usar Edge Function
    if (dados.email || dados.senha || dados.nome_completo) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return {
          success: false,
          error: new Error('Sessão não encontrada. Faça login novamente.'),
        }
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const requestBody: any = {
        userId,
      }
      
      // Só inclui campos que foram fornecidos
      if (dados.email) {
        requestBody.email = dados.email
      }
      if (dados.senha) {
        requestBody.password = dados.senha
      }
      if (dados.nome_completo) {
        requestBody.nome_completo = dados.nome_completo
        requestBody.display_name = dados.nome_completo
      }

      console.log('🔄 Chamando Edge Function para atualizar usuário:', {
        userId,
        temEmail: !!dados.email,
        temSenha: !!dados.senha,
        temNome: !!dados.nome_completo,
      })

      const response = await fetch(`${supabaseUrl}/functions/v1/atualizar-usuario-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify(requestBody),
      })

      let responseData
      try {
        responseData = await response.json()
      } catch (jsonError) {
        console.error('❌ Erro ao fazer parse do JSON da resposta:', jsonError)
        const textResponse = await response.text()
        console.error('❌ Resposta em texto:', textResponse)
        return {
          success: false,
          error: new Error(`Erro ao processar resposta da Edge Function (${response.status}): ${textResponse}`),
        }
      }

      if (!response.ok) {
        console.error('❌ Erro na Edge Function:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        })
        const errorMessage = responseData?.error || responseData?.details || `Erro ao atualizar usuário (${response.status})`
        const finalError = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
        console.error('❌ Mensagem de erro final:', finalError)
        return {
          success: false,
          error: new Error(finalError),
        }
      }

      if (responseData.error) {
        console.error('❌ Erro na resposta da Edge Function:', responseData.error)
        return {
          success: false,
          error: new Error(typeof responseData.error === 'string' ? responseData.error : responseData.error?.message || 'Erro ao atualizar usuário'),
        }
      }

      console.log('✅ Usuário atualizado com sucesso via Edge Function')
    }

    // Atualizar unidade_id na tabela colaboradores (se fornecido)
    if (dados.unidade_id !== undefined) {
      // Normalizar unidade_id: se for string vazio, converter para null
      const unidadeIdNormalizado = dados.unidade_id === '' || dados.unidade_id === null ? null : dados.unidade_id
      
      const updateData: any = {
        unidade_id: unidadeIdNormalizado, // Pode ser null (todas as unidades) ou string (unidade específica)
      }

      console.log('🔄 Atualizando unidade_id do colaborador:', {
        colaboradorId,
        unidade_id_original: dados.unidade_id,
        unidade_id_normalizado: unidadeIdNormalizado,
        updateData,
      })

      // Verificar se o colaborador existe e obter informações adicionais para debug
      const { data: colaboradorInfo, error: infoError } = await supabase
        .from('colaboradores')
        .select('id, revenda_id, tipo_colaborador, unidade_id')
        .eq('id', colaboradorId)
        .single()

      if (infoError) {
        console.error('❌ Erro ao buscar informações do colaborador:', infoError)
        return {
          success: false,
          error: infoError instanceof Error ? infoError : new Error(infoError.message || 'Erro ao buscar colaborador'),
        }
      }

      console.log('📊 Informações do colaborador antes da atualização:', colaboradorInfo)

      const { data: updateResult, error: updateColaboradorError } = await supabase
        .from('colaboradores')
        .update(updateData)
        .eq('id', colaboradorId)
        .select()

      if (updateColaboradorError) {
        console.error('❌ Erro ao atualizar colaborador:', updateColaboradorError)
        console.error('❌ Código do erro:', updateColaboradorError.code)
        console.error('❌ Mensagem do erro:', updateColaboradorError.message)
        console.error('❌ Detalhes do erro:', JSON.stringify(updateColaboradorError, null, 2))
        console.error('❌ Dados que tentaram ser atualizados:', updateData)
        console.error('❌ Colaborador ID:', colaboradorId)
        
        // Mensagem de erro mais detalhada
        let errorMessage = 'Erro ao atualizar colaborador'
        if (updateColaboradorError.message) {
          errorMessage = updateColaboradorError.message
        } else if (updateColaboradorError.code) {
          errorMessage = `Erro ${updateColaboradorError.code}: ${updateColaboradorError.message || 'Erro desconhecido'}`
        }
        
        return {
          success: false,
          error: updateColaboradorError instanceof Error ? updateColaboradorError : new Error(errorMessage),
        }
      }

      console.log('✅ Colaborador atualizado com sucesso:', updateResult)
    }

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar colaborador:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

/**
 * Remove um colaborador
 */
export async function removerColaborador(
  colaboradorId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    console.log('🔄 Removendo colaborador:', colaboradorId)

    // Buscar colaborador para obter usuario_id antes de deletar
    const { data: colaboradorData, error: buscarError } = await supabase
      .from('colaboradores')
      .select('usuario_id')
      .eq('id', colaboradorId)
      .single()

    if (buscarError || !colaboradorData) {
      console.error('❌ Colaborador não encontrado:', buscarError)
      return {
        success: false,
        error: buscarError || new Error('Colaborador não encontrado'),
      }
    }

    const userId = colaboradorData.usuario_id
    console.log('📋 Usuario ID do colaborador:', userId)

    // Deletar permissões primeiro (cascade deve fazer isso, mas garantindo)
    const { error: permissoesError } = await supabase
      .from('permissoes_colaborador')
      .delete()
      .eq('colaborador_id', colaboradorId)

    if (permissoesError) {
      console.warn('⚠️ Erro ao deletar permissões (pode ser cascade):', permissoesError)
    }

    // Deletar colaborador da tabela colaboradores
    const { error: deleteColaboradorError } = await supabase
      .from('colaboradores')
      .delete()
      .eq('id', colaboradorId)

    if (deleteColaboradorError) {
      console.error('❌ Erro ao deletar colaborador:', deleteColaboradorError)
      return {
        success: false,
        error: deleteColaboradorError,
      }
    }

    console.log('✅ Colaborador deletado da tabela colaboradores')

    // Deletar usuário de auth.users usando Edge Function
    // Isso é necessário porque o ON DELETE CASCADE não funciona entre colaboradores e auth.users
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.warn('⚠️ Sem sessão, não foi possível deletar usuário de auth.users')
        // Não falha a operação se não houver sessão, mas loga o aviso
        return {
          success: true,
          error: null,
        }
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/excluir-usuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          userId: userId,
        }),
      })

      let responseData
      try {
        responseData = await response.json()
      } catch (jsonError) {
        console.error('❌ Erro ao fazer parse do JSON da resposta:', jsonError)
        const textResponse = await response.text()
        console.error('❌ Resposta em texto:', textResponse)
        // Não falha a operação se apenas a Edge Function der erro
        return {
          success: true,
          error: null,
        }
      }

      if (!response.ok) {
        console.error('❌ Erro na Edge Function excluir-usuario:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        })
        // Não falha a operação se apenas a Edge Function der erro
        // O colaborador já foi deletado da tabela colaboradores
        return {
          success: true,
          error: null,
        }
      }

      if (responseData.error) {
        console.error('❌ Erro na resposta da Edge Function:', responseData.error)
        // Não falha a operação se apenas a Edge Function der erro
        return {
          success: true,
          error: null,
        }
      }

      console.log('✅ Usuário deletado de auth.users com sucesso')
    } catch (deleteUserError) {
      console.error('⚠️ Erro ao deletar usuário de auth.users (não crítico):', deleteUserError)
      // Não falha a operação se apenas isso der erro
      // O colaborador já foi deletado da tabela colaboradores
    }

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao remover colaborador:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

/**
 * Gera senha aleatória segura
 */
export function gerarSenhaAleatoria(): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*'
  const tamanho = 12
  let senha = ''

  // Garantir pelo menos uma maiúscula, uma minúscula, um número e um caractere especial
  senha += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  senha += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  senha += '0123456789'[Math.floor(Math.random() * 10)]
  senha += '!@#$%&*'[Math.floor(Math.random() * 8)]

  // Preencher o resto
  for (let i = senha.length; i < tamanho; i++) {
    senha += caracteres[Math.floor(Math.random() * caracteres.length)]
  }

  // Embaralhar
  return senha
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Reseta a senha de um colaborador e retorna a nova senha gerada
 */
export async function resetarSenhaColaborador(
  colaboradorId: string
): Promise<{ success: boolean; senha?: string; error: Error | null }> {
  try {
    console.log('🔄 Resetando senha do colaborador:', colaboradorId)

    // Buscar colaborador para obter usuario_id
    const { data: colaboradorData, error: colaboradorError } = await supabase
      .from('colaboradores')
      .select('usuario_id')
      .eq('id', colaboradorId)
      .single()

    if (colaboradorError || !colaboradorData) {
      console.error('❌ Colaborador não encontrado ou erro ao buscar:', colaboradorError)
      return {
        success: false,
        error: colaboradorError || new Error('Colaborador não encontrado'),
      }
    }

    const userId = colaboradorData.usuario_id

    // Gerar nova senha
    const novaSenha = gerarSenhaAleatoria()

    // Obter sessão atual
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return {
        success: false,
        error: new Error('Sessão não encontrada. Faça login novamente.'),
      }
    }

    // Chamar Edge Function para atualizar senha
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/atualizar-usuario-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        userId,
        password: novaSenha,
      }),
    })

    let responseData
    try {
      responseData = await response.json()
      console.log('📋 Resposta completa da Edge Function:', JSON.stringify(responseData, null, 2))
    } catch (jsonError) {
      console.error('❌ Erro ao fazer parse do JSON da resposta:', jsonError)
      const textResponse = await response.text()
      console.error('❌ Resposta em texto:', textResponse)
      return {
        success: false,
        error: new Error(`Erro ao processar resposta da Edge Function (${response.status}): ${textResponse}`),
      }
    }

    if (!response.ok) {
      console.error('❌ Erro na Edge Function:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        dataString: JSON.stringify(responseData, null, 2),
      })
      
      // Extrair mensagem de erro detalhada
      let errorMessage = `Erro ao resetar senha (${response.status})`
      
      if (responseData) {
        if (typeof responseData === 'string') {
          errorMessage = responseData
        } else if (responseData.error) {
          if (typeof responseData.error === 'string') {
            errorMessage = responseData.error
          } else if (responseData.error.message) {
            errorMessage = responseData.error.message
          } else {
            errorMessage = JSON.stringify(responseData.error)
          }
        } else if (responseData.details) {
          if (typeof responseData.details === 'string') {
            errorMessage = responseData.details
          } else if (responseData.details.message) {
            errorMessage = responseData.details.message
          } else {
            errorMessage = JSON.stringify(responseData.details)
          }
        } else {
          errorMessage = JSON.stringify(responseData)
        }
      }
      
      return {
        success: false,
        error: new Error(errorMessage),
      }
    }

    if (responseData?.error) {
      console.error('❌ Erro na resposta da Edge Function:', responseData.error)
      const errorMsg = typeof responseData.error === 'string' 
        ? responseData.error 
        : responseData.error?.message || JSON.stringify(responseData.error)
      return {
        success: false,
        error: new Error(errorMsg),
      }
    }

    console.log('✅ Senha resetada com sucesso')

    return {
      success: true,
      senha: novaSenha,
      error: null,
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao resetar senha:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro inesperado'),
    }
  }
}

