import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Lock, ArrowRight } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ThemeToggle'
import { redefinirSenha, obterSessao } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { traduzirErro } from '@/lib/traduzirErro'

export default function RedefinirSenha() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [sessaoValida, setSessaoValida] = useState(false)

  useEffect(() => {
    // Verifica se há uma sessão válida (necessária para redefinir senha)
    // O Supabase cria uma sessão temporária quando o usuário clica no link do email
    const verificarSessao = async () => {
      try {
        // Aguarda um pouco para o Supabase processar o token automaticamente
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Primeiro, tenta obter a sessão atual (Supabase processa automaticamente com detectSessionInUrl)
        const session = await obterSessao()
        
        if (session && session.user) {
          setSessaoValida(true)
        } else {
          // Se não há sessão, verifica se há parâmetros na URL que podem criar uma sessão
          const tokenHash = searchParams.get('token_hash')
          const token = searchParams.get('token')
          const type = searchParams.get('type')

          if (tokenHash || token) {
            // Tenta verificar o token e criar uma sessão manualmente
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash || '',
              token: token || '',
              type: (type as any) || 'recovery',
            })

            if (error) {
              setErro('Link inválido ou expirado. Por favor, solicite um novo link de recuperação.')
              return
            }

            if (data && data.session) {
              setSessaoValida(true)
            } else {
              setErro('Sessão inválida. Por favor, clique no link do e-mail novamente.')
            }
          } else {
            setErro('Sessão inválida. Por favor, clique no link do e-mail de recuperação.')
          }
        }
      } catch (error) {
        setErro('Erro ao verificar sessão. Tente novamente.')
      }
    }

    verificarSessao()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem')
      return
    }

    if (senha.length < 8) {
      setErro('A senha deve ter no mínimo 8 caracteres')
      return
    }

    setCarregando(true)

    try {
      const { error, mensagem } = await redefinirSenha(senha)

      if (error) {
        setErro(mensagem || 'Erro ao redefinir senha. Tente novamente.')
        setCarregando(false)
        return
      }

      setSucesso(true)
      setCarregando(false)

      // Redireciona para login após 3 segundos
      setTimeout(() => {
        navigate('/login', {
          state: {
            mensagem: 'Senha redefinida com sucesso! Você já pode fazer login.',
          },
        })
      }, 3000)
    } catch (error) {
      setErro('Erro inesperado ao redefinir senha. Tente novamente.')
      setCarregando(false)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 px-4 py-12 animate-fade-in">
        <ThemeToggle />
        
        <div className="w-full max-w-md">
          <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-xl">
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Senha redefinida!
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Sua senha foi redefinida com sucesso. Você já pode fazer login com sua nova senha.
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-2">
                  Redirecionando para o login...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 px-4 py-12 animate-fade-in">
      <ThemeToggle />
      
      <div className="w-full max-w-md space-y-6">
        {/* Logo e Título */}
        <div className="text-center space-y-2 mb-8">
          <div className="flex justify-center mb-4">
            <Logo variant="full" width={120} height={40} />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
            Redefinir Senha
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Digite sua nova senha
          </p>
        </div>

        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold">
              Nova Senha
            </CardTitle>
            <CardDescription>
              Escolha uma senha segura para sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {erro && (
              <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
              </div>
            )}

            {!sessaoValida && !erro && (
              <div className="mb-4 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Verificando sessão...
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-neutral-700 dark:text-neutral-300">
                  Nova Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                  <Input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    disabled={carregando || !sessaoValida}
                    minLength={8}
                    className="pl-10 border-neutral-300 dark:border-neutral-700 focus:ring-violet-500 dark:focus:ring-violet-400 bg-white dark:bg-neutral-800"
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Mínimo de 8 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha" className="text-neutral-700 dark:text-neutral-300">
                  Confirmar Nova Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="••••••••"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    required
                    disabled={carregando || !sessaoValida}
                    className={`pl-10 border-neutral-300 dark:border-neutral-700 focus:ring-violet-500 dark:focus:ring-violet-400 bg-white dark:bg-neutral-800 ${
                      confirmarSenha && senha !== confirmarSenha 
                        ? 'border-red-300 dark:border-red-700' 
                        : confirmarSenha && senha === confirmarSenha
                        ? 'border-green-300 dark:border-green-700'
                        : ''
                    }`}
                  />
                </div>
                {confirmarSenha && senha !== confirmarSenha && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    As senhas não coincidem
                  </p>
                )}
                {confirmarSenha && senha === confirmarSenha && senha && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Senhas coincidem
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={carregando || !sessaoValida || senha !== confirmarSenha || senha.length < 8}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {carregando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Redefinindo...
                  </>
                ) : (
                  <>
                    Redefinir Senha
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

