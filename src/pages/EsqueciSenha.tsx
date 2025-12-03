import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ThemeToggle'
import { recuperarSenha } from '@/lib/auth'
import { traduzirErro } from '@/lib/traduzirErro'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    
    try {
      const { error, mensagem } = await recuperarSenha(email)

      if (error) {
        setErro(mensagem || 'Erro ao enviar email de recuperação. Tente novamente.')
        setEnviando(false)
        return
      }

      setEnviado(true)
      setEnviando(false)
    } catch (error) {
      setErro('Erro inesperado ao enviar email. Tente novamente.')
      setEnviando(false)
    }
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
            Recuperar Senha
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {enviado ? 'Verifique seu e-mail' : 'Enviaremos instruções para redefinir sua senha'}
          </p>
        </div>

        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-xl">
          {!enviado ? (
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-semibold">
                  Esqueceu sua senha?
                </CardTitle>
                <CardDescription>
                  Digite seu e-mail e enviaremos um link para redefinir sua senha
                </CardDescription>
              </CardHeader>
              <CardContent>
                {erro && (
                  <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        disabled={enviando}
                        className="pl-10 border-neutral-300 dark:border-neutral-700 focus:ring-violet-500 dark:focus:ring-violet-400 bg-white dark:bg-neutral-800"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={enviando}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 disabled:opacity-50"
                  >
                    {enviando ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Enviar Link de Recuperação
                        <Mail className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  E-mail enviado!
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Enviamos um link de recuperação para <strong>{email}</strong>. 
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
                <div className="pt-4 space-y-2">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Não recebeu o e-mail? Verifique sua pasta de spam ou{' '}
                    <button
                      onClick={() => {
                        setEnviado(false)
                        setEmail('')
                        setErro(null)
                      }}
                      className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium"
                    >
                      tente novamente
                    </button>
                  </p>
                </div>
              </div>
            </CardContent>
          )}

          <div className="px-6 pb-6">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
