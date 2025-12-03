import { useLocation } from 'react-router-dom'
import { Store, Users, LayoutDashboard, ShoppingCart, CreditCard, Calendar, AlertTriangle, DollarSign, ArrowRightLeft, FileText, UserPlus, MessageSquare } from 'lucide-react'
import UserLayout from './UserLayout'
import { usePermissoes } from '@/hooks/usePermissoes'

/**
 * Layout específico para o painel administrativo
 * Configura os menus e rotas específicas do admin
 */
export default function AdminLayout() {
  const location = useLocation()
  const { podeVisualizar, carregando: carregandoPermissoes } = usePermissoes()

  // Mapeamento de paths para funcionalidades
  const pathToFuncionalidade: Record<string, string> = {
    '/admin': 'dashboard',
    '/admin/revendas': 'revendas',
    '/admin/clientes': 'clientes',
    '/admin/pedidos': 'pedidos',
    '/admin/parcelamentos': 'parcelamentos',
    '/admin/agendamentos': 'agendamentos',
    '/admin/repasses': 'repasses',
    '/admin/financeiro': 'financeiro',
    '/admin/inadimplencia': 'inadimplencia',
    '/admin/relatorios': 'relatorios',
    '/admin/colaboradores': 'administracao',
    '/admin/administracao': 'administracao',
    '/admin/comunicacao': 'comunicacao',
  }

  const todosMenus = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin',
      active: location.pathname === '/admin',
      funcionalidade: 'dashboard',
    },
    {
      label: 'Revendas',
      icon: Store,
      path: '/admin/revendas',
      active: location.pathname.startsWith('/admin/revendas'),
      funcionalidade: 'revendas',
    },
    {
      label: 'Clientes',
      icon: Users,
      path: '/admin/clientes',
      active: location.pathname.startsWith('/admin/clientes'),
      funcionalidade: 'clientes',
    },
    {
      label: 'Pedidos',
      icon: ShoppingCart,
      path: '/admin/pedidos',
      active: location.pathname.startsWith('/admin/pedidos'),
      funcionalidade: 'pedidos',
    },
    {
      label: 'Parcelamentos',
      icon: CreditCard,
      path: '/admin/parcelamentos',
      active: location.pathname.startsWith('/admin/parcelamentos'),
      funcionalidade: 'parcelamentos',
    },
    {
      label: 'Agendamentos',
      icon: Calendar,
      path: '/admin/agendamentos',
      active: location.pathname.startsWith('/admin/agendamentos'),
      funcionalidade: 'agendamentos',
    },
    {
      label: 'Repasses',
      icon: ArrowRightLeft,
      path: '/admin/repasses',
      active: location.pathname.startsWith('/admin/repasses'),
      funcionalidade: 'repasses',
    },
    {
      label: 'Financeiro',
      icon: DollarSign,
      path: '/admin/financeiro',
      active: location.pathname.startsWith('/admin/financeiro'),
      funcionalidade: 'financeiro',
    },
    {
      label: 'Inadimplência',
      icon: AlertTriangle,
      path: '/admin/inadimplencia',
      active: location.pathname.startsWith('/admin/inadimplencia'),
      funcionalidade: 'inadimplencia',
    },
    {
      label: 'Relatórios',
      icon: FileText,
      path: '/admin/relatorios',
      active: location.pathname.startsWith('/admin/relatorios'),
      funcionalidade: 'relatorios',
    },
    {
      label: 'Colaboradores',
      icon: UserPlus,
      path: '/admin/colaboradores',
      active: location.pathname.startsWith('/admin/colaboradores'),
      funcionalidade: 'administracao',
    },
    {
      label: 'Comunicação',
      icon: MessageSquare,
      path: '/admin/comunicacao',
      active: location.pathname.startsWith('/admin/comunicacao'),
      funcionalidade: 'comunicacao',
    },
  ]

  // Colaboradores agora veem TODOS os menus
  // Admin colaboradores têm acesso completo
  const menuItems = todosMenus

  return (
    <UserLayout
      allowedRole="admin"
      menuItems={menuItems}
      contaPath="/admin/conta"
      tituloPainel="Painel Admin"
    />
  )
}
