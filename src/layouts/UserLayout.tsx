import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { 
  LogOut, 
  Menu, 
  X, 
  Settings,
  Moon,
  Sun,
  LucideIcon
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { obterSessao, fazerLogout } from '@/lib/auth'
import { obterRoleDeUsuario } from '@/lib/roles'
import { obterRevendaId } from '@/lib/impersonation'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { MenuMobileFixo } from '@/components/cliente/MenuMobileFixo'
import { BadgeNotificacoes } from '@/components/notificacoes/BadgeNotificacoes'
import { BannerAlerta } from '@/components/comunicacao/BannerAlerta'
import { NotificacaoPush } from '@/components/comunicacao/NotificacaoPush'
import { cn } from '@/lib/utils'

interface MenuItem {
  label: string
  icon: LucideIcon
  path: string
  active: boolean
  funcionalidade?: string // Opcional: chave da funcionalidade para controle de permissões
}

interface UserLayoutProps {
  allowedRole: 'admin' | 'cliente' | 'revenda'
  menuItems: MenuItem[]
  contaPath: string
  tituloPainel: string
  subtituloPainel?: string // Opcional: subtítulo para exibir abaixo do título (ex: informação de unidade)
}

export default function UserLayout({ allowedRole, menuItems, contaPath, tituloPainel, subtituloPainel }: UserLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [usuario, setUsuario] = useState<SupabaseUser | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [menuAberto, setMenuAberto] = useState(false)
  const [nomeExibicao, setNomeExibicao] = useState<string>('')

  useEffect(() => {
    let cancelado = false
    
    const verificarAutenticacao = async () => {
      try {
        const session = await obterSessao()
        
        if (cancelado) return
        
        if (!session || !session.user) {
          navigate('/login', { replace: true })
          return
        }

        const role = obterRoleDeUsuario(session.user)
        const roleOriginal = session.user.user_metadata?.role as string
        
        // Verifica se está em modo impersonation (admin visualizando como revenda ou cliente)
        const impersonationData = localStorage.getItem('impersonation_mode')
        let emModoImpersonation = false
        
        if (impersonationData && (allowedRole === 'revenda' || allowedRole === 'cliente')) {
          try {
            const dados = JSON.parse(impersonationData)
            // Verifica se o token não expirou (válido por 1 hora)
            const agora = Date.now()
            const umaHora = 60 * 60 * 1000
            if (agora - dados.timestamp < umaHora && dados.adminUserId === session.user.id) {
              // Verifica se o tipo de impersonation corresponde ao role esperado
              if ((allowedRole === 'revenda' && dados.revendaUserId) || 
                  (allowedRole === 'cliente' && dados.clienteUserId)) {
                emModoImpersonation = true
              }
            } else {
              // Token expirado, remove do localStorage
              localStorage.removeItem('impersonation_mode')
            }
          } catch {
            // Dados inválidos, remove do localStorage
            localStorage.removeItem('impersonation_mode')
          }
        }
        
        if (cancelado) return
        
        // Verifica se tem o role permitido OU está em modo impersonation
        // Colaboradores são tratados como admin ou revenda para navegação
        const isColaborador = roleOriginal === 'colaborador_revenda'
        const podeAcessar = role === allowedRole || 
                           (isColaborador && allowedRole === role) ||
                           emModoImpersonation
        
        if (!podeAcessar) {
          // Redireciona baseado no role usando replace para evitar histórico de navegação
          if (role === 'admin') {
            navigate('/admin', { replace: true })
          } else if (role === 'revenda' || roleOriginal === 'colaborador_revenda') {
            navigate('/revenda', { replace: true })
          } else {
            navigate('/cliente', { replace: true })
          }
          return
        }
        
        if (cancelado) return
        
        setUsuario(session.user)

        // Se for admin, busca nome
        if (allowedRole === 'admin') {
          setNomeExibicao(session.user.user_metadata?.nome_completo || session.user.email || 'Administrador')
          setCarregando(false)
          return
        }

        // Se for revenda (ou em modo impersonation), busca nome_revenda da tabela revendas
        if (allowedRole === 'revenda' && (session.user.id || emModoImpersonation)) {
          // Se for colaborador revenda, busca nome da tabela usuarios através do usuario_id
          if (roleOriginal === 'colaborador_revenda') {
            const { data: usuarioData } = await supabase
              .from('usuarios')
              .select('nome_completo')
              .eq('id', session.user.id)
              .single()
            
            if (usuarioData?.nome_completo) {
              setNomeExibicao(usuarioData.nome_completo)
            } else {
              setNomeExibicao(session.user.user_metadata?.nome_completo || session.user.email || 'Colaborador Revenda')
            }
            setCarregando(false)
            return
          }
          
          // Para revenda principal ou modo impersonation, busca usando obterRevendaId
          // Se não conseguir obter revendaId, usa dados dos metadados do usuário
          try {
            const revendaId = await obterRevendaId()
            
            if (revendaId) {
              const { data: revendaData, error: revendaError } = await supabase
                .from('revendas')
                .select('nome_revenda, nome_responsavel')
                .eq('id', revendaId)
                .single()

              if (!revendaError && revendaData) {
                setNomeExibicao(revendaData.nome_revenda || revendaData.nome_responsavel || session.user.email || 'Revenda')
              } else {
                // Se não encontrou dados da revenda, usa metadados do usuário
                setNomeExibicao(session.user.user_metadata?.nome_completo || session.user.email || 'Revenda')
              }
            } else {
              // Se não conseguiu obter revendaId, usa metadados do usuário
              // Isso pode acontecer se a revenda ainda não foi criada ou há algum problema
              setNomeExibicao(session.user.user_metadata?.nome_completo || session.user.email || 'Revenda')
            }
          } catch (error) {
            // Em caso de erro ao buscar revendaId, usa metadados do usuário
            console.error('Erro ao buscar dados da revenda:', error)
            setNomeExibicao(session.user.user_metadata?.nome_completo || session.user.email || 'Revenda')
          }
        } else if (allowedRole === 'cliente') {
          // Se está em modo impersonation de cliente, busca dados do cliente
          if (emModoImpersonation && impersonationData) {
            try {
              const dados = JSON.parse(impersonationData)
              const clienteUserId = dados.clienteUserId
              
              // Busca dados do cliente na tabela usuarios
              const { data: clienteData, error: clienteError } = await supabase
                .from('usuarios')
                .select('nome_completo, display_name, email')
                .eq('id', clienteUserId)
                .eq('role', 'cliente')
                .single()
              
              if (clienteError) {
                console.error('❌ Erro ao buscar dados do cliente:', clienteError)
              }
              
              if (clienteData) {
                setNomeExibicao(
                  clienteData.display_name || 
                  clienteData.nome_completo || 
                  clienteData.email || 
                  'Cliente'
                )
              } else {
                // Fallback: usa email da sessão atual
                setNomeExibicao(session.user.email || 'Cliente')
              }
            } catch (error) {
              console.error('❌ Erro ao processar dados de impersonation:', error)
              // Se não conseguir parsear, usa nome_completo dos metadados ou email
              setNomeExibicao(session.user.user_metadata?.nome_completo || session.user.email || 'Usuário')
            }
          } else {
            // Para clientes normais, usa nome_completo dos metadados ou email
            setNomeExibicao(session.user.user_metadata?.nome_completo || session.user.email || 'Usuário')
          }
        }

        if (!cancelado) {
          setCarregando(false)
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        if (!cancelado) {
          navigate('/login', { replace: true })
        }
      }
    }

    verificarAutenticacao()
    
    return () => {
      cancelado = true
    }
  }, [navigate, allowedRole])

  const handleLogout = async () => {
    await fazerLogout()
    navigate('/login')
  }

  const handleIrParaConta = () => {
    navigate(contaPath)
  }

  // Função para obter iniciais do nome
  const obterIniciais = (nome: string | null | undefined, email: string | null | undefined) => {
    if (nome) {
      const partes = nome.split(' ')
      if (partes.length >= 2) {
        return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
      }
      return nome.substring(0, 2).toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    if (allowedRole === 'admin') {
      return 'AD'
    }
    return 'US'
  }

  // Função para obter nome de exibição
  const obterNomeExibicao = () => {
    if (allowedRole === 'admin') {
      return nomeExibicao || usuario?.email || 'Administrador'
    }
    return nomeExibicao || usuario?.email || (allowedRole === 'revenda' ? 'Revenda' : 'Usuário')
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 flex flex-col">
      {/* Barra Superior Fixa */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-20 lg:h-16 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 lg:left-64 lg:right-0">
        <div className="h-full flex items-center justify-between px-4 lg:px-6">
          {/* Logo Mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <Logo width={100} height={100} />
          </div>

          {/* Menu Mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <BadgeNotificacoes />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-12 w-12"
              aria-label="Alternar tema"
            >
              {theme === 'light' ? (
                <Moon className="h-8 w-8" />
              ) : (
                <Sun className="h-8 w-8" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuAberto(!menuAberto)}
              className="h-12 w-12"
            >
              {menuAberto ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
            </Button>
          </div>

          {/* ThemeToggle - Desktop (à esquerda) */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle useAbsolutePosition={false} />
            <BadgeNotificacoes />
          </div>

          {/* Avatar - Desktop (à direita) */}
          <div className="hidden lg:flex items-center ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-violet-500/20">
                    {obterIniciais(obterNomeExibicao(), usuario?.email)}
                  </div>
                  <div className="text-left hidden xl:block">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {obterNomeExibicao()}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[200px]">
                      {usuario?.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                    {obterNomeExibicao()}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {usuario?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleIrParaConta} className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Ir para Conta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar - Fixo sempre */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          w-64 h-screen
          bg-white dark:bg-neutral-900
          border-r border-neutral-200 dark:border-neutral-800
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${menuAberto ? 'translate-x-0' : '-translate-x-full'}
          pt-16 lg:pt-0
          pb-6 lg:pb-0
          flex flex-col
          shadow-lg lg:shadow-none
        `}
      >
        {/* Logo Desktop */}
        <div className="hidden lg:flex flex-col items-start justify-center gap-2 p-6 border-b border-neutral-200 dark:border-neutral-800 h-16 flex-shrink-0">
          <Logo width={150} height={150} />
        </div>

        {/* Menu Items - Ocupa espaço disponível */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
          <div className="px-4 mb-2 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {tituloPainel}
            </p>
            {subtituloPainel && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                {subtituloPainel}
              </p>
            )}
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => {
                  // Se já está na mesma rota, força navegação com replace para remontar o componente
                  if (location.pathname === item.path) {
                    navigate(item.path, { replace: true, state: { refresh: Date.now() } })
                  } else {
                    navigate(item.path)
                  }
                  setMenuAberto(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    item.active
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium shadow-sm'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* User Info - Fixo no final */}
        <div className="p-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex-shrink-0">
          <div className="px-4 py-2 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 text-white mb-3">
            <p className="text-sm font-medium truncate">
              {obterNomeExibicao()}
            </p>
            <p className="text-xs text-violet-100 truncate">
              {usuario?.email}
            </p>
          </div>
          <div className="flex gap-2 mb-3">
            <Button
              variant="outline"
              onClick={handleIrParaConta}
              className="flex-1 border-neutral-300 dark:border-neutral-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-800 hover:text-violet-700 dark:hover:text-violet-300 transition-all duration-200 hover:shadow-sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Perfil
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex-1 border-neutral-300 dark:border-neutral-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 hover:shadow-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
          {/* Divisória e Footer */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2">
            <p className="text-xs text-center text-neutral-500 dark:text-neutral-400">
              Pixy Pay | 2026 1.0.1
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {menuAberto && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMenuAberto(false)}
        />
      )}

      {/* Main Content - Ocupa espaço restante com margin para sidebar fixo */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 pt-16 sm:pt-20 lg:pt-16 lg:ml-64",
        allowedRole === 'cliente' && "pb-menu-mobile lg:pb-0"
      )}>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Banner de Alerta - aparece acima do conteúdo */}
          {/* Exibir para revendas, clientes e colaboradores */}
          {allowedRole !== 'admin' && <BannerAlerta />}
          <Outlet />
        </div>
      </main>

      {/* Notificação Push - aparece no canto inferior direito */}
      {/* Exibir para revendas, clientes e colaboradores */}
      {allowedRole !== 'admin' && <NotificacaoPush />}

      {/* Menu Mobile Fixo - Apenas para Cliente */}
      {allowedRole === 'cliente' && <MenuMobileFixo />}
    </div>
  )
}

