import { useLocation } from 'react-router-dom'
import { ShoppingCart, CreditCard, Heart, Handshake, HelpCircle } from 'lucide-react'
import UserLayout from './UserLayout'

/**
 * Layout específico para o painel do cliente
 * Configura os menus e rotas específicas do cliente
 */
export default function ClienteLayout() {
  const location = useLocation()

  const menuItems = [
    {
      label: 'Parcelamentos',
      icon: CreditCard,
      path: '/cliente/parcelamentos',
      active: location.pathname === '/cliente' || location.pathname === '/cliente/parcelamentos',
    },
    {
      label: 'Minhas Compras',
      icon: ShoppingCart,
      path: '/cliente/compras',
      active: location.pathname === '/cliente/compras' || location.pathname.startsWith('/cliente/compras/'),
    },
    {
      label: 'Meus Favoritos',
      icon: Heart,
      path: '/cliente/favoritos',
      active: location.pathname === '/cliente/favoritos',
    },
    {
      label: 'Negociações',
      icon: Handshake,
      path: '/cliente/negociacoes',
      active: location.pathname === '/cliente/negociacoes',
    },
    {
      label: 'Ajuda',
      icon: HelpCircle,
      path: '/cliente/ajuda',
      active: location.pathname === '/cliente/ajuda',
    },
  ]

  return (
    <UserLayout
      allowedRole="cliente"
      menuItems={menuItems}
      contaPath="/cliente/conta"
      tituloPainel="Painel Cliente"
    />
  )
}

