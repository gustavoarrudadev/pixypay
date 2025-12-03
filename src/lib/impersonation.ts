import { supabase } from './supabase'
import { obterSessao } from './auth'

/**
 * Obtém o user_id do cliente atual
 * Se estiver em modo impersonation, retorna o clienteUserId do token
 * Caso contrário, retorna null (o código deve usar session.user.id)
 */
export async function obterClienteUserId(): Promise<string | null> {
  const impersonationData = localStorage.getItem('impersonation_mode')
  
  if (impersonationData) {
    try {
      const dados = JSON.parse(impersonationData)
      const agora = Date.now()
      const umaHora = 60 * 60 * 1000
      
      // Verifica se o token não expirou
      if (agora - dados.timestamp < umaHora) {
        // Verifica se o admin ainda está logado
        const session = await obterSessao()
        if (session?.user?.id === dados.adminUserId) {
          // Verifica se é impersonation de cliente
          if (dados.clienteUserId) {
            return dados.clienteUserId
          }
        }
      }
      
      // Token expirado ou admin não está mais logado, remove do localStorage
      localStorage.removeItem('impersonation_mode')
    } catch {
      // Dados inválidos, remove do localStorage
      localStorage.removeItem('impersonation_mode')
    }
  }
  
  // Se não está em modo impersonation, retorna null
  // O código que chama esta função deve usar session.user.id
  return null
}

/**
 * Obtém o clienteId (ID da tabela usuarios) do cliente atual
 * Considera modo impersonation se estiver ativo
 * Nota: Na verdade retorna o user_id, pois não existe tabela clientes separada
 */
export async function obterClienteId(): Promise<string | null> {
  const clienteUserId = await obterClienteUserId()
  
  // Se está em modo impersonation, retorna o clienteUserId diretamente
  // pois o ID da tabela usuarios é o mesmo que o user_id do auth
  if (clienteUserId) {
    return clienteUserId
  }
  
  // Se não está em modo impersonation, retorna o user_id da sessão atual
  const session = await obterSessao()
  if (!session?.user?.id) {
    return null
  }
  
  return session.user.id
}

/**
 * Obtém o user_id da revenda atual
 * Se estiver em modo impersonation, retorna o revendaUserId do token
 * Caso contrário, retorna o user_id da sessão atual
 */
export async function obterRevendaUserId(): Promise<string | null> {
  const impersonationData = localStorage.getItem('impersonation_mode')
  
  if (impersonationData) {
    try {
      const dados = JSON.parse(impersonationData)
      const agora = Date.now()
      const umaHora = 60 * 60 * 1000
      
      // Verifica se o token não expirou
      if (agora - dados.timestamp < umaHora) {
        // Verifica se o admin ainda está logado
        const session = await obterSessao()
        if (session?.user?.id === dados.adminUserId) {
          // Verifica se é impersonation de revenda
          if (dados.revendaUserId) {
            return dados.revendaUserId
          }
        }
      }
      
      // Token expirado ou admin não está mais logado, remove do localStorage
      localStorage.removeItem('impersonation_mode')
    } catch {
      // Dados inválidos, remove do localStorage
      localStorage.removeItem('impersonation_mode')
    }
  }
  
  // Se não está em modo impersonation, retorna null
  // O código que chama esta função deve usar session.user.id
  return null
}

/**
 * Obtém o revendaId (ID da tabela revendas) da revenda atual
 * Considera modo impersonation se estiver ativo
 * Suporta colaboradores de revenda
 */
export async function obterRevendaId(): Promise<string | null> {
  const revendaUserId = await obterRevendaUserId()
  
  // Se está em modo impersonation, usa o revendaUserId do token
  if (revendaUserId) {
    const { data: revendaData, error: revendaError } = await supabase
      .from('revendas')
      .select('id')
      .eq('user_id', revendaUserId)
      .single()
    
    if (revendaError) {
      console.error('❌ Erro ao buscar revenda em modo impersonation:', revendaError)
      return null
    }
    
    if (revendaData) {
      return revendaData.id
    }
  }
  
  // Se não está em modo impersonation, busca usando a sessão atual
  const session = await obterSessao()
  if (!session?.user?.id) {
    return null
  }
  
  // Verifica se é colaborador de revenda
  const role = session.user.user_metadata?.role as string
  if (role === 'colaborador_revenda') {
    // Busca revenda_id através da tabela colaboradores
    const { data: colaboradorData, error: colaboradorError } = await supabase
      .from('colaboradores')
      .select('revenda_id')
      .eq('usuario_id', session.user.id)
      .eq('ativo', true)
      .eq('tipo_colaborador', 'revenda')
      .single()
    
    if (colaboradorError) {
      console.error('❌ Erro ao buscar colaborador:', colaboradorError)
      return null
    }
    
    if (colaboradorData?.revenda_id) {
      return colaboradorData.revenda_id
    }
    
    return null
  }
  
  // Se não é colaborador, busca revenda diretamente pelo user_id
  const { data: revendaData, error: revendaError } = await supabase
    .from('revendas')
    .select('id')
    .eq('user_id', session.user.id)
    .single()
  
  if (revendaError) {
    // Se não encontrou revenda, pode ser que o usuário não seja uma revenda
    // Isso é normal se o usuário for cliente ou admin
    return null
  }
  
  return revendaData?.id || null
}

/**
 * Verifica se está em modo impersonation
 */
export function estaEmModoImpersonation(): boolean {
  const impersonationData = localStorage.getItem('impersonation_mode')
  if (!impersonationData) return false
  
  try {
    const dados = JSON.parse(impersonationData)
    const agora = Date.now()
    const umaHora = 60 * 60 * 1000
    return agora - dados.timestamp < umaHora
  } catch {
    return false
  }
}

/**
 * Remove o modo impersonation
 */
export function sairModoImpersonation(): void {
  localStorage.removeItem('impersonation_mode')
}

/**
 * Obtém o unidade_id do colaborador atual (se for colaborador_revenda)
 * Retorna:
 * - undefined: se não for colaborador (não filtrar)
 * - null: se for colaborador com acesso a todas as unidades (não filtrar no código, RLS já filtra)
 * - string: se for colaborador com acesso a unidade específica (filtrar por essa unidade)
 */
export async function obterUnidadeIdColaborador(): Promise<string | null | undefined> {
  const session = await obterSessao()
  if (!session?.user?.id) {
    return undefined
  }

  const role = session.user.user_metadata?.role as string
  if (role !== 'colaborador_revenda') {
    return undefined // Não é colaborador, retorna undefined para não filtrar
  }

  // Busca unidade_id do colaborador
  const { data: colaboradorData, error: colaboradorError } = await supabase
    .from('colaboradores')
    .select('unidade_id')
    .eq('usuario_id', session.user.id)
    .eq('ativo', true)
    .eq('tipo_colaborador', 'revenda')
    .single()

  if (colaboradorError) {
    console.error('❌ Erro ao buscar unidade_id do colaborador:', colaboradorError)
    return undefined
  }

  // Se unidade_id é null, significa que tem acesso a todas as unidades
  // Retorna null para indicar "todas as unidades" (RLS já filtra automaticamente)
  // Se unidade_id existe, retorna o ID específico para filtrar no código também
  return colaboradorData?.unidade_id || null
}

