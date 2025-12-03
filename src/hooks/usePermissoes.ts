import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'

export type AcaoPermissao = 'visualizar' | 'criar' | 'editar' | 'excluir'

/**
 * Hook para verificar permissões do usuário atual
 */
export function usePermissoes() {
  const [permissoes, setPermissoes] = useState<Map<string, Set<AcaoPermissao>>>(new Map())
  const [carregando, setCarregando] = useState(true)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    carregarPermissoes()
  }, [])

  const carregarPermissoes = async () => {
    try {
      const sessao = await obterSessao()
      if (!sessao?.user) {
        setCarregando(false)
        return
      }

      // Buscar role do usuário
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', sessao.user.id)
        .single()

      if (!usuarioData) {
        setCarregando(false)
        return
      }

      const userRole = usuarioData.role
      setRole(userRole)

      // Se for admin ou revenda principal, tem todas as permissões
      if (userRole === 'admin' || userRole === 'revenda') {
        setCarregando(false)
        return
      }

      // Se for colaborador de revenda, buscar permissões específicas
      if (userRole === 'colaborador_revenda') {
        try {
          const { data: colaboradorData, error: colaboradorError } = await supabase
            .from('colaboradores')
            .select('id')
            .eq('usuario_id', sessao.user.id)
            .eq('ativo', true)
            .single()

          if (colaboradorError || !colaboradorData) {
            console.warn('⚠️ Colaborador não encontrado ou inativo:', colaboradorError)
            setCarregando(false)
            return
          }

          const { data: permissoesData, error: permissoesError } = await supabase
            .from('permissoes_colaborador')
            .select('funcionalidade, pode_visualizar, pode_criar, pode_editar, pode_excluir')
            .eq('colaborador_id', colaboradorData.id)

          if (permissoesError) {
            console.error('❌ Erro ao buscar permissões:', permissoesError)
            setCarregando(false)
            return
          }

          if (permissoesData) {
            const permissoesMap = new Map<string, Set<AcaoPermissao>>()

            permissoesData.forEach((perm) => {
              const acoes = new Set<AcaoPermissao>()
              if (perm.pode_visualizar) acoes.add('visualizar')
              if (perm.pode_criar) acoes.add('criar')
              if (perm.pode_editar) acoes.add('editar')
              if (perm.pode_excluir) acoes.add('excluir')

              if (acoes.size > 0) {
                permissoesMap.set(perm.funcionalidade, acoes)
              }
            })

            setPermissoes(permissoesMap)
          }
        } catch (error) {
          console.error('❌ Erro ao carregar permissões do colaborador:', error)
        }
      }

      setCarregando(false)
    } catch (error) {
      console.error('❌ Erro ao carregar permissões:', error)
      setCarregando(false)
    }
  }

  /**
   * Verifica se o usuário tem permissão para uma ação específica
   */
  const temPermissao = (
    funcionalidade: string,
    acao: AcaoPermissao = 'visualizar'
  ): boolean => {
    // Admin e revenda principal têm todas as permissões
    if (role === 'admin' || role === 'revenda') {
      return true
    }

    // Verificar permissão específica do colaborador de revenda
    const acoesPermitidas = permissoes.get(funcionalidade)
    return acoesPermitidas?.has(acao) ?? false
  }

  /**
   * Verifica se o usuário pode visualizar uma funcionalidade
   */
  const podeVisualizar = (funcionalidade: string): boolean => {
    return temPermissao(funcionalidade, 'visualizar')
  }

  /**
   * Verifica se o usuário pode criar em uma funcionalidade
   */
  const podeCriar = (funcionalidade: string): boolean => {
    return temPermissao(funcionalidade, 'criar')
  }

  /**
   * Verifica se o usuário pode editar em uma funcionalidade
   */
  const podeEditar = (funcionalidade: string): boolean => {
    return temPermissao(funcionalidade, 'editar')
  }

  /**
   * Verifica se o usuário pode excluir em uma funcionalidade
   */
  const podeExcluir = (funcionalidade: string): boolean => {
    return temPermissao(funcionalidade, 'excluir')
  }

  return {
    permissoes,
    role,
    carregando,
    temPermissao,
    podeVisualizar,
    podeCriar,
    podeEditar,
    podeExcluir,
    recarregar: carregarPermissoes,
  }
}

