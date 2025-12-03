import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { traduzirErro } from '@/lib/traduzirErro'

export default function NovoCliente() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

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
      // Chama Edge Function para criar usuário (requer service role)
      // Por enquanto, vamos usar uma abordagem que cria via signUp e depois atualiza o role
      // NOTA: Isso requer que você crie uma Edge Function ou use Admin API no backend
      const { data, error } = await supabase.functions.invoke('criar-usuario-admin', {
        body: {
          email,
          password: senha,
          nome_completo: nome,
          role: 'cliente',
        },
      })

      if (error) {
        // Se a Edge Function não existir, mostra mensagem informativa
        setErro('Para criar usuários como admin, é necessário configurar uma Edge Function ou usar o painel do Supabase. Por favor, crie o cliente manualmente no painel do Supabase ou configure a Edge Function.')
        setCarregando(false)
        return
      }

      if (data?.error) {
        setErro(traduzirErro(data.error))
        setCarregando(false)
        return
      }

      setSucesso(true)
      setCarregando(false)

      // Redireciona após 2 segundos
      setTimeout(() => {
        navigate('/admin/clientes')
      }, 2000)
    } catch (error) {
      // Se não houver Edge Function, mostra instruções
      setErro('Para criar clientes pelo painel admin, é necessário configurar uma Edge Function no Supabase. Por enquanto, crie o cliente manualmente no painel do Supabase (Authentication > Users > Add User) e defina o role como "cliente" nos metadados.')
      setCarregando(false)
    }
  }

  if (sucesso) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-xl">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Cliente criado com sucesso!
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                O cliente <strong>{nome}</strong> foi cadastrado e pode fazer login imediatamente.
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-2">
                Redirecionando...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/admin/clientes')}
          className="border-neutral-300 dark:border-neutral-700"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Novo Cliente
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Cadastre um novo cliente no sistema
          </p>
        </div>
      </div>

      <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle>Dados do Cliente</CardTitle>
          <CardDescription>
            Preencha os dados para cadastrar o cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {erro && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{erro}</p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  Alternativa: Crie manualmente no painel do Supabase (Authentication &gt; Users &gt; Add User) e defina role: &quot;cliente&quot; nos metadados.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                <Input
                  id="nome"
                  type="text"
                  placeholder="Nome do cliente"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  disabled={carregando}
                  className="pl-10 border-neutral-300 dark:border-neutral-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={carregando}
                  className="pl-10 border-neutral-300 dark:border-neutral-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
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
                  minLength={8}
                  className="pl-10 border-neutral-300 dark:border-neutral-700"
                />
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Mínimo de 8 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                <Input
                  id="confirmarSenha"
                  type="password"
                  placeholder="••••••••"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                  disabled={carregando}
                  className={`pl-10 border-neutral-300 dark:border-neutral-700 ${
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
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/clientes')}
                disabled={carregando}
                className="flex-1 border-neutral-300 dark:border-neutral-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={carregando || senha !== confirmarSenha || senha.length < 8}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
              >
                {carregando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Cadastrando...
                  </>
                ) : (
                  'Cadastrar Cliente'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
