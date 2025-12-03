import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/ThemeToggle'
import { fazerLogin, enviarMagicLink, obterSessao } from '@/lib/auth'
import { obterRoleDeUsuario } from '@/lib/roles'
import { supabase } from '@/lib/supabase'
import { sincronizarTelefone } from '@/lib/sincronizarTelefone'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Verifica se já está logado e redireciona
  useEffect(() => {
    const verificarAutenticacao = async () => {
      try {
        const session = await obterSessao()
        if (session && session.user) {
          const role = obterRoleDeUsuario(session.user)
          
          // Redireciona para a dashboard apropriada
          if (role === 'admin') {
            navigate('/admin')
          } else if (role === 'revenda') {
            navigate('/revenda')
          } else if (role === 'cliente') {
            navigate('/cliente/parcelamentos')
          }
        }
      } catch (error) {
        // Se houver erro, continua na página de login
        console.error('Erro ao verificar autenticação:', error)
      }
    }
    
    verificarAutenticacao()
  }, [navigate])
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modoLogin, setModoLogin] = useState<'senha' | 'magic-link'>('senha')
  const [enviandoMagicLink, setEnviandoMagicLink] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucessoMagicLink, setSucessoMagicLink] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  useEffect(() => {
    // Verifica se há mensagem de sucesso vinda de outras páginas
    if (location.state?.mensagem) {
      setMensagemSucesso(location.state.mensagem)
      // Limpa o state após mostrar a mensagem
      window.history.replaceState({}, document.title)
    }
    
    // Restaura redirectAfterAuth se vier do registro
    if (location.state?.redirectAfterAuth) {
      localStorage.setItem('redirectAfterAuth', location.state.redirectAfterAuth)
    }
  }, [location])

  const handleSubmitSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    try {
      const { user, session, error, mensagemErro } = await fazerLogin(email, senha)

      if (error) {
        setErro(mensagemErro || 'Erro ao fazer login. Verifique suas credenciais.')
        setCarregando(false)
        return
      }

      if (user && session) {
        // Verifica se o email foi confirmado
        if (user.email_confirmed_at) {
          // Sincroniza o telefone dos metadados para o campo phone
          await sincronizarTelefone(user)

          // Verifica se há URL salva para redirecionar após login
          const redirectUrl = localStorage.getItem('redirectAfterAuth')
          if (redirectUrl) {
            localStorage.removeItem('redirectAfterAuth')
            navigate(redirectUrl)
            return
          }

          // Verifica o role do usuário e redireciona adequadamente
          const role = obterRoleDeUsuario(user)
          
          if (role === 'admin') {
            navigate('/admin')
          } else if (role === 'revenda') {
            navigate('/revenda')
          } else {
            // Cliente ou sem role definido
            navigate('/cliente/parcelamentos')
          }
        } else {
          setErro('Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.')
          setCarregando(false)
        }
      }
    } catch (error) {
      setErro('Erro inesperado ao fazer login. Tente novamente.')
      setCarregando(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setEnviandoMagicLink(true)

    try {
      const { error, mensagem } = await enviarMagicLink(email)

      if (error) {
        setErro(mensagem || 'Erro ao enviar Magic Link.')
        setEnviandoMagicLink(false)
        return
      }

      setSucessoMagicLink(true)
      setEnviandoMagicLink(false)
    } catch (error) {
      setErro('Erro inesperado ao enviar Magic Link. Tente novamente.')
      setEnviandoMagicLink(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 px-4 py-12 animate-fade-in">
      <ThemeToggle />
      
      <div className="w-full max-w-md space-y-6">
        {/* Logo e Título */}
        <div className="text-center space-y-2 mb-8">
          <div className="flex justify-center mb-4">
            <Logo variant="full" width={180} height={60} />
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Entre na sua conta para continuar:
          </p>
        </div>

        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold">
              {modoLogin === 'senha' ? 'Entrar' : 'Magic Link'}
            </CardTitle>
            <CardDescription>
              {modoLogin === 'senha' 
                ? 'Use suas credenciais para acessar'
                : 'Enviaremos um link mágico para seu e-mail'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mensagem de Sucesso (confirmação de email, etc) */}
            {mensagemSucesso && (
              <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-600 dark:text-green-400">{mensagemSucesso}</p>
              </div>
            )}

            {/* Mensagem de Erro */}
            {erro && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
              </div>
            )}

            {/* Mensagem de Sucesso Magic Link */}
            {sucessoMagicLink && (
              <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-2 animate-fade-in">
                <Mail className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  Magic Link enviado! Verifique seu e-mail e clique no link para fazer login.
                </p>
              </div>
            )}

            {/* Toggle entre modos */}
            <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setModoLogin('senha')
                  setErro(null)
                  setSucessoMagicLink(false)
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  modoLogin === 'senha'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-50 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  Senha
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModoLogin('magic-link')
                  setErro(null)
                  setSucessoMagicLink(false)
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  modoLogin === 'magic-link'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-50 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  Magic Link
                </div>
              </button>
            </div>

            {/* Formulário de Login com Senha */}
            {modoLogin === 'senha' && (
              <form onSubmit={handleSubmitSenha} className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-neutral-700 dark:text-neutral-300">
                    E-mail
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={carregando}
                      className="pl-10 border-neutral-300 dark:border-neutral-700 focus:ring-violet-500 dark:focus:ring-violet-400 bg-white dark:bg-neutral-800"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="senha" className="text-neutral-700 dark:text-neutral-300">
                      Senha
                    </Label>
                    <Link
                      to="/esqueci-senha"
                      className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors"
                    >
                      Esqueceu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <Input
                      id="senha"
                      type="password"
                      placeholder="••••••••"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                      disabled={carregando}
                      className="pl-10 border-neutral-300 dark:border-neutral-700 focus:ring-violet-500 dark:focus:ring-violet-400 bg-white dark:bg-neutral-800"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 disabled:opacity-50"
                >
                  {carregando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Formulário Magic Link */}
            {modoLogin === 'magic-link' && (
              <form onSubmit={handleMagicLink} className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="email-magic" className="text-neutral-700 dark:text-neutral-300">
                    E-mail
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <Input
                      id="email-magic"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={enviandoMagicLink}
                      className="pl-10 border-neutral-300 dark:border-neutral-700 focus:ring-violet-500 dark:focus:ring-violet-400 bg-white dark:bg-neutral-800"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={enviandoMagicLink}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 disabled:opacity-50"
                >
                  {enviandoMagicLink ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Magic Link
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-neutral-500 dark:text-neutral-400">
                  Enviaremos um link seguro para fazer login sem senha
                </p>
              </form>
            )}

            <Separator className="my-6" />

            {/* Link para Registro */}
            <div className="text-center space-y-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Não tem uma conta?{' '}
                <Link
                  to="/registro"
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors inline-flex items-center gap-1"
                >
                  Criar conta
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
