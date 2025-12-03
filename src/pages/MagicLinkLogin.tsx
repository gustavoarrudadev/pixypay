import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { supabase } from '@/lib/supabase'
import { traduzirErro } from '@/lib/traduzirErro'
import { obterRoleDeUsuario } from '@/lib/roles'
import { sincronizarTelefone } from '@/lib/sincronizarTelefone'

export default function MagicLinkLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'processando' | 'sucesso' | 'erro'>('processando')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    const processarMagicLink = async () => {
      try {
        // Aguarda um pouco para o Supabase processar o token automaticamente
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // O Supabase com detectSessionInUrl: true processa automaticamente os tokens
        // Verifica se há uma sessão após o processamento
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          setStatus('erro')
          setMensagem(traduzirErro(sessionError) || 'Erro ao fazer login. O link pode ter expirado.')
          return
        }

        // Se há sessão, significa que o login foi bem-sucedido
        if (session && session.user) {
          // Verifica se o email foi confirmado
          if (session.user.email_confirmed_at) {
            // Sincroniza o telefone dos metadados para o campo phone
            await sincronizarTelefone(session.user)

            setStatus('sucesso')
            setMensagem('Login realizado com sucesso! Redirecionando...')
            
            // Verifica o role do usuário e redireciona adequadamente
            const role = obterRoleDeUsuario(session.user)
            
            setTimeout(() => {
              if (role === 'admin') {
                navigate('/admin')
              } else if (role === 'revenda') {
                navigate('/revenda')
              } else {
                navigate('/cliente')
              }
            }, 1000)
          } else {
            setStatus('erro')
            setMensagem('Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.')
            
            // Redireciona para login após 3 segundos
            setTimeout(() => {
              navigate('/login')
            }, 3000)
          }
        } else {
          // Se não há sessão, verifica se há parâmetros na URL
          const tokenHash = searchParams.get('token_hash')
          const token = searchParams.get('token')
          const type = searchParams.get('type')

          if (tokenHash || token) {
            // Tenta verificar o token manualmente
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash || '',
              token: token || '',
              type: (type as any) || 'magiclink',
            })

            if (error) {
              setStatus('erro')
              setMensagem(traduzirErro(error) || 'Erro ao fazer login. O link pode ter expirado.')
              return
            }

            if (data && data.user && data.session) {
              // Verifica se o email foi confirmado
              if (data.user.email_confirmed_at) {
                // Sincroniza o telefone dos metadados para o campo phone
                await sincronizarTelefone(data.user)

                setStatus('sucesso')
                setMensagem('Login realizado com sucesso! Redirecionando...')
                
                // Verifica o role do usuário e redireciona adequadamente
                const role = obterRoleDeUsuario(data.user)
                
                setTimeout(() => {
                  if (role === 'admin') {
                    navigate('/admin')
                  } else if (role === 'revenda') {
                    navigate('/revenda')
                  } else {
                    navigate('/cliente')
                  }
                }, 1000)
              } else {
                setStatus('erro')
                setMensagem('Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.')
                
                setTimeout(() => {
                  navigate('/login')
                }, 3000)
              }
            } else {
              setStatus('erro')
              setMensagem('Não foi possível fazer login. Tente novamente.')
            }
          } else {
            // Sem parâmetros e sem sessão - pode ser acesso direto
            setStatus('erro')
            setMensagem('Link inválido ou expirado. Solicite um novo Magic Link.')
          }
        }
      } catch (error) {
        setStatus('erro')
        setMensagem('Erro inesperado ao fazer login. Tente novamente.')
      }
    }

    processarMagicLink()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 px-4 py-12 animate-fade-in">
      <ThemeToggle />
      
      <div className="w-full max-w-md">
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-xl">
          <CardContent className="py-8">
            {status === 'processando' && (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-4">
                  <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Fazendo login...
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Aguarde enquanto processamos seu Magic Link.
                </p>
              </div>
            )}

            {status === 'sucesso' && (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Login realizado!
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {mensagem}
                </p>
              </div>
            )}

            {status === 'erro' && (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Erro ao fazer login
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {mensagem}
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  className="mt-4 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Voltar para Login
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

