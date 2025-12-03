import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  AlertCircle, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock,
  MoreVertical,
  User,
  Lock,
  Edit,
  Trash2,
  Ban,
  Send,
  KeyRound,
  CreditCard,
  Eye,
  Store,
  LayoutGrid,
  List,
  ArrowLeft,
  UserCheck,
  MailCheck
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Dropdown } from '@/components/ui/dropdown'
import { Dialog, DialogActions } from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { listarClientes, buscarDetalhesCliente, type ClienteCompleto } from '@/lib/usuarios'
import { aplicarMascaraTelefone, removerMascaraTelefone, aplicarMascaraCPF, removerMascaraCPF } from '@/lib/mascaras'
import { supabase } from '@/lib/supabase'
import { traduzirErro } from '@/lib/traduzirErro'
import { useNavigate } from 'react-router-dom'
import { 
  enviarMagicLinkCliente, 
  enviarRedefinicaoSenhaCliente, 
  atualizarCliente,
  excluirCliente,
  bloquearCliente
} from '@/lib/gerenciarCliente'
import { VisualizarComoCliente } from '@/components/admin/VisualizarComoCliente'
import { FiltrosRevendaUnidade } from '@/components/admin/FiltrosRevendaUnidade'
import { FiltrosAvancados } from '@/components/admin/FiltrosAvancados'

export default function Clientes() {
  const [clientes, setClientes] = useState<ClienteCompleto[]>([])
  const [carregando, setCarregando] = useState(false)
  const [revendaSelecionada, setRevendaSelecionada] = useState<string | null>(null)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string | null>(null)
  const [clientesTodos, setClientesTodos] = useState<ClienteCompleto[]>([])
  const [carregandoDashboard, setCarregandoDashboard] = useState(false)
  const [metricasAnteriores, setMetricasAnteriores] = useState({
    totalClientes: 0,
    clientesAtivos: 0,
    emailsPendentes: 0,
    clientesBanidos: 0,
  })
  const [busca, setBusca] = useState('')
  // Filtros avançados
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'banido' | 'email_pendente'>('todos')
  const [dataFiltro, setDataFiltro] = useState<'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'>('tudo')
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('')
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sheetAberto, setSheetAberto] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteCompleto | null>(null)
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false)
  
  // Estados para o slide de novo cliente
  const [sheetNovoClienteAberto, setSheetNovoClienteAberto] = useState(false)
  const [nomeNovoCliente, setNomeNovoCliente] = useState('')
  const [emailNovoCliente, setEmailNovoCliente] = useState('')
  const [cpfNovoCliente, setCpfNovoCliente] = useState('')
  const [telefoneNovoCliente, setTelefoneNovoCliente] = useState('')
  const [senhaNovoCliente, setSenhaNovoCliente] = useState('')
  const [confirmarSenhaNovoCliente, setConfirmarSenhaNovoCliente] = useState('')
  const [enviarMagicLinkNovoCliente, setEnviarMagicLinkNovoCliente] = useState(false)
  const [carregandoNovoCliente, setCarregandoNovoCliente] = useState(false)
  const [erroNovoCliente, setErroNovoCliente] = useState<string | null>(null)
  const [sucessoNovoCliente, setSucessoNovoCliente] = useState(false)
  
  // Estados para gerenciar cliente
  const [editandoCliente, setEditandoCliente] = useState(false)
  const [nomeEditado, setNomeEditado] = useState('')
  const [cpfEditado, setCpfEditado] = useState('')
  const [telefoneEditado, setTelefoneEditado] = useState('')
  const [emailEditado, setEmailEditado] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)
  const [sucessoAcao, setSucessoAcao] = useState<string | null>(null)
  
  // Estados para banimento inline
  const [mostrarCamposBanimento, setMostrarCamposBanimento] = useState(false)
  const [tipoTempoBanimento, setTipoTempoBanimento] = useState<'horas' | 'dias'>('horas')
  const [tempoBanimento, setTempoBanimento] = useState<string>('1')
  const [banindoCliente, setBanindoCliente] = useState(false)
  const [confirmarExclusaoAberto, setConfirmarExclusaoAberto] = useState(false)
  const [excluindoCliente, setExcluindoCliente] = useState(false)
  
  // Estado para visualização como cliente
  const [visualizarComoClienteAberto, setVisualizarComoClienteAberto] = useState(false)

  useEffect(() => {
    if (revendaSelecionada) {
      carregarClientes()
    } else {
      carregarClientes()
      carregarDashboardClientes()
    }
  }, [revendaSelecionada, unidadeSelecionada])


  const carregarDashboardClientes = async () => {
    try {
      setCarregandoDashboard(true)
      const { clientes: clientesData, error } = await listarClientes()
      if (!error && clientesData) {
        setClientesTodos(clientesData)
        
        // Calcular métricas anteriores (dia anterior) filtrando por data de criação
        const hoje = new Date()
        const ontem = new Date(hoje)
        ontem.setDate(ontem.getDate() - 1)
        ontem.setHours(0, 0, 0, 0)
        const fimOntem = new Date(ontem)
        fimOntem.setHours(23, 59, 59, 999)
        
        const clientesOntem = clientesData.filter(c => {
          const dataCriacao = new Date(c.created_at || c.criado_em || '')
          return dataCriacao >= ontem && dataCriacao <= fimOntem
        })
        
        setMetricasAnteriores({
          totalClientes: clientesOntem.length,
          clientesAtivos: clientesOntem.filter(c => !c.esta_banido && c.email_confirmado).length,
          emailsPendentes: clientesOntem.filter(c => !c.email_confirmado && !c.esta_banido).length,
          clientesBanidos: clientesOntem.filter(c => c.esta_banido).length,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard de clientes:', error)
    } finally {
      setCarregandoDashboard(false)
    }
  }


  const carregarClientes = async () => {
    try {
      setCarregando(true)
      setErro(null)
      
      // Se não há revenda selecionada, carrega todos os clientes
      // Se há revenda selecionada, filtra por revenda
      console.log('🔄 Carregando clientes...', revendaSelecionada ? `Revenda: ${revendaSelecionada}` : 'Todos os clientes')
      const { clientes: clientesData, error } = await listarClientes(
        revendaSelecionada || undefined, 
        (unidadeSelecionada && revendaSelecionada) ? unidadeSelecionada : undefined
      )

      if (error) {
        setErro('Erro ao carregar clientes. Verifique se a tabela "usuarios" foi criada no Supabase.')
        console.error('❌ Erro ao carregar clientes:', error)
        setCarregando(false)
        return
      }

      console.log('📦 Dados recebidos:', {
        total: clientesData.length,
        roles: [...new Set(clientesData.map(c => c.role))]
      })

      // Filtra apenas clientes para garantir que nenhum outro role apareça
      const apenasClientes = clientesData.filter(cliente => {
        // Filtro rigoroso: apenas role 'cliente', exclui explicitamente admin e revenda
        if (!cliente || !cliente.role) {
          console.warn('⚠️ Cliente inválido no componente:', cliente)
          return false
        }
        const isCliente = cliente.role === 'cliente'
        if (!isCliente) {
          console.warn('⚠️ Role não é cliente no componente:', cliente.role, cliente.email)
        }
        return isCliente
      })
      
      console.log('✅ Clientes finais após filtro:', apenasClientes.length)
      console.log('📋 Roles finais:', [...new Set(apenasClientes.map(c => c.role))])
      
      setClientes(apenasClientes)
      setCarregando(false)
    } catch (error) {
      setErro('Erro inesperado ao carregar clientes.')
      console.error('❌ Erro inesperado ao carregar clientes:', error)
      setCarregando(false)
    }
  }

  const handleAbrirDetalhes = async (clienteId: string) => {
    setCarregandoDetalhes(true)
    setSheetAberto(true)
    setEditandoCliente(false)
    setErroEdicao(null)
    setSucessoAcao(null)
    
    const { cliente, error } = await buscarDetalhesCliente(clienteId)
    
    if (error || !cliente) {
      console.error('Erro ao buscar detalhes:', error)
      setClienteSelecionado(null)
    } else {
      setClienteSelecionado(cliente)
      setNomeEditado(cliente.display_name || cliente.nome_completo || '')
      setCpfEditado(cliente.cpf || cliente.metadata?.cpf ? aplicarMascaraCPF(cliente.cpf || cliente.metadata?.cpf || '') : '')
      setTelefoneEditado(cliente.telefone || cliente.metadata?.telefone ? aplicarMascaraTelefone(cliente.telefone || cliente.metadata?.telefone || '') : '')
      setEmailEditado(cliente.email)
    }
    
    setCarregandoDetalhes(false)
  }

  const handleCadastrarNovoCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroNovoCliente(null)

    // Validação de senha apenas se o admin quiser definir uma senha manualmente
    // Por padrão, o cliente criará sua própria senha via email
    if (senhaNovoCliente && senhaNovoCliente !== confirmarSenhaNovoCliente) {
      setErroNovoCliente('As senhas não coincidem')
      return
    }

    if (senhaNovoCliente && senhaNovoCliente.length < 8) {
      setErroNovoCliente('A senha deve ter no mínimo 8 caracteres')
      return
    }

    setCarregandoNovoCliente(true)

    try {
      const telefoneLimpo = telefoneNovoCliente ? removerMascaraTelefone(telefoneNovoCliente) : null
      const cpfLimpo = cpfNovoCliente ? removerMascaraCPF(cpfNovoCliente) : null
      
      const { data, error } = await supabase.functions.invoke('criar-usuario-admin', {
        body: {
          email: emailNovoCliente,
          password: senhaNovoCliente || undefined, // Senha opcional - se não fornecer, cliente criará via email
          nome_completo: nomeNovoCliente,
          telefone: telefoneLimpo,
          cpf: cpfLimpo,
          role: 'cliente',
          enviar_magic_link: enviarMagicLinkNovoCliente,
        },
      })

      if (error) {
        console.error('❌ Erro ao chamar Edge Function:', error)
        setErroNovoCliente(
          error.message || 
          'Erro ao criar cliente. Verifique se a Edge Function está configurada corretamente.'
        )
        setCarregandoNovoCliente(false)
        return
      }

      if (data?.error) {
        console.error('❌ Erro retornado pela Edge Function:', data.error)
        setErroNovoCliente(traduzirErro(data.error) || data.error)
        setCarregandoNovoCliente(false)
        return
      }

      // Email de criação de senha já é enviado automaticamente pela Edge Function
      // Se foi solicitado magic link, envia após criação
      if (enviarMagicLinkNovoCliente && data?.user?.email) {
        console.log('📧 Enviando magic link para:', data.user.email)
        const { error: magicLinkError } = await enviarMagicLinkCliente(data.user.email)
        if (magicLinkError) {
          console.warn('⚠️ Erro ao enviar magic link:', magicLinkError)
          // Não falha a criação se o magic link falhar
        }
      }

      console.log('✅ Cliente criado com sucesso:', data.user)

      setSucessoNovoCliente(true)
      setCarregandoNovoCliente(false)

      // Recarrega a lista de clientes
      await carregarClientes()

      // Fecha o slide após 2 segundos
      setTimeout(() => {
        setSheetNovoClienteAberto(false)
        setSucessoNovoCliente(false)
        setNomeNovoCliente('')
        setEmailNovoCliente('')
        setCpfNovoCliente('')
        setTelefoneNovoCliente('')
        setSenhaNovoCliente('')
        setConfirmarSenhaNovoCliente('')
        setEnviarMagicLinkNovoCliente(false)
      }, 2000)
    } catch (error) {
      setErroNovoCliente('Erro ao cadastrar cliente. Verifique se a Edge Function está configurada.')
      setCarregandoNovoCliente(false)
    }
  }

  const handleSalvarEdicao = async () => {
    if (!clienteSelecionado) return

    setErroEdicao(null)
    setSalvandoEdicao(true)

    try {
      const telefoneLimpo = telefoneEditado ? removerMascaraTelefone(telefoneEditado) : null
      const cpfLimpo = cpfEditado ? removerMascaraCPF(cpfEditado) : null
      
      const { error } = await atualizarCliente(clienteSelecionado.id, {
        display_name: nomeEditado,
        telefone: telefoneLimpo || undefined,
        cpf: cpfLimpo || undefined,
        email: emailEditado !== clienteSelecionado.email ? emailEditado : undefined,
      })

      if (error) {
        setErroEdicao(error.message || 'Erro ao atualizar cliente')
        setSalvandoEdicao(false)
        return
      }

      setSucessoAcao('Cliente atualizado com sucesso!')
      setEditandoCliente(false)
      setSalvandoEdicao(false)
      
      // Aguarda mais tempo para garantir que a atualização foi processada no banco
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Recarrega os dados para refletir as mudanças na lista
      await carregarClientes()
      
      // Aguarda mais um pouco antes de recarregar os detalhes
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Recarrega os detalhes do cliente atualizado com dados frescos
      const { cliente, error: detalhesError } = await buscarDetalhesCliente(clienteSelecionado.id)
      
      if (detalhesError) {
        console.error('Erro ao recarregar detalhes:', detalhesError)
      }
      
      if (cliente) {
        console.log('✅ Dados atualizados recarregados:', {
          nome: cliente.display_name,
          email: cliente.email,
          telefone: cliente.telefone,
          cpf: cliente.cpf
        })
        
        setClienteSelecionado(cliente)
        // Atualiza também os campos de edição para refletir os novos valores
        setNomeEditado(cliente.display_name || cliente.nome_completo || '')
        setCpfEditado(cliente.cpf || cliente.metadata?.cpf ? aplicarMascaraCPF(cliente.cpf || cliente.metadata?.cpf || '') : '')
        setTelefoneEditado(cliente.telefone || cliente.metadata?.telefone ? aplicarMascaraTelefone(cliente.telefone || cliente.metadata?.telefone || '') : '')
        setEmailEditado(cliente.email)
      } else {
        // Se não conseguiu recarregar, tenta novamente após mais tempo
        setTimeout(async () => {
          const { cliente: clienteRetry } = await buscarDetalhesCliente(clienteSelecionado.id)
          if (clienteRetry) {
            setClienteSelecionado(clienteRetry)
            setNomeEditado(clienteRetry.display_name || clienteRetry.nome_completo || '')
            setCpfEditado(clienteRetry.cpf || clienteRetry.metadata?.cpf ? aplicarMascaraCPF(clienteRetry.cpf || clienteRetry.metadata?.cpf || '') : '')
            setTelefoneEditado(clienteRetry.telefone || clienteRetry.metadata?.telefone ? aplicarMascaraTelefone(clienteRetry.telefone || clienteRetry.metadata?.telefone || '') : '')
            setEmailEditado(clienteRetry.email)
          }
        }, 1000)
      }

      setTimeout(() => setSucessoAcao(null), 3000)
    } catch (error) {
      setErroEdicao('Erro inesperado ao atualizar cliente')
      setSalvandoEdicao(false)
    }
  }

  const handleEnviarMagicLink = async () => {
    if (!clienteSelecionado) return

    setSucessoAcao(null)
    const { error, mensagem } = await enviarMagicLinkCliente(clienteSelecionado.email)

    if (error) {
      setErroEdicao(mensagem || 'Erro ao enviar magic link')
    } else {
      setSucessoAcao('Magic Link enviado com sucesso!')
      setTimeout(() => setSucessoAcao(null), 3000)
    }
  }

  const handleEnviarRedefinicaoSenha = async () => {
    if (!clienteSelecionado) return

    setSucessoAcao(null)
    const { error, mensagem } = await enviarRedefinicaoSenhaCliente(clienteSelecionado.email)

    if (error) {
      setErroEdicao(mensagem || 'Erro ao enviar email de redefinição')
    } else {
      setSucessoAcao('Email de redefinição de senha enviado com sucesso!')
      setTimeout(() => setSucessoAcao(null), 3000)
    }
  }

  const handleExcluirCliente = async () => {
    if (!clienteSelecionado) return
    setConfirmarExclusaoAberto(true)
  }

  const confirmarExclusao = async () => {
    if (!clienteSelecionado) return
    setExcluindoCliente(true)
    setSucessoAcao(null)
    const { error, mensagem } = await excluirCliente(clienteSelecionado.id)
    setExcluindoCliente(false)
    setConfirmarExclusaoAberto(false)
    if (error) {
      setErroEdicao(mensagem || 'Erro ao excluir cliente')
    } else {
      setSucessoAcao('Cliente excluído com sucesso!')
      setSheetAberto(false)
      await carregarClientes()
      setTimeout(() => setSucessoAcao(null), 3000)
    }
  }

  const handleBanirCliente = async () => {
    if (!clienteSelecionado) return

    const valor = parseInt(tempoBanimento)
    if (isNaN(valor) || valor <= 0) {
      setErroEdicao('Por favor, insira um valor válido maior que zero.')
      return
    }

    const tempoFinal = tipoTempoBanimento === 'horas' ? `${valor}h` : `${valor}d`

    setBanindoCliente(true)
    setSucessoAcao(null)
    setErroEdicao(null)

    console.log('🔒 Banindo cliente com tempo:', tempoFinal)

    const { error, mensagem } = await bloquearCliente(
      clienteSelecionado.id, 
      true, 
      tempoFinal
    )

    setBanindoCliente(false)

    if (error) {
      setErroEdicao(mensagem || 'Erro ao banir cliente')
      console.error('❌ Erro ao banir:', error)
    } else {
      let tempoTexto = ''
      if (tempoFinal.endsWith('h')) {
        tempoTexto = `por ${valor} ${valor === 1 ? 'hora' : 'horas'}`
      } else {
        tempoTexto = `por ${valor} ${valor === 1 ? 'dia' : 'dias'}`
      }
      setSucessoAcao(`Cliente banido ${tempoTexto} com sucesso!`)
      setMostrarCamposBanimento(false)
      setTempoBanimento('1')
      await carregarClientes()
      const { cliente } = await buscarDetalhesCliente(clienteSelecionado.id)
      if (cliente) setClienteSelecionado(cliente)
      setTimeout(() => setSucessoAcao(null), 5000)
    }
  }

  const handleDesbanirCliente = async () => {
    if (!clienteSelecionado) return

    setSucessoAcao(null)
    setErroEdicao(null)
    const { error, mensagem } = await bloquearCliente(clienteSelecionado.id, false)

    if (error) {
      setErroEdicao(mensagem || 'Erro ao desbanir cliente')
    } else {
      setSucessoAcao('Cliente desbanido com sucesso!')
      await carregarClientes()
      const { cliente } = await buscarDetalhesCliente(clienteSelecionado.id)
      if (cliente) setClienteSelecionado(cliente)
      setTimeout(() => setSucessoAcao(null), 3000)
    }
  }

  const clientesFiltrados = clientes.filter(cliente =>
    {
      // Filtro por busca de texto
      const termo = busca.trim().toLowerCase()
      const correspondeBusca =
        termo.length === 0 ||
        (cliente.display_name || cliente.nome_completo || '')
          .toLowerCase()
          .includes(termo) ||
        cliente.email.toLowerCase().includes(termo) ||
        (cliente.telefone || '').includes(busca) ||
        (cliente.metadata?.telefone || '').includes(busca) ||
        (cliente.cpf || '').includes(busca) ||
        (cliente.metadata?.cpf || '').includes(busca)

      // Filtro por status
      const correspondeStatus = (() => {
        switch (statusFiltro) {
          case 'ativo':
            return !cliente.esta_banido && !!cliente.email_confirmado
          case 'banido':
            return !!cliente.esta_banido
          case 'email_pendente':
            return !cliente.email_confirmado && !cliente.esta_banido
          case 'todos':
          default:
            return true
        }
      })()

      // Filtro por data de cadastro
      const correspondeData = (() => {
        const createdAt = cliente.created_at ? new Date(cliente.created_at) : null
        if (!createdAt) return false

        const agora = new Date()
        const inicioHoje = new Date()
        inicioHoje.setHours(0, 0, 0, 0)

        if (dataFiltro === 'tudo') return true
        if (dataFiltro === 'hoje') return createdAt >= inicioHoje

        const diasNum = dataFiltro === '7' || dataFiltro === '15' || dataFiltro === '30' ? parseInt(dataFiltro, 10) : null
        if (diasNum) {
          const limite = new Date(agora)
          limite.setDate(limite.getDate() - diasNum)
          return createdAt >= limite
        }

        // Personalizado
        if (dataFiltro === 'personalizado') {
          // Se nenhuma data foi definida, não restringe
          if (!dataInicioPersonalizada && !dataFimPersonalizada) return true

          const inicio = dataInicioPersonalizada ? new Date(dataInicioPersonalizada) : null
          const fim = dataFimPersonalizada ? new Date(dataFimPersonalizada) : null
          if (inicio) inicio.setHours(0, 0, 0, 0)
          if (fim) fim.setHours(23, 59, 59, 999)

          if (inicio && fim) return createdAt >= inicio && createdAt <= fim
          if (inicio && !fim) return createdAt >= inicio
          if (!inicio && fim) return createdAt <= fim
          return true
        }

        return true
      })()

      return correspondeBusca && correspondeStatus && correspondeData
    }
  )

  const formatarData = (data: string | null) => {
    if (!data) return 'N/A'
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Users className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Clientes
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {revendaSelecionada 
              ? `Clientes da revenda selecionada (${clientes.length} ${clientes.length === 1 ? 'cliente' : 'clientes'})`
              : `Todos os clientes cadastrados na plataforma (${clientes.length} ${clientes.length === 1 ? 'cliente' : 'clientes'})`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {revendaSelecionada && (
            <Button
              variant="outline"
              onClick={() => setRevendaSelecionada(null)}
              className="border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          )}
          <Button
            onClick={() => setSheetNovoClienteAberto(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Filtros de Revenda e Unidade */}
      <FiltrosRevendaUnidade
        revendaSelecionada={revendaSelecionada}
        unidadeSelecionada={unidadeSelecionada}
        onRevendaSelecionada={setRevendaSelecionada}
        onUnidadeSelecionada={setUnidadeSelecionada}
        obrigatorio={false}
      />

      {/* Mensagem de Erro */}
      {erro && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{erro}</p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  Execute o SQL em supabase/migrations/001_create_usuarios_table.sql no SQL Editor do Supabase.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas Gerais - Sempre visíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Total de Clientes</p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                  {revendaSelecionada ? clientes.length : clientesTodos.length}
                </p>
                {(() => {
                  const atual = revendaSelecionada ? clientes.length : clientesTodos.length
                  const anterior = metricasAnteriores.totalClientes
                  if (anterior > 0) {
                    const variacao = ((atual - anterior) / anterior) * 100
                    return (
                      <p className={`text-xs mt-1 ${variacao >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {variacao >= 0 ? '↑' : '↓'} {Math.abs(variacao).toFixed(1)}% vs dia anterior
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
              <Users className="w-8 h-8 text-violet-600 dark:text-violet-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Clientes Ativos</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {(revendaSelecionada ? clientes : clientesTodos).filter(c => !c.esta_banido && c.email_confirmado).length}
                </p>
                {(() => {
                  const atual = (revendaSelecionada ? clientes : clientesTodos).filter(c => !c.esta_banido && c.email_confirmado).length
                  const anterior = metricasAnteriores.clientesAtivos
                  if (anterior > 0) {
                    const variacao = ((atual - anterior) / anterior) * 100
                    return (
                      <p className={`text-xs mt-1 ${variacao >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {variacao >= 0 ? '↑' : '↓'} {Math.abs(variacao).toFixed(1)}% vs dia anterior
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
              <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Emails Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {(revendaSelecionada ? clientes : clientesTodos).filter(c => !c.email_confirmado && !c.esta_banido).length}
                </p>
                {(() => {
                  const atual = (revendaSelecionada ? clientes : clientesTodos).filter(c => !c.email_confirmado && !c.esta_banido).length
                  const anterior = metricasAnteriores.emailsPendentes
                  if (anterior > 0) {
                    const variacao = ((atual - anterior) / anterior) * 100
                    return (
                      <p className={`text-xs mt-1 ${variacao >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {variacao >= 0 ? '↑' : '↓'} {Math.abs(variacao).toFixed(1)}% vs dia anterior
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
              <MailCheck className="w-8 h-8 text-yellow-600 dark:text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Clientes Banidos</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {(revendaSelecionada ? clientes : clientesTodos).filter(c => c.esta_banido).length}
                </p>
                {(() => {
                  const atual = (revendaSelecionada ? clientes : clientesTodos).filter(c => c.esta_banido).length
                  const anterior = metricasAnteriores.clientesBanidos
                  if (anterior > 0) {
                    const variacao = ((atual - anterior) / anterior) * 100
                    return (
                      <p className={`text-xs mt-1 ${variacao >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {variacao >= 0 ? '↑' : '↓'} {Math.abs(variacao).toFixed(1)}% vs dia anterior
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
              <Ban className="w-8 h-8 text-red-600 dark:text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo */}
      <div className="mt-6 space-y-6">
              {/* Filtros Simplificados */}
              <FiltrosAvancados
                busca={busca}
                onBuscaChange={setBusca}
                statusFiltro={{
                  value: statusFiltro,
                  onChange: (v) => {
                    setStatusFiltro(v as 'todos' | 'ativo' | 'banido' | 'email_pendente')
                  },
                  options: [
                    { value: 'todos', label: 'Todos' },
                    { value: 'ativo', label: 'Em atividade' },
                    { value: 'email_pendente', label: 'E-mail pendente' },
                    { value: 'banido', label: 'Banidos' },
                  ],
                }}
                dataFiltro={{
                  value: dataFiltro,
                  onChange: (v) => {
                    setDataFiltro(v as 'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado')
                  },
                  dataInicio: dataInicioPersonalizada,
                  dataFim: dataFimPersonalizada,
                  onDataInicioChange: setDataInicioPersonalizada,
                  onDataFimChange: setDataFimPersonalizada,
                }}
                placeholderBusca="Buscar por nome, e-mail ou telefone..."
                onLimparFiltros={() => {
                  setDataInicioPersonalizada('')
                  setDataFimPersonalizada('')
                  setDropdownCalendarioAberto(false)
                }}
              />

      {/* Lista de Clientes */}
      {carregando ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800">
                <Users className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  {busca
                    ? 'Tente buscar com outros termos'
                    : 'Os clientes aparecerão aqui quando se registrarem'}
                </p>
              </div>
              {!busca && (
                <Button
                  onClick={() => setSheetNovoClienteAberto(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Cliente
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Nome
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      CPF
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      E-mail
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Telefone
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Status
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex-shrink-0">
                            <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div className="min-w-0 flex items-center gap-2">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
                              {cliente.display_name || cliente.nome_completo || 'Sem nome'}
                            </p>
                            {cliente.inadimplente && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center gap-1 flex-shrink-0">
                                <AlertCircle className="w-3 h-3" />
                                Inadimplente
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                          <span className="text-sm text-neutral-900 dark:text-neutral-50">
                            {cliente.cpf || cliente.metadata?.cpf ? aplicarMascaraCPF(cliente.cpf || cliente.metadata?.cpf || '') : 'Não informado'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-neutral-900 dark:text-neutral-50 truncate">
                          {cliente.email}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                          <span className="text-sm text-neutral-900 dark:text-neutral-50">
                            {cliente.telefone || cliente.metadata?.telefone ? aplicarMascaraTelefone(cliente.telefone || cliente.metadata?.telefone || '') : 'Não informado'}
                          </span>
                          {cliente.telefone_confirmado && (
                            <CheckCircle2 className="w-4 h-4 text-green-500 ml-1 flex-shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          {cliente.esta_banido ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:ring-orange-800">
                              <Ban className="w-3.5 h-3.5 mr-1.5" />
                              <span className="text-xs font-medium">Banido</span>
                            </span>
                          ) : cliente.email_confirmado ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                              <span className="text-xs font-medium">Em Atividade</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800">
                              <XCircle className="w-3.5 h-3.5 mr-1.5" />
                              <span className="text-xs font-medium">E-mail não confirmado</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAbrirDetalhes(cliente.id)}
                            className="text-neutral-700 dark:text-neutral-300 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 dark:hover:text-white transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 mr-2" />
                            Ações
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      </div>

      {/* Sheet de Detalhes */}
      <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do Cliente</SheetTitle>
            <SheetDescription>
              Informações completas e opções de gerenciamento
            </SheetDescription>
          </SheetHeader>

          {carregandoDetalhes ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : clienteSelecionado ? (
            <div className="mt-6">
              {sucessoAcao && (
                <div className="mb-4 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">{sucessoAcao}</p>
                </div>
              )}

              {erroEdicao && (
                <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{erroEdicao}</p>
                </div>
              )}

              <Tabs defaultValue="informacoes" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="informacoes">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="gerenciar">Gerenciar</TabsTrigger>
                </TabsList>

                <TabsContent value="informacoes" className="mt-6 space-y-6">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                      Informações Básicas
                    </h3>
                    
                    <div className="grid gap-4">
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Nome do Cliente</p>
                          <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                            {clienteSelecionado.display_name || clienteSelecionado.nome_completo || 'Não informado'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">E-mail</p>
                          <div className="flex items-center gap-2">
                            <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                              {clienteSelecionado.email}
                            </p>
                            {clienteSelecionado.email_confirmado ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            {clienteSelecionado.email_confirmado ? 'E-mail confirmado' : 'E-mail não confirmado'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Telefone</p>
                          <div className="flex items-center gap-2">
                            <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                              {clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone ? aplicarMascaraTelefone(clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone || '') : 'Não informado'}
                            </p>
                            {clienteSelecionado.telefone_confirmado && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          {(clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone) && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              {clienteSelecionado.telefone_confirmado ? 'Telefone confirmado' : 'Telefone não confirmado'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CreditCard className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">CPF</p>
                          <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                            {clienteSelecionado.cpf || clienteSelecionado.metadata?.cpf ? aplicarMascaraCPF(clienteSelecionado.cpf || clienteSelecionado.metadata?.cpf || '') : 'Não informado'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informações de Conta */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                      Informações de Conta
                    </h3>
                    
                    <div className="grid gap-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Data de Cadastro</p>
                          <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                            {formatarData(clienteSelecionado.created_at)}
                          </p>
                        </div>
                      </div>

                      {clienteSelecionado.ultimo_login && (
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Último Login</p>
                            <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                              {formatarData(clienteSelecionado.ultimo_login)}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">ID do Usuário</p>
                          <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 break-all">
                            {clienteSelecionado.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Tipo do Usuário</p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 capitalize">
                            {clienteSelecionado.role}
                          </span>
                        </div>
                      </div>

                      {clienteSelecionado.esta_banido && (
                        <div className="flex items-start gap-3">
                          <Ban className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Status de Banimento</p>
                            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-600 text-white shadow-sm">
                                  🚫 BANIDO
                                </span>
                              </div>
                              <div className="space-y-1.5 text-xs">
                                {clienteSelecionado.banido_at && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                                    <span className="text-neutral-700 dark:text-neutral-300">
                                      <span className="font-medium">Banido em:</span> {formatarData(clienteSelecionado.banido_at)}
                                    </span>
                                  </div>
                                )}
                                {clienteSelecionado.banido_ate && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                                    <span className="text-neutral-700 dark:text-neutral-300">
                                      <span className="font-medium">
                                        {new Date(clienteSelecionado.banido_ate) > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                                          ? '⏳ Banimento permanente'
                                          : `Válido até: ${formatarData(clienteSelecionado.banido_ate)}`}
                                      </span>
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {clienteSelecionado.inadimplente && (
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Status de Inadimplência</p>
                            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-600 text-white shadow-sm">
                                  ⚠️ INADIMPLENTE
                                </span>
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                                  <span className="text-neutral-700 dark:text-neutral-300">
                                    <span className="font-medium">
                                      {clienteSelecionado.total_parcelas_atrasadas || 0} parcela{(clienteSelecionado.total_parcelas_atrasadas || 0) > 1 ? 's' : ''} atrasada{(clienteSelecionado.total_parcelas_atrasadas || 0) > 1 ? 's' : ''}
                                    </span>
                                  </span>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-red-200 dark:border-red-800">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/admin/inadimplencia`)}
                                  className="w-full border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver Detalhes da Inadimplência
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="gerenciar" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                      Editar Cliente
                    </h3>

                    {!editandoCliente ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Nome do Cliente</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {clienteSelecionado.display_name || clienteSelecionado.nome_completo || 'Não informado'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditandoCliente(true)
                              // Garante que os campos de edição estão sincronizados com clienteSelecionado
                              if (clienteSelecionado) {
                                setNomeEditado(clienteSelecionado.display_name || clienteSelecionado.nome_completo || '')
                                setEmailEditado(clienteSelecionado.email)
                                setTelefoneEditado(
                                  clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone
                                    ? aplicarMascaraTelefone(clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone || '')
                                    : ''
                                )
                                setCpfEditado(
                                  clienteSelecionado.cpf || clienteSelecionado.metadata?.cpf
                                    ? aplicarMascaraCPF(clienteSelecionado.cpf || clienteSelecionado.metadata?.cpf || '')
                                    : ''
                                )
                              }
                            }}
                            className="border-neutral-300 dark:border-neutral-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">E-mail</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {clienteSelecionado.email}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditandoCliente(true)
                              // Garante que os campos de edição estão sincronizados com clienteSelecionado
                              if (clienteSelecionado) {
                                setNomeEditado(clienteSelecionado.display_name || clienteSelecionado.nome_completo || '')
                                setEmailEditado(clienteSelecionado.email)
                                setTelefoneEditado(
                                  clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone
                                    ? aplicarMascaraTelefone(clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone || '')
                                    : ''
                                )
                                setCpfEditado(
                                  clienteSelecionado.cpf || clienteSelecionado.metadata?.cpf
                                    ? aplicarMascaraCPF(clienteSelecionado.cpf || clienteSelecionado.metadata?.cpf || '')
                                    : ''
                                )
                              }
                            }}
                            className="border-neutral-300 dark:border-neutral-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Telefone</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone 
                                ? aplicarMascaraTelefone(clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone || '') 
                                : 'Não informado'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditandoCliente(true)
                              // Garante que os campos de edição estão sincronizados com clienteSelecionado
                              if (clienteSelecionado) {
                                setNomeEditado(clienteSelecionado.display_name || clienteSelecionado.nome_completo || '')
                                setEmailEditado(clienteSelecionado.email)
                                setTelefoneEditado(
                                  clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone
                                    ? aplicarMascaraTelefone(clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone || '')
                                    : ''
                                )
                                setCpfEditado(
                                  clienteSelecionado.cpf || clienteSelecionado.metadata?.cpf
                                    ? aplicarMascaraCPF(clienteSelecionado.cpf || clienteSelecionado.metadata?.cpf || '')
                                    : ''
                                )
                              }
                            }}
                            className="border-neutral-300 dark:border-neutral-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">CPF</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {clienteSelecionado.cpf || clienteSelecionado.metadata?.cpf 
                                ? aplicarMascaraCPF(clienteSelecionado.cpf || clienteSelecionado.metadata?.cpf || '') 
                                : 'Não informado'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditandoCliente(true)
                              // Garante que os campos de edição estão sincronizados com clienteSelecionado
                              if (clienteSelecionado) {
                                setNomeEditado(clienteSelecionado.display_name || clienteSelecionado.nome_completo || '')
                                setEmailEditado(clienteSelecionado.email)
                                setTelefoneEditado(
                                  clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone
                                    ? aplicarMascaraTelefone(clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone || '')
                                    : ''
                                )
                                setCpfEditado(
                                  clienteSelecionado.cpf || clienteSelecionado.metadata?.cpf
                                    ? aplicarMascaraCPF(clienteSelecionado.cpf || clienteSelecionado.metadata?.cpf || '')
                                    : ''
                                )
                              }
                            }}
                            className="border-neutral-300 dark:border-neutral-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nomeEditado">Nome do Cliente</Label>
                          <Input
                            id="nomeEditado"
                            value={nomeEditado}
                            onChange={(e) => setNomeEditado(e.target.value)}
                            disabled={salvandoEdicao}
                            placeholder="Nome do cliente"
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emailEditado">E-mail</Label>
                          <Input
                            id="emailEditado"
                            type="email"
                            value={emailEditado}
                            onChange={(e) => setEmailEditado(e.target.value)}
                            disabled={salvandoEdicao}
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="telefoneEditado">Telefone</Label>
                          <Input
                            id="telefoneEditado"
                            type="tel"
                            placeholder="(00) 0-0000-0000"
                            value={telefoneEditado}
                            onChange={(e) => {
                              const valor = e.target.value
                              const apenasNumeros = valor.replace(/\D/g, '')
                              if (apenasNumeros.length <= 11) {
                                setTelefoneEditado(aplicarMascaraTelefone(valor))
                              }
                            }}
                            disabled={salvandoEdicao}
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cpfEditado">CPF</Label>
                          <Input
                            id="cpfEditado"
                            type="text"
                            placeholder="000.000.000-00"
                            value={cpfEditado}
                            onChange={(e) => {
                              const valorFormatado = aplicarMascaraCPF(e.target.value)
                              setCpfEditado(valorFormatado)
                            }}
                            disabled={salvandoEdicao}
                            maxLength={14}
                            className="border-neutral-300 dark:border-neutral-700"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditandoCliente(false)
                              setNomeEditado(clienteSelecionado.display_name || clienteSelecionado.nome_completo || '')
                              setCpfEditado(clienteSelecionado.cpf || clienteSelecionado.metadata?.cpf ? aplicarMascaraCPF(clienteSelecionado.cpf || clienteSelecionado.metadata?.cpf || '') : '')
                              setTelefoneEditado(clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone ? aplicarMascaraTelefone(clienteSelecionado.telefone || clienteSelecionado.metadata?.telefone || '') : '')
                              setEmailEditado(clienteSelecionado.email)
                              setErroEdicao(null)
                            }}
                            disabled={salvandoEdicao}
                            className="flex-1 border-neutral-300 dark:border-neutral-700"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSalvarEdicao}
                            disabled={salvandoEdicao}
                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                          >
                            {salvandoEdicao ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Salvando...
                              </>
                            ) : (
                              'Salvar'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                      Ações Rápidas
                    </h3>

                    <div className="grid gap-2">
                      <Button
                        variant="outline"
                        onClick={handleEnviarMagicLink}
                        className="justify-start border-neutral-300 dark:border-neutral-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Magic Link
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleEnviarRedefinicaoSenha}
                        className="justify-start border-neutral-300 dark:border-neutral-700"
                      >
                        <KeyRound className="w-4 h-4 mr-2" />
                        Enviar Redefinição de Senha
                      </Button>

                      {clienteSelecionado.esta_banido ? (
                        <>
                          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 mb-2">
                            <div className="flex items-start gap-2">
                              <Ban className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-orange-900 dark:text-orange-50">
                                  Cliente Banido
                                </p>
                                {clienteSelecionado.banido_ate && (
                                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                    {clienteSelecionado.banido_ate && new Date(clienteSelecionado.banido_ate) > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                                      ? 'Banimento permanente'
                                      : `Banido até ${formatarData(clienteSelecionado.banido_ate)}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={handleDesbanirCliente}
                            className="w-full justify-start border border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 bg-white dark:bg-neutral-900 hover:bg-green-600 hover:text-white dark:hover:bg-green-600 dark:hover:text-white hover:border-green-600 dark:hover:border-green-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md rounded-md px-4 py-2 text-sm inline-flex items-center"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Desbanir Cliente
                          </button>
                        </>
                      ) : (
                        <>
                          {!mostrarCamposBanimento ? (
                            <button
                              onClick={() => setMostrarCamposBanimento(true)}
                              className="w-full justify-start border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 bg-white dark:bg-neutral-900 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-600 dark:hover:text-white hover:border-orange-600 dark:hover:border-orange-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md rounded-md px-4 py-2 text-sm inline-flex items-center"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Banir Cliente
                            </button>
                          ) : (
                            <div className="p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-orange-900 dark:text-orange-50">
                                  Tempo de Banimento
                                </Label>
                                <button
                                  onClick={() => {
                                    setMostrarCamposBanimento(false)
                                    setTempoBanimento('1')
                                    setTipoTempoBanimento('horas')
                                  }}
                                  className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                                >
                                  Cancelar
                                </button>
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setTipoTempoBanimento('horas')}
                                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                    tipoTempoBanimento === 'horas'
                                      ? 'bg-orange-600 text-white'
                                      : 'bg-white dark:bg-neutral-800 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30'
                                  }`}
                                >
                                  Horas
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTipoTempoBanimento('dias')}
                                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                    tipoTempoBanimento === 'dias'
                                      ? 'bg-orange-600 text-white'
                                      : 'bg-white dark:bg-neutral-800 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30'
                                  }`}
                                >
                                  Dias
                                </button>
                              </div>

                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder={`Ex: ${tipoTempoBanimento === 'horas' ? '24' : '7'}`}
                                  value={tempoBanimento}
                                  onChange={(e) => {
                                    const valor = e.target.value.replace(/\D/g, '')
                                    if (valor === '' || parseInt(valor) > 0) {
                                      setTempoBanimento(valor)
                                    }
                                  }}
                                  className="flex-1 border-orange-300 dark:border-orange-700 bg-white dark:bg-neutral-900"
                                />
                                <button
                                  onClick={handleBanirCliente}
                                  disabled={banindoCliente || !tempoBanimento || parseInt(tempoBanimento) <= 0}
                                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center"
                                >
                                  {banindoCliente ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                      Banindo...
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-4 h-4 mr-2" />
                                      Banir
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-orange-700 dark:text-orange-300">
                                O cliente será banido por {tempoBanimento || '...'} {tipoTempoBanimento === 'horas' ? (parseInt(tempoBanimento) === 1 ? 'hora' : 'horas') : (parseInt(tempoBanimento) === 1 ? 'dia' : 'dias')}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {clienteSelecionado?.id && (
                        <button
                          onClick={() => {
                            setVisualizarComoClienteAberto(true)
                          }}
                          className="w-full justify-start border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 bg-white dark:bg-neutral-900 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-400 dark:hover:border-violet-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md rounded-md px-4 py-2 text-sm inline-flex items-center mb-2"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar como Cliente
                        </button>
                      )}

                      <button
                        onClick={handleExcluirCliente}
                        className="w-full justify-start border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-white dark:bg-neutral-900 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md rounded-md px-4 py-2 text-sm inline-flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Cliente
                      </button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="mt-6 text-center py-12">
              <AlertCircle className="w-12 h-12 text-neutral-400 dark:text-neutral-500 mx-auto mb-4" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Não foi possível carregar os detalhes do cliente.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet de Novo Cliente */}
      <Sheet open={sheetNovoClienteAberto} onOpenChange={setSheetNovoClienteAberto}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Cadastrar Novo Cliente</SheetTitle>
            <SheetDescription>
              Preencha os dados para cadastrar um novo cliente no sistema
            </SheetDescription>
          </SheetHeader>

          {sucessoNovoCliente ? (
            <div className="mt-6 text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                Cliente criado com sucesso!
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                O cliente <strong>{nomeNovoCliente}</strong> foi cadastrado e receberá um email para criar sua senha.
              </p>
            </div>
          ) : (
            <form onSubmit={handleCadastrarNovoCliente} className="mt-6 space-y-6">
              {erroNovoCliente && (
                <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{erroNovoCliente}</p>
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      Alternativa: Crie manualmente no painel do Supabase (Authentication &gt; Users &gt; Add User) e defina role: &quot;cliente&quot; nos metadados.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeNovoCliente">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <Input
                      id="nomeNovoCliente"
                      type="text"
                      placeholder="Nome do cliente"
                      value={nomeNovoCliente}
                      onChange={(e) => setNomeNovoCliente(e.target.value)}
                      required
                      disabled={carregandoNovoCliente}
                      className="pl-10 border-neutral-300 dark:border-neutral-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailNovoCliente">E-mail *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <Input
                      id="emailNovoCliente"
                      type="email"
                      placeholder="cliente@email.com"
                      value={emailNovoCliente}
                      onChange={(e) => setEmailNovoCliente(e.target.value)}
                      required
                      disabled={carregandoNovoCliente}
                      className="pl-10 border-neutral-300 dark:border-neutral-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefoneNovoCliente">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <Input
                      id="telefoneNovoCliente"
                      type="tel"
                      placeholder="(00) 0-0000-0000"
                      value={telefoneNovoCliente}
                      onChange={(e) => {
                        const valor = e.target.value
                        const apenasNumeros = valor.replace(/\D/g, '')
                        if (apenasNumeros.length <= 11) {
                          setTelefoneNovoCliente(aplicarMascaraTelefone(valor))
                        }
                      }}
                      disabled={carregandoNovoCliente}
                      className="pl-10 border-neutral-300 dark:border-neutral-700"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Telefone com DDD (opcional)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpfNovoCliente">CPF</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <Input
                      id="cpfNovoCliente"
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpfNovoCliente}
                      onChange={(e) => {
                        const valorFormatado = aplicarMascaraCPF(e.target.value)
                        setCpfNovoCliente(valorFormatado)
                      }}
                      disabled={carregandoNovoCliente}
                      maxLength={14}
                      className="pl-10 border-neutral-300 dark:border-neutral-700"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    CPF do cliente (opcional)
                  </p>
                </div>

                <div className="space-y-4 p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="enviarMagicLinkNovoCliente"
                      checked={enviarMagicLinkNovoCliente}
                      onChange={(e) => setEnviarMagicLinkNovoCliente(e.target.checked)}
                      disabled={carregandoNovoCliente}
                      className="mt-1 w-4 h-4 text-violet-600 border-neutral-300 rounded focus:ring-violet-500 dark:border-neutral-700"
                    />
                    <div className="flex-1">
                      <Label htmlFor="enviarMagicLinkNovoCliente" className="text-sm font-medium text-neutral-900 dark:text-neutral-50 cursor-pointer">
                        Enviar Magic Link ao invés de senha
                      </Label>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        Se marcado, o cliente receberá um link de login por e-mail ao invés de uma senha. Os campos de senha serão desabilitados.
                      </p>
                    </div>
                  </div>
                </div>

                {!enviarMagicLinkNovoCliente && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="senhaNovoCliente">Senha (Opcional)</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                        <Input
                          id="senhaNovoCliente"
                          type="password"
                          placeholder="Deixe em branco para cliente criar senha via email"
                          value={senhaNovoCliente}
                          onChange={(e) => setSenhaNovoCliente(e.target.value)}
                          disabled={carregandoNovoCliente || enviarMagicLinkNovoCliente}
                          minLength={8}
                          className="pl-10 border-neutral-300 dark:border-neutral-700"
                        />
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Se deixar em branco, o cliente receberá um email para criar sua senha. Se preencher, use no mínimo 8 caracteres.
                      </p>
                    </div>

                    {senhaNovoCliente && (
                      <div className="space-y-2">
                        <Label htmlFor="confirmarSenhaNovoCliente">Confirmar Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                          <Input
                            id="confirmarSenhaNovoCliente"
                            type="password"
                            placeholder="••••••••"
                            value={confirmarSenhaNovoCliente}
                            onChange={(e) => setConfirmarSenhaNovoCliente(e.target.value)}
                            disabled={carregandoNovoCliente || enviarMagicLinkNovoCliente}
                            className={`pl-10 border-neutral-300 dark:border-neutral-700 ${
                              confirmarSenhaNovoCliente && senhaNovoCliente !== confirmarSenhaNovoCliente
                                ? 'border-red-300 dark:border-red-700'
                                : confirmarSenhaNovoCliente && senhaNovoCliente === confirmarSenhaNovoCliente
                                ? 'border-green-300 dark:border-green-700'
                                : ''
                            }`}
                          />
                        </div>
                        {confirmarSenhaNovoCliente && senhaNovoCliente !== confirmarSenhaNovoCliente && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            As senhas não coincidem
                          </p>
                        )}
                        {confirmarSenhaNovoCliente && senhaNovoCliente === confirmarSenhaNovoCliente && senhaNovoCliente && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Senhas coincidem
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSheetNovoClienteAberto(false)
                    setNomeNovoCliente('')
                    setEmailNovoCliente('')
                    setCpfNovoCliente('')
                    setTelefoneNovoCliente('')
                    setSenhaNovoCliente('')
                    setConfirmarSenhaNovoCliente('')
                    setEnviarMagicLinkNovoCliente(false)
                    setErroNovoCliente(null)
                  }}
                  disabled={carregandoNovoCliente}
                  className="flex-1 border-neutral-300 dark:border-neutral-700"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    carregandoNovoCliente || 
                    !!(senhaNovoCliente && (senhaNovoCliente !== confirmarSenhaNovoCliente || senhaNovoCliente.length < 8))
                  }
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
                >
                  {carregandoNovoCliente ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Cadastrando...
                    </>
                  ) : (
                    enviarMagicLinkNovoCliente ? 'Cadastrar e Enviar Magic Link' : 'Cadastrar Cliente'
                  )}
                </Button>
              </div>
            </form>
          )}
      </SheetContent>
      </Sheet>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        aberto={confirmarExclusaoAberto}
        onOpenChange={setConfirmarExclusaoAberto}
        titulo="Confirmar exclusão"
        descricao="Esta ação não pode ser desfeita. O cliente e seus dados associados serão removidos."
      >
        <div className="space-y-3">
          {clienteSelecionado && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">
                Cliente: <strong className="font-medium">{clienteSelecionado.display_name || clienteSelecionado.nome_completo || clienteSelecionado.email}</strong>
              </p>
            </div>
          )}
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Tem certeza que deseja excluir? Esta ação afetará o acesso do cliente.
          </p>
        </div>
        <DialogActions>
          <Button
            variant="outline"
            onClick={() => setConfirmarExclusaoAberto(false)}
            className="border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmarExclusao}
            disabled={excluindoCliente}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {excluindoCliente ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Excluindo...
              </>
            ) : (
              <>Confirmar exclusão</>
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Popup de Visualização como Cliente */}
      {visualizarComoClienteAberto && clienteSelecionado && clienteSelecionado.id && (
        <VisualizarComoCliente
          clienteId={clienteSelecionado.id}
          clienteUserId={clienteSelecionado.id}
          clienteNome={clienteSelecionado.display_name || clienteSelecionado.nome_completo || clienteSelecionado.email || 'Cliente'}
          onClose={() => setVisualizarComoClienteAberto(false)}
        />
      )}
    </div>
  )
}
