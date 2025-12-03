import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  BarChart3,
  PieChart,
  Calendar,
  Search,
  Eye,
  Store,
  LayoutGrid,
  List,
  RefreshCw,
  Percent,
  Settings,
  ArrowLeft,
  ChevronDown,
  XCircle,
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
  atualizarTaxasEmMassa,
  buscarTaxasPadraoModalidade,
} from '@/lib/configuracoesRepasse'
import {
  calcularMetricasGerais,
  listarTodasTransacoes,
  type TransacaoFinanceira,
} from '@/lib/financeiro'
import { executarAtualizacaoStatusTransacoes } from '@/lib/atualizarStatusTransacoes'
import { listarRevendas } from '@/lib/gerenciarRevenda'
import { formatarPreco } from '@/lib/utils'
import { FiltrosRevendaUnidade } from '@/components/admin/FiltrosRevendaUnidade'
import { FiltrosAvancados } from '@/components/admin/FiltrosAvancados'
import { AccordionItem } from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

export default function FinanceiroAdmin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [carregando, setCarregando] = useState(true)
  const [revendaSelecionada, setRevendaSelecionada] = useState<string | null>(null)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string | null>(null)
  const [revendas, setRevendas] = useState<Array<{ id: string; nome_revenda: string }>>([])
  const [metricas, setMetricas] = useState({
    receitaTotal: 0,
    totalTransacoes: 0,
    repassesRealizados: 0,
    repassesPendentes: 0,
    taxaMedia: 0,
  })
  const [metricasAnteriores, setMetricasAnteriores] = useState({
    receitaTotal: 0,
    totalTransacoes: 0,
    repassesRealizados: 0,
    repassesPendentes: 0,
    taxaMedia: 0,
  })
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([])
  const [transacoesParaGraficos, setTransacoesParaGraficos] = useState<TransacaoFinanceira[]>([]) // Transações sem filtros para gráficos
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid')
  const [atualizandoStatus, setAtualizandoStatus] = useState(false)

  // Estados para Taxas em Massa
  const [taxasD1, setTaxasD1] = useState({ percentual: '8.0', fixa: '50' })
  const [taxasD15, setTaxasD15] = useState({ percentual: '6.5', fixa: '50' })
  const [taxasD30, setTaxasD30] = useState({ percentual: '5.0', fixa: '50' })
  const [salvandoTaxas, setSalvandoTaxas] = useState<{ [key: string]: boolean }>({})
  const [confirmarSalvarTaxas, setConfirmarSalvarTaxas] = useState<{ modalidade: string; percentual: number; fixa: number } | null>(null)
  const [acordeaoTaxasAberto, setAcordeaoTaxasAberto] = useState(false)
  const [alertaTaxasAtualizadas, setAlertaTaxasAtualizadas] = useState<{ modalidade: string; atualizadas: number } | null>(null)

  // Filtros avançados
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'pendente' | 'liberado' | 'repassado'>('todos')
  const [modalidadeFiltro, setModalidadeFiltro] = useState<'todos' | 'D+1' | 'D+15' | 'D+30'>('todos')
  const [dataFiltro, setDataFiltro] = useState<'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'>('tudo')
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('')
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)

  const carregarRevendas = useCallback(async () => {
    const { revendas: revendasData } = await listarRevendas()
    setRevendas(revendasData || [])
  }, [])

  // Carregar taxas padrão quando o componente é montado
  useEffect(() => {
    const carregarTaxasPadrao = async () => {
      const [d1, d15, d30] = await Promise.all([
        buscarTaxasPadraoModalidade('D+1'),
        buscarTaxasPadraoModalidade('D+15'),
        buscarTaxasPadraoModalidade('D+30'),
      ])
      
      if (!d1.error) {
        setTaxasD1({
          percentual: d1.taxaPercentual.toString(),
          fixa: (d1.taxaFixa * 100).toString(), // Converter reais para centavos
        })
      }
      if (!d15.error) {
        setTaxasD15({
          percentual: d15.taxaPercentual.toString(),
          fixa: (d15.taxaFixa * 100).toString(),
        })
      }
      if (!d30.error) {
        setTaxasD30({
          percentual: d30.taxaPercentual.toString(),
          fixa: (d30.taxaFixa * 100).toString(),
        })
      }
    }
    carregarTaxasPadrao()
  }, [])

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    try {
      const filtros: any = {}
      if (revendaSelecionada) {
        filtros.revendaId = revendaSelecionada
      }
      if (unidadeSelecionada && revendaSelecionada) {
        filtros.unidadeId = unidadeSelecionada
      }
      
      console.log('📊 [FinanceiroAdmin] Filtros aplicados:', filtros)
      if (statusFiltro !== 'todos') {
        filtros.status = statusFiltro
      }
      if (modalidadeFiltro !== 'todos') {
        filtros.modalidade = modalidadeFiltro
      }

      // Calcula datas para filtro
      if (dataFiltro !== 'tudo') {
        const agora = new Date()
        let dataInicio: Date | null = null
        let dataFim: Date | null = null

        switch (dataFiltro) {
          case 'hoje':
            dataInicio = new Date(agora)
            dataInicio.setHours(0, 0, 0, 0)
            dataFim = new Date(agora)
            dataFim.setHours(23, 59, 59, 999)
            break
          case '7':
            dataInicio = new Date(agora)
            dataInicio.setDate(dataInicio.getDate() - 7)
            dataFim = new Date(agora)
            break
          case '15':
            dataInicio = new Date(agora)
            dataInicio.setDate(dataInicio.getDate() - 15)
            dataFim = new Date(agora)
            break
          case '30':
            dataInicio = new Date(agora)
            dataInicio.setDate(dataInicio.getDate() - 30)
            dataFim = new Date(agora)
            break
          case 'personalizado':
            if (dataInicioPersonalizada) {
              dataInicio = new Date(dataInicioPersonalizada)
              dataInicio.setHours(0, 0, 0, 0)
            }
            if (dataFimPersonalizada) {
              dataFim = new Date(dataFimPersonalizada)
              dataFim.setHours(23, 59, 59, 999)
            }
            break
        }

        if (dataInicio) {
          filtros.dataInicio = dataInicio.toISOString().split('T')[0]
        }
        if (dataFim) {
          filtros.dataFim = dataFim.toISOString().split('T')[0]
        }
      }

      // Calcular período anterior para comparação
      const filtrosAnteriores = { ...filtros }
      if (dataFiltro !== 'tudo') {
        const agora = new Date()
        let dataInicio: Date | null = null
        let dataFim: Date | null = null
        let diasPeriodo = 0

        switch (dataFiltro) {
          case 'hoje':
            dataInicio = new Date(agora)
            dataInicio.setDate(dataInicio.getDate() - 1)
            dataInicio.setHours(0, 0, 0, 0)
            dataFim = new Date(agora)
            dataFim.setDate(dataFim.getDate() - 1)
            dataFim.setHours(23, 59, 59, 999)
            diasPeriodo = 1
            break
          case '7':
            diasPeriodo = 7
            dataFim = new Date(agora)
            dataFim.setDate(dataFim.getDate() - 7)
            dataInicio = new Date(dataFim)
            dataInicio.setDate(dataInicio.getDate() - 7)
            break
          case '15':
            diasPeriodo = 15
            dataFim = new Date(agora)
            dataFim.setDate(dataFim.getDate() - 15)
            dataInicio = new Date(dataFim)
            dataInicio.setDate(dataInicio.getDate() - 15)
            break
          case '30':
            diasPeriodo = 30
            dataFim = new Date(agora)
            dataFim.setDate(dataFim.getDate() - 30)
            dataInicio = new Date(dataFim)
            dataInicio.setDate(dataInicio.getDate() - 30)
            break
          case 'personalizado':
            if (dataInicioPersonalizada && dataFimPersonalizada) {
              const inicio = new Date(dataInicioPersonalizada)
              const fim = new Date(dataFimPersonalizada)
              diasPeriodo = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
              dataFim = new Date(inicio)
              dataFim.setDate(dataFim.getDate() - 1)
              dataInicio = new Date(dataFim)
              dataInicio.setDate(dataInicio.getDate() - diasPeriodo)
            }
            break
        }

        if (dataInicio && dataFim) {
          filtrosAnteriores.dataInicio = dataInicio.toISOString().split('T')[0]
          filtrosAnteriores.dataFim = dataFim.toISOString().split('T')[0]
        }
      }

      // Para gráficos do dashboard, carregar TODAS as transações sem filtros quando não há revenda selecionada
      console.log('📊 [FinanceiroAdmin] Carregando dados para gráficos:', {
        revendaSelecionada,
        filtros,
      })
      
      // Calcular métricas anteriores: se há filtro, usa período anterior; senão, usa dia anterior
      const filtrosDiaAnterior = dataFiltro === 'tudo' ? {
        ...filtros,
        dataInicio: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
        dataFim: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
      } : filtrosAnteriores
      
      const [metricasResult, metricasAnterioresResult, transacoesResult] = await Promise.all([
        calcularMetricasGerais(filtros),
        calcularMetricasGerais(filtrosDiaAnterior).catch(() => ({
          receitaTotal: 0,
          totalTransacoes: 0,
          repassesRealizados: 0,
          repassesPendentes: 0,
          taxaMedia: 0,
          error: null,
        })),
        listarTodasTransacoes(filtros),
      ])

      console.log('📊 [FinanceiroAdmin] Resultados do carregamento:', {
        transacoesFiltradas: transacoesResult.transacoes?.length || 0,
        revendaSelecionada,
        unidadeSelecionada,
        filtros,
        erroTransacoes: transacoesResult.error,
      })

      setMetricas(metricasResult)
      setMetricasAnteriores(metricasAnterioresResult)
      setTransacoes(transacoesResult.transacoes || [])
      // Para gráficos: usa as mesmas transações filtradas
      const transacoesParaGraficos = transacoesResult.transacoes || []
      console.log('📊 [FinanceiroAdmin] Definindo transacoesParaGraficos:', {
        quantidade: transacoesParaGraficos.length,
        primeiras3: transacoesParaGraficos.slice(0, 3).map(t => ({
          id: t.id,
          modalidade: t.modalidade,
          valor: t.valor_bruto,
          revenda: t.revenda?.nome_revenda,
        })),
      })
      setTransacoesParaGraficos(transacoesParaGraficos)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setCarregando(false)
    }
  }, [revendaSelecionada, unidadeSelecionada, statusFiltro, modalidadeFiltro, dataFiltro, dataInicioPersonalizada, dataFimPersonalizada])

  // Carrega dados na inicialização e quando filtros mudam
  useEffect(() => {
    carregarRevendas()
  }, [carregarRevendas])

  // Carrega dados quando filtros mudam - EXATAMENTE como Repasses faz
  useEffect(() => {
    console.log('🔄 [FinanceiroAdmin] Carregando dados (filtros mudaram ou entrou no menu)...')
    carregarDados()
  }, [carregarDados])

  // Recarrega quando entra no menu Financeiro
  // Detecta quando o menu é clicado mesmo estando na mesma rota através do location.state
  useEffect(() => {
    // Sempre recarrega quando a rota é /admin/financeiro
    if (location.pathname === '/admin/financeiro') {
      // Se há um state com refresh, significa que o menu foi clicado
      const stateRefresh = (location.state as any)?.refresh
      if (stateRefresh) {
        console.log('🔄 [FinanceiroAdmin] Menu Financeiro foi clicado, recarregando dados...')
        carregarDados()
        // Limpa o state para evitar recarregamentos desnecessários
        navigate(location.pathname, { replace: true, state: {} })
      } else {
        // Primeira vez que entra na rota
        console.log('🔄 [FinanceiroAdmin] Entrou no menu Financeiro, recarregando dados...')
        carregarDados()
      }
    }
  }, [location.pathname, location.state, carregarDados, navigate])

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
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
        const dataTransacao = new Date(transacao.data_pagamento)
        return dataTransacao >= dataInicio && dataTransacao <= dataFim
      })
    }

    return filtrados
  }, [transacoes, busca, dataFiltro, dataInicioPersonalizada, dataFimPersonalizada])

  const limparFiltros = () => {
    setBusca('')
    setStatusFiltro('todos')
    setModalidadeFiltro('todos')
    setDataFiltro('tudo')
    setDataInicioPersonalizada('')
    setDataFimPersonalizada('')
    setDropdownCalendarioAberto(false)
  }

  const handleAtualizarStatusTransacoes = async () => {
    setAtualizandoStatus(true)
    try {
      const { atualizadas, error, mensagem } = await executarAtualizacaoStatusTransacoes()

      if (error) {
        toast.error(mensagem || 'Erro ao atualizar status das transações')
        setAtualizandoStatus(false)
        return
      }

      toast.success(`${atualizadas} transação(ões) atualizada(s) para liberado!`)
      await carregarDados()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro inesperado ao atualizar status')
    } finally {
      setAtualizandoStatus(false)
    }
  }

  const handleRefresh = async () => {
    setCarregando(true)
    try {
      await carregarDados()
      toast.success('Dados atualizados com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar dados:', error)
      toast.error('Erro ao atualizar dados')
    } finally {
      setCarregando(false)
    }
  }

  // Distribuição por modalidade - usa TODAS as transações (não filtradas) para o dashboard
  const distribuicaoModalidade = useMemo(() => {
    const distribuicao = {
      'D+1': { quantidade: 0, valor: 0 },
      'D+15': { quantidade: 0, valor: 0 },
      'D+30': { quantidade: 0, valor: 0 },
    }

    // Usa transacoesParaGraficos quando não há revenda selecionada (sem filtros)
    // Ou transacoesFiltradas quando há revenda selecionada
    const transacoesParaGrafico = revendaSelecionada ? transacoesFiltradas : transacoesParaGraficos

    console.log('📊 [distribuicaoModalidade] Calculando distribuição:', {
      revendaSelecionada,
      totalTransacoesParaGraficos: transacoesParaGraficos.length,
      totalTransacoesFiltradas: transacoesFiltradas.length,
      totalTransacoesParaGrafico: transacoesParaGrafico.length,
      transacoes: transacoesParaGrafico.slice(0, 5).map(t => ({ 
        id: t.id, 
        modalidade: t.modalidade, 
        valor: t.valor_bruto,
        revenda: t.revenda?.nome_revenda,
      })),
    })

    if (transacoesParaGrafico.length === 0) {
      console.warn('⚠️ [distribuicaoModalidade] Nenhuma transação disponível para gráfico')
      return distribuicao
    }

    transacoesParaGrafico.forEach((t) => {
      if (t.modalidade && t.modalidade in distribuicao) {
        distribuicao[t.modalidade as keyof typeof distribuicao].quantidade++
        distribuicao[t.modalidade as keyof typeof distribuicao].valor += t.valor_bruto || 0
      }
    })

    console.log('📊 [distribuicaoModalidade] Resultado:', distribuicao)

    return distribuicao
  }, [transacoesParaGraficos, transacoesFiltradas, revendaSelecionada])

  // Distribuição por revenda e unidade - usa transações filtradas de acordo com os filtros
  const distribuicaoRevenda = useMemo(() => {
    const map = new Map<string, { nome: string; tipo: 'revenda' | 'unidade'; quantidade: number; valor: number }>()

    // Usa transacoesParaGraficos quando não há revenda selecionada (sem filtros)
    // Ou transacoesFiltradas quando há revenda selecionada
    const transacoesParaGrafico = revendaSelecionada ? transacoesFiltradas : transacoesParaGraficos

    console.log('📊 [distribuicaoRevenda] Calculando distribuição:', {
      revendaSelecionada,
      unidadeSelecionada,
      totalTransacoesParaGraficos: transacoesParaGraficos.length,
      totalTransacoesFiltradas: transacoesFiltradas.length,
      totalTransacoesParaGrafico: transacoesParaGrafico.length,
      transacoes: transacoesParaGrafico.slice(0, 5).map(t => ({ 
        id: t.id, 
        revenda: t.revenda?.nome_revenda, 
        unidade: (t.pedido as any)?.unidade?.nome || (t.pedido as any)?.unidade?.nome_publico,
        valor: t.valor_bruto,
        revendaId: t.revenda_id,
      })),
    })

    if (transacoesParaGrafico.length === 0) {
      console.warn('⚠️ [distribuicaoRevenda] Nenhuma transação disponível para gráfico')
      return []
    }

    transacoesParaGrafico.forEach((t) => {
      if (t.revenda_id) {
        const pedido = t.pedido as any
        const unidade = pedido?.unidade
        
        // Se há unidade, agrupa por unidade; senão, agrupa por revenda
        if (unidade && unidade.id) {
          const unidadeId = unidade.id
          const unidadeNome = unidade.nome_publico || unidade.nome || 'Desconhecida'
          const revendaNome = t.revenda?.nome_revenda || 'Desconhecida'
          const nomeCompleto = `${revendaNome} - ${unidadeNome}`
          const key = `unidade_${unidadeId}`
          const existing = map.get(key) || { nome: nomeCompleto, tipo: 'unidade' as const, quantidade: 0, valor: 0 }
          existing.quantidade++
          existing.valor += t.valor_bruto || 0
          map.set(key, existing)
        } else {
          // Sem unidade, agrupa por revenda
          const revendaId = t.revenda_id
          const revendaNome = t.revenda?.nome_revenda || 'Desconhecida'
          const key = `revenda_${revendaId}`
          const existing = map.get(key) || { nome: revendaNome, tipo: 'revenda' as const, quantidade: 0, valor: 0 }
          existing.quantidade++
          existing.valor += t.valor_bruto || 0
          map.set(key, existing)
        }
      }
    })

    const resultado = Array.from(map.values()).sort((a, b) => b.valor - a.valor).slice(0, 5)
    console.log('📊 [distribuicaoRevenda] Resultado:', resultado)

    return resultado
  }, [transacoesParaGraficos, transacoesFiltradas, revendaSelecionada, unidadeSelecionada])

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Financeiro
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {revendaSelecionada ? `Visão financeira da revenda selecionada (${transacoes.length} transações)` : 'Visão geral financeira da plataforma'}
          </p>
        </div>
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

      {/* Alerta de Taxas Atualizadas */}
      {alertaTaxasAtualizadas && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <AlertTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Taxas Atualizadas com Sucesso!
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300 mt-2">
                As taxas da modalidade <strong>{alertaTaxasAtualizadas.modalidade}</strong> foram atualizadas para <strong>{alertaTaxasAtualizadas.atualizadas}</strong> configuração(ões).
                <br />
                <span className="text-xs mt-1 block">Novos pedidos usarão as novas taxas automaticamente.</span>
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAlertaTaxasAtualizadas(null)}
              className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        </Alert>
      )}

      {/* Configuração de Taxas - Acordeão que desaparece quando filtrado por revenda */}
      {!revendaSelecionada && (
        <div className="border border-violet-200 dark:border-violet-800 rounded-lg overflow-hidden bg-violet-50/30 dark:bg-violet-900/10">
          <Button
            variant="ghost"
            onClick={() => setAcordeaoTaxasAberto(!acordeaoTaxasAberto)}
            className="w-full justify-between p-4 h-auto hover:bg-violet-100/50 dark:hover:bg-violet-900/30 rounded-none"
          >
            <span className="font-medium text-left text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Settings className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Configuração de Taxas em Massa
            </span>
            <ChevronDown
              className={`w-5 h-5 text-neutral-500 transition-transform duration-200 ${
                acordeaoTaxasAberto ? 'transform rotate-180' : ''
              }`}
            />
          </Button>
          {acordeaoTaxasAberto && (
            <div className="px-4 pb-4 pt-0">
          <div className="space-y-4 pt-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Altere as taxas padrão para todas as modalidades. As alterações serão aplicadas a todas as revendas.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Modalidade D+1 */}
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  D+1 (24 horas)
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="d1-percentual" className="text-xs">Taxa Percentual (%)</Label>
                    <Input
                      id="d1-percentual"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxasD1.percentual}
                      onChange={(e) => setTaxasD1({ ...taxasD1, percentual: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="d1-fixa" className="text-xs">Taxa Fixa (centavos)</Label>
                    <Input
                      id="d1-fixa"
                      type="number"
                      step="1"
                      min="0"
                      placeholder="Ex: 50"
                      value={taxasD1.fixa}
                      onChange={(e) => setTaxasD1({ ...taxasD1, fixa: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {taxasD1.fixa ? `= ${formatarPreco(parseFloat(taxasD1.fixa || '0') / 100)}` : 'Ex: 50 = R$ 0,50'}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const percentual = parseFloat(taxasD1.percentual)
                      const fixa = parseFloat(taxasD1.fixa)
                      if (isNaN(percentual) || isNaN(fixa) || percentual < 0 || percentual > 100 || fixa < 0) {
                        toast.error('Valores inválidos')
                        return
                      }
                      setConfirmarSalvarTaxas({ modalidade: 'D+1', percentual, fixa })
                    }}
                    disabled={salvandoTaxas.D1}
                    size="sm"
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {salvandoTaxas.D1 ? 'Salvando...' : 'Salvar D+1'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Modalidade D+15 */}
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  D+15 (15 dias)
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="d15-percentual" className="text-xs">Taxa Percentual (%)</Label>
                    <Input
                      id="d15-percentual"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxasD15.percentual}
                      onChange={(e) => setTaxasD15({ ...taxasD15, percentual: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="d15-fixa" className="text-xs">Taxa Fixa (centavos)</Label>
                    <Input
                      id="d15-fixa"
                      type="number"
                      step="1"
                      min="0"
                      placeholder="Ex: 50"
                      value={taxasD15.fixa}
                      onChange={(e) => setTaxasD15({ ...taxasD15, fixa: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {taxasD15.fixa ? `= ${formatarPreco(parseFloat(taxasD15.fixa || '0') / 100)}` : 'Ex: 50 = R$ 0,50'}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const percentual = parseFloat(taxasD15.percentual)
                      const fixa = parseFloat(taxasD15.fixa)
                      if (isNaN(percentual) || isNaN(fixa) || percentual < 0 || percentual > 100 || fixa < 0) {
                        toast.error('Valores inválidos')
                        return
                      }
                      setConfirmarSalvarTaxas({ modalidade: 'D+15', percentual, fixa })
                    }}
                    disabled={salvandoTaxas.D15}
                    size="sm"
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {salvandoTaxas.D15 ? 'Salvando...' : 'Salvar D+15'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Modalidade D+30 */}
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                  D+30 (30 dias)
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="d30-percentual" className="text-xs">Taxa Percentual (%)</Label>
                    <Input
                      id="d30-percentual"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxasD30.percentual}
                      onChange={(e) => setTaxasD30({ ...taxasD30, percentual: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="d30-fixa" className="text-xs">Taxa Fixa (centavos)</Label>
                    <Input
                      id="d30-fixa"
                      type="number"
                      step="1"
                      min="0"
                      placeholder="Ex: 50"
                      value={taxasD30.fixa}
                      onChange={(e) => setTaxasD30({ ...taxasD30, fixa: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {taxasD30.fixa ? `= ${formatarPreco(parseFloat(taxasD30.fixa || '0') / 100)}` : 'Ex: 50 = R$ 0,50'}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const percentual = parseFloat(taxasD30.percentual)
                      const fixa = parseFloat(taxasD30.fixa)
                      if (isNaN(percentual) || isNaN(fixa) || percentual < 0 || percentual > 100 || fixa < 0) {
                        toast.error('Valores inválidos')
                        return
                      }
                      setConfirmarSalvarTaxas({ modalidade: 'D+30', percentual, fixa })
                    }}
                    disabled={salvandoTaxas.D30}
                    size="sm"
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {salvandoTaxas.D30 ? 'Salvando...' : 'Salvar D+30'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
            </div>
          )}
        </div>
      )}

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
                    <p className="text-sm text-neutral-500 dark:text-neutral-500">Receita Total</p>
                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                      {formatarPreco(metricas.receitaTotal)}
                    </p>
                    {metricasAnteriores.receitaTotal > 0 && (
                      <p className={`text-xs mt-1 ${metricas.receitaTotal >= metricasAnteriores.receitaTotal ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {metricas.receitaTotal >= metricasAnteriores.receitaTotal ? '↑' : '↓'} {Math.abs(((metricas.receitaTotal - metricasAnteriores.receitaTotal) / metricasAnteriores.receitaTotal) * 100).toFixed(1)}% vs {dataFiltro !== 'tudo' ? 'período anterior' : 'dia anterior'}
                      </p>
                    )}
                  </div>
                  <DollarSign className="w-8 h-8 text-violet-600 dark:text-violet-400 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-neutral-500 dark:text-neutral-500">Total Transações</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mt-1">
                      {metricas.totalTransacoes}
                    </p>
                    {metricasAnteriores.totalTransacoes > 0 && (
                      <p className={`text-xs mt-1 ${metricas.totalTransacoes >= metricasAnteriores.totalTransacoes ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {metricas.totalTransacoes >= metricasAnteriores.totalTransacoes ? '↑' : '↓'} {Math.abs(((metricas.totalTransacoes - metricasAnteriores.totalTransacoes) / metricasAnteriores.totalTransacoes) * 100).toFixed(1)}% vs {dataFiltro !== 'tudo' ? 'período anterior' : 'dia anterior'}
                      </p>
                    )}
                  </div>
                  <ShoppingCart className="w-8 h-8 text-neutral-600 dark:text-neutral-400 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-neutral-500 dark:text-neutral-500">Repasses Realizados</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {metricas.repassesRealizados}
                    </p>
                    {metricasAnteriores.repassesRealizados > 0 && (
                      <p className={`text-xs mt-1 ${metricas.repassesRealizados >= metricasAnteriores.repassesRealizados ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {metricas.repassesRealizados >= metricasAnteriores.repassesRealizados ? '↑' : '↓'} {Math.abs(((metricas.repassesRealizados - metricasAnteriores.repassesRealizados) / metricasAnteriores.repassesRealizados) * 100).toFixed(1)}% vs {dataFiltro !== 'tudo' ? 'período anterior' : 'dia anterior'}
                      </p>
                    )}
                  </div>
                  <CreditCard className="w-8 h-8 text-green-600 dark:text-green-400 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-neutral-500 dark:text-neutral-500">Repasses Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                      {metricas.repassesPendentes}
                    </p>
                    {metricasAnteriores.repassesPendentes > 0 && (
                      <p className={`text-xs mt-1 ${metricas.repassesPendentes >= metricasAnteriores.repassesPendentes ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {metricas.repassesPendentes >= metricasAnteriores.repassesPendentes ? '↑' : '↓'} {Math.abs(((metricas.repassesPendentes - metricasAnteriores.repassesPendentes) / metricasAnteriores.repassesPendentes) * 100).toFixed(1)}% vs {dataFiltro !== 'tudo' ? 'período anterior' : 'dia anterior'}
                      </p>
                    )}
                  </div>
                  <TrendingUp className="w-8 h-8 text-yellow-600 dark:text-yellow-400 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-neutral-500 dark:text-neutral-500">Taxa Média</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {metricas.taxaMedia.toFixed(2)}%
                    </p>
                    {metricasAnteriores.taxaMedia > 0 && (
                      <p className={`text-xs mt-1 ${metricas.taxaMedia >= metricasAnteriores.taxaMedia ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {metricas.taxaMedia >= metricasAnteriores.taxaMedia ? '↑' : '↓'} {Math.abs(metricas.taxaMedia - metricasAnteriores.taxaMedia).toFixed(2)}pp vs {dataFiltro !== 'tudo' ? 'período anterior' : 'dia anterior'}
                      </p>
                    )}
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

      {/* Filtros Simplificados */}
      <div className="space-y-3">
        <FiltrosAvancados
          busca={busca}
          onBuscaChange={setBusca}
          statusFiltro={{
            value: statusFiltro,
            onChange: (value) => setStatusFiltro(value as any),
            options: [
              { value: 'todos', label: 'Todos os Status' },
              { value: 'pendente', label: 'Pendente' },
              { value: 'liberado', label: 'Liberado' },
              { value: 'repassado', label: 'Repassado' },
            ],
          }}
          modalidadeFiltro={{
            value: modalidadeFiltro,
            onChange: (value) => setModalidadeFiltro(value as any),
            options: [
              { value: 'todos', label: 'Todas as Modalidades' },
              { value: 'D+1', label: 'D+1' },
              { value: 'D+15', label: 'D+15' },
              { value: 'D+30', label: 'D+30' },
            ],
          }}
          dataFiltro={{
            value: dataFiltro,
            onChange: setDataFiltro,
            dataInicio: dataInicioPersonalizada,
            dataFim: dataFimPersonalizada,
            onDataInicioChange: setDataInicioPersonalizada,
            onDataFimChange: setDataFimPersonalizada,
          }}
          placeholderBusca="Buscar por pedido, cliente, revenda..."
          onLimparFiltros={() => {
            setDataInicioPersonalizada('')
            setDataFimPersonalizada('')
            setDropdownCalendarioAberto(false)
          }}
        />
        
      </div>

      {/* Dashboard quando não há revenda selecionada */}
      {!revendaSelecionada && (
        <>
          {/* Gráficos de Distribuição - apenas quando não há filtros */}
          {/* Não mostrar quando há qualquer filtro aplicado */}
          {!unidadeSelecionada && statusFiltro === 'todos' && modalidadeFiltro === 'todos' && dataFiltro === 'tudo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Distribuição por Modalidade */}
              <Card className="border-neutral-200 dark:border-neutral-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    Distribuição por Modalidade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(['D+1', 'D+15', 'D+30'] as const).map((modalidade) => {
                      const dados = distribuicaoModalidade[modalidade]
                      const total = Object.values(distribuicaoModalidade).reduce(
                        (sum, d) => sum + d.quantidade,
                        0
                      )
                      const percentual = total > 0 ? (dados.quantidade / total) * 100 : 0

                      return (
                        <div key={modalidade} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-neutral-900 dark:text-neutral-50">
                              {modalidade}
                            </span>
                            <span className="text-neutral-600 dark:text-neutral-400">
                              {dados.quantidade} ({percentual.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                            <div
                              className="bg-violet-600 dark:bg-violet-400 h-2 rounded-full transition-all"
                              style={{ width: `${percentual}%` }}
                            />
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500">
                            Valor: {formatarPreco(dados.valor)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Revendas */}
              <Card className="border-neutral-200 dark:border-neutral-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    Top Revendas por Volume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {distribuicaoRevenda.length === 0 ? (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                        Nenhuma transação encontrada
                      </p>
                    ) : (
                      distribuicaoRevenda.map((revenda, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                              #{index + 1}
                            </span>
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                              {revenda.nome}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                              {formatarPreco(revenda.valor)}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              {revenda.quantidade} transações
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
                    Use o seletor acima para filtrar por revenda específica e visualizar transações detalhadas, gráficos e análises completas.
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
          {/* Gráficos de Distribuição - NÃO mostrar quando há revenda selecionada */}
          {/* Quando há revenda selecionada, mesmo sem unidade específica, há um filtro aplicado */}

          {/* Header com Toggle */}
          {transacoesFiltradas.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {transacoesFiltradas.length} transação{transacoesFiltradas.length > 1 ? 'ões' : ''} encontrada{transacoesFiltradas.length > 1 ? 's' : ''}
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
              {transacoesFiltradas.map((transacao) => (
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

                      {transacao.revenda && (
                        <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                          <Store className="w-3 h-3" />
                          {transacao.revenda.nome_publico || transacao.revenda.nome_revenda}
                        </div>
                      )}

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

                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/pedidos/${transacao.pedido_id}`)}
                          className="flex-1 border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
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
            <div className="space-y-3">
              {transacoesFiltradas.map((transacao) => (
                <Card
                  key={transacao.id}
                  className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <ShoppingCart className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-neutral-900 dark:text-neutral-50">
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
                            <div className="flex items-center gap-4 mt-1">
                              {transacao.revenda && (
                                <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                                  <Store className="w-4 h-4" />
                                  {transacao.revenda.nome_publico || transacao.revenda.nome_revenda}
                                </div>
                              )}
                              {transacao.cliente && (
                                <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                                  <Eye className="w-4 h-4" />
                                  {transacao.cliente.nome_completo || transacao.cliente.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">Valor Bruto</p>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                              {formatarPreco(transacao.valor_bruto)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">Taxas</p>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">
                              -{formatarPreco(
                                (transacao.valor_bruto * transacao.taxa_percentual) / 100 +
                                  transacao.taxa_fixa
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">Valor Líquido</p>
                            <p className="text-sm font-bold text-violet-600 dark:text-violet-400">
                              {formatarPreco(transacao.valor_liquido)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              Repasse Previsto
                            </p>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                              {formatarData(transacao.data_repasse_prevista)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/pedidos/${transacao.pedido_id}`)}
                        className="ml-4 border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Pedido
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

          {/* Dialog de Confirmação de Salvar Taxas */}
      <AlertDialog open={!!confirmarSalvarTaxas} onOpenChange={(open) => !open && setConfirmarSalvarTaxas(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alteração de Taxas</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a alterar as taxas da modalidade <strong>{confirmarSalvarTaxas?.modalidade}</strong> para todas as revendas.
              </p>
              {confirmarSalvarTaxas && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Taxa Percentual:</span>
                    <span className="font-medium">{confirmarSalvarTaxas.percentual}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Taxa Fixa:</span>
                    <span className="font-medium">{formatarPreco(confirmarSalvarTaxas.fixa / 100)}</span>
                  </div>
                </div>
              )}
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                ⚠️ Esta alteração será aplicada a todas as revendas desta modalidade. Novos pedidos usarão as novas taxas.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmarSalvarTaxas && (salvandoTaxas[confirmarSalvarTaxas.modalidade.replace('+', '')] || false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmarSalvarTaxas) return
                const { modalidade, percentual, fixa } = confirmarSalvarTaxas
                const key = modalidade.replace('+', '')
                setSalvandoTaxas({ ...salvandoTaxas, [key]: true })
                const { atualizadas, error, mensagem } = await atualizarTaxasEmMassa(
                  modalidade as 'D+1' | 'D+15' | 'D+30',
                  percentual,
                  fixa
                )
                setSalvandoTaxas({ ...salvandoTaxas, [key]: false })
                setConfirmarSalvarTaxas(null)
                if (error) {
                  toast.error(mensagem || 'Erro ao atualizar taxas')
                } else {
                  toast.success(`✅ Taxas ${modalidade} atualizadas com sucesso! ${atualizadas} configuração(ões) alterada(s)`)
                  // Mostrar alerta de mudança
                  setAlertaTaxasAtualizadas({ modalidade, atualizadas })
                  // Fechar o alerta após 8 segundos
                  setTimeout(() => {
                    setAlertaTaxasAtualizadas(null)
                  }, 8000)
                }
              }}
              disabled={confirmarSalvarTaxas && (salvandoTaxas[confirmarSalvarTaxas.modalidade.replace('+', '')] || false)}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {confirmarSalvarTaxas && salvandoTaxas[confirmarSalvarTaxas.modalidade.replace('+', '')] ? 'Salvando...' : 'Confirmar e Salvar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

