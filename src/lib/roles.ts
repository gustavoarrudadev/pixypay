import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'revenda' | 'cliente'

/**
 * Obtém o role do usuário atual
 */
export async function obterRoleUsuario(): Promise<UserRole | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    return (user.user_metadata?.role as UserRole) || 'cliente'
  } catch (error) {
    return null
  }
}

/**
 * Obtém o role de um usuário específico
 * Colaboradores de revenda são tratados como revenda para fins de navegação
 */
export function obterRoleDeUsuario(user: User | null): UserRole {
  if (!user) return 'cliente'
  const role = user.user_metadata?.role as string
  
  // Colaboradores de revenda são tratados como revenda para navegação
  if (role === 'colaborador_revenda') {
    return 'revenda'
  }
  
  return (role as UserRole) || 'cliente'
}

/**
 * Verifica se o usuário é admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await obterRoleUsuario()
  return role === 'admin'
}

/**
 * Verifica se o usuário é revenda
 */
export async function isRevenda(): Promise<boolean> {
  const role = await obterRoleUsuario()
  return role === 'revenda'
}

/**
 * Verifica se o usuário é cliente
 */
export async function isCliente(): Promise<boolean> {
  const role = await obterRoleUsuario()
  return role === 'cliente'
}

