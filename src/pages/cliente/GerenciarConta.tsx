import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Save, ArrowLeft, AlertCircle, CheckCircle2, Phone, CreditCard, Trash2, Users, Copy, Share2, MapPin, Edit, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { obterSessao, redefinirSenha, fazerLogout } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { traduzirErro } from '@/lib/traduzirErro'
import { sincronizarTelefone } from '@/lib/sincronizarTelefone'
import { aplicarMascaraTelefone, removerMascaraTelefone, aplicarMascaraCPF, aplicarMascaraCEP } from '@/lib/mascaras'
import { obterRoleDeUsuario } from '@/lib/roles'
import { verificarPodeExcluirConta } from '@/lib/gerenciarParcelamentos'
import { obterCodigoIndicacao, obterInfoIndicacoes } from '@/lib/indicacoes'
import { listarEnderecos, atualizarEndereco, deletarEndereco, type EnderecoEntrega, type DadosEndereco } from '@/lib/gerenciarEnderecos'
import { toast } from 'sonner'

export default function GerenciarConta() {
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
  
  // Estados para exclusão de conta
  const [verificandoExclusao, setVerificandoExclusao] = useState(false)
  const [excluindoConta, setExcluindoConta] = useState(false)
  const [podeExcluir, setPodeExcluir] = useState<boolean | null>(null)
  const [motivoBloqueio, setMotivoBloqueio] = useState<string | null>(null)
  
  // Estados para indicação de amigo
  const [codigoIndicacao, setCodigoIndicacao] = useState<string | null>(null)
  const [totalIndicacoes, setTotalIndicacoes] = useState(0)
  const [carregandoIndicacoes, setCarregandoIndicacoes] = useState(true)
  
  // Estados para endereços
  const [enderecos, setEnderecos] = useState<EnderecoEntrega[]>([])
  const [carregandoEnderecos, setCarregandoEnderecos] = useState(true)
  const [enderecoEditando, setEnderecoEditando] = useState<EnderecoEntrega | null>(null)
  const [salvandoEndereco, setSalvandoEndereco] = useState(false)
  const [excluindoEndereco, setExcluindoEndereco] = useState<string | null>(null)
  
  // Estados do formulário de endereço
  const [nomeEndereco, setNomeEndereco] = useState('')
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const session = await obterSessao()
        
        if (!session || !session.user) {
          navigate('/login')
          return
        }

        // Verifica o role e redireciona revendas para página específica
        const role = obterRoleDeUsuario(session.user)
        if (role === 'revenda') {
          navigate('/revenda/conta')
          return
        }
        if (role === 'admin') {
          navigate('/admin/conta')
          return
        }

        // Obtém o clienteUserId considerando modo impersonation
        const { obterClienteUserId } = await import('@/lib/impersonation')
        const clienteUserId = await obterClienteUserId()
        const usuarioIdParaBuscar = clienteUserId || session.user.id
        
        // Busca dados atualizados da tabela usuarios também para garantir sincronização
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('nome_completo, telefone, cpf')
          .eq('id', usuarioIdParaBuscar)
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
        navigate('/login')
      }
    }

    carregarUsuario()
  }, [navigate])

  // Verifica se pode excluir conta ao carregar
  useEffect(() => {
    const verificarExclusao = async () => {
      if (!usuario) return
      
      setVerificandoExclusao(true)
      const { podeExcluir: pode, motivo } = await verificarPodeExcluirConta(usuario.id)
      setPodeExcluir(pode)
      setMotivoBloqueio(motivo || null)
      setVerificandoExclusao(false)
    }

    if (usuario) {
      verificarExclusao()
      carregarIndicacoes(usuario.id)
      carregarEnderecos()
    }
  }, [usuario])

  const carregarIndicacoes = async (usuarioId: string) => {
    setCarregandoIndicacoes(true)
    try {
      const [codigoResult, infoResult] = await Promise.all([
        obterCodigoIndicacao(usuarioId),
        obterInfoIndicacoes(usuarioId)
      ])
      
      if (codigoResult.codigo) {
        setCodigoIndicacao(codigoResult.codigo)
      }
      
      if (infoResult.totalIndicacoes !== undefined) {
        setTotalIndicacoes(infoResult.totalIndicacoes)
      }
    } catch (error) {
      console.error('Erro ao carregar indicações:', error)
    } finally {
      setCarregandoIndicacoes(false)
    }
  }

  const copiarLinkIndicacao = () => {
    if (!codigoIndicacao) return
    
    const link = `${window.location.origin}/registro?ref=${codigoIndicacao}`
    navigator.clipboard.writeText(link)
    toast.success('Link copiado para a área de transferência!')
  }

  const carregarEnderecos = async () => {
    setCarregandoEnderecos(true)
    try {
      const { enderecos: enderecosLista, error } = await listarEnderecos()
      if (error) {
        console.error('Erro ao carregar endereços:', error)
        toast.error('Erro ao carregar endereços salvos')
      } else {
        setEnderecos(enderecosLista)
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar endereços:', error)
      toast.error('Erro ao carregar endereços salvos')
    } finally {
      setCarregandoEnderecos(false)
    }
  }

  const iniciarEdicaoEndereco = (endereco: EnderecoEntrega) => {
    setEnderecoEditando(endereco)
    setNomeEndereco(endereco.nome_endereco || '')
    setCep(aplicarMascaraCEP(endereco.cep))
    setLogradouro(endereco.logradouro)
    setNumero(endereco.numero)
    setComplemento(endereco.complemento || '')
    setBairro(endereco.bairro)
    setCidade(endereco.cidade)
    setEstado(endereco.estado)
  }

  const cancelarEdicaoEndereco = () => {
    setEnderecoEditando(null)
    setNomeEndereco('')
    setCep('')
    setLogradouro('')
    setNumero('')
    setComplemento('')
    setBairro('')
    setCidade('')
    setEstado('')
  }

  const salvarEndereco = async () => {
    if (!enderecoEditando) return

    if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setSalvandoEndereco(true)
    try {
      const dados: DadosEndereco = {
        nome_endereco: nomeEndereco || null,
        cep: cep.replace(/\D/g, ''),
        logradouro,
        numero,
        complemento: complemento || null,
        bairro,
        cidade,
        estado,
      }

      const { error, mensagem } = await atualizarEndereco(enderecoEditando.id, dados)
      
      if (error) {
        toast.error(mensagem || 'Erro ao atualizar endereço')
      } else {
        toast.success('Endereço atualizado com sucesso!')
        cancelarEdicaoEndereco()
        carregarEnderecos()
      }
    } catch (error) {
      console.error('Erro ao salvar endereço:', error)
      toast.error('Erro inesperado ao atualizar endereço')
    } finally {
      setSalvandoEndereco(false)
    }
  }

  const excluirEndereco = async (enderecoId: string) => {
    setExcluindoEndereco(enderecoId)
    try {
      const { error, mensagem } = await deletarEndereco(enderecoId)
      
      if (error) {
        toast.error(mensagem || 'Erro ao excluir endereço')
      } else {
        toast.success('Endereço excluído com sucesso!')
        carregarEnderecos()
      }
    } catch (error) {
      console.error('Erro ao excluir endereço:', error)
      toast.error('Erro inesperado ao excluir endereço')
    } finally {
      setExcluindoEndereco(null)
    }
  }

  const compartilharLink = async () => {
    if (!codigoIndicacao) return
    
    const link = `${window.location.origin}/registro?ref=${codigoIndicacao}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Venha para o Pixy Pay!',
          text: 'Crie sua conta usando meu link de indicação',
          url: link,
        })
      } catch (error) {
        // Usuário cancelou ou erro ao compartilhar
        console.log('Compartilhamento cancelado')
      }
    } else {
      // Fallback: copia para área de transferência
      copiarLinkIndicacao()
    }
  }

  const handleExcluirConta = async () => {
    if (!usuario) return

    setErro(null)
    setExcluindoConta(true)

    try {
      // Verifica novamente antes de excluir
      const { podeExcluir: pode, motivo } = await verificarPodeExcluirConta(usuario.id)
      
      if (!pode) {
        setErro(motivo || 'Não é possível excluir a conta no momento')
        setExcluindoConta(false)
        return
      }

      // Chama Edge Function para excluir usuário
      const { error: deleteError } = await supabase.functions.invoke('excluir-usuario', {
        body: { userId: usuario.id },
      })

      if (deleteError) {
        throw deleteError
      }

      // Faz logout e redireciona
      await fazerLogout()
      navigate('/login')
      
      // Mostra mensagem de sucesso (mesmo que o usuário seja redirecionado)
      setSucesso('Conta excluída com sucesso')
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error)
      setErro(error.message || 'Erro ao excluir conta. Tente novamente.')
      setExcluindoConta(false)
    }
  }

  const handleAtualizarPerfil = async () => {
    if (!usuario) return

    setErro(null)
    setSucesso(null)
    setSalvando(true)

    try {
      const telefoneLimpo = telefone ? removerMascaraTelefone(telefone) : null
      const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : null

      // Atualiza na tabela usuarios primeiro
      const updateDataUsuarios: any = {
        updated_at: new Date().toISOString(),
      }
      
      if (nome) {
        updateDataUsuarios.nome_completo = nome.trim()
      }
      
      if (telefoneLimpo !== undefined) {
        updateDataUsuarios.telefone = telefoneLimpo || null
      }
      
      if (cpfLimpo !== undefined) {
        updateDataUsuarios.cpf = cpfLimpo || null
      }

      const { error: usuariosError } = await supabase
        .from('usuarios')
        .update(updateDataUsuarios)
        .eq('id', usuario.id)

      if (usuariosError) {
        setErro('Erro ao atualizar dados. Tente novamente.')
        setSalvando(false)
        return
      }

      // Atualiza no auth.users usando Edge Function para sincronização completa
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('atualizar-usuario-admin', {
        body: {
          userId: usuario.id,
          display_name: nome,
          telefone: telefoneLimpo,
          cpf: cpfLimpo,
        },
      })

      if (edgeError) {
        console.warn('⚠️ Erro ao atualizar no auth.users via Edge Function (não crítico):', edgeError)
      } else if (edgeData?.error) {
        console.warn('⚠️ Erro retornado pela Edge Function (não crítico):', edgeData.error)
      }

      // Também atualiza diretamente no auth.users para garantir sincronização
      const updateDataAuth: any = {
        data: {
          nome_completo: nome,
          telefone: telefoneLimpo || null,
          cpf: cpfLimpo || null,
        },
      }

      const { error: authError } = await supabase.auth.updateUser(updateDataAuth)

      if (authError) {
        if (authError.message && authError.message.includes('SMS provider')) {
          console.warn('⚠️ SMS provider não configurado, mas telefone foi salvo nos metadados')
        } else {
          console.warn('⚠️ Erro ao atualizar auth.users diretamente (não crítico):', authError)
        }
      }

        // Recarrega dados do usuário
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUsuario(session.user)
          // Carrega informações de indicação
          // Obtém o clienteUserId considerando modo impersonation
          const { obterClienteUserId } = await import('@/lib/impersonation')
          const clienteUserId = await obterClienteUserId()
          const clienteIdParaBuscar = clienteUserId || session.user.id
          carregarIndicacoes(clienteIdParaBuscar)
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
      <div className="flex items-center justify-center min-h-[400px]">
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
          onClick={() => navigate('/cliente')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
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

      {/* Indicação de Amigo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Indicação de Amigo
          </CardTitle>
          <CardDescription>
            Compartilhe seu link e ganhe amigos na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {carregandoIndicacoes ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                <div className="space-y-3 mb-3">
                  <div>
                    <Label className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 block">
                      Seu Link de Indicação
                    </Label>
                    <Input
                      value={codigoIndicacao ? `${window.location.origin}/registro?ref=${codigoIndicacao}` : 'Carregando...'}
                      readOnly
                      className="font-mono text-sm bg-white dark:bg-neutral-900"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={copiarLinkIndicacao}
                      disabled={!codigoIndicacao}
                      className="flex-1"
                    >
                      <Copy className="w-5 h-5 mr-2" />
                      Copiar Link
                    </Button>
                    <Button
                      variant="outline"
                      onClick={compartilharLink}
                      disabled={!codigoIndicacao}
                      className="flex-1"
                    >
                      <Share2 className="w-5 h-5 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
                <div className="pt-3 border-t border-violet-200 dark:border-violet-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Amigos indicados
                    </span>
                    <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {totalIndicacoes}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                Quando um amigo criar uma conta usando seu link, ele será contabilizado aqui.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Endereços Salvos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Endereços Salvos
          </CardTitle>
          <CardDescription>
            Gerencie seus endereços de entrega salvos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {carregandoEnderecos ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : enderecos.length === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center py-4">
              Nenhum endereço salvo ainda. Os endereços serão salvos automaticamente quando você fizer um pedido.
            </p>
          ) : (
            <div className="space-y-4">
              {enderecos.map((endereco) => (
                <div
                  key={endereco.id}
                  className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 space-y-3"
                >
                  {enderecoEditando?.id === endereco.id ? (
                    // Formulário de edição
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="nomeEndereco">Nome do Endereço (opcional)</Label>
                          <Input
                            id="nomeEndereco"
                            value={nomeEndereco}
                            onChange={(e) => setNomeEndereco(e.target.value)}
                            placeholder="Ex: Casa, Trabalho..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cep">CEP *</Label>
                          <Input
                            id="cep"
                            value={cep}
                            onChange={(e) => {
                              const valor = e.target.value
                              setCep(aplicarMascaraCEP(valor))
                            }}
                            placeholder="00000-000"
                            maxLength={9}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="logradouro">Logradouro *</Label>
                        <Input
                          id="logradouro"
                          value={logradouro}
                          onChange={(e) => setLogradouro(e.target.value)}
                          placeholder="Rua, Avenida..."
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="numero">Número *</Label>
                          <Input
                            id="numero"
                            value={numero}
                            onChange={(e) => setNumero(e.target.value)}
                            placeholder="123"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="complemento">Complemento (opcional)</Label>
                          <Input
                            id="complemento"
                            value={complemento}
                            onChange={(e) => setComplemento(e.target.value)}
                            placeholder="Apto, Bloco..."
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bairro">Bairro *</Label>
                        <Input
                          id="bairro"
                          value={bairro}
                          onChange={(e) => setBairro(e.target.value)}
                          placeholder="Nome do bairro"
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="cidade">Cidade *</Label>
                          <Input
                            id="cidade"
                            value={cidade}
                            onChange={(e) => setCidade(e.target.value)}
                            placeholder="Nome da cidade"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estado">Estado *</Label>
                          <Input
                            id="estado"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value.toUpperCase())}
                            placeholder="SP"
                            maxLength={2}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={salvarEndereco}
                          disabled={salvandoEndereco}
                          size="sm"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {salvandoEndereco ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelarEdicaoEndereco}
                          disabled={salvandoEndereco}
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Visualização do endereço
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {endereco.nome_endereco && (
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                              {endereco.nome_endereco}
                            </h4>
                          )}
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {endereco.logradouro}, {endereco.numero}
                            {endereco.complemento && ` - ${endereco.complemento}`}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {endereco.bairro} - {endereco.cidade}/{endereco.estado}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            CEP: {aplicarMascaraCEP(endereco.cep)}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => iniciarEdicaoEndereco(endereco)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Endereço</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este endereço? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={excluindoEndereco === endereco.id}>
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => excluirEndereco(endereco.id)}
                                  disabled={excluindoEndereco === endereco.id}
                                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                >
                                  {excluindoEndereco === endereco.id ? 'Excluindo...' : 'Excluir'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
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
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Cliente</span>
          </div>
        </CardContent>
      </Card>

      {/* Excluir Conta */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="w-5 h-5" />
            Excluir Conta
          </CardTitle>
          <CardDescription className="text-red-600/80 dark:text-red-400/80">
            Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificandoExclusao ? (
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
              Verificando condições para exclusão...
            </div>
          ) : podeExcluir === false ? (
            <div className="p-4 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Não é possível excluir sua conta no momento
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {motivoBloqueio || 'Você possui parcelas pendentes ou vencidas. Quitte todas as parcelas antes de excluir sua conta.'}
                  </p>
                </div>
              </div>
            </div>
          ) : podeExcluir === true ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={excluindoConta}
                  className="w-full md:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {excluindoConta ? 'Excluindo...' : 'Excluir Minha Conta'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão de Conta</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      Tem certeza que deseja excluir sua conta? Esta ação é <strong>irreversível</strong> e irá:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Remover permanentemente todos os seus dados pessoais</li>
                      <li>Cancelar todos os pedidos pendentes</li>
                      <li>Remover seu histórico de compras</li>
                      <li>Excluir seus endereços salvos</li>
                    </ul>
                    <p className="font-medium text-red-600 dark:text-red-400 mt-2">
                      Esta ação não pode ser desfeita.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={excluindoConta}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleExcluirConta}
                    disabled={excluindoConta}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  >
                    {excluindoConta ? 'Excluindo...' : 'Sim, excluir minha conta'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

