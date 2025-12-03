import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { User, Mail, Phone, Lock, CreditCard, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ThemeToggle } from '@/components/ThemeToggle'
import { registrarUsuario, obterSessao } from '@/lib/auth'
import { obterRoleDeUsuario } from '@/lib/roles'
import { aplicarMascaraTelefone, removerMascaraTelefone, aplicarMascaraCPF, removerMascaraCPF } from '@/lib/mascaras'

export default function Registro() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const codigoIndicacao = searchParams.get('ref') || undefined
  
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
            navigate('/cliente')
          }
        }
      } catch (error) {
        // Se houver erro, continua na página de registro
        console.error('Erro ao verificar autenticação:', error)
      }
    }
    
    verificarAutenticacao()
  }, [navigate])
  const [etapaAtual, setEtapaAtual] = useState(1)
  
  // Etapa 1: Nome e Email
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  
  // Etapa 2: CPF e Telefone
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  
  // Etapa 3: Senha
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [requisitosSenha, setRequisitosSenha] = useState({
    minCaracteres: false,
    maiuscula: false,
    numero: false,
  })
  const [aceiteTermos, setAceiteTermos] = useState(false)
  
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const validarSenha = (valor: string) => {
    setSenha(valor)
    setRequisitosSenha({
      minCaracteres: valor.length >= 8,
      maiuscula: /[A-Z]/.test(valor),
      numero: /[0-9]/.test(valor),
    })
  }

  const validarEtapa1 = () => {
    if (!nome.trim()) {
      setErro('Nome completo é obrigatório')
      return false
    }
    if (!email.trim() || !email.includes('@')) {
      setErro('E-mail válido é obrigatório')
      return false
    }
    return true
  }

  const validarEtapa2 = () => {
    const cpfLimpo = removerMascaraCPF(cpf)
    if (cpfLimpo.length !== 11) {
      setErro('CPF deve ter 11 dígitos')
      return false
    }
    
    const telefoneLimpo = telefone ? removerMascaraTelefone(telefone) : ''
    if (!telefone || telefoneLimpo.length < 10) {
      setErro('Telefone é obrigatório e deve ter pelo menos 10 dígitos (com DDD)')
      return false
    }
    
    return true
  }

  const validarEtapa3 = () => {
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem')
      return false
    }
    if (!requisitosSenha.minCaracteres || !requisitosSenha.maiuscula || !requisitosSenha.numero) {
      setErro('A senha não atende aos requisitos mínimos')
      return false
    }
    if (!aceiteTermos) {
      setErro('Você precisa aceitar os Termos de Uso para criar uma conta')
      return false
    }
    return true
  }

  const avancarEtapa = () => {
    setErro(null)
    
    if (etapaAtual === 1) {
      if (validarEtapa1()) {
        setEtapaAtual(2)
      }
    } else if (etapaAtual === 2) {
      if (validarEtapa2()) {
        setEtapaAtual(3)
      }
    }
  }

  const voltarEtapa = () => {
    setErro(null)
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!validarEtapa3()) {
      return
    }

    setCarregando(true)

    try {
      const telefoneLimpo = telefone ? removerMascaraTelefone(telefone) : ''
      const cpfLimpo = removerMascaraCPF(cpf)
      
      // Validações adicionais
      if (!telefone || telefoneLimpo.length < 10) {
        setErro('Telefone é obrigatório e deve ter pelo menos 10 dígitos (com DDD)')
        setCarregando(false)
        return
      }
      
      if (cpfLimpo.length !== 11) {
        setErro('CPF deve ter 11 dígitos')
        setCarregando(false)
        return
      }

      const { user, error } = await registrarUsuario(email, senha, nome, telefoneLimpo, 'cliente', cpfLimpo, codigoIndicacao)

      if (error) {
        console.error('❌ Erro detalhado no registro:', {
          error,
          mensagem: error.mensagemErro,
          message: error.message,
          stack: error.stack
        })
        setErro(error.mensagemErro || error.message || 'Erro ao criar conta. Tente novamente.')
        setCarregando(false)
        return
      }

      if (!user) {
        console.error('❌ Usuário não foi criado, mas não há erro')
        setErro('Erro ao criar conta. Tente novamente.')
        setCarregando(false)
        return
      }

      setSucesso(true)
      setCarregando(false)
      
      // Mantém a URL de redirecionamento se existir
      const redirectUrl = localStorage.getItem('redirectAfterAuth')
      
      setTimeout(() => {
        // Redireciona para a página de login principal
        if (redirectUrl) {
          // Se há URL de redirecionamento, mantém no localStorage
          localStorage.setItem('redirectAfterAuth', redirectUrl)
        }
        window.location.href = '/login'
      }, 3000)
    } catch (error) {
      console.error('Erro inesperado:', error)
      setErro('Erro inesperado ao criar conta. Tente novamente.')
      setCarregando(false)
    }
  }

  const senhaValida = requisitosSenha.minCaracteres && requisitosSenha.maiuscula && requisitosSenha.numero

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
                  Conta criada com sucesso!
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Enviamos um e-mail de confirmação para <strong>{email}</strong>. 
                  Verifique sua caixa de entrada e clique no link para confirmar sua conta.
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

  const titulosEtapas = [
    'Como devemos te chamar?',
    'Só mais alguns detalhes...',
    'Quase lá...'
  ]

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
            Criar Conta
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {titulosEtapas[etapaAtual - 1]}
          </p>
        </div>

        {/* Indicador de Etapas */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((etapa) => (
            <div key={etapa} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  etapa === etapaAtual
                    ? 'bg-violet-600 text-white scale-110 shadow-lg shadow-violet-500/30'
                    : etapa < etapaAtual
                    ? 'bg-green-500 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {etapa < etapaAtual ? <Check className="w-5 h-5" /> : etapa}
              </div>
              {etapa < 3 && (
                <div
                  className={`w-12 h-1 transition-all duration-300 ${
                    etapa < etapaAtual
                      ? 'bg-green-500'
                      : etapa === etapaAtual
                      ? 'bg-violet-600'
                      : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold">
              Etapa {etapaAtual} de 3
            </CardTitle>
            <CardDescription>
              {titulosEtapas[etapaAtual - 1]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mensagem de Erro */}
            {erro && (
              <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
              </div>
            )}

            <form onSubmit={etapaAtual === 3 ? handleSubmit : (e) => { e.preventDefault(); avancarEtapa(); }} className="space-y-4">
              {/* Etapa 1: Nome e Email */}
              {etapaAtual === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-neutral-700 dark:text-neutral-300">
                      Nome Completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                      <Input
                        id="nome"
                        type="text"
                        placeholder="Seu nome completo"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        disabled={carregando}
                        className="pl-10 border-neutral-300 dark:border-neutral-700 focus:ring-violet-500 dark:focus:ring-violet-400 bg-white dark:bg-neutral-800"
                      />
                    </div>
                  </div>

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
                </div>
              )}

              {/* Etapa 2: CPF e Telefone */}
              {etapaAtual === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="text-neutral-700 dark:text-neutral-300">
                      CPF
                    </Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={(e) => {
                          const valorFormatado = aplicarMascaraCPF(e.target.value)
                          setCpf(valorFormatado)
                        }}
                        required
                        disabled={carregando}
                        maxLength={14}
                        className="pl-10 border-neutral-300 dark:border-neutral-700 focus:ring-violet-500 dark:focus:ring-violet-400 bg-white dark:bg-neutral-800"
                      />
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Formato: 000.000.000-00
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-neutral-700 dark:text-neutral-300">
                      Telefone <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                      <Input
                        id="telefone"
                        type="tel"
                        placeholder="(00) 0-0000-0000"
                        value={telefone}
                        onChange={(e) => {
                          const valorFormatado = aplicarMascaraTelefone(e.target.value)
                          setTelefone(valorFormatado)
                        }}
                        required
                        disabled={carregando}
                        maxLength={16}
                        className="pl-10 border-neutral-300 dark:border-neutral-700 focus:ring-violet-500 dark:focus:ring-violet-400 bg-white dark:bg-neutral-800"
                      />
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Formato: (00) 0-0000-0000
                    </p>
                  </div>
                </div>
              )}

              {/* Etapa 3: Senha */}
              {etapaAtual === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="senha" className="text-neutral-700 dark:text-neutral-300">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                      <Input
                        id="senha"
                        type="password"
                        placeholder="••••••••"
                        value={senha}
                        onChange={(e) => validarSenha(e.target.value)}
                        required
                        disabled={carregando}
                        className="pl-10 border-neutral-300 dark:border-neutral-700 focus:ring-violet-500 dark:focus:ring-violet-400 bg-white dark:bg-neutral-800"
                      />
                    </div>
                    {senha && (
                      <div className="mt-2 space-y-1.5 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-md border border-neutral-200 dark:border-neutral-700">
                        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Requisitos da senha:
                        </p>
                        <div className="space-y-1">
                          <div className={`flex items-center gap-2 text-xs ${
                            requisitosSenha.minCaracteres 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}>
                            <Check className={`w-3 h-3 ${requisitosSenha.minCaracteres ? 'opacity-100' : 'opacity-30'}`} />
                            Mínimo de 8 caracteres
                          </div>
                          <div className={`flex items-center gap-2 text-xs ${
                            requisitosSenha.maiuscula 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}>
                            <Check className={`w-3 h-3 ${requisitosSenha.maiuscula ? 'opacity-100' : 'opacity-30'}`} />
                            Pelo menos uma letra maiúscula
                          </div>
                          <div className={`flex items-center gap-2 text-xs ${
                            requisitosSenha.numero 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}>
                            <Check className={`w-3 h-3 ${requisitosSenha.numero ? 'opacity-100' : 'opacity-30'}`} />
                            Pelo menos um número
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha" className="text-neutral-700 dark:text-neutral-300">
                      Confirmar Senha
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
                        disabled={carregando}
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

                  {/* Checkbox de Aceite dos Termos */}
                  <div className="space-y-2 pt-4">
                    <div className="flex items-start gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-md border border-neutral-200 dark:border-neutral-700">
                      <Checkbox
                        id="aceiteTermos"
                        checked={aceiteTermos}
                        onCheckedChange={(checked) => setAceiteTermos(checked === true)}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor="aceiteTermos"
                        className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer leading-relaxed"
                      >
                        Eu li e aceito os{' '}
                        <Link
                          to="/termos-de-uso"
                          target="_blank"
                          className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold underline underline-offset-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Termos de Uso
                        </Link>
                        {' '}do Pixy Pay
                      </Label>
                    </div>
                    {!aceiteTermos && etapaAtual === 3 && (
                      <p className="text-xs text-red-600 dark:text-red-400 ml-7">
                        Você precisa aceitar os Termos de Uso para criar uma conta
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Botões de Navegação */}
              <div className="flex gap-2 mt-6">
                {etapaAtual > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={voltarEtapa}
                    disabled={carregando}
                    className="flex-1 border-neutral-300 dark:border-neutral-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                )}
                {etapaAtual < 3 ? (
                  <Button
                    type="submit"
                    disabled={carregando}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30"
                  >
                    Continuar
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!senhaValida || senha !== confirmarSenha || !aceiteTermos || carregando}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {carregando ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Criando conta...
                      </>
                    ) : (
                      <>
                        Criar Conta
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Já tem uma conta?{' '}
                <Link
                  to="/login"
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors inline-flex items-center gap-1"
                >
                  Fazer login
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
