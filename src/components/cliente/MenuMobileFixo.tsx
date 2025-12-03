import { useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, CreditCard, Heart, Handshake, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  active: boolean
}

export function MenuMobileFixo() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems: MenuItem[] = [
    {
      label: 'Parcelas',
      icon: CreditCard,
      path: '/cliente/parcelamentos',
      active: location.pathname === '/cliente' || location.pathname === '/cliente/parcelamentos',
    },
    {
      label: 'Compras',
      icon: ShoppingCart,
      path: '/cliente/compras',
      active: location.pathname === '/cliente/compras' || location.pathname.startsWith('/cliente/compras/'),
    },
    {
      label: 'Favoritos',
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

  const handleNavigate = (path: string) => {
    if (location.pathname === path) {
      navigate(path, { replace: true, state: { refresh: Date.now() } })
    } else {
      navigate(path)
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 safe-area-inset-bottom lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 px-2 py-2 transition-all duration-200",
                item.active
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-neutral-500 dark:text-neutral-400"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                item.active && "scale-110"
              )} />
              <span className={cn(
                "text-[10px] font-medium truncate w-full text-center leading-tight",
                item.active && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

