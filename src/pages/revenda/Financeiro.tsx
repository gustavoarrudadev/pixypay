import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Search,
  Eye,
  ShoppingCart,
  User,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Lock,
  RefreshCw,
  Trash2,
  QrCode,
  Save,
  X,
  Edit,
  CreditCard,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePickerCompact } from '@/components/ui/date-range-picker-compact'
import { Dropdown } from '@/components/ui/dropdown'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import {
  calcularMetricasRevenda,
  listarTransacoesRevenda,
  type TransacaoFinanceira,
} from '@/lib/financeiro'
import {
  buscarConfiguracaoRepasseAtiva,
  listarConfiguracoesRepasse,
  alterarModalidadeRepasse,
  type ConfiguracaoRepasse,
} from '@/lib/configuracoesRepasse'
import { formatarPreco } from '@/lib/utils'
import { obterRevendaId, obterUnidadeIdColaborador } from '@/lib/impersonation'
import { buscarDetalhesRevenda, atualizarRevenda, type RevendaCompleta } from '@/lib/gerenciarRevenda'
import { aplicarMascaraCPF, aplicarMascaraCNPJ } from '@/lib/mascaras'
import { toast } from 'sonner'
import { listarUnidades, buscarUnidade, atualizarConfiguracaoFinanceiraUnidade, type UnidadeRevenda } from '@/lib/gerenciarUnidades'
import { Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const MODALIDADES = [
  { valor: 'D+1', label: 'D+1 (24 horas)', taxaPercentual: 8.0, taxaFixa: 0.5 },
  { valor: 'D+15', label: 'D+15 (15 dias)', taxaPercentual: 6.5, taxaFixa: 0.5 },
  { valor: 'D+30', label: 'D+30 (30 dias)', taxaPercentual: 5.0, taxaFixa: 0.5 },
] as const

export default function Financeiro() {
  const navigate = useNavigate()
  const location = useLocation()
  const [carregando, setCarregando] = useState(true)
  const [revendaId, setRevendaId] = useState<string | null>(null)
  const [configuracaoAtiva, setConfiguracaoAtiva] = useState<ConfiguracaoRepasse | null>(null)
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoRepasse[]>([])
  const [metricas, setMetricas] = useState({
    valoresRecebidosHoje: 0,
    valoresLiberados: 0,
    valoresPendentes: 0,
    valoresBloqueados: 0,
    totalEmProcessamento: 0,
  })
  const [metricasAnteriores, setMetricasAnteriores] = useState({
    valoresRecebidosHoje: 0,
    valoresLiberados: 0,
    valoresPendentes: 0,
    valoresBloqueados: 0,
  })
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([])
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('lista') // Padrão lista para melhor visualização
  const [mostrarModalidade, setMostrarModalidade] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina] = useState(20)
  const [novaModalidade, setNovaModalidade] = useState<'D+1' | 'D+15' | 'D+30' | null>(null)
  const [dialogAlterarModalidadeAberto, setDialogAlterarModalidadeAberto] = useState(false)
  const [alterandoModalidade, setAlterandoModalidade] = useState(false)
  
  // Estado de unidades
  const [unidades, setUnidades] = useState<UnidadeRevenda[]>([])
  const [carregandoUnidades, setCarregandoUnidades] = useState(true)
  const [unidadeSelecionadaId, setUnidadeSelecionadaId] = useState<string | null>(null)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<UnidadeRevenda | null>(null)
  
  // Estados para conta PIX (agora por unidade)
  const [editandoContaPix, setEditandoContaPix] = useState(false)
  const [contaPixNome, setContaPixNome] = useState('')
  const [contaPixCpfCnpj, setContaPixCpfCnpj] = useState('')
  const [contaPixChave, setContaPixChave] = useState('')
  const [contaPixTipo, setContaPixTipo] = useState<'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'CHAVE_ALEATORIA'>('CPF')
  const [salvandoContaPix, setSalvandoContaPix] = useState(false)

  // Filtros avançados
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'pendente' | 'liberado' | 'repassado'>('todos')
  const [modalidadeFiltro, setModalidadeFiltro] = useState<'todos' | 'D+1' | 'D+15' | 'D+30'>('todos')
  const [dataFiltro, setDataFiltro] = useState<'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'>('tudo')
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('')
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)

  useEffect(() => {
    inicializar()
  }, [])

  // Recarrega dados quando a página recebe foco (usuário volta para a aba) ou quando navega para esta página
  useEffect(() => {
    if (!revendaId) return

    let isMounted = true
    let intervalId: NodeJS.Timeout | null = null

    const recarregarDados = async () => {
      if (isMounted && location.pathname === '/revenda/financeiro' && revendaId) {
        console.log('🔄 [Financeiro Revenda] Recarregando dados...')
        await Promise.all([
          carregarConfiguracao(revendaId),
          carregarMetricas(revendaId),
          carregarTransacoes(revendaId),
        ])
      }
    }

    const handleVisibilityChange = async () => {
      if (!document.hidden && isMounted && revendaId) {
        console.log('🔄 [Financeiro Revenda] Página recebeu foco (visibilitychange), recarregando dados...')
        await recarregarDados()
        // Reinicia o intervalo quando a página recebe foco
        if (intervalId) {
          clearInterval(intervalId)
        }
        // Recarrega a cada 30 segundos quando a página está visível
        intervalId = setInterval(async () => {
          if (!document.hidden && isMounted && location.pathname === '/revenda/financeiro' && revendaId) {
            console.log('🔄 [Financeiro Revenda] Atualização automática periódica...')
            await recarregarDados()
          }
        }, 30000)
      } else {
        // Para o intervalo quando a página está oculta
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      }
    }

    const handleFocus = async () => {
      if (isMounted && revendaId) {
        console.log('🔄 [Financeiro Revenda] Janela recebeu foco, recarregando dados...')
        await recarregarDados()
      }
    }

    // Recarrega quando a página recebe foco
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    // Recarrega quando navega para esta página
    if (location.pathname === '/revenda/financeiro') {
      recarregarDados()
      // Inicia o intervalo quando a página está visível
      if (!document.hidden) {
        intervalId = setInterval(async () => {
          if (!document.hidden && isMounted && location.pathname === '/revenda/financeiro' && revendaId) {
            console.log('🔄 [Financeiro Revenda] Atualização automática periódica...')
            await recarregarDados()
          }
        }, 30000)
      }
    }

    return () => {
      isMounted = false
      if (intervalId) {
        clearInterval(intervalId)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [location.pathname, revendaId])

  const inicializar = async () => {
    setCarregando(true)
    try {
      const id = await obterRevendaId()
      if (!id) {
        toast.error('Erro ao identificar revenda')
        setCarregando(false)
        return
      }

      setRevendaId(id)
      await carregarUnidades(id)
    } catch (error) {
      console.error('Erro ao inicializar:', error)
      toast.error('Erro ao carregar dados financeiros')
    } finally {
      setCarregando(false)
    }
  }

  const carregarUnidades = async (id: string) => {
    setCarregandoUnidades(true)
    try {
      const { unidades: unidadesData, error } = await listarUnidades(id)
      if (error) {
        console.error('❌ Erro ao carregar unidades:', error)
        return
      }

      // Se for colaborador com unidade específica, filtrar apenas aquela unidade
      const unidadeIdColaborador = await obterUnidadeIdColaborador()
      let unidadesFiltradas = unidadesData || []
      
      if (unidadeIdColaborador !== undefined && unidadeIdColaborador !== null) {
        // Colaborador tem acesso apenas a uma unidade específica
        unidadesFiltradas = unidadesFiltradas.filter(u => u.id === unidadeIdColaborador)
        // Seleciona automaticamente a unidade do colaborador
        if (unidadesFiltradas.length > 0) {
          setUnidadeSelecionadaId(unidadesFiltradas[0].id)
        }
      }

      setUnidades(unidadesFiltradas)

      // Seleciona primeira unidade se não houver selecionada (apenas das unidades filtradas)
      if (!unidadeSelecionadaId && unidadesFiltradas.length > 0) {
        setUnidadeSelecionadaId(unidadesFiltradas[0].id)
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar unidades:', error)
    } finally {
      setCarregandoUnidades(false)
    }
  }

  useEffect(() => {
    if (unidadeSelecionadaId && revendaId) {
      carregarDadosUnidade()
    }
  }, [unidadeSelecionadaId, revendaId])

  const carregarDadosUnidade = async () => {
    if (!unidadeSelecionadaId || !revendaId) return

    try {
      // Carrega dados da unidade
      const { unidade, error: unidadeError } = await buscarUnidade(unidadeSelecionadaId)
      if (!unidadeError && unidade) {
        setUnidadeSelecionada(unidade)
        // Carrega conta PIX da unidade
        setContaPixNome(unidade.conta_pix_nome_completo || '')
        setContaPixCpfCnpj(unidade.conta_pix_cpf_cnpj ? (unidade.conta_pix_cpf_cnpj.length === 11 ? aplicarMascaraCPF(unidade.conta_pix_cpf_cnpj) : aplicarMascaraCNPJ(unidade.conta_pix_cpf_cnpj)) : '')
        setContaPixChave(unidade.conta_pix_chave || '')
        setContaPixTipo(unidade.conta_pix_tipo || 'CPF')
      }

      // Carrega todas as configurações da revenda (necessário para mostrar taxas corretas)
      await carregarConfiguracao(revendaId)
      
      // Se a unidade tem modalidade própria, busca a configuração específica dessa modalidade
      // Caso contrário, usa a configuração ativa da revenda
      if (unidade?.modalidade_repasse) {
        const { configuracoes: todasConfiguracoes } = await listarConfiguracoesRepasse(revendaId)
        const configUnidade = todasConfiguracoes?.find(c => c.modalidade === unidade.modalidade_repasse)
        if (configUnidade) {
          // Define como ativa apenas para exibição (a unidade pode ter modalidade diferente da revenda)
          setConfiguracaoAtiva({
            ...configUnidade,
            ativo: true // Força como ativo para exibição
          })
        }
      }

      await Promise.all([
        carregarMetricas(revendaId),
        carregarTransacoes(revendaId),
        // Removido carregarRepasses - não é mais necessário na revenda
      ])
    } catch (error) {
      console.error('Erro ao carregar dados da unidade:', error)
      toast.error('Erro ao carregar dados financeiros da unidade')
    }
  }

  const carregarConfiguracao = async (id: string) => {
    const [ativaResult, todasResult] = await Promise.all([
      buscarConfiguracaoRepasseAtiva(id),
      listarConfiguracoesRepasse(id),
    ])

    if (ativaResult.configuracao) {
      console.log('✅ [Financeiro Revenda] Configuração ativa carregada:', ativaResult.configuracao)
      setConfiguracaoAtiva(ativaResult.configuracao)
    }

    if (todasResult.configuracoes) {
      console.log('✅ [Financeiro Revenda] Configurações carregadas:', todasResult.configuracoes)
      setConfiguracoes(todasResult.configuracoes)
    }
  }

  const carregarMetricas = async (id: string) => {
    const { valoresRecebidosHoje, valoresLiberados, valoresPendentes, valoresBloqueados, totalEmProcessamento } =
      await calcularMetricasRevenda(id, unidadeSelecionadaId)
    setMetricas({
      valoresRecebidosHoje,
      valoresLiberados,
      valoresPendentes,
      valoresBloqueados,
      totalEmProcessamento,
    })
    
    // Métricas anteriores serão calculadas quando necessário
    setMetricasAnteriores({
      valoresRecebidosHoje: 0,
      valoresLiberados: 0,
      valoresPendentes: 0,
      valoresBloqueados: 0,
    })
  }

  const carregarTransacoes = async (id: string) => {
    console.log('🔄 [Financeiro Revenda] Carregando transações...', {
      revendaId: id,
      unidadeId: unidadeSelecionadaId,
      statusFiltro,
      modalidadeFiltro,
    })
    
    const filtros: any = {
      unidadeId: unidadeSelecionadaId,
    }
    // Não aplicar filtro de status se for 'todos' - queremos todas as transações
    if (statusFiltro !== 'todos') {
      filtros.status = statusFiltro
    }
    if (modalidadeFiltro !== 'todos') {
      filtros.modalidade = modalidadeFiltro
    }

    const { transacoes: transacoesData, error } = await listarTransacoesRevenda(id, filtros)
    
    console.log('📊 [Financeiro Revenda] Transações carregadas:', {
      quantidade: transacoesData?.length || 0,
      error: error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
      } : null,
      primeiras3: transacoesData?.slice(0, 3).map(t => ({
        id: t.id,
        pedido_id: t.pedido_id,
        status: t.status,
        valor_liquido: t.valor_liquido,
      })),
    })
    
    if (error) {
      console.error('❌ [Financeiro Revenda] Erro ao carregar transações:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        error: error,
      })
      
      // Mensagem mais específica baseada no tipo de erro
      let mensagemErro = 'Erro ao carregar transações'
      if (error.message?.includes('row-level security') || error.message?.includes('permission denied')) {
        mensagemErro = 'Erro de permissão. Verifique se você tem acesso a esta unidade.'
      } else if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        mensagemErro = 'Erro no banco de dados. Entre em contato com o suporte.'
      } else if (error.message) {
        mensagemErro = `Erro: ${error.message}`
      }
      
      toast.error(mensagemErro)
      setTransacoes([])
    } else {
      setTransacoes(transacoesData || [])
    }
  }

  // Removido carregarRepasses - não é mais necessário na revenda

  useEffect(() => {
    if (revendaId && unidadeSelecionadaId) {
      carregarTransacoes(revendaId)
    }
  }, [statusFiltro, modalidadeFiltro, revendaId, unidadeSelecionadaId])

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatarDataCompleta = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const handleAlterarModalidade = async () => {
    if (!novaModalidade || !unidadeSelecionadaId) {
      console.error('❌ [handleAlterarModalidade] Dados faltando:', { novaModalidade, unidadeSelecionadaId })
      toast.error('Selecione uma unidade e escolha uma modalidade')
      return
    }

    console.log('🔄 [handleAlterarModalidade] Iniciando alteração de modalidade:', {
      unidadeId: unidadeSelecionadaId,
      novaModalidade,
      modalidadeAtual: unidadeSelecionada?.modalidade_repasse,
    })

    setAlterandoModalidade(true)
    try {
      // Salva modalidade na unidade
      const { error } = await atualizarConfiguracaoFinanceiraUnidade(unidadeSelecionadaId, {
        modalidade_repasse: novaModalidade,
      })

      if (error) {
        console.error('❌ [handleAlterarModalidade] Erro ao alterar modalidade:', error)
        toast.error('Erro ao alterar modalidade')
        setAlterandoModalidade(false)
        return
      }

      console.log('✅ [handleAlterarModalidade] Modalidade alterada com sucesso')
      
      // Fecha o diálogo primeiro
      setDialogAlterarModalidadeAberto(false)
      setNovaModalidade(null)
      
      // Recarrega dados da unidade para atualizar a UI
      console.log('🔄 [handleAlterarModalidade] Recarregando dados da unidade...')
      await carregarDadosUnidade()
      console.log('✅ [handleAlterarModalidade] Dados recarregados')
      
      // Mostra toast de sucesso após recarregar
      toast.success('Modalidade alterada com sucesso!')
    } catch (error) {
      console.error('❌ [handleAlterarModalidade] Erro inesperado:', error)
      toast.error('Erro inesperado ao alterar modalidade')
    } finally {
      setAlterandoModalidade(false)
    }
  }

  const abrirDialogAlterarModalidade = (modalidade: 'D+1' | 'D+15' | 'D+30') => {
    setNovaModalidade(modalidade)
    setDialogAlterarModalidadeAberto(true)
  }

  const transacoesFiltradas = useMemo(() => {
    if (!transacoes || transacoes.length === 0) return []
    let filtrados = [...transacoes]

    // Filtro de busca
    if (busca) {
      const buscaLower = busca.toLowerCase()
      filtrados = filtrados.filter((transacao) => {
        const pedidoId = transacao.pedido_id?.toLowerCase() || ''
        const clienteNome = transacao.cliente?.nome_completo?.toLowerCase() || ''
        const clienteEmail = transacao.cliente?.email?.toLowerCase() || ''
        return (
          pedidoId.includes(buscaLower) ||
          clienteNome.includes(buscaLower) ||
          clienteEmail.includes(buscaLower)
        )
      })
    }

    // Filtro de data
    if (dataFiltro !== 'tudo') {
      const agora = new Date()
      let dataInicio: Date
      let dataFim: Date = agora

      switch (dataFiltro) {
        case 'hoje':
          dataInicio = new Date(agora)
          dataInicio.setHours(0, 0, 0, 0)
          break
        case '7':
          dataInicio = new Date(agora)
          dataInicio.setDate(dataInicio.getDate() - 7)
          break
        case '15':
          dataInicio = new Date(agora)
          dataInicio.setDate(dataInicio.getDate() - 15)
          break
        case '30':
          dataInicio = new Date(agora)
          dataInicio.setDate(dataInicio.getDate() - 30)
          break
        case 'personalizado':
          if (dataInicioPersonalizada && dataFimPersonalizada) {
            dataInicio = new Date(dataInicioPersonalizada)
            dataFim = new Date(dataFimPersonalizada)
            dataFim.setHours(23, 59, 59, 999)
          } else {
            return filtrados
          }
          break
        default:
          return filtrados
      }

      filtrados = filtrados.filter((transacao) => {
        const dataTransacao = new Date(transacao.data_repasse_prevista)
        return dataTransacao >= dataInicio && dataTransacao <= dataFim
      })
    }

    return filtrados
  }, [transacoes, busca, dataFiltro, dataInicioPersonalizada, dataFimPersonalizada])

  // Paginação
  const totalPaginas = Math.ceil(transacoesFiltradas.length / itensPorPagina)
  const inicioIndex = (paginaAtual - 1) * itensPorPagina
  const fimIndex = inicioIndex + itensPorPagina
  const transacoesPaginadas = transacoesFiltradas.slice(inicioIndex, fimIndex)

  useEffect(() => {
    // Resetar para primeira página quando filtros mudarem
    setPaginaAtual(1)
  }, [busca, statusFiltro, modalidadeFiltro, dataFiltro, dataInicioPersonalizada, dataFimPersonalizada])


  const limparFiltros = () => {
    setBusca('')
    setStatusFiltro('todos')
    setModalidadeFiltro('todos')
    setDataFiltro('tudo')
    setDataInicioPersonalizada('')
    setDataFimPersonalizada('')
    setDropdownCalendarioAberto(false)
  }

  const handleRefresh = async () => {
    if (!revendaId || !unidadeSelecionadaId) return
    setCarregando(true)
    try {
      await carregarDadosUnidade()
      toast.success('Dados atualizados com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar dados:', error)
      toast.error('Erro ao atualizar dados')
    } finally {
      setCarregando(false)
    }
  }

  const salvarContaPix = async () => {
    if (!unidadeSelecionadaId) {
      toast.error('Selecione uma unidade primeiro')
      return
    }
    
    if (!contaPixNome.trim() || !contaPixCpfCnpj.trim() || !contaPixChave.trim()) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    
    setSalvandoContaPix(true)
    try {
      const { error } = await atualizarConfiguracaoFinanceiraUnidade(unidadeSelecionadaId, {
        conta_pix_nome_completo: contaPixNome.trim(),
        conta_pix_cpf_cnpj: contaPixCpfCnpj.replace(/\D/g, ''),
        conta_pix_chave: contaPixChave.trim(),
        conta_pix_tipo: contaPixTipo,
      })
      
      if (error) {
        toast.error('Erro ao salvar conta PIX')
        return
      }
      
      // Recarrega dados da unidade
      await carregarDadosUnidade()
      
      setEditandoContaPix(false)
      toast.success('Conta PIX salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar conta PIX:', error)
      toast.error('Erro ao salvar conta PIX')
    } finally {
      setSalvandoContaPix(false)
    }
  }
  
  const temContaPixCadastrada = unidadeSelecionada?.conta_pix_chave && unidadeSelecionada?.conta_pix_nome_completo && unidadeSelecionada?.conta_pix_cpf_cnpj

  // Determina a modalidade atual baseada na unidade ou na revenda
  const modalidadeAtualUnidade = unidadeSelecionada?.modalidade_repasse
    ? MODALIDADES.find((m) => m.valor === unidadeSelecionada.modalidade_repasse)
    : null
  
  const modalidadeAtualRevenda = configuracaoAtiva
    ? MODALIDADES.find((m) => m.valor === configuracaoAtiva.modalidade)
    : null
  
  const modalidadeAtual = modalidadeAtualUnidade || modalidadeAtualRevenda
  
  // Calcula as taxas atuais (da unidade se personalizadas, senão da revenda)
  const calcularTaxasAtuais = () => {
    if (!modalidadeAtual) return { taxaPercentual: 0, taxaFixa: 0, usandoTaxaPersonalizada: false }
    
    const modalidadeValor = modalidadeAtual.valor
    
    // Se a unidade tem modalidade e taxas personalizadas para essa modalidade
    if (unidadeSelecionada && 
        unidadeSelecionada.modalidade_repasse === modalidadeValor &&
        unidadeSelecionada.taxa_repasse_percentual !== null && 
        unidadeSelecionada.taxa_repasse_percentual !== undefined) {
      return {
        taxaPercentual: unidadeSelecionada.taxa_repasse_percentual,
        taxaFixa: unidadeSelecionada.taxa_repasse_fixa !== null && 
                 unidadeSelecionada.taxa_repasse_fixa !== undefined
                 ? unidadeSelecionada.taxa_repasse_fixa
                 : 0.50,
        usandoTaxaPersonalizada: true
      }
    }
    
    // Usa taxas da configuração da revenda
    const configReal = configuracoes.find((c) => c.modalidade === modalidadeValor)
    return {
      taxaPercentual: configReal?.taxa_percentual ?? modalidadeAtual.taxaPercentual,
      taxaFixa: configReal?.taxa_fixa ?? modalidadeAtual.taxaFixa,
      usandoTaxaPersonalizada: false
    }
  }
  
  const taxasAtuais = calcularTaxasAtuais()

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
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <DollarSign className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          Financeiro
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Gerencie seus recebimentos e modalidades de repasse
        </p>
      </div>

      {/* Seleção de Unidade */}
      {revendaId && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Selecione uma unidade para gerenciar financeiro
          </h2>
          {carregandoUnidades ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : unidades.length === 0 ? (
            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardContent className="py-12 text-center">
                <Store className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                  Nenhuma unidade cadastrada
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Crie uma unidade em "Presença na Loja" para começar
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unidades.map((unidade) => {
                const isSelecionada = unidadeSelecionadaId === unidade.id
                return (
                  <Card
                    key={unidade.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelecionada
                        ? 'border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-600 dark:ring-violet-400'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                    onClick={() => setUnidadeSelecionadaId(unidade.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            isSelecionada
                              ? 'bg-violet-600 dark:bg-violet-400'
                              : 'bg-violet-100 dark:bg-violet-900/30'
                          }`}>
                            <Store className={`w-5 h-5 ${
                              isSelecionada
                                ? 'text-white'
                                : 'text-violet-600 dark:text-violet-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                              {unidade.nome}
                              {unidade.ativo ? (
                                <Badge variant="default" className="bg-green-500 text-xs">
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Inativa
                                </Badge>
                              )}
                            </h3>
                            {unidade.nome_publico && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                {unidade.nome_publico}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-neutral-500 dark:text-neutral-400 text-xs">Conta PIX</p>
                          <p className="font-medium text-neutral-900 dark:text-neutral-50">
                            {unidade.conta_pix_chave ? '✓ Cadastrada' : '✗ Não cadastrada'}
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-500 dark:text-neutral-400 text-xs">Modalidade</p>
                          <p className="font-medium text-neutral-900 dark:text-neutral-50">
                            {unidade.modalidade_repasse || 'Não configurada'}
                          </p>
                        </div>
                      </div>
                      {isSelecionada && (
                        <div className="mt-3 pt-3 border-t border-violet-300 dark:border-violet-700">
                          <p className="text-xs font-medium text-violet-700 dark:text-violet-300 flex items-center gap-1">
                            ✓ Unidade selecionada
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo Financeiro - Só mostra se houver unidade selecionada */}
      {unidadeSelecionadaId && (
        <>
      {/* Alerta para cadastrar conta PIX */}
      {!temContaPixCadastrada && (
        <Card className="border-yellow-500 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  ⚠️ Cadastre sua conta PIX para recebimento
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                  É necessário cadastrar sua conta PIX para receber os repasses. Clique no botão abaixo para cadastrar.
                </p>
                <Button
                  onClick={() => setEditandoContaPix(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  size="sm"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Cadastrar Conta PIX
                </Button>
      </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conta PIX e Modalidade de Repasse - Grid lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card de Conta PIX */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                Conta PIX para Recebimento
              </CardTitle>
            {!editandoContaPix && temContaPixCadastrada && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditandoContaPix(true)
                  if (unidadeSelecionada) {
                    setContaPixNome(unidadeSelecionada.conta_pix_nome_completo || '')
                    setContaPixCpfCnpj(unidadeSelecionada.conta_pix_cpf_cnpj ? (unidadeSelecionada.conta_pix_cpf_cnpj.length === 11 ? aplicarMascaraCPF(unidadeSelecionada.conta_pix_cpf_cnpj) : aplicarMascaraCNPJ(unidadeSelecionada.conta_pix_cpf_cnpj)) : '')
                    setContaPixChave(unidadeSelecionada.conta_pix_chave || '')
                    setContaPixTipo(unidadeSelecionada.conta_pix_tipo || 'CPF')
                  }
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editandoContaPix ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contaPixNome">Nome Completo *</Label>
                <Input
                  id="contaPixNome"
                  value={contaPixNome}
                  onChange={(e) => setContaPixNome(e.target.value)}
                  placeholder="Nome completo do titular"
                  disabled={salvandoContaPix}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contaPixTipo">Tipo de Chave PIX *</Label>
                <SelectMenu
                  value={contaPixTipo}
                  onChange={(value) => {
                    setContaPixTipo(value as typeof contaPixTipo)
                    setContaPixChave('')
                  }}
                  options={[
                    { value: 'CPF', label: 'CPF' },
                    { value: 'CNPJ', label: 'CNPJ' },
                    { value: 'EMAIL', label: 'E-mail' },
                    { value: 'TELEFONE', label: 'Telefone' },
                    { value: 'CHAVE_ALEATORIA', label: 'Chave Aleatória' },
                  ]}
                  disabled={salvandoContaPix}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contaPixCpfCnpj">
                  {contaPixTipo === 'CPF' ? 'CPF' : contaPixTipo === 'CNPJ' ? 'CNPJ' : 'CPF/CNPJ'} *
                </Label>
                <Input
                  id="contaPixCpfCnpj"
                  value={contaPixCpfCnpj}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '')
                    if (contaPixTipo === 'CPF') {
                      setContaPixCpfCnpj(aplicarMascaraCPF(valor))
                    } else if (contaPixTipo === 'CNPJ') {
                      setContaPixCpfCnpj(aplicarMascaraCNPJ(valor))
                    } else {
                      setContaPixCpfCnpj(valor.length === 11 ? aplicarMascaraCPF(valor) : aplicarMascaraCNPJ(valor))
                    }
                  }}
                  placeholder={contaPixTipo === 'CPF' ? '000.000.000-00' : contaPixTipo === 'CNPJ' ? '00.000.000/0000-00' : 'CPF ou CNPJ'}
                  disabled={salvandoContaPix}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contaPixChave">Chave PIX *</Label>
                <Input
                  id="contaPixChave"
                  value={contaPixChave}
                  onChange={(e) => setContaPixChave(e.target.value)}
                  placeholder={
                    contaPixTipo === 'CPF' ? '000.000.000-00' :
                    contaPixTipo === 'CNPJ' ? '00.000.000/0000-00' :
                    contaPixTipo === 'EMAIL' ? 'email@exemplo.com' :
                    contaPixTipo === 'TELEFONE' ? '(00) 00000-0000' :
                    'Chave aleatória'
                  }
                  disabled={salvandoContaPix}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={salvarContaPix}
                  disabled={salvandoContaPix}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {salvandoContaPix ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditandoContaPix(false)
                    if (unidadeSelecionada) {
                      setContaPixNome(unidadeSelecionada.conta_pix_nome_completo || '')
                      setContaPixCpfCnpj(unidadeSelecionada.conta_pix_cpf_cnpj ? (unidadeSelecionada.conta_pix_cpf_cnpj.length === 11 ? aplicarMascaraCPF(unidadeSelecionada.conta_pix_cpf_cnpj) : aplicarMascaraCNPJ(unidadeSelecionada.conta_pix_cpf_cnpj)) : '')
                      setContaPixChave(unidadeSelecionada.conta_pix_chave || '')
                      setContaPixTipo(unidadeSelecionada.conta_pix_tipo || 'CPF')
                    }
                  }}
                  disabled={salvandoContaPix}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {temContaPixCadastrada ? (
                <>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Nome Completo</p>
                      <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                        {unidadeSelecionada?.conta_pix_nome_completo}
                </p>
              </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">CPF/CNPJ</p>
                      <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
                        {unidadeSelecionada?.conta_pix_cpf_cnpj ? (unidadeSelecionada.conta_pix_cpf_cnpj.length === 11 ? aplicarMascaraCPF(unidadeSelecionada.conta_pix_cpf_cnpj) : aplicarMascaraCNPJ(unidadeSelecionada.conta_pix_cpf_cnpj)) : 'Não informado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <QrCode className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Chave PIX ({unidadeSelecionada?.conta_pix_tipo})</p>
                      <p className="text-base font-medium text-neutral-900 dark:text-neutral-50 break-all">
                        {unidadeSelecionada?.conta_pix_chave}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                  Nenhuma conta PIX cadastrada
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

        {/* Modalidade de Repasse */}
        <Card className="border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-900/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Modalidade de Repasse
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarModalidade(!mostrarModalidade)}
              className="border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400"
            >
              {mostrarModalidade ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Alterar
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Modalidade Atual - Sempre visível */}
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-violet-200 dark:border-violet-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {modalidadeAtual?.label || 'Não configurado'}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                Ativo
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Taxa Percentual</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    {taxasAtuais.taxaPercentual}%
                  </p>
                  {taxasAtuais.usandoTaxaPersonalizada && (
                    <Badge variant="outline" className="text-xs">
                      Personalizada
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Taxa Fixa</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    {formatarPreco(taxasAtuais.taxaFixa)}
                  </p>
                  {taxasAtuais.usandoTaxaPersonalizada && (
                    <Badge variant="outline" className="text-xs">
                      Personalizada
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Opções de Modalidade - Mostra quando expandido */}
          {mostrarModalidade && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {MODALIDADES.map((modalidade) => {
                // Verifica se a modalidade é a ativa da unidade selecionada
                const isAtiva = unidadeSelecionada?.modalidade_repasse === modalidade.valor
                
                // Buscar configuração real do banco de dados para esta modalidade (da revenda)
                const configReal = configuracoes.find((c) => c.modalidade === modalidade.valor)
                
                // Se a unidade tem taxas personalizadas para esta modalidade, usa elas
                // Caso contrário, usa as taxas da configuração da revenda ou valores padrão
                let taxaPercentual: number
                let taxaFixa: number
                let usandoTaxaPersonalizada = false
                
                if (unidadeSelecionada && 
                    unidadeSelecionada.modalidade_repasse === modalidade.valor &&
                    unidadeSelecionada.taxa_repasse_percentual !== null && 
                    unidadeSelecionada.taxa_repasse_percentual !== undefined) {
                  // Unidade tem taxas personalizadas para esta modalidade
                  taxaPercentual = unidadeSelecionada.taxa_repasse_percentual
                  taxaFixa = unidadeSelecionada.taxa_repasse_fixa !== null && 
                            unidadeSelecionada.taxa_repasse_fixa !== undefined
                            ? unidadeSelecionada.taxa_repasse_fixa
                            : 0.50
                  usandoTaxaPersonalizada = true
                } else {
                  // Usa taxas da configuração da revenda ou valores padrão
                  taxaPercentual = configReal?.taxa_percentual ?? modalidade.taxaPercentual
                  taxaFixa = configReal?.taxa_fixa ?? modalidade.taxaFixa
                }
                
                return (
                  <Card
                    key={modalidade.valor}
                    className={`cursor-pointer transition-all ${
                      isAtiva
                        ? 'border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-violet-300 dark:hover:border-violet-700'
                    }`}
                    onClick={() => !isAtiva && abrirDialogAlterarModalidade(modalidade.valor)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                          {modalidade.label}
                        </span>
                        <div className="flex items-center gap-2">
                          {usandoTaxaPersonalizada && (
                            <Badge variant="outline" className="text-xs">
                              Personalizada
                            </Badge>
                          )}
                          {isAtiva && (
                            <CheckCircle2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                        <p>Taxa: {taxaPercentual}% + {formatarPreco(taxaFixa)}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Métricas - Grid 2x2 */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Recebidos Hoje</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatarPreco(metricas.valoresRecebidosHoje)}
                </p>
                {metricasAnteriores.valoresRecebidosHoje > 0 && (
                  <p className={`text-xs mt-1 ${metricas.valoresRecebidosHoje >= metricasAnteriores.valoresRecebidosHoje ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {metricas.valoresRecebidosHoje >= metricasAnteriores.valoresRecebidosHoje ? '↑' : '↓'} {Math.abs(((metricas.valoresRecebidosHoje - metricasAnteriores.valoresRecebidosHoje) / metricasAnteriores.valoresRecebidosHoje) * 100).toFixed(1)}% vs dia anterior
                  </p>
                )}
                {metricasAnteriores.valoresRecebidosHoje === 0 && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Valores repassados hoje
                  </p>
                )}
    </div>
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Liberados</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatarPreco(metricas.valoresLiberados)}
                </p>
                {metricasAnteriores.valoresLiberados > 0 && (
                  <p className={`text-xs mt-1 ${metricas.valoresLiberados >= metricasAnteriores.valoresLiberados ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {metricas.valoresLiberados >= metricasAnteriores.valoresLiberados ? '↑' : '↓'} {Math.abs(((metricas.valoresLiberados - metricasAnteriores.valoresLiberados) / metricasAnteriores.valoresLiberados) * 100).toFixed(1)}% vs dia anterior
                  </p>
                )}
                {metricasAnteriores.valoresLiberados === 0 && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Disponíveis para repasse
                  </p>
                )}
              </div>
              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {formatarPreco(metricas.valoresPendentes)}
                </p>
                {metricasAnteriores.valoresPendentes > 0 && (
                  <p className={`text-xs mt-1 ${metricas.valoresPendentes >= metricasAnteriores.valoresPendentes ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {metricas.valoresPendentes >= metricasAnteriores.valoresPendentes ? '↑' : '↓'} {Math.abs(((metricas.valoresPendentes - metricasAnteriores.valoresPendentes) / metricasAnteriores.valoresPendentes) * 100).toFixed(1)}% vs dia anterior
                  </p>
                )}
                {metricasAnteriores.valoresPendentes === 0 && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Aguardando prazo
                  </p>
                )}
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Bloqueados</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatarPreco(metricas.valoresBloqueados)}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {metricas.valoresBloqueados > 0 ? 'Repasses bloqueados' : 'Nenhum bloqueado'}
                </p>
              </div>
              <Lock className="w-8 h-8 text-red-600 dark:text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de Busca - Em uma única linha abaixo dos números */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-4">
          <div className="flex flex-nowrap items-end gap-3 overflow-x-auto">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por pedido, cliente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full"
              />
            </div>

            <SelectMenu
              value={statusFiltro}
              onChange={(value) => setStatusFiltro(value as any)}
              options={[
                { value: 'todos', label: 'Todos os Status' },
                { value: 'pendente', label: 'Pendente' },
                { value: 'liberado', label: 'Liberado' },
                { value: 'repassado', label: 'Repassado' },
              ]}
              placeholder="Status"
            />

            <SelectMenu
              value={modalidadeFiltro}
              onChange={(value) => setModalidadeFiltro(value as any)}
              options={[
                { value: 'todos', label: 'Todas as Modalidades' },
                { value: 'D+1', label: 'D+1' },
                { value: 'D+15', label: 'D+15' },
                { value: 'D+30', label: 'D+30' },
              ]}
              placeholder="Modalidade"
            />

            <DateRangePickerCompact
              value={dataFiltro}
              onChange={setDataFiltro}
              dataInicio={dataInicioPersonalizada}
              dataFim={dataFimPersonalizada}
              onDataInicioChange={setDataInicioPersonalizada}
              onDataFimChange={setDataFimPersonalizada}
              open={dropdownCalendarioAberto}
              onOpenChange={setDropdownCalendarioAberto}
            />

            <Button
              variant="outline"
              onClick={handleRefresh}
              size="sm"
              className="whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Título da Seção */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Transações
        </h2>
      </div>

      {/* Conteúdo das Transações */}
      <>
          {/* Header com Toggle e Paginação */}
          {transacoesFiltradas.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Mostrando {inicioIndex + 1}-{Math.min(fimIndex, transacoesFiltradas.length)} de {transacoesFiltradas.length} transação{transacoesFiltradas.length > 1 ? 'ões' : ''}
              </p>
              <div className="flex items-center gap-2">
                {totalPaginas > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                      disabled={paginaAtual === 1}
                      className="h-8"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400 px-2">
                      {paginaAtual} / {totalPaginas}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaAtual === totalPaginas}
                      className="h-8"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1 bg-neutral-50 dark:bg-neutral-900">
                  <Button
                    variant={visualizacao === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setVisualizacao('grid')}
                    className="h-8"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={visualizacao === 'lista' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setVisualizacao('lista')}
                    className="h-8"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Transações */}
          {transacoesFiltradas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                  {transacoes.length === 0
                    ? 'Nenhuma transação encontrada'
                    : 'Nenhuma transação corresponde aos filtros aplicados'}
                </p>
              </CardContent>
            </Card>
          ) : visualizacao === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transacoesPaginadas.map((transacao) => (
                <Card
                  key={transacao.id}
                  className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          Pedido #{transacao.pedido_id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            transacao.status === 'pendente'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : transacao.status === 'liberado'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : transacao.status === 'repassado'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {transacao.status === 'pendente'
                            ? 'Pendente'
                            : transacao.status === 'liberado'
                            ? 'Liberado'
                            : transacao.status === 'repassado'
                            ? 'Repassado'
                            : 'Cancelado'}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 dark:text-neutral-400">Valor Bruto</span>
                          <span className="font-medium text-neutral-900 dark:text-neutral-50">
                            {formatarPreco(transacao.valor_bruto)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 dark:text-neutral-400">Taxas</span>
                          <span className="font-medium text-red-600 dark:text-red-400">
                            -{formatarPreco(
                              (transacao.valor_bruto * transacao.taxa_percentual) / 100 +
                                transacao.taxa_fixa
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                            Valor Líquido
                          </span>
                          <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                            {formatarPreco(transacao.valor_liquido)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                        <div>
                          <p>Modalidade</p>
                          <p className="font-medium">{transacao.modalidade}</p>
                        </div>
                        <div>
                          <p>Repasse Previsto</p>
                          <p className="font-medium">{formatarData(transacao.data_repasse_prevista)}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/revenda/pedidos/${transacao.pedido_id}`)}
                          className="w-full border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Pedido
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {transacoesPaginadas.map((transacao) => (
                <Card
                  key={transacao.id}
                  className="border-neutral-200 dark:border-neutral-800 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => navigate(`/revenda/pedidos/${transacao.pedido_id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <ShoppingCart className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                              #{transacao.pedido_id.slice(0, 8).toUpperCase()}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                transacao.status === 'pendente'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                  : transacao.status === 'liberado'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : transacao.status === 'repassado'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              }`}
                            >
                              {transacao.status === 'pendente'
                                ? 'Pendente'
                                : transacao.status === 'liberado'
                                ? 'Liberado'
                                : transacao.status === 'repassado'
                                ? 'Repassado'
                                : 'Cancelado'}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                              {transacao.modalidade}
                            </span>
                          </div>
                          {transacao.cliente && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                              {transacao.cliente.nome_completo || transacao.cliente.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Valor Líquido</p>
                          <p className="text-base font-bold text-violet-600 dark:text-violet-400">
                            {formatarPreco(transacao.valor_liquido)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Repasse</p>
                          <p className="text-xs font-medium text-neutral-900 dark:text-neutral-50">
                            {formatarData(transacao.data_repasse_prevista)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/revenda/pedidos/${transacao.pedido_id}`)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let paginaNum: number
                  if (totalPaginas <= 5) {
                    paginaNum = i + 1
                  } else if (paginaAtual <= 3) {
                    paginaNum = i + 1
                  } else if (paginaAtual >= totalPaginas - 2) {
                    paginaNum = totalPaginas - 4 + i
                  } else {
                    paginaNum = paginaAtual - 2 + i
                  }
                  return (
                    <Button
                      key={paginaNum}
                      variant={paginaAtual === paginaNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaginaAtual(paginaNum)}
                      className="h-8 w-8 p-0"
                    >
                      {paginaNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
              >
                Próxima
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
      </>
        </>
      )}

      {/* Dialogs - Fora do conteúdo condicional */}
      {/* Dialog de Alteração de Modalidade */}
      <AlertDialog open={dialogAlterarModalidadeAberto} onOpenChange={setDialogAlterarModalidadeAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar Modalidade de Repasse</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a alterar sua modalidade de repasse para{' '}
                <strong>{MODALIDADES.find((m) => m.valor === novaModalidade)?.label}</strong>.
              </p>
              {configuracaoAtiva && novaModalidade && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Modalidade Atual:</span>
                    <span className="font-medium">
                      {MODALIDADES.find((m) => m.valor === configuracaoAtiva.modalidade)?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Taxa Atual:</span>
                    <span className="font-medium">
                      {configuracaoAtiva.taxa_percentual}% + {formatarPreco(configuracaoAtiva.taxa_fixa)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Nova Taxa:</span>
                    <span className="font-medium text-violet-600 dark:text-violet-400">
                      {(() => {
                        const novaConfig = configuracoes.find((c) => c.modalidade === novaModalidade)
                        const taxaPercentual = novaConfig?.taxa_percentual ?? MODALIDADES.find((m) => m.valor === novaModalidade)?.taxaPercentual ?? 0
                        const taxaFixa = novaConfig?.taxa_fixa ?? MODALIDADES.find((m) => m.valor === novaModalidade)?.taxaFixa ?? 0
                        return `${taxaPercentual}% + ${formatarPreco(taxaFixa)}`
                      })()}
                    </span>
                  </div>
                </div>
              )}
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                ⚠️ Importante: A partir desta mudança, novos pedidos seguirão a nova modalidade. Pedidos
                já criados manterão a modalidade original.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={alterandoModalidade}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleAlterarModalidade()
              }}
              disabled={alterandoModalidade}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {alterandoModalidade ? 'Alterando...' : 'Confirmar Alteração'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
