import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, Store, ShoppingCart, Calendar, DollarSign, FileText, CreditCard, Users, HelpCircle, UserPlus } from 'lucide-react'
import UserLayout from './UserLayout'
import { usePermissoes } from '@/hooks/usePermissoes'
import { supabase } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'

/**
 * Layout específico para o painel da revenda
 * Configura os menus e rotas específicas da revenda
 */
export default function RevendaLayout() {
  const location = useLocation()
  const { podeVisualizar, carregando: carregandoPermissoes } = usePermissoes()
  const [tituloPainel, setTituloPainel] = useState('Painel Revenda')
  const [subtituloPainel, setSubtituloPainel] = useState<string | undefined>(undefined)

  const todosMenus = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/revenda/dashboard',
      active: location.pathname === '/revenda/dashboard' || location.pathname === '/revenda',
      funcionalidade: 'dashboard',
    },
    {
      label: 'Presença na Loja',
      icon: Store,
      path: '/revenda/presenca',
      active: location.pathname === '/revenda/presenca',
      funcionalidade: 'presenca',
    },
    {
      label: 'Produtos',
      icon: Package,
      path: '/revenda/produtos',
      active: location.pathname.startsWith('/revenda/produtos'),
      funcionalidade: 'produtos',
    },
    {
      label: 'Pedidos',
      icon: ShoppingCart,
      path: '/revenda/pedidos',
      active: location.pathname === '/revenda/pedidos' || location.pathname.startsWith('/revenda/pedidos/'),
      funcionalidade: 'pedidos',
    },
    {
      label: 'Agendamentos',
      icon: Calendar,
      path: '/revenda/agendamentos',
      active: location.pathname === '/revenda/agendamentos',
      funcionalidade: 'agendamentos',
    },
    {
      label: 'Clientes',
      icon: Users,
      path: '/revenda/clientes',
      active: location.pathname === '/revenda/clientes',
      funcionalidade: 'clientes',
    },
    {
      label: 'Parcelamentos',
      icon: CreditCard,
      path: '/revenda/parcelamentos',
      active: location.pathname === '/revenda/parcelamentos',
      funcionalidade: 'parcelamentos',
    },
    {
      label: 'Financeiro',
      icon: DollarSign,
      path: '/revenda/financeiro',
      active: location.pathname === '/revenda/financeiro',
      funcionalidade: 'financeiro',
    },
    {
      label: 'Relatório',
      icon: FileText,
      path: '/revenda/relatorio',
      active: location.pathname === '/revenda/relatorio',
      funcionalidade: 'relatorios',
    },
    {
      label: 'Colaboradores',
      icon: UserPlus,
      path: '/revenda/colaboradores',
      active: location.pathname.startsWith('/revenda/colaboradores'),
      funcionalidade: 'administracao',
    },
    {
      label: 'Ajuda',
      icon: HelpCircle,
      path: '/revenda/ajuda',
      active: location.pathname.startsWith('/revenda/ajuda'),
      funcionalidade: 'ajuda',
    },
  ]

  // Filtrar menus: colaboradores não veem o menu de Colaboradores
  const [isColaborador, setIsColaborador] = useState(false)
  
  useEffect(() => {
    const verificarSeColaborador = async () => {
      try {
        const session = await obterSessao()
        if (session?.user) {
          const roleOriginal = session.user.user_metadata?.role as string
          setIsColaborador(roleOriginal === 'colaborador_revenda')
        }
      } catch (error) {
        console.error('❌ Erro ao verificar se é colaborador:', error)
      }
    }
    verificarSeColaborador()
  }, [])

  // Se for colaborador, remove o menu de Colaboradores (funcionalidade: 'administracao')
  const menuItems = isColaborador
    ? todosMenus.filter(menu => menu.path !== '/revenda/colaboradores')
    : todosMenus

  // Verificar se é colaborador e buscar informações da unidade
  useEffect(() => {
    const verificarColaborador = async () => {
      try {
        const session = await obterSessao()
        if (!session?.user) {
          console.log('🔍 [RevendaLayout] Sem sessão, mantendo título padrão')
          return
        }

        const roleOriginal = session.user.user_metadata?.role as string
        console.log('🔍 [RevendaLayout] Role do usuário:', roleOriginal)
        
        // Se for colaborador revenda, buscar informações da unidade
        if (roleOriginal === 'colaborador_revenda') {
          console.log('✅ [RevendaLayout] É colaborador_revenda, alterando título')
          setTituloPainel('Painel Colaborador')
          
          // Buscar dados do colaborador para obter unidade_id
          const { data: colaboradorData, error: colaboradorError } = await supabase
            .from('colaboradores')
            .select('unidade_id')
            .eq('usuario_id', session.user.id)
            .eq('ativo', true)
            .eq('tipo_colaborador', 'revenda')
            .single()

          if (colaboradorError) {
            console.error('❌ [RevendaLayout] Erro ao buscar dados do colaborador:', colaboradorError)
            setSubtituloPainel(undefined)
            return
          }

          console.log('📊 [RevendaLayout] Dados do colaborador:', colaboradorData)

          if (colaboradorData) {
            if (colaboradorData.unidade_id) {
              // Colaborador tem acesso a uma unidade específica - buscar nome da unidade
              const { data: unidadeData, error: unidadeError } = await supabase
                .from('unidades_revenda')
                .select('nome')
                .eq('id', colaboradorData.unidade_id)
                .single()

              if (unidadeError) {
                console.error('❌ [RevendaLayout] Erro ao buscar nome da unidade:', unidadeError)
                setSubtituloPainel('Unidade específica')
              } else if (unidadeData?.nome) {
                console.log('✅ [RevendaLayout] Unidade encontrada:', unidadeData.nome)
                setSubtituloPainel(`Unidade: ${unidadeData.nome}`)
              } else {
                setSubtituloPainel('Unidade específica')
              }
            } else {
              // Colaborador tem acesso a todas as unidades
              console.log('✅ [RevendaLayout] Colaborador tem acesso a todas as unidades')
              setSubtituloPainel('Visualizando: Todas as unidades')
            }
          }
        } else {
          // Não é colaborador, manter título padrão
          console.log('ℹ️ [RevendaLayout] Não é colaborador, mantendo título padrão')
          setTituloPainel('Painel Revenda')
          setSubtituloPainel(undefined)
        }
      } catch (error) {
        console.error('❌ [RevendaLayout] Erro ao verificar colaborador:', error)
        // Em caso de erro, manter título padrão
        setTituloPainel('Painel Revenda')
        setSubtituloPainel(undefined)
      }
    }

    verificarColaborador()
  }, [])

  return (
    <UserLayout
      allowedRole="revenda"
      menuItems={menuItems}
      contaPath="/revenda/conta"
      tituloPainel={tituloPainel}
      subtituloPainel={subtituloPainel}
    />
  )
}

