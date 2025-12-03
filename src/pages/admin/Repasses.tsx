import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  ShoppingCart,
  Store,
  User,
  Calendar,
  Search,
  LayoutGrid,
  List,
  Plus,
  AlertCircle,
  Lock,
  Unlock,
  FastForward,
  ArrowLeft,
  TrendingUp,
  PieChart,
  Trash2,
  X,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePickerCompact } from '@/components/ui/date-range-picker-compact'
import { Dropdown } from '@/components/ui/dropdown'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  listarTransacoesLiberadas,
  listarTodosRepasses,
  criarRepasse,
  bloquearRepasse,
  desbloquearRepasse,
  anteciparRepasse,
  reverterAntecipacao,
  excluirRepasse,
  limparTodosRepasses,
  type Repasse,
} from '@/lib/repasses'
import { listarRevendas } from '@/lib/gerenciarRevenda'
import { formatarPreco } from '@/lib/utils'
import { FiltrosRevendaUnidade } from '@/components/admin/FiltrosRevendaUnidade'
import { FiltrosAvancados } from '@/components/admin/FiltrosAvancados'
import { toast } from 'sonner'

interface TransacaoLiberada {
  id: string
  pedido_id: string
  revenda_id: string
  valor_bruto: number
  valor_liquido: number
  taxa_percentual: number
  taxa_fixa: number
  modalidade: 'D+1' | 'D+15' | 'D+30'
  data_repasse_prevista: string
  bloqueado: boolean
  bloqueado_motivo?: string | null
  antecipado: boolean
  data_repasse_antecipada?: string | null
  pedido?: {
    id: string
    valor_total: number
  }
  cliente?: {
    id: string
    nome_completo: string | null
    email: string
  }
  revenda?: {
    id: string
    nome_revenda: string
  }
}

export default function RepassesAdmin() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [carregandoDashboard, setCarregandoDashboard] = useState(false)
  const [revendaSelecionada, setRevendaSelecionada] = useState<string | null>(null)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string | null>(null)
  const [revendas, setRevendas] = useState<Array<{ id: string; nome_revenda: string }>>([])
  const [transacoesLiberadas, setTransacoesLiberadas] = useState<TransacaoLiberada[]>([])
  const [transacoesLiberadasTodos, setTransacoesLiberadasTodos] = useState<TransacaoLiberada[]>([])
  const [repasses, setRepasses] = useState<Repasse[]>([])
  const [repassesTodos, setRepassesTodos] = useState<Repasse[]>([])
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid')
  const [transacoesSelecionadas, setTransacoesSelecionadas] = useState<Set<string>>(new Set())
  const [dialogCriarRepasseAberto, setDialogCriarRepasseAberto] = useState(false)
  const [observacoesRepasse, setObservacoesRepasse] = useState('')
  const [criandoRepasse, setCriandoRepasse] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<'pendentes' | 'historico'>('pendentes')
  const [dialogBloquearAberto, setDialogBloquearAberto] = useState(false)
  const [dialogAnteciparAberto, setDialogAnteciparAberto] = useState(false)
  const [dialogReverterAntecipacaoAberto, setDialogReverterAntecipacaoAberto] = useState(false)
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<TransacaoLiberada | null>(null)
  const [motivoBloqueio, setMotivoBloqueio] = useState('')
  const [novaDataAntecipacao, setNovaDataAntecipacao] = useState('')
  const [tipoAntecipacao, setTipoAntecipacao] = useState<'hoje' | 'outro'>('hoje')
  const [processandoAcao, setProcessandoAcao] = useState(false)
  const [dialogExcluirRepasseAberto, setDialogExcluirRepasseAberto] = useState(false)
  const [dialogLimparTodosAberto, setDialogLimparTodosAberto] = useState(false)
  const [repasseParaExcluir, setRepasseParaExcluir] = useState<Repasse | null>(null)
  const [excluindoRepasse, setExcluindoRepasse] = useState(false)
  const [metricasAnteriores, setMetricasAnteriores] = useState({
    transacoesLiberadas: 0,
    valorTotalLiberado: 0,
    repassesRealizados: 0,
    repassesAntecipados: 0,
    valorTotalRepassado: 0,
  })

  // Filtros avançados
  const [busca, setBusca] = useState('')
  const [dataFiltro, setDataFiltro] = useState<'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'>('tudo')
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('')
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)

  const carregarDados = useCallback(async (criarTransacoesAutomaticamente: boolean = true) => {
    setCarregando(true)
    try {
      console.log('🔄 [RepassesAdmin] Carregando dados...', { abaAtiva, revendaSelecionada, criarTransacoesAutomaticamente })
      
      // Sempre carregar repasses para mostrar o contador correto, mesmo quando abaAtiva é 'pendentes'
      const { repasses: repassesData, error: errorRepasses } = await listarTodosRepasses({
        revendaId: revendaSelecionada || undefined,
        unidadeId: (unidadeSelecionada && revendaSelecionada) ? unidadeSelecionada : undefined,
      })
      
      if (errorRepasses) {
        console.error('Erro ao carregar repasses:', errorRepasses)
        setRepasses([])
      } else {
        setRepasses(repassesData || [])
      }
      
      // Sempre carregar transações liberadas/antecipadas para calcular o contador do histórico corretamente
      // Mesmo quando está na aba "pendentes", precisa carregar para o contador
      const { transacoes: transacoesParaContador, error: errorContador } = await listarTransacoesLiberadas(
        revendaSelecionada || undefined, 
        true, 
        false, // Não criar transações automaticamente aqui, apenas para contador
        unidadeSelecionada || undefined
      )
      
      if (!errorContador && transacoesParaContador) {
        // Filtrar apenas transações liberadas ou antecipadas que ainda não foram repassadas
        const transacoesNaoRepassadas = transacoesParaContador.filter(t => 
          (t.status === 'liberado' || t.antecipado === true) && !t.repasse_id
        )
        setTransacoesLiberadas(transacoesNaoRepassadas)
      }
      
      if (abaAtiva === 'pendentes') {
        console.log('📋 [RepassesAdmin] Buscando transações liberadas...', {
          revendaSelecionada,
          unidadeSelecionada,
        })
        // Inclui transações pendentes também para que o admin possa ver todas as transações disponíveis
        // criarTransacoesAutomaticamente = true apenas no carregamento inicial, false nas atualizações em tempo real
        // Se há unidade selecionada, sempre passa o filtro de unidade (mesmo sem revenda)
        const { transacoes, error } = await listarTransacoesLiberadas(
          revendaSelecionada || undefined, 
          true, 
          criarTransacoesAutomaticamente, 
          unidadeSelecionada || undefined
        )
        
        console.log('📊 [RepassesAdmin] Resultado:', {
          transacoesCount: transacoes?.length || 0,
          error: error ? {
            message: error.message,
            code: (error as any).code,
            details: (error as any).details,
            hint: (error as any).hint
          } : null
        })
        
        if (error) {
          console.error('❌ [RepassesAdmin] Erro ao carregar transações liberadas:', error)
          console.error('❌ [RepassesAdmin] Detalhes completos:', error)
          
          // Mensagem mais específica para campos não existentes
          if (error.message?.includes('column "bloqueado" does not exist') ||
              error.message?.includes('column "antecipado" does not exist')) {
            toast.error('Execute a migration 050 no Supabase para habilitar bloqueio e antecipação de repasses')
          } else if (error.message?.includes('row-level security') || 
                     error.message?.includes('permission denied') ||
                     (error as any).code === '42501') {
            toast.error('Erro de permissão. Verifique se você está logado como admin.')
            console.error('🔒 [RepassesAdmin] Problema de RLS detectado')
          } else {
            toast.error(`Erro ao carregar transações: ${error.message || 'Erro desconhecido'}`)
          }
          
          setTransacoesLiberadas([])
        } else {
          console.log(`✅ [RepassesAdmin] ${transacoes?.length || 0} transação(ões) carregada(s)`)
          setTransacoesLiberadas(transacoes || [])
          
          if (transacoes && transacoes.length === 0) {
            console.log('ℹ️ [RepassesAdmin] Nenhuma transação liberada encontrada')
          } else {
            console.log('✅ [RepassesAdmin] Transações carregadas:', transacoes?.map(t => ({
              id: t.id,
              pedido_id: t.pedido_id,
              valor_liquido: t.valor_liquido,
              modalidade: 'N/A',
              status: 'liberado'
            })))
          }
        }
      } else if (abaAtiva === 'historico') {
        // No histórico, também carregar transações liberadas e antecipadas que ainda não foram repassadas
        console.log('📋 [RepassesAdmin] Buscando transações liberadas e antecipadas para histórico...', {
          revendaSelecionada,
          unidadeSelecionada,
        })
        const { transacoes: transacoesHist, error: errorHist } = await listarTransacoesLiberadas(
          revendaSelecionada || undefined, 
          true, 
          false, // Não criar transações automaticamente no histórico
          unidadeSelecionada || undefined
        )
        
        if (!errorHist && transacoesHist) {
          // Filtrar apenas transações liberadas ou antecipadas que ainda não foram repassadas
          const transacoesNaoRepassadas = transacoesHist.filter(t => 
            (t.status === 'liberado' || t.antecipado === true) && !t.repasse_id
          )
          setTransacoesLiberadas(transacoesNaoRepassadas)
        }
      }
    } catch (error) {
      console.error('❌ [RepassesAdmin] Erro inesperado ao carregar dados:', error)
      toast.error('Erro inesperado ao carregar dados')
    } finally {
      setCarregando(false)
    }
  }, [abaAtiva, revendaSelecionada, unidadeSelecionada])

  const carregarDadosDashboard = useCallback(async () => {
    setCarregandoDashboard(true)
    try {
      console.log('🔄 [RepassesAdmin] Carregando dados do dashboard...')
      
      // Calcular data de ontem para comparação
      const hoje = new Date()
      const ontem = new Date(hoje)
      ontem.setDate(ontem.getDate() - 1)
      const dataOntem = ontem.toISOString().split('T')[0]
      
      const [transacoesResult, repassesResult, repassesOntemResult] = await Promise.all([
        listarTransacoesLiberadas(undefined, true, true),
        listarTodosRepasses({}),
        listarTodosRepasses({ dataInicio: dataOntem, dataFim: dataOntem })
      ])
      
      if (transacoesResult.error) {
        console.error('Erro ao carregar transações:', transacoesResult.error)
        setTransacoesLiberadasTodos([])
      } else {
        console.log('✅ [RepassesAdmin] Transações carregadas:', transacoesResult.transacoes?.length || 0)
        setTransacoesLiberadasTodos(transacoesResult.transacoes || [])
      }
      
      if (repassesResult.error) {
        console.error('❌ [RepassesAdmin] Erro ao carregar repasses:', repassesResult.error)
        setRepassesTodos([])
      } else {
        console.log('✅ [RepassesAdmin] Repasses carregados:', {
          quantidade: repassesResult.repasses?.length || 0,
          primeiros3: repassesResult.repasses?.slice(0, 3).map(r => ({
            id: r.id,
            revenda: r.revenda?.nome_revenda,
            valor_total: r.valor_total,
          })),
        })
        setRepassesTodos(repassesResult.repasses || [])
      }
      
      // Calcular métricas anteriores (dia anterior) baseado em repasses e transações
      // Buscar transações antecipadas de ontem que não estão em repasses
      const transacoesOntemResult = await listarTransacoesLiberadas(undefined, true, false)
      const transacoesAntecipadasOntem = (transacoesOntemResult.transacoes || []).filter(t => t.antecipado === true).length
      
      if (!repassesOntemResult.error && repassesOntemResult.repasses) {
        const repassesOntem = repassesOntemResult.repasses
        const repassesAntecipadosOntem = repassesOntem.filter(r => 
          r.transacoes?.some(t => (t as any).antecipado === true)
        ).length
        
        const valorTotalLiberadoOntem = repassesOntem.reduce((sum, r) => sum + (r.valor_total || 0), 0)
        
        setMetricasAnteriores({
          transacoesLiberadas: repassesOntem.reduce((sum, r) => sum + (r.quantidade_transacoes || 0), 0),
          valorTotalLiberado: valorTotalLiberadoOntem,
          repassesRealizados: repassesOntem.length,
          repassesAntecipados: repassesAntecipadosOntem + transacoesAntecipadasOntem,
          valorTotalRepassado: valorTotalLiberadoOntem,
        })
      } else {
        // Se não há repasses de ontem, ainda podemos contar transações antecipadas
        setMetricasAnteriores({
          transacoesLiberadas: 0,
          valorTotalLiberado: 0,
          repassesRealizados: 0,
          repassesAntecipados: transacoesAntecipadasOntem,
          valorTotalRepassado: 0,
        })
      }
    } catch (error) {
      console.error('❌ [RepassesAdmin] Erro inesperado ao carregar dashboard:', error)
    } finally {
      setCarregandoDashboard(false)
      setCarregando(false)
    }
  }, [])

  // Carrega dados quando filtros mudam
  useEffect(() => {
    if (revendaSelecionada) {
      carregarDados()
    } else {
      carregarDadosDashboard()
    }
  }, [carregarDados, carregarDadosDashboard, revendaSelecionada, unidadeSelecionada])

  // Recarrega dados quando a aba muda
  useEffect(() => {
    if (revendaSelecionada) {
      carregarDados()
    }
  }, [abaAtiva, carregarDados])

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

  const toggleSelecionarTransacao = (transacaoId: string) => {
    // Não permite selecionar transações bloqueadas
    const transacao = transacoesLiberadas.find((t) => t.id === transacaoId)
    if (transacao?.bloqueado) {
      toast.error('Não é possível selecionar transações bloqueadas')
      return
    }

    const novasSelecionadas = new Set(transacoesSelecionadas)
    if (novasSelecionadas.has(transacaoId)) {
      novasSelecionadas.delete(transacaoId)
    } else {
      novasSelecionadas.add(transacaoId)
    }
    setTransacoesSelecionadas(novasSelecionadas)
  }

  const selecionarTodasTransacoes = () => {
    // Filtra apenas transações não bloqueadas
    const transacoesNaoBloqueadas = transacoesFiltradas.filter((t) => !t.bloqueado)
    const idsNaoBloqueadas = new Set(transacoesNaoBloqueadas.map((t) => t.id))
    
    // Verifica se todas as não bloqueadas já estão selecionadas
    const todasSelecionadas = transacoesNaoBloqueadas.every((t) => transacoesSelecionadas.has(t.id))
    
    if (todasSelecionadas) {
      // Remove todas as selecionadas
      setTransacoesSelecionadas(new Set())
    } else {
      // Seleciona todas as não bloqueadas
      setTransacoesSelecionadas(idsNaoBloqueadas)
    }
  }

  const transacoesFiltradas = useMemo(() => {
    if (!transacoesLiberadas || transacoesLiberadas.length === 0) return []
    let filtrados = [...transacoesLiberadas]

    // Filtro de busca
    if (busca) {
      const buscaLower = busca.toLowerCase()
      filtrados = filtrados.filter((transacao) => {
        const pedidoId = transacao.pedido_id?.toLowerCase() || ''
        const clienteNome = transacao.cliente?.nome_completo?.toLowerCase() || ''
        const clienteEmail = transacao.cliente?.email?.toLowerCase() || ''
        const revendaNome = transacao.revenda?.nome_revenda?.toLowerCase() || ''
        return (
          pedidoId.includes(buscaLower) ||
          clienteNome.includes(buscaLower) ||
          clienteEmail.includes(buscaLower) ||
          revendaNome.includes(buscaLower)
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
  }, [transacoesLiberadas, busca, dataFiltro, dataInicioPersonalizada, dataFimPersonalizada])

  // Calcular contador do histórico (sempre, mesmo quando está na aba "pendentes")
  const contadorHistorico = useMemo(() => {
    let contador = repasses?.length || 0
    
    // Adicionar transações liberadas/antecipadas que ainda não foram repassadas
    if (transacoesLiberadas && transacoesLiberadas.length > 0) {
      const transacoesNaoRepassadas = transacoesLiberadas.filter(t => 
        (t.status === 'liberado' || t.antecipado === true) && !t.repasse_id
      )
      
      // Agrupar por revenda para contar repasses virtuais
      const revendasComTransacoes = new Set(transacoesNaoRepassadas.map(t => t.revenda_id))
      contador += revendasComTransacoes.size
    }
    
    return contador
  }, [repasses, transacoesLiberadas])

  const repassesFiltrados = useMemo(() => {
    let filtrados: Repasse[] = []
    
    // Sempre incluir repasses já criados
    if (repasses && repasses.length > 0) {
      filtrados = [...repasses]
    }
    
    // No histórico, também incluir transações liberadas e antecipadas que ainda não foram repassadas
    if (abaAtiva === 'historico' && transacoesLiberadas && transacoesLiberadas.length > 0) {
      // Agrupar transações por revenda e criar "repasses virtuais" para exibição
      const transacoesPorRevenda = new Map<string, typeof transacoesLiberadas>()
      
      transacoesLiberadas.forEach((transacao) => {
        // Apenas transações liberadas ou antecipadas que ainda não foram repassadas
        if ((transacao.status === 'liberado' || transacao.antecipado === true) && !transacao.repasse_id) {
          const revendaId = transacao.revenda_id
          if (!transacoesPorRevenda.has(revendaId)) {
            transacoesPorRevenda.set(revendaId, [])
          }
          transacoesPorRevenda.get(revendaId)!.push(transacao)
        }
      })
      
      // Criar "repasses virtuais" para cada grupo de transações
      transacoesPorRevenda.forEach((transacoes, revendaId) => {
        const valorTotal = transacoes.reduce((sum, t) => sum + (t.valor_liquido || 0), 0)
        const temAntecipado = transacoes.some(t => t.antecipado === true)
        
        // Criar um "repasse virtual" para exibição
        const repasseVirtual: Repasse = {
          id: `virtual-${revendaId}-${Date.now()}`, // ID temporário
          revenda_id: revendaId,
          valor_total: valorTotal,
          quantidade_transacoes: transacoes.length,
          data_repasse: temAntecipado && transacoes[0]?.data_repasse_antecipada 
            ? transacoes[0].data_repasse_antecipada! 
            : transacoes[0]?.data_repasse_prevista || new Date().toISOString().split('T')[0],
          observacoes: null,
          criado_em: new Date().toISOString(),
          criado_por: null,
          revenda: transacoes[0]?.revenda,
          transacoes: transacoes.map(t => ({
            id: t.id,
            pedido_id: t.pedido_id,
            valor_liquido: t.valor_liquido,
            antecipado: t.antecipado,
            data_repasse_antecipada: t.data_repasse_antecipada || null,
            data_repasse_prevista: t.data_repasse_prevista,
            modalidade: t.modalidade,
            pedido: t.pedido,
            cliente: t.cliente,
          })),
        }
        
        filtrados.push(repasseVirtual)
      })
    }

    // Filtro de busca
    if (busca) {
      const buscaLower = busca.toLowerCase()
      filtrados = filtrados.filter((repasse) => {
        const revendaNome = repasse.revenda?.nome_revenda?.toLowerCase() || ''
        return revendaNome.includes(buscaLower)
      })
    }

    // Ordenar por data (mais recentes primeiro)
    filtrados.sort((a, b) => {
      const dataA = new Date(a.data_repasse).getTime()
      const dataB = new Date(b.data_repasse).getTime()
      return dataB - dataA
    })

    return filtrados
  }, [repasses, busca, abaAtiva, transacoesLiberadas])

  const valorTotalSelecionado = useMemo(() => {
    return transacoesFiltradas
      .filter((t) => transacoesSelecionadas.has(t.id))
      .reduce((sum, t) => sum + (t.valor_liquido || 0), 0)
  }, [transacoesFiltradas, transacoesSelecionadas])

  const handleCriarRepasse = async () => {
    if (transacoesSelecionadas.size === 0) {
      toast.error('Selecione pelo menos uma transação')
      return
    }

    // Agrupa transações por revenda
    const transacoesPorRevenda = new Map<string, string[]>()
    transacoesFiltradas
      .filter((t) => transacoesSelecionadas.has(t.id))
      .forEach((t) => {
        const revendaId = t.revenda_id
        if (!transacoesPorRevenda.has(revendaId)) {
          transacoesPorRevenda.set(revendaId, [])
        }
        transacoesPorRevenda.get(revendaId)!.push(t.id)
      })

    setCriandoRepasse(true)
    try {
      // Cria repasse para cada revenda
      const promises = Array.from(transacoesPorRevenda.entries()).map(([revendaId, transacaoIds]) =>
        criarRepasse({
          revendaId,
          transacaoIds,
          observacoes: observacoesRepasse || undefined,
        })
      )

      const resultados = await Promise.all(promises)
      const erros = resultados.filter((r) => r.error)

      if (erros.length > 0) {
        toast.error(`Erro ao criar ${erros.length} repasse(s)`)
      } else {
        toast.success(`${resultados.length} repasse(s) criado(s) com sucesso!`)
        setDialogCriarRepasseAberto(false)
        setTransacoesSelecionadas(new Set())
        setObservacoesRepasse('')
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao criar repasse:', error)
      toast.error('Erro inesperado ao criar repasse')
    } finally {
      setCriandoRepasse(false)
    }
  }

  const limparFiltros = () => {
    setBusca('')
    setDataFiltro('tudo')
    setDataInicioPersonalizada('')
    setDataFimPersonalizada('')
    setDropdownCalendarioAberto(false)
  }

  const handleBloquearRepasse = async () => {
    if (!transacaoSelecionada || !motivoBloqueio.trim()) {
      toast.error('Informe o motivo do bloqueio')
      return
    }

    setProcessandoAcao(true)
    try {
      const { error, mensagem } = await bloquearRepasse(transacaoSelecionada.id, motivoBloqueio.trim())
      if (error) {
        toast.error(mensagem || 'Erro ao bloquear repasse')
        return
      }

      toast.success('Repasse bloqueado com sucesso')
      setDialogBloquearAberto(false)
      setMotivoBloqueio('')
      setTransacaoSelecionada(null)
      await carregarDados()
    } catch (error) {
      console.error('Erro ao bloquear repasse:', error)
      toast.error('Erro inesperado ao bloquear repasse')
    } finally {
      setProcessandoAcao(false)
    }
  }

  const handleDesbloquearRepasse = async (transacaoId: string) => {
    setProcessandoAcao(true)
    try {
      const { error, mensagem } = await desbloquearRepasse(transacaoId)
      if (error) {
        toast.error(mensagem || 'Erro ao desbloquear repasse')
        return
      }

      toast.success('Repasse desbloqueado com sucesso')
      await carregarDados()
    } catch (error) {
      console.error('Erro ao desbloquear repasse:', error)
      toast.error('Erro inesperado ao desbloquear repasse')
    } finally {
      setProcessandoAcao(false)
    }
  }

  const handleAnteciparRepasse = async () => {
    console.log('🔄 [handleAnteciparRepasse] Iniciando...', {
      transacaoSelecionada: transacaoSelecionada?.id,
      tipoAntecipacao,
      novaDataAntecipacao
    })

    if (!transacaoSelecionada) {
      toast.error('Selecione uma transação para antecipar')
      return
    }

    let dataAntecipacao = ''
    if (tipoAntecipacao === 'hoje') {
      // Garante que seja exatamente hoje
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      dataAntecipacao = hoje.toISOString().split('T')[0]
      console.log('📅 [handleAnteciparRepasse] Usando data de HOJE (será liberado imediatamente):', dataAntecipacao)
    } else {
      if (!novaDataAntecipacao) {
        toast.error('Selecione uma data para antecipação')
        return
      }
      dataAntecipacao = novaDataAntecipacao
      
      // Verifica se a data selecionada é hoje
      const dataSelecionada = new Date(dataAntecipacao + 'T00:00:00')
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const isHoje = dataSelecionada.getTime() === hoje.getTime()
      
      if (isHoje) {
        console.log('📅 [handleAnteciparRepasse] Data personalizada é HOJE - será liberado imediatamente')
      } else {
        console.log('📅 [handleAnteciparRepasse] Usando data futura selecionada:', dataAntecipacao)
      }
    }

    setProcessandoAcao(true)
    try {
      console.log('📤 [handleAnteciparRepasse] Chamando anteciparRepasse...', {
        transacaoId: transacaoSelecionada.id,
        dataAntecipacao
      })
      
      const { error, mensagem } = await anteciparRepasse(transacaoSelecionada.id, dataAntecipacao)
      
      console.log('📥 [handleAnteciparRepasse] Resposta:', { error, mensagem })
      
      if (error) {
        console.error('❌ [handleAnteciparRepasse] Erro:', error)
        toast.error(mensagem || 'Erro ao antecipar repasse')
        setProcessandoAcao(false)
        return
      }

      // Usa a mensagem retornada pela função (já inclui informação sobre liberação imediata)
      toast.success(mensagem || 'Repasse antecipado com sucesso')
      setDialogAnteciparAberto(false)
      setNovaDataAntecipacao('')
      setTipoAntecipacao('hoje')
      setTransacaoSelecionada(null)
      await carregarDados()
    } catch (error) {
      console.error('❌ [handleAnteciparRepasse] Erro inesperado:', error)
      toast.error('Erro inesperado ao antecipar repasse')
    } finally {
      setProcessandoAcao(false)
    }
  }

  const handleReverterAntecipacao = async () => {
    if (!transacaoSelecionada) {
      toast.error('Selecione uma transação para reverter')
      return
    }

    console.log('🔄 [handleReverterAntecipacao] Iniciando reversão...', {
      transacaoId: transacaoSelecionada.id
    })

    setProcessandoAcao(true)
    try {
      const { error, mensagem } = await reverterAntecipacao(transacaoSelecionada.id)
      
      console.log('📥 [handleReverterAntecipacao] Resposta:', { error, mensagem })
      
      if (error) {
        console.error('❌ [handleReverterAntecipacao] Erro:', error)
        toast.error(mensagem || 'Erro ao reverter antecipação')
        setProcessandoAcao(false)
        return
      }

      toast.success(mensagem || 'Antecipação revertida com sucesso')
      setDialogReverterAntecipacaoAberto(false)
      setTransacaoSelecionada(null)
      await carregarDados()
    } catch (error) {
      console.error('❌ [handleReverterAntecipacao] Erro inesperado:', error)
      toast.error('Erro inesperado ao reverter antecipação')
    } finally {
      setProcessandoAcao(false)
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
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <ArrowRightLeft className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          Repasses
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          {revendaSelecionada 
            ? `Repasses da revenda selecionada (${transacoesLiberadas.length} transações liberadas)`
            : 'Gerencie repasses para todas as revendas da plataforma'}
        </p>
      </div>
      <div className="flex items-center justify-end">
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
      </div>

      {/* Seletor de Revenda */}
      <FiltrosRevendaUnidade
        revendaSelecionada={revendaSelecionada}
        unidadeSelecionada={unidadeSelecionada}
        onRevendaSelecionada={setRevendaSelecionada}
        onUnidadeSelecionada={setUnidadeSelecionada}
        obrigatorio={false}
      />

      {/* Métricas Gerais - Sempre visíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Transações Liberadas</p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                  {revendaSelecionada ? transacoesLiberadas.length : transacoesLiberadasTodos.length}
                </p>
                {(() => {
                  const atual = revendaSelecionada ? transacoesLiberadas.length : transacoesLiberadasTodos.length
                  const anterior = metricasAnteriores.transacoesLiberadas
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
              <Clock className="w-8 h-8 text-violet-600 dark:text-violet-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Valor Total Liberado</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatarPreco((revendaSelecionada ? transacoesLiberadas : transacoesLiberadasTodos).reduce((sum, t) => sum + (t.valor_liquido || 0), 0))}
                </p>
                {(() => {
                  const atual = (revendaSelecionada ? transacoesLiberadas : transacoesLiberadasTodos).reduce((sum, t) => sum + (t.valor_liquido || 0), 0)
                  const anterior = metricasAnteriores.valorTotalLiberado
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
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Repasses Realizados</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {revendaSelecionada ? repasses.length : repassesTodos.length}
                </p>
                {(() => {
                  const atual = revendaSelecionada ? repasses.length : repassesTodos.length
                  const anterior = metricasAnteriores.repassesRealizados
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
              <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Repasses Antecipados</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {(() => {
                    // Contar transações antecipadas (tanto em repasses quanto disponíveis para repasse)
                    const transacoesParaContar = revendaSelecionada ? transacoesLiberadas : transacoesLiberadasTodos
                    const transacoesAntecipadas = transacoesParaContar.filter(t => t.antecipado === true).length
                    
                    // Também contar repasses que têm transações antecipadas
                    const repassesParaContar = revendaSelecionada ? repasses : repassesTodos
                    const repassesComAntecipadas = repassesParaContar.filter(r => 
                      r.transacoes?.some(t => (t as any).antecipado === true)
                    ).length
                    
                    // Retornar a soma: transações antecipadas disponíveis + repasses com antecipadas
                    return transacoesAntecipadas + repassesComAntecipadas
                  })()}
                </p>
                {(() => {
                  const transacoesParaContar = revendaSelecionada ? transacoesLiberadas : transacoesLiberadasTodos
                  const transacoesAntecipadas = transacoesParaContar.filter(t => t.antecipado === true).length
                  const repassesParaContar = revendaSelecionada ? repasses : repassesTodos
                  const repassesComAntecipadas = repassesParaContar.filter(r => 
                    r.transacoes?.some(t => (t as any).antecipado === true)
                  ).length
                  const atual = transacoesAntecipadas + repassesComAntecipadas
                  const anterior = metricasAnteriores.repassesAntecipados
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
              <FastForward className="w-8 h-8 text-orange-600 dark:text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Valor Total Repassado</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {formatarPreco((revendaSelecionada ? repasses : repassesTodos).reduce((sum, r) => sum + (r.valor_total || 0), 0))}
                </p>
                {(() => {
                  const atual = (revendaSelecionada ? repasses : repassesTodos).reduce((sum, r) => sum + (r.valor_total || 0), 0)
                  const anterior = metricasAnteriores.valorTotalRepassado
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
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard quando não há revenda selecionada */}
      {!revendaSelecionada && (
        <>


          {/* Mensagem para selecionar revenda */}
          <Card className="border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-900/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Store className="w-12 h-12 text-violet-600 dark:text-violet-400 opacity-50" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
                    Selecione uma Revenda
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Use o seletor acima para filtrar por revenda específica e visualizar transações detalhadas, criar repasses e gerenciar bloqueios e antecipações.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Conteúdo completo quando há revenda selecionada */}
      {revendaSelecionada && (
        <>
          {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => {
            setAbaAtiva('pendentes')
            carregarDados()
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            abaAtiva === 'pendentes'
              ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Repasses Pendentes
          </div>
        </button>
        <button
          onClick={() => {
            setAbaAtiva('historico')
            carregarDados()
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            abaAtiva === 'historico'
              ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Histórico de Repasses
          </div>
        </button>
      </div>

      {/* Filtros Simplificados */}
      <div className="space-y-3">
        <FiltrosAvancados
          busca={busca}
          onBuscaChange={setBusca}
          dataFiltro={{
            value: dataFiltro,
            onChange: setDataFiltro,
            dataInicio: dataInicioPersonalizada,
            dataFim: dataFimPersonalizada,
            onDataInicioChange: setDataInicioPersonalizada,
            onDataFimChange: setDataFimPersonalizada,
          }}
          placeholderBusca="Buscar por pedido, cliente, revenda..."
          onLimparFiltros={limparFiltros}
        />
        
      </div>

      {/* Conteúdo das Tabs */}
      {abaAtiva === 'pendentes' ? (
        <>
          {/* Ações */}
          {transacoesFiltradas.length > 0 && (
            <Card className="border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-900/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selecionarTodasTransacoes}
                      className="border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400"
                    >
                      {transacoesSelecionadas.size === transacoesFiltradas.length
                        ? 'Desselecionar Todas'
                        : 'Selecionar Todas'}
                    </Button>
                    {transacoesSelecionadas.size > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          {transacoesSelecionadas.size} transação{transacoesSelecionadas.size > 1 ? 'ões' : ''} selecionada{transacoesSelecionadas.size > 1 ? 's' : ''}
                        </span>
                        <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                          Total: {formatarPreco(valorTotalSelecionado)}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => setDialogCriarRepasseAberto(true)}
                    disabled={transacoesSelecionadas.size === 0}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Repasse
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Header com Toggle */}
          {transacoesFiltradas.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {transacoesFiltradas.length} transação{transacoesFiltradas.length > 1 ? 'ões' : ''} disponível{transacoesFiltradas.length > 1 ? 'eis' : ''} para repasse
              </p>
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
          )}

          {/* Lista de Transações Liberadas */}
          {transacoesFiltradas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-2">
                  {transacoesLiberadas.length === 0
                    ? 'Nenhuma transação encontrada para repasse'
                    : 'Nenhuma transação corresponde aos filtros aplicados'}
                </p>
                {transacoesLiberadas.length === 0 && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-500 text-center">
                    💡 Transações serão criadas automaticamente quando pedidos forem criados.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : visualizacao === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transacoesFiltradas.map((transacao) => {
                const selecionada = transacoesSelecionadas.has(transacao.id)
                return (
                  <Card
                    key={transacao.id}
                    className={`border-neutral-200 dark:border-neutral-800 transition-all ${
                      transacao.bloqueado
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:shadow-md cursor-pointer'
                    } ${
                      selecionada
                        ? 'border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                        : ''
                    }`}
                    onClick={() => !transacao.bloqueado && toggleSelecionarTransacao(transacao.id)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                              Pedido #{transacao.pedido_id.slice(0, 8).toUpperCase()}
                            </span>
                            {transacao.status === 'pendente' && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                Pendente
                              </span>
                            )}
                            {transacao.status === 'liberado' && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                Liberado
                              </span>
                            )}
                          </div>
                          {selecionada && (
                            <CheckCircle2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                          )}
                        </div>

                        {transacao.revenda && (
                          <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                            <Store className="w-3 h-3" />
                            {transacao.revenda.nome_revenda}
                          </div>
                        )}

                        {transacao.cliente && (
                          <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                            <User className="w-3 h-3" />
                            {transacao.cliente.nome_completo || transacao.cliente.email}
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-neutral-500 dark:text-neutral-500">
                                Valor Total (Cliente)
                              </span>
                              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                {formatarPreco(transacao.valor_bruto || transacao.pedido?.valor_total || 0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-neutral-500 dark:text-neutral-500">
                                Valor a Repassar
                              </span>
                              <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                                {formatarPreco(transacao.valor_liquido)}
                              </span>
                            </div>
                            {transacao.modalidade && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-neutral-500 dark:text-neutral-500">
                                  Modalidade
                                </span>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                                  {transacao.modalidade}
                                </span>
                              </div>
                            )}
                            {(transacao.taxa_percentual !== null && transacao.taxa_percentual !== undefined) || 
                             (transacao.taxa_fixa !== null && transacao.taxa_fixa !== undefined) ? (
                              <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
                                {transacao.taxa_percentual !== null && transacao.taxa_percentual !== undefined && (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-neutral-500 dark:text-neutral-500">
                                      Taxa (%)
                                    </span>
                                    <span className="text-neutral-600 dark:text-neutral-400">
                                      {transacao.taxa_percentual.toFixed(2)}%
                                    </span>
                                  </div>
                                )}
                                {transacao.taxa_fixa !== null && transacao.taxa_fixa !== undefined && (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-neutral-500 dark:text-neutral-500">
                                      Taxa Fixa
                                    </span>
                                    <span className="text-neutral-600 dark:text-neutral-400">
                                      {formatarPreco(transacao.taxa_fixa)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-500">
                            Repasse previsto: {formatarData(transacao.antecipado && transacao.data_repasse_antecipada ? transacao.data_repasse_antecipada : transacao.data_repasse_prevista)}
                            {transacao.antecipado && transacao.data_repasse_antecipada && (
                              <span className="ml-1 text-blue-600 dark:text-blue-400">(Antecipado)</span>
                            )}
                          </div>
                        </div>

                        {(transacao.bloqueado || transacao.antecipado) && (
                          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                            {transacao.bloqueado && (
                              <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                                <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                                  <Lock className="w-3 h-3" />
                                  <span className="font-medium">Bloqueado</span>
                                </div>
                                {transacao.bloqueado_motivo && (
                                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    {transacao.bloqueado_motivo}
                                  </p>
                                )}
                              </div>
                            )}
                            {transacao.antecipado && (
                              <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                                  <FastForward className="w-3 h-3" />
                                  <span className="font-medium">Antecipado</span>
                                </div>
                                {transacao.data_repasse_antecipada && (
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Nova data: {formatarData(transacao.data_repasse_antecipada)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className={`pt-2 border-t border-neutral-200 dark:border-neutral-800 ${transacao.bloqueado || transacao.antecipado ? 'mt-2' : ''}`}>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/admin/pedidos/${transacao.pedido_id}`)
                              }}
                              className="w-full border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Pedido
                            </Button>
                            {!transacao.bloqueado && (
                              <div className={`grid gap-2 ${transacao.antecipado ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setTransacaoSelecionada(transacao)
                                    setDialogBloquearAberto(true)
                                  }}
                                  className="border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Lock className="w-3 h-3 mr-1" />
                                  Bloquear
                                </Button>
                                {transacao.antecipado ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setTransacaoSelecionada(transacao)
                                        setDialogReverterAntecipacaoAberto(true)
                                      }}
                                      className="border-orange-600 dark:border-orange-400 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                    >
                                      <RefreshCw className="w-3 h-3 mr-1" />
                                      Reverter
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setTransacaoSelecionada(transacao)
                                        setTipoAntecipacao('hoje')
                                        setNovaDataAntecipacao('')
                                        setDialogAnteciparAberto(true)
                                      }}
                                      className="border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                                    >
                                      <FastForward className="w-3 h-3 mr-1" />
                                      Antecipar
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setTransacaoSelecionada(transacao)
                                      setTipoAntecipacao('hoje')
                                      setNovaDataAntecipacao('')
                                      setDialogAnteciparAberto(true)
                                    }}
                                    className="border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                                  >
                                    <FastForward className="w-3 h-3 mr-1" />
                                    Antecipar
                                  </Button>
                                )}
                              </div>
                            )}
                            {transacao.bloqueado && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDesbloquearRepasse(transacao.id)
                                }}
                                disabled={processandoAcao}
                                className="w-full border-green-600 dark:border-green-400 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                              >
                                <Unlock className="w-3 h-3 mr-1" />
                                Desbloquear
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {transacoesFiltradas.map((transacao) => {
                const selecionada = transacoesSelecionadas.has(transacao.id)
                return (
                  <Card
                    key={transacao.id}
                    className={`border-neutral-200 dark:border-neutral-800 transition-all ${
                      transacao.bloqueado
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:shadow-md cursor-pointer'
                    } ${
                      selecionada
                        ? 'border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                        : ''
                    }`}
                    onClick={() => !transacao.bloqueado && toggleSelecionarTransacao(transacao.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {selecionada ? (
                              <CheckCircle2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            ) : (
                              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                                  Pedido #{transacao.pedido_id.slice(0, 8).toUpperCase()}
                                </span>
                                {transacao.status === 'pendente' && (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                    Pendente
                                  </span>
                                )}
                                {transacao.status === 'liberado' && (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                    Liberado
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                {transacao.revenda && (
                                  <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                                    <Store className="w-4 h-4" />
                                    {transacao.revenda.nome_revenda}
                                  </div>
                                )}
                                {transacao.cliente && (
                                  <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                                    <User className="w-4 h-4" />
                                    {transacao.cliente.nome_completo || transacao.cliente.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">
                                Valor Total (Cliente)
                              </p>
                              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                {formatarPreco(transacao.valor_bruto || transacao.pedido?.valor_total || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">
                                Valor a Repassar
                              </p>
                              <p className="text-xl font-bold text-violet-600 dark:text-violet-400">
                                {formatarPreco(transacao.valor_liquido)}
                              </p>
                            </div>
                            {transacao.modalidade && (
                              <div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">
                                  Modalidade
                                </p>
                                <p className="text-sm font-medium">
                                  <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                                    {transacao.modalidade}
                                  </span>
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">
                                Repasse Previsto
                              </p>
                              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                {formatarData(transacao.antecipado && transacao.data_repasse_antecipada ? transacao.data_repasse_antecipada : transacao.data_repasse_prevista)}
                                {transacao.antecipado && transacao.data_repasse_antecipada && (
                                  <span className="ml-1 text-blue-600 dark:text-blue-400 text-xs">(Antecipado)</span>
                                )}
                              </p>
                            </div>
                          </div>
                          {((transacao.taxa_percentual !== null && transacao.taxa_percentual !== undefined) || 
                            (transacao.taxa_fixa !== null && transacao.taxa_fixa !== undefined)) && (
                            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                              <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-2">Taxas Aplicadas</p>
                              <div className="flex items-center gap-4">
                                {transacao.taxa_percentual !== null && transacao.taxa_percentual !== undefined && (
                                  <div>
                                    <span className="text-xs text-neutral-500 dark:text-neutral-500">Taxa (%): </span>
                                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                      {transacao.taxa_percentual.toFixed(2)}%
                                    </span>
                                  </div>
                                )}
                                {transacao.taxa_fixa !== null && transacao.taxa_fixa !== undefined && (
                                  <div>
                                    <span className="text-xs text-neutral-500 dark:text-neutral-500">Taxa Fixa: </span>
                                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                      {formatarPreco(transacao.taxa_fixa)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/admin/pedidos/${transacao.pedido_id}`)
                          }}
                          className="ml-4 border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Pedido
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Header com Toggle e Ações */}
          {repassesFiltrados.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {repassesFiltrados.length} repasse{repassesFiltrados.length > 1 ? 's' : ''} encontrado{repassesFiltrados.length > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogLimparTodosAberto(true)}
                  className="border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Tudo
                </Button>
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

          {/* Lista de Repasses */}
          {repassesFiltrados.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowRightLeft className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                  {repasses.length === 0
                    ? 'Nenhum repasse encontrado'
                    : 'Nenhum repasse corresponde aos filtros aplicados'}
                </p>
              </CardContent>
            </Card>
          ) : visualizacao === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repassesFiltrados.map((repasse) => (
                <Card
                  key={repasse.id}
                  className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            Repasse #{repasse.id.slice(0, 8).toUpperCase()}
                          </span>
                          {(() => {
                            const temAntecipado = repasse.transacoes?.some((t: any) => t.antecipado === true)
                            if (temAntecipado) {
                              return (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                  Antecipado
                                </span>
                              )
                            } else {
                              return (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                                  Automático
                                </span>
                              )
                            }
                          })()}
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>

                      {repasse.revenda && (
                        <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                          <Store className="w-3 h-3" />
                          {repasse.revenda.nome_publico || repasse.revenda.nome_revenda}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500 dark:text-neutral-500">Valor Total</span>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatarPreco(repasse.valor_total)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500 dark:text-neutral-500">
                            Transações
                          </span>
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {repasse.quantidade_transacoes}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500 dark:text-neutral-500">Data</span>
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {formatarDataCompleta(repasse.data_repasse)}
                          </span>
                        </div>
                      </div>

                      {repasse.transacoes && repasse.transacoes.length > 0 && (
                        <div className="pt-2 border-t border-green-200 dark:border-green-800">
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-2">
                            Pedidos incluídos:
                          </p>
                          <div className="space-y-1">
                            {repasse.transacoes.slice(0, 3).map((transacao: any) => (
                              <div
                                key={transacao.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-neutral-600 dark:text-neutral-400">
                                  #{transacao.pedido_id?.slice(0, 8).toUpperCase() || 'N/A'}
                                </span>
                                <span className="font-medium text-neutral-900 dark:text-neutral-50">
                                  {formatarPreco(transacao.valor_liquido || 0)}
                                </span>
                              </div>
                            ))}
                            {repasse.transacoes.length > 3 && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                +{repasse.transacoes.length - 3} mais
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!repasse.id.startsWith('virtual-') && (
                        <div className="pt-2 border-t border-green-200 dark:border-green-800">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setRepasseParaExcluir(repasse)
                              setDialogExcluirRepasseAberto(true)
                            }}
                            className="w-full border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </Button>
                        </div>
                      )}
                      {repasse.id.startsWith('virtual-') && (
                        <div className="pt-2 border-t border-green-200 dark:border-green-800">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                            Transações liberadas/antecipadas aguardando repasse
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {repassesFiltrados.map((repasse) => (
                <Card
                  key={repasse.id}
                  className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                                Repasse #{repasse.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                Processado
                              </span>
                              {(() => {
                                const temAntecipado = repasse.transacoes?.some((t: any) => t.antecipado === true)
                                if (temAntecipado) {
                                  return (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                      Antecipado
                                    </span>
                                  )
                                } else {
                                  return (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                                      Automático
                                    </span>
                                  )
                                }
                              })()}
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              {repasse.revenda && (
                                <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                                  <Store className="w-4 h-4" />
                                  {repasse.revenda.nome_publico || repasse.revenda.nome_revenda}
                                </div>
                              )}
                              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                {formatarDataCompleta(repasse.data_repasse)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">Valor Total</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                              {formatarPreco(repasse.valor_total)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              Quantidade de Transações
                            </p>
                            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                              {repasse.quantidade_transacoes}
                            </p>
                          </div>
                          {repasse.observacoes && (
                            <div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-500">Observações</p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {repasse.observacoes}
                              </p>
                            </div>
                          )}
                        </div>

                        {repasse.transacoes && repasse.transacoes.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                              Pedidos incluídos:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {repasse.transacoes.map((transacao: any) => (
                                <div
                                  key={transacao.id}
                                  className="flex items-center justify-between p-2 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800"
                                >
                                  <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4 text-neutral-400" />
                                    <span className="text-sm text-neutral-900 dark:text-neutral-50">
                                      #{transacao.pedido_id?.slice(0, 8).toUpperCase() || 'N/A'}
                                    </span>
                                    {transacao.cliente && (
                                      <span className="text-xs text-neutral-500 dark:text-neutral-500">
                                        - {transacao.cliente.nome_completo || transacao.cliente.email}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                    {formatarPreco(transacao.valor_liquido || 0)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {!repasse.id.startsWith('virtual-') && (
                        <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRepasseParaExcluir(repasse)
                              setDialogExcluirRepasseAberto(true)
                            }}
                            className="w-full border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </Button>
                        </div>
                      )}
                      {repasse.id.startsWith('virtual-') && (
                        <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                            Transações liberadas/antecipadas aguardando repasse
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Dialog de Criar Repasse */}
      <AlertDialog open={dialogCriarRepasseAberto} onOpenChange={setDialogCriarRepasseAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Criar Repasse</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a criar um repasse para{' '}
                <strong>{transacoesSelecionadas.size} transação(ões)</strong> selecionada(s).
              </p>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-neutral-600 dark:text-neutral-400">Valor Total:</span>
                  <span className="font-bold text-violet-600 dark:text-violet-400 text-lg">
                    {formatarPreco(valorTotalSelecionado)}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  O repasse será agrupado por revenda automaticamente.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                  Observações (opcional)
                </label>
                <Textarea
                  value={observacoesRepasse}
                  onChange={(e) => setObservacoesRepasse(e.target.value)}
                  placeholder="Adicione observações sobre este repasse..."
                  className="min-h-[80px]"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={criandoRepasse}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCriarRepasse}
              disabled={criandoRepasse}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {criandoRepasse ? 'Criando...' : 'Confirmar Repasse'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Bloquear Repasse */}
      <AlertDialog open={dialogBloquearAberto} onOpenChange={setDialogBloquearAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear Repasse</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo para bloquear este repasse. O repasse não poderá ser realizado até ser desbloqueado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            {transacaoSelecionada && (
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Pedido #{transacaoSelecionada.pedido_id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Valor: {formatarPreco(transacaoSelecionada.valor_liquido)}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Data prevista: {formatarData(transacaoSelecionada.data_repasse_prevista)}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2 block">
                Motivo do Bloqueio *
              </label>
              <Textarea
                value={motivoBloqueio}
                onChange={(e) => setMotivoBloqueio(e.target.value)}
                placeholder="Descreva o motivo do bloqueio..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setMotivoBloqueio('')
              setTransacaoSelecionada(null)
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBloquearRepasse}
              disabled={!motivoBloqueio.trim() || processandoAcao}
              className="bg-red-600 hover:bg-red-700"
            >
              {processandoAcao ? 'Bloqueando...' : 'Bloquear Repasse'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Antecipar Repasse */}
      <AlertDialog 
        open={dialogAnteciparAberto} 
        onOpenChange={(open) => {
          console.log('🔄 [AlertDialog onOpenChange]', { open })
          if (!open && !processandoAcao) {
            setNovaDataAntecipacao('')
            setTipoAntecipacao('hoje')
            setTransacaoSelecionada(null)
          }
          setDialogAnteciparAberto(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Antecipar Repasse</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha quando deseja antecipar este repasse. Se selecionar "Hoje", o repasse será liberado imediatamente e ficará disponível para recebimento agora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            {transacaoSelecionada && (
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Pedido #{transacaoSelecionada.pedido_id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Valor: {formatarPreco(transacaoSelecionada.valor_liquido)}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Data original: {formatarData(transacaoSelecionada.data_repasse_prevista)}
                </p>
              </div>
            )}
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-900 dark:text-neutral-50 block">
                Quando antecipar? *
              </label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={tipoAntecipacao === 'hoje' ? 'default' : 'outline'}
                  onClick={() => {
                    setTipoAntecipacao('hoje')
                    setNovaDataAntecipacao('')
                  }}
                  className={tipoAntecipacao === 'hoje' ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}
                >
                  Hoje ({new Date().toLocaleDateString('pt-BR')}) - Liberado Imediatamente
                </Button>
                <Button
                  type="button"
                  variant={tipoAntecipacao === 'outro' ? 'default' : 'outline'}
                  onClick={() => setTipoAntecipacao('outro')}
                  className={tipoAntecipacao === 'outro' ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}
                >
                  Outro dia
                </Button>
              </div>
              {tipoAntecipacao === 'outro' && (
                <div className="mt-3">
                  <label className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2 block">
                    Selecione a data *
                  </label>
                  <Input
                    type="date"
                    value={novaDataAntecipacao}
                    onChange={(e) => setNovaDataAntecipacao(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setNovaDataAntecipacao('')
              setTipoAntecipacao('hoje')
              setTransacaoSelecionada(null)
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                console.log('🔘 [AlertDialogAction onClick] Botão clicado!', {
                  processandoAcao,
                  tipoAntecipacao,
                  novaDataAntecipacao,
                  transacaoSelecionada: transacaoSelecionada?.id
                })
                
                // Previne o fechamento automático do diálogo
                e.preventDefault()
                
                if (processandoAcao) {
                  console.log('⏸️ [AlertDialogAction onClick] Já está processando, ignorando clique')
                  return
                }
                
                if (tipoAntecipacao === 'outro' && !novaDataAntecipacao) {
                  console.log('❌ [AlertDialogAction onClick] Data não selecionada')
                  toast.error('Selecione uma data para antecipação')
                  return
                }
                
                console.log('✅ [AlertDialogAction onClick] Chamando handleAnteciparRepasse...')
                await handleAnteciparRepasse()
              }}
              disabled={processandoAcao || (tipoAntecipacao === 'outro' && !novaDataAntecipacao)}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {processandoAcao ? 'Antecipando...' : 'Antecipar Repasse'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Reverter Antecipação */}
      <AlertDialog 
        open={dialogReverterAntecipacaoAberto} 
        onOpenChange={(open) => {
          if (!open && !processandoAcao) {
            setTransacaoSelecionada(null)
          }
          setDialogReverterAntecipacaoAberto(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverter Antecipação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja reverter a antecipação deste repasse? A data será restaurada para a data original de repasse calculada pela modalidade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            {transacaoSelecionada && (
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Pedido #{transacaoSelecionada.pedido_id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Valor: {formatarPreco(transacaoSelecionada.valor_liquido)}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Data atual (antecipada): {transacaoSelecionada.data_repasse_antecipada ? formatarData(transacaoSelecionada.data_repasse_antecipada) : formatarData(transacaoSelecionada.data_repasse_prevista)}
                </p>
                <p className="text-sm text-violet-600 dark:text-violet-400 mt-2 font-medium">
                  A data será restaurada para a data original calculada pela modalidade de repasse.
                </p>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setTransacaoSelecionada(null)
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                console.log('🔘 [AlertDialogAction onClick] Reverter antecipação clicado!')
                e.preventDefault()
                
                if (processandoAcao) {
                  console.log('⏸️ [AlertDialogAction onClick] Já está processando, ignorando clique')
                  return
                }
                
                console.log('✅ [AlertDialogAction onClick] Chamando handleReverterAntecipacao...')
                await handleReverterAntecipacao()
              }}
              disabled={processandoAcao}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {processandoAcao ? 'Revertendo...' : 'Reverter Antecipação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação para Excluir Repasse */}
      <AlertDialog open={dialogExcluirRepasseAberto} onOpenChange={setDialogExcluirRepasseAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este repasse?
              {repasseParaExcluir && (
                <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Repasse:</span>
                    <span className="font-medium">#{repasseParaExcluir.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Valor Total:</span>
                    <span className="font-medium">{formatarPreco(repasseParaExcluir.valor_total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Transações:</span>
                    <span className="font-medium">{repasseParaExcluir.quantidade_transacoes}</span>
                  </div>
                </div>
              )}
              <p className="mt-4 font-semibold text-red-600 dark:text-red-400">
                ⚠️ Esta ação não pode ser desfeita.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindoRepasse}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!repasseParaExcluir) return
                setExcluindoRepasse(true)
                const { error, mensagem } = await excluirRepasse(repasseParaExcluir.id)
                setExcluindoRepasse(false)
                if (error) {
                  console.error('❌ Erro ao excluir repasse:', error)
                  toast.error(mensagem || `Erro ao excluir repasse: ${error.message || 'Erro desconhecido'}`)
                } else {
                  toast.success('Repasse excluído com sucesso')
                  setDialogExcluirRepasseAberto(false)
                  setRepasseParaExcluir(null)
                  // Recarregar dados baseado na aba ativa
                  if (revendaSelecionada) {
                    await carregarDados()
                  } else {
                    await carregarDadosDashboard()
                  }
                }
              }}
              disabled={excluindoRepasse}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {excluindoRepasse ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação para Limpar Todos os Repasses */}
      <AlertDialog open={dialogLimparTodosAberto} onOpenChange={setDialogLimparTodosAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Limpeza</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir todos os repasses{revendaSelecionada ? ' desta revenda' : ''}?
              <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Total de repasses: <strong>{repassesFiltrados.length}</strong>
                </p>
              </div>
              <p className="mt-4 font-semibold text-red-600 dark:text-red-400">
                ⚠️ Esta ação não pode ser desfeita. Todos os repasses serão permanentemente excluídos.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindoRepasse}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setExcluindoRepasse(true)
                const { excluidos, error, mensagem } = await limparTodosRepasses(revendaSelecionada || undefined)
                setExcluindoRepasse(false)
                if (error) {
                  console.error('❌ Erro ao limpar repasses:', error)
                  toast.error(mensagem || `Erro ao limpar repasses: ${error.message || 'Erro desconhecido'}`)
                } else {
                  toast.success(`${excluidos} repasse(s) excluído(s) com sucesso`)
                  setDialogLimparTodosAberto(false)
                  // Recarregar dados baseado na aba ativa
                  if (revendaSelecionada) {
                    await carregarDados()
                  } else {
                    await carregarDadosDashboard()
                  }
                }
              }}
              disabled={excluindoRepasse}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {excluindoRepasse ? 'Excluindo...' : 'Limpar Tudo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </>
      )}
    </div>
  )
}

