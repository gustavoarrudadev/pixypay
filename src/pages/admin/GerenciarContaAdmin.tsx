import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Save, ArrowLeft, AlertCircle, CheckCircle2, Phone, CreditCard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { obterSessao, redefinirSenha } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { traduzirErro } from '@/lib/traduzirErro'
import { sincronizarTelefone } from '@/lib/sincronizarTelefone'
import { aplicarMascaraTelefone, removerMascaraTelefone, aplicarMascaraCPF } from '@/lib/mascaras'
import { obterRoleDeUsuario } from '@/lib/roles'

export default function GerenciarContaAdmin() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState<SupabaseUser | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  
  // Estados do formulário
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarAlterarSenha, setMostrarAlterarSenha] = useState(false)

  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const session = await obterSessao()
        
        if (!session || !session.user) {
          navigate('/login')
          return
        }

        // Verifica se é admin
        const role = obterRoleDeUsuario(session.user)
        if (role !== 'admin') {
          navigate('/admin')
          return
        }

        // Busca dados atualizados da tabela usuarios também para garantir sincronização
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('nome_completo, telefone, cpf')
          .eq('id', session.user.id)
          .single()

        setUsuario(session.user)
        
        // Prioriza dados da tabela usuarios, depois auth.users
        const nomeCompleto = usuarioData?.nome_completo || session.user.user_metadata?.nome_completo || ''
        setNome(nomeCompleto)
        setEmail(session.user.email || '')
        
        // Carrega o telefone (prioriza tabela usuarios, depois phone, depois metadados)
        const telefoneUsuario = usuarioData?.telefone || session.user.phone || session.user.user_metadata?.telefone || ''
        setTelefone(telefoneUsuario ? aplicarMascaraTelefone(telefoneUsuario) : '')
        
        // Carrega o CPF (prioriza tabela usuarios, depois metadados)
        const cpfUsuario = usuarioData?.cpf || session.user.user_metadata?.cpf || ''
        setCpf(cpfUsuario ? aplicarMascaraCPF(cpfUsuario) : '')
        
        // Sincroniza o telefone dos metadados para o campo phone
        await sincronizarTelefone(session.user)
        
        // Recarrega a sessão para obter dados atualizados do auth.users
        const { data: { session: novaSession } } = await supabase.auth.getSession()
        if (novaSession?.user) {
          setUsuario(novaSession.user)
          // Atualiza apenas se não tiver dados da tabela usuarios
          if (!usuarioData?.telefone) {
            const telefoneAtualizado = novaSession.user.phone || novaSession.user.user_metadata?.telefone || ''
            setTelefone(telefoneAtualizado ? aplicarMascaraTelefone(telefoneAtualizado) : '')
          }
          if (!usuarioData?.cpf) {
            const cpfAtualizado = novaSession.user.user_metadata?.cpf || ''
            setCpf(cpfAtualizado ? aplicarMascaraCPF(cpfAtualizado) : '')
          }
          if (!usuarioData?.nome_completo) {
            setNome(novaSession.user.user_metadata?.nome_completo || '')
          }
        }
        
        setCarregando(false)
      } catch (error) {
        console.error('Erro ao carregar usuário:', error)
        navigate('/admin')
      }
    }

    carregarUsuario()
  }, [navigate])

  const handleAtualizarPerfil = async () => {
    if (!usuario) return

    setErro(null)
    setSucesso(null)
    setSalvando(true)

    try {
      // Atualiza auth.users
      const updates: any = {
        data: {
          nome_completo: nome.trim(),
          telefone: removerMascaraTelefone(telefone),
          cpf: cpf.replace(/\D/g, ''),
        }
      }

      // Não atualiza phone diretamente (pode causar erro de SMS provider)
      // O telefone será armazenado apenas em user_metadata.telefone
      const { error: updateError } = await supabase.auth.updateUser(updates)

      if (updateError) {
        // Ignora erros relacionados a SMS provider
        if (!updateError.message.includes('SMS provider') && !updateError.message.includes('sms')) {
          throw updateError
        }
      }

      // Atualiza tabela usuarios
      const { error: dbError } = await supabase
        .from('usuarios')
        .update({
          nome_completo: nome.trim() || null,
          telefone: removerMascaraTelefone(telefone) || null,
          cpf: cpf.replace(/\D/g, '') || null,
        })
        .eq('id', usuario.id)

      if (dbError) {
        throw dbError
      }

      // Chama Edge Function para sincronizar
      try {
        const { error: edgeError } = await supabase.functions.invoke('atualizar-usuario-admin', {
          body: {
            user_id: usuario.id,
            nome_completo: nome.trim(),
            telefone: removerMascaraTelefone(telefone),
            cpf: cpf.replace(/\D/g, ''),
          }
        })

        if (edgeError) {
          console.warn('Erro ao sincronizar via Edge Function:', edgeError)
        }
      } catch (edgeError) {
        console.warn('Erro ao chamar Edge Function:', edgeError)
      }

      // Recarrega dados do usuário
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUsuario(session.user)
      }

      // Recarrega dados da tabela usuarios
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('nome_completo, telefone, cpf')
        .eq('id', usuario.id)
        .single()

      if (usuarioData) {
        setNome(usuarioData.nome_completo || '')
        setTelefone(usuarioData.telefone ? aplicarMascaraTelefone(usuarioData.telefone) : '')
        setCpf(usuarioData.cpf ? aplicarMascaraCPF(usuarioData.cpf) : '')
      }

      setSucesso('Perfil atualizado com sucesso!')
      setTimeout(() => setSucesso(null), 5000)
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error)
      setErro(traduzirErro(error.message))
      setTimeout(() => setErro(null), 5000)
    } finally {
      setSalvando(false)
    }
  }

  const handleAlterarSenha = async () => {
    if (!usuario) return

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setErro('Preencha todos os campos de senha')
      setTimeout(() => setErro(null), 5000)
      return
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem')
      setTimeout(() => setErro(null), 5000)
      return
    }

    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres')
      setTimeout(() => setErro(null), 5000)
      return
    }

    setErro(null)
    setSucesso(null)
    setSalvando(true)

    try {
      const { error } = await redefinirSenha(novaSenha)

      if (error) {
        throw error
      }

      setSucesso('Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
      setMostrarAlterarSenha(false)
      setTimeout(() => setSucesso(null), 5000)
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error)
      setErro(traduzirErro(error.message))
      setTimeout(() => setErro(null), 5000)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
          Gerenciar Conta
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Atualize suas informações pessoais e senha
        </p>
      </div>

      {/* Mensagens de Erro/Sucesso */}
      {erro && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        </div>
      )}

      {sucesso && (
        <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-600 dark:text-green-400">{sucesso}</p>
        </div>
      )}

      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Atualize suas informações de perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-neutral-100 dark:bg-neutral-800"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                O e-mail não pode ser alterado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                value={telefone}
                onChange={(e) => {
                  const valor = e.target.value
                  setTelefone(aplicarMascaraTelefone(valor))
                }}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={(e) => {
                  const valor = e.target.value
                  setCpf(aplicarMascaraCPF(valor))
                }}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
          </div>

          <Button
            onClick={handleAtualizarPerfil}
            disabled={salvando}
            className="w-full md:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Altere sua senha de acesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!mostrarAlterarSenha ? (
            <Button
              variant="outline"
              onClick={() => setMostrarAlterarSenha(true)}
            >
              Alterar Senha
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="senhaAtual">Senha Atual</Label>
                <Input
                  id="senhaAtual"
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha</Label>
                <Input
                  id="novaSenha"
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite sua nova senha"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Confirme sua nova senha"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAlterarSenha}
                  disabled={salvando}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {salvando ? 'Alterando...' : 'Alterar Senha'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMostrarAlterarSenha(false)
                    setSenhaAtual('')
                    setNovaSenha('')
                    setConfirmarSenha('')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">ID do Usuário</span>
            <span className="text-sm font-mono text-neutral-900 dark:text-neutral-50">{usuario?.id}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">E-mail Confirmado</span>
            <span className={`text-sm font-medium ${usuario?.email_confirmed_at ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {usuario?.email_confirmed_at ? 'Sim' : 'Não'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Tipo de Usuário</span>
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Administrador</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

