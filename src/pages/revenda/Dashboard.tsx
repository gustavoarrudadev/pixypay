import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Copy, CheckCircle2, AlertCircle, Package, TrendingUp, Eye, RefreshCw, DollarSign, ShoppingCart, CreditCard, Users, Filter, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { listarProdutos } from '@/lib/gerenciarProduto'
import { supabase } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'
import { buscarDetalhesRevenda } from '@/lib/gerenciarRevenda'
import { obterRevendaId, obterUnidadeIdColaborador } from '@/lib/impersonation'
import { listarAgendamentos, criarAgendamento, deletarAgendamento, atualizarAgendamento, atualizarStatusPorAgendamentos, type Agendamento, type DadosAgendamento } from '@/lib/gerenciarAgendamentos'
import { listarPedidosRevenda } from '@/lib/gerenciarPedidos'
import { calcularMetricasRevenda, listarTransacoesRevenda } from '@/lib/financeiro'
import { listarParcelamentosRevenda } from '@/lib/gerenciarParcelamentos'
import { listarClientesRevenda } from '@/lib/gerenciarCliente'
import { listarUnidades, type UnidadeRevenda } from '@/lib/gerenciarUnidades'
import { formatarPreco } from '@/lib/utils'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePickerCompact } from '@/components/ui/date-range-picker-compact'
import {
  ChartConfig,
} from '@/components/ui/chart'
import { ChartLineGradient } from '@/components/charts/ChartLineGradient'
import { ChartPieLabeled } from '@/components/charts/ChartPieLabeled'
import { ChartBarGradient } from '@/components/charts/ChartBarGradient'

export default function Dashboard() {
  const [revendaId, setRevendaId] = useState<string | null>(null)
  const [revendaNome, setRevendaNome] = useState<string>('')
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  
  
  // Estatísticas
  const [totalProdutos, setTotalProdutos] = useState(0)
  const [produtosAtivos, setProdutosAtivos] = useState(0)
  const [metricasFinanceiras, setMetricasFinanceiras] = useState({
    valoresRecebidosHoje: 0,
    valoresLiberados: 0,
    valoresPendentes: 0,
    valoresBloqueados: 0,
    totalEmProcessamento: 0,
  })
  const [totalPedidos, setTotalPedidos] = useState(0)
  const [pedidosEntregues, setPedidosEntregues] = useState(0)
  const [pedidosPendentes, setPedidosPendentes] = useState(0)
  const [totalClientes, setTotalClientes] = useState(0)
  const [parcelamentosAtivos, setParcelamentosAtivos] = useState(0)
  const [metricasAnteriores, setMetricasAnteriores] = useState({
    valoresRecebidosHoje: 0,
    valoresLiberados: 0,
    valoresPendentes: 0,
    totalPedidos: 0,
    pedidosEntregues: 0,
    totalClientes: 0,
    parcelamentosAtivos: 0,
  })
  
  // Agendamentos
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [carregandoAgendamentos, setCarregandoAgendamentos] = useState(false)

  // Dados para gráficos
  const [dadosGraficos, setDadosGraficos] = useState({
    receitaTemporal: [] as Array<{ data: string; receita: number }>,
    parcelamentos: [] as Array<{ name: string; value: number }>,
    volumePixParcelado: [] as Array<{ data: string; volume: number }>,
  })
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'customizado'>('mes')
  const [dataInicio, setDataInicio] = useState<Date | null>(null)
  const [dataFim, setDataFim] = useState<Date | null>(null)
  const [dataInicioString, setDataInicioString] = useState<string>('')
  const [dataFimString, setDataFimString] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)
  const [buscaGlobal, setBuscaGlobal] = useState('')
  const [filtroUnidade, setFiltroUnidade] = useState<string>('tudo')
  const [unidades, setUnidades] = useState<UnidadeRevenda[]>([])
  const [carregandoUnidades, setCarregandoUnidades] = useState(false)
  const [mostrarFiltroUnidade, setMostrarFiltroUnidade] = useState(true)
  const [buscando, setBuscando] = useState(false)
  const [resultadosBusca, setResultadosBusca] = useState<Array<{
    tipo: 'cliente' | 'pedido' | 'parcelamento' | 'funcionalidade'
    id?: string
    titulo: string
    subtitulo?: string
    rota: string
  }>>([])
  const [mostrarResultados, setMostrarResultados] = useState(false)

  const navigate = useNavigate()
  const buscaTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const buscaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    carregarDados()
    
    // Atualização automática a cada 30 segundos
    intervalRef.current = setInterval(() => {
      if (!document.hidden && revendaId) {
        carregarDados(true)
      }
    }, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [revendaId])

  // Recarregar dados quando filtros mudarem
  useEffect(() => {
    if (!carregando && revendaId) {
      carregarDados(true)
    }
  }, [filtroPeriodo, dataInicio, dataFim, filtroUnidade])

  // Função de busca global para revenda - definida antes do useEffect
  const handleBuscaGlobal = useCallback(async (termo: string) => {
    if (!termo.trim()) {
      setResultadosBusca([])
      setMostrarResultados(false)
      return
    }

    setBuscando(true)
    try {
      const termoLower = termo.toLowerCase().trim()
      const resultados: Array<{
        tipo: 'cliente' | 'pedido' | 'parcelamento' | 'funcionalidade'
        id?: string
        titulo: string
        subtitulo?: string
        rota: string
      }> = []

      // Busca em funcionalidades/páginas do sistema
      const funcionalidades = [
        { nome: 'Dashboard', rota: '/revenda/dashboard', palavras: ['dashboard', 'inicio', 'principal', 'home'] },
        { nome: 'Presença na Loja', rota: '/revenda/presenca', palavras: ['presenca', 'presença', 'loja', 'publica', 'link'] },
        { nome: 'Produtos', rota: '/revenda/produtos', palavras: ['produtos', 'produto', 'itens', 'item'] },
        { nome: 'Pedidos', rota: '/revenda/pedidos', palavras: ['pedidos', 'pedido', 'vendas', 'venda'] },
        { nome: 'Agendamentos', rota: '/revenda/agendamentos', palavras: ['agendamentos', 'agendamento', 'agenda'] },
        { nome: 'Clientes', rota: '/revenda/clientes', palavras: ['clientes', 'cliente', 'usuarios', 'usuario'] },
        { nome: 'Parcelamentos', rota: '/revenda/parcelamentos', palavras: ['parcelamentos', 'parcelamento', 'parcelas', 'parcela'] },
        { nome: 'Financeiro', rota: '/revenda/financeiro', palavras: ['financeiro', 'financeira', 'financas', 'receita'] },
        { nome: 'Relatório', rota: '/revenda/relatorio', palavras: ['relatorio', 'relatório', 'relatorios', 'relatórios'] },
        { nome: 'Administração', rota: '/revenda/administracao', palavras: ['administracao', 'admin', 'configuracoes', 'configurações'] },
      ]

      funcionalidades.forEach(func => {
        const matchNome = func.nome.toLowerCase().includes(termoLower)
        const matchPalavras = func.palavras.some(p => p.includes(termoLower))
        if (matchNome || matchPalavras) {
          resultados.push({
            tipo: 'funcionalidade',
            titulo: func.nome,
            subtitulo: 'Página do sistema',
            rota: func.rota
          })
        }
      })

      // Busca em clientes da revenda
      if (revendaId) {
        try {
          const { clientes } = await listarClientesRevenda(revendaId)
          clientes.forEach(c => {
            if (
              c.email?.toLowerCase().includes(termoLower) ||
              c.nome_completo?.toLowerCase().includes(termoLower) ||
              c.id?.toLowerCase().includes(termoLower)
            ) {
              resultados.push({
                tipo: 'cliente',
                id: c.id || '',
                titulo: c.nome_completo || c.email || 'Cliente sem nome',
                subtitulo: c.email,
                rota: `/revenda/clientes`
              })
            }
          })
        } catch (error) {
          console.error('Erro ao buscar clientes:', error)
        }
      }

      // Busca em pedidos da revenda
      if (revendaId) {
        try {
          const { pedidos } = await listarPedidosRevenda(revendaId)
          pedidos.forEach(p => {
            if (
              p.id.toLowerCase().includes(termoLower) ||
              p.dados_cliente?.nome?.toLowerCase().includes(termoLower) ||
              p.dados_cliente?.email?.toLowerCase().includes(termoLower)
            ) {
              resultados.push({
                tipo: 'pedido',
                id: p.id,
                titulo: `Pedido #${p.id.slice(0, 8).toUpperCase()}`,
                subtitulo: `${p.dados_cliente?.nome || 'Cliente'}`,
                rota: `/revenda/pedidos`
              })
            }
          })
        } catch (error) {
          console.error('Erro ao buscar pedidos:', error)
        }
      }

      // Busca em parcelamentos da revenda
      if (revendaId) {
        try {
          const { parcelamentos } = await listarParcelamentosRevenda(revendaId)
          parcelamentos.forEach(parc => {
            if (
              parc.id.toLowerCase().includes(termoLower) ||
              parc.pedido?.id.toLowerCase().includes(termoLower) ||
              parc.pedido?.dados_cliente?.nome?.toLowerCase().includes(termoLower)
            ) {
              resultados.push({
                tipo: 'parcelamento',
                id: parc.id,
                titulo: `Parcelamento #${parc.id.slice(0, 8).toUpperCase()}`,
                subtitulo: `Pedido: ${parc.pedido?.id.slice(0, 8).toUpperCase() || 'N/A'}`,
                rota: `/revenda/parcelamentos`
              })
            }
          })
        } catch (error) {
          console.error('Erro ao buscar parcelamentos:', error)
        }
      }

      setResultadosBusca(resultados.slice(0, 20))
      setMostrarResultados(resultados.length > 0)
    } catch (error) {
      console.error('❌ Erro ao buscar:', error)
      setResultadosBusca([])
      setMostrarResultados(false)
    } finally {
      setBuscando(false)
    }
  }, [revendaId, navigate])

  // Busca em tempo real com debounce
  useEffect(() => {
    // Limpa timeout anterior
    if (buscaTimeoutRef.current) {
      clearTimeout(buscaTimeoutRef.current)
    }

    // Se a busca estiver vazia, limpa resultados
    if (!buscaGlobal.trim() || !revendaId) {
      setResultadosBusca([])
      setMostrarResultados(false)
      return
    }

    // Aguarda 300ms após parar de digitar para fazer a busca
    buscaTimeoutRef.current = setTimeout(() => {
      handleBuscaGlobal(buscaGlobal)
    }, 300)

    return () => {
      if (buscaTimeoutRef.current) {
        clearTimeout(buscaTimeoutRef.current)
      }
    }
  }, [buscaGlobal, revendaId, handleBuscaGlobal])

  // Pausar atualização quando a aba está inativa
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      } else if (revendaId) {
        carregarDados(true)
        intervalRef.current = setInterval(() => {
          carregarDados(true)
        }, 30000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [revendaId])

  // Verifica e atualiza status por agendamentos periodicamente
  useEffect(() => {
    if (!revendaId) return

    // Verifica imediatamente ao carregar
    const verificarStatus = async () => {
      try {
        await atualizarStatusPorAgendamentos(revendaId)
      } catch (error) {
        console.error('❌ Erro ao verificar status por agendamentos:', error)
      }
    }

    verificarStatus()

    // Verifica a cada minuto
    const intervalId = setInterval(verificarStatus, 60000)

    return () => clearInterval(intervalId)
  }, [revendaId])

  const carregarDados = async (silencioso: boolean = false) => {
    if (!silencioso) {
      setCarregando(true)
    } else {
      setAtualizando(true)
    }
    setErro(null)

    try {
      // Usa função helper que considera modo impersonation
      const revendaIdAtual = await obterRevendaId()
      
      if (!revendaIdAtual) {
        setErro('Erro ao carregar dados da revenda.')
        return
      }

      // Busca dados da revenda usando o revendaId
      const { data: revendaData, error: revendaError } = await supabase
        .from('revendas')
        .select('id, nome_revenda')
        .eq('id', revendaIdAtual)
        .single()

      if (revendaError || !revendaData) {
        setErro('Erro ao carregar dados da revenda.')
        return
      }

      setRevendaId(revendaData.id)
      setRevendaNome(revendaData.nome_revenda)

      // Carrega unidades da revenda
      await carregarUnidades(revendaData.id)

      // Carrega todas as estatísticas em paralelo
      await Promise.all([
        carregarEstatisticas(revendaData.id),
        carregarAgendamentos(revendaData.id),
        carregarMetricasCompletas(revendaData.id),
      ])

      setUltimaAtualizacao(new Date())
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      setErro('Erro inesperado ao carregar dados.')
    } finally {
      setCarregando(false)
      setAtualizando(false)
    }
  }

  const carregarUnidades = async (id: string) => {
    setCarregandoUnidades(true)
    try {
      const { unidades: unidadesData, error } = await listarUnidades(id)
      if (!error && unidadesData) {
        // Se for colaborador com unidade específica, filtrar apenas aquela unidade
        const unidadeIdColaborador = await obterUnidadeIdColaborador()
        if (unidadeIdColaborador !== undefined && unidadeIdColaborador !== null) {
          // Colaborador tem acesso apenas a uma unidade específica
          // Não mostra o filtro de unidade e força a unidade específica
          const unidadeFiltrada = unidadesData.filter(u => u.id === unidadeIdColaborador)
          setUnidades(unidadeFiltrada)
          setMostrarFiltroUnidade(false) // Esconde o filtro de unidade
          // Seleciona automaticamente a unidade do colaborador
          if (unidadeFiltrada.length > 0) {
            setFiltroUnidade(unidadeFiltrada[0].id)
          }
        } else {
          // Colaborador com acesso a todas as unidades ou revenda comum
          setUnidades(unidadesData)
          setMostrarFiltroUnidade(true) // Mostra o filtro de unidade
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar unidades:', error)
    } finally {
      setCarregandoUnidades(false)
    }
  }

  const carregarEstatisticas = async (id: string) => {
    try {
      // Se for colaborador, verifica se tem unidade_id específico
      const unidadeIdColaborador = await obterUnidadeIdColaborador()
      let unidadeId: string | null | undefined = undefined
      
      // Se colaborador tem unidade_id específico, força o filtro para essa unidade
      if (unidadeIdColaborador !== undefined && unidadeIdColaborador !== null) {
        // Colaborador com acesso a unidade específica - sempre filtra por essa unidade
        unidadeId = unidadeIdColaborador
      } else if (filtroUnidade !== 'tudo') {
        // Não é colaborador com unidade específica e filtro não é "tudo" - usa o filtro selecionado
        unidadeId = filtroUnidade
      }
      // Se filtroUnidade === 'tudo' e não é colaborador com unidade específica, unidadeId fica undefined (busca todas)
      
      const { produtos, error } = await listarProdutos(id, unidadeId)
      if (!error && produtos) {
        setTotalProdutos(produtos.length)
        setProdutosAtivos(produtos.filter(p => p.ativo).length)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error)
    }
  }

  const carregarMetricasCompletas = async (id: string) => {
    try {
      // Calcular data de ontem para comparação
      const hoje = new Date()
      const ontem = new Date(hoje)
      ontem.setDate(ontem.getDate() - 1)
      const dataOntem = ontem.toISOString().split('T')[0]

      // Se for colaborador, verifica se tem unidade_id específico
      const unidadeIdColaborador = await obterUnidadeIdColaborador()
      let unidadeId: string | null | undefined = undefined
      
      // Se colaborador tem unidade_id específico, força o filtro para essa unidade
      if (unidadeIdColaborador !== undefined && unidadeIdColaborador !== null) {
        // Colaborador com acesso a unidade específica - sempre filtra por essa unidade
        unidadeId = unidadeIdColaborador
      } else if (filtroUnidade !== 'tudo') {
        // Não é colaborador com unidade específica e filtro não é "tudo" - usa o filtro selecionado
        unidadeId = filtroUnidade
      }
      // Se filtroUnidade === 'tudo' e não é colaborador com unidade específica, unidadeId fica undefined (busca todas)

      const [
        metricasResult,
        metricasOntemResult,
        pedidosResult,
        clientesResult,
        parcelamentosResult,
        transacoesResult
      ] = await Promise.all([
        calcularMetricasRevenda(id, unidadeId),
        calcularMetricasRevenda(id, unidadeId).catch(() => ({
          valoresRecebidosHoje: 0,
          valoresLiberados: 0,
          valoresPendentes: 0,
          valoresBloqueados: 0,
          totalEmProcessamento: 0,
          error: null,
        })),
        listarPedidosRevenda(id, unidadeId),
        listarClientesRevenda(id, unidadeId),
        listarParcelamentosRevenda(id, unidadeId),
        listarTransacoesRevenda(id, { unidadeId }),
      ])

      if (!metricasResult.error) {
        setMetricasFinanceiras(metricasResult)
      }

      if (!metricasOntemResult.error) {
        setMetricasAnteriores(prev => ({
          ...prev,
          valoresRecebidosHoje: metricasOntemResult.valoresRecebidosHoje || 0,
          valoresLiberados: metricasOntemResult.valoresLiberados || 0,
          valoresPendentes: metricasOntemResult.valoresPendentes || 0,
        }))
      }

      if (!pedidosResult.error) {
        const pedidosTodos = pedidosResult.pedidos || []
        
        // Aplicar filtro de período
        let dataInicioFiltro = new Date()
        let dataFimFiltro = new Date()
        
        if (filtroPeriodo === 'hoje') {
          dataInicioFiltro.setHours(0, 0, 0, 0)
          dataFimFiltro.setHours(23, 59, 59, 999)
        } else if (filtroPeriodo === 'semana') {
          dataInicioFiltro.setDate(dataInicioFiltro.getDate() - 7)
          dataInicioFiltro.setHours(0, 0, 0, 0)
        } else if (filtroPeriodo === 'mes') {
          dataInicioFiltro.setDate(dataInicioFiltro.getDate() - 30)
          dataInicioFiltro.setHours(0, 0, 0, 0)
        } else if (filtroPeriodo === 'customizado' && dataInicio && dataFim) {
          dataInicioFiltro = dataInicio
          dataFimFiltro = dataFim
        }

        const pedidos = pedidosTodos.filter(p => {
          if (!p.criado_em) return false
          const dataPedido = new Date(p.criado_em)
          if (isNaN(dataPedido.getTime())) return false
          return dataPedido >= dataInicioFiltro && dataPedido <= dataFimFiltro
        })

        setTotalPedidos(pedidos.length)
        setPedidosEntregues(pedidos.filter(p => p.status === 'entregue').length)
        setPedidosPendentes(pedidos.filter(p => ['pendente', 'confirmado', 'preparando', 'pronto', 'em_transito'].includes(p.status)).length)

        // Calcular métricas anteriores de pedidos
        const pedidosOntem = pedidosTodos.filter(p => {
          if (!p.criado_em) return false
          const dataCriacao = new Date(p.criado_em)
          if (isNaN(dataCriacao.getTime())) return false
          return dataCriacao.toISOString().split('T')[0] === dataOntem
        })
        setMetricasAnteriores(prev => ({
          ...prev,
          totalPedidos: pedidosOntem.length,
          pedidosEntregues: pedidosOntem.filter(p => p.status === 'entregue').length,
        }))

        // Preparar dados para gráficos (usando transações dos últimos 7 dias, independente do filtro)
        // Calcular data dos últimos 7 dias para o gráfico
        const dataInicioGrafico = new Date()
        dataInicioGrafico.setDate(dataInicioGrafico.getDate() - 6)
        dataInicioGrafico.setHours(0, 0, 0, 0)
        const dataFimGrafico = new Date()
        dataFimGrafico.setHours(23, 59, 59, 999)
        
        // Filtrar transações dos últimos 7 dias por data_pagamento
        const transacoesGrafico = (transacoesResult.transacoes || []).filter(t => {
          const dataStr = t.data_pagamento || t.criado_em
          if (!dataStr) return false
          const dataPagamento = new Date(dataStr)
          if (isNaN(dataPagamento.getTime())) return false
          return dataPagamento >= dataInicioGrafico && dataPagamento <= dataFimGrafico
        })
        prepararDadosGraficos(pedidos, transacoesGrafico, parcelamentosResult.parcelamentos || [])
      }

      if (!clientesResult.error) {
        const clientes = clientesResult.clientes || []
        setTotalClientes(clientes.length)

        // Calcular métricas anteriores de clientes
        // Nota: listarClientesRevenda não retorna criado_em, então usamos ultimo_pedido como aproximação
        const clientesOntem = clientes.filter(c => {
          if (!c.ultimo_pedido) return false
          const dataUltimoPedido = new Date(c.ultimo_pedido)
          if (isNaN(dataUltimoPedido.getTime())) return false
          return dataUltimoPedido.toISOString().split('T')[0] === dataOntem
        })
        setMetricasAnteriores(prev => ({
          ...prev,
          totalClientes: clientesOntem.length,
        }))
      }

      if (!parcelamentosResult.error) {
        const parcelamentos = parcelamentosResult.parcelamentos || []
        console.log('📊 [Dashboard Revenda] Parcelamentos carregados:', {
          total: parcelamentos.length,
          ativos: parcelamentos.filter(p => p.status === 'ativo').length,
          parcelamentos: parcelamentos.map(p => ({
            id: p.id,
            status: p.status,
            pedido_id: p.pedido_id,
          })),
        })
        const parcelamentosAtivosCount = parcelamentos.filter(p => p.status === 'ativo').length
        setParcelamentosAtivos(parcelamentosAtivosCount)

        // Calcular métricas anteriores de parcelamentos
        const parcelamentosOntem = parcelamentos.filter(p => {
          const dataStr = p.criado_em || p.pedido?.criado_em
          if (!dataStr) return false
          const dataCriacao = new Date(dataStr)
          if (isNaN(dataCriacao.getTime())) return false
          return dataCriacao.toISOString().split('T')[0] === dataOntem
        })
        setMetricasAnteriores(prev => ({
          ...prev,
          parcelamentosAtivos: parcelamentosOntem.filter(p => p.status === 'ativo').length,
        }))
      } else {
        console.error('❌ [Dashboard Revenda] Erro ao carregar parcelamentos:', parcelamentosResult.error)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar métricas completas:', error)
    }
  }

  const prepararDadosGraficos = (pedidos: any[], transacoes: any[], parcelamentos: any[]) => {
    // Receita ao longo do tempo (últimos 7 dias)
    const receitaTemporal: Array<{ data: string; receita: number }> = []
    for (let i = 6; i >= 0; i--) {
      const data = new Date()
      data.setDate(data.getDate() - i)
      data.setHours(0, 0, 0, 0)
      const dataStr = data.toISOString().split('T')[0]
      
      const receitaDia = transacoes
        .filter(t => {
          const dataPagamento = new Date(t.data_pagamento || t.criado_em).toISOString().split('T')[0]
          return dataPagamento === dataStr
        })
        .reduce((sum, t) => sum + (parseFloat(t.valor_liquido) || 0), 0)
      
      receitaTemporal.push({
        data: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        receita: Math.round(receitaDia * 100) / 100,
      })
    }

    // Parcelamentos por status
    // Contar parcelamentos inadimplentes (que têm pelo menos uma parcela atrasada)
    const parcelamentosInadimplentes = parcelamentos.filter((p: any) => {
      if (!p.parcelas || p.parcelas.length === 0) return false
      return p.parcelas.some((parcela: any) => parcela.status === 'atrasada')
    }).length

    const parcelamentosPorStatus = [
      { name: 'Ativo', value: parcelamentos.filter((p: any) => p.status === 'ativo' && !p.parcelas?.some((parcela: any) => parcela.status === 'atrasada')).length },
      { name: 'Inadimplente', value: parcelamentosInadimplentes },
      { name: 'Quitado', value: parcelamentos.filter((p: any) => p.status === 'quitado').length },
      { name: 'Cancelado', value: parcelamentos.filter((p: any) => p.status === 'cancelado').length },
    ]

    // Volume de pedidos Pix Parcelado ao longo do tempo (últimos 7 dias)
    const pedidosPixParcelado = pedidos.filter(p => p.forma_pagamento === 'pix_parcelado')
    const volumePixParcelado: Array<{ data: string; volume: number }> = []
    for (let i = 6; i >= 0; i--) {
      const data = new Date()
      data.setDate(data.getDate() - i)
      data.setHours(0, 0, 0, 0)
      const dataStr = data.toISOString().split('T')[0]
      
      const volumeDia = pedidosPixParcelado.filter(p => {
        if (!p.criado_em) return false
        const dataPedido = new Date(p.criado_em).toISOString().split('T')[0]
        return dataPedido === dataStr
      }).length
      
      volumePixParcelado.push({
        data: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        volume: volumeDia,
      })
    }

    setDadosGraficos({
      receitaTemporal,
      parcelamentos: parcelamentosPorStatus,
      volumePixParcelado,
    })
  }

  // Configuração dos gráficos com cores vibrantes estilo React Native Chart Kit
  const receitaChartConfig = {
    receita: {
      label: 'Receita',
      color: '#6366f1', // Indigo vibrante
    },
  } satisfies ChartConfig

  const parcelamentosChartConfig = {
    Ativo: {
      label: 'Ativo',
      color: '#8b5cf6', // Violeta
    },
    Inadimplente: {
      label: 'Inadimplente',
      color: '#f59e0b', // Amarelo/Amber
    },
    Quitado: {
      label: 'Quitado',
      color: '#10b981', // Verde
    },
    Cancelado: {
      label: 'Cancelado',
      color: '#ef4444', // Vermelho
    },
  } satisfies ChartConfig

  const volumePixParceladoChartConfig = {
    volume: {
      label: 'Volume',
      color: '#1fecff', // Ciano vibrante
    },
  } satisfies ChartConfig


  const carregarAgendamentos = async (id: string) => {
    setCarregandoAgendamentos(true)
    try {
      const { agendamentos: agendamentosData, error } = await listarAgendamentos(id)
      if (!error && agendamentosData) {
        setAgendamentos(agendamentosData)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar agendamentos:', error)
    } finally {
      setCarregandoAgendamentos(false)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Dashboard
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Gerencie sua loja pública e visualize estatísticas
          </p>
          {ultimaAtualizacao && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Última atualização: {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => carregarDados()}
          disabled={atualizando}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${atualizando ? 'animate-spin' : ''}`} />
          {atualizando ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Mensagens */}
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

      {/* Filtros Avançados */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardContent className="pt-6">
          {/* Busca e Filtros em uma única linha */}
          <div className="flex flex-wrap items-end gap-4">
            {/* Barra de Busca Global com Dropdown */}
            <div className="relative flex-1 min-w-[250px]">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                Busca Rápida
              </label>
              <div className="relative">
                <Input
                  ref={buscaInputRef}
                  type="text"
                  placeholder="Buscar clientes, pedidos, funcionalidades..."
                  value={buscaGlobal}
                  onChange={(e) => {
                    setBuscaGlobal(e.target.value)
                    setMostrarResultados(true)
                  }}
                  onFocus={() => {
                    if (resultadosBusca.length > 0) {
                      setMostrarResultados(true)
                    }
                  }}
                  onBlur={() => {
                    // Delay para permitir clique nos resultados
                    setTimeout(() => setMostrarResultados(false), 200)
                  }}
                  className="w-full border-neutral-300 dark:border-neutral-700 pr-10"
                />
                {buscando && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <RefreshCw className="w-4 h-4 animate-spin text-neutral-400" />
                  </div>
                )}
                {!buscando && buscaGlobal && (
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                )}
                
                {/* Dropdown de Resultados */}
                {mostrarResultados && resultadosBusca.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {resultadosBusca.map((resultado, index) => {
                      const IconComponent = 
                        resultado.tipo === 'cliente' ? Users :
                        resultado.tipo === 'pedido' ? ShoppingCart :
                        resultado.tipo === 'parcelamento' ? CreditCard :
                        resultado.tipo === 'funcionalidade' ? LayoutDashboard :
                        Search
                      
                      return (
                        <button
                          key={`${resultado.tipo}-${resultado.id || resultado.rota}-${index}`}
                          onClick={() => {
                            if (resultado.rota) {
                              navigate(resultado.rota, { 
                                state: resultado.id ? { 
                                  [`${resultado.tipo}Id`]: resultado.id 
                                } : {}
                              })
                            }
                            setBuscaGlobal('')
                            setMostrarResultados(false)
                          }}
                          className="w-full px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-start gap-3 text-left transition-colors border-b border-neutral-200 dark:border-neutral-800 last:border-b-0"
                        >
                          <IconComponent className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutral-900 dark:text-neutral-50 truncate">
                              {resultado.titulo}
                            </p>
                            {resultado.subtitulo && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                                {resultado.subtitulo}
                              </p>
                            )}
                            <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 capitalize">
                              {resultado.tipo}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            {/* Filtro de Unidade - Só aparece se colaborador tem acesso a todas as unidades */}
            {mostrarFiltroUnidade && (
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Unidade
                </label>
                <div className={carregandoUnidades ? 'opacity-50 pointer-events-none' : ''}>
                  <SelectMenu
                    value={filtroUnidade}
                    onChange={(value) => {
                      setFiltroUnidade(value)
                    }}
                    options={[
                      { value: 'tudo', label: 'Tudo' },
                      ...unidades.map(unidade => ({
                        value: unidade.id,
                        label: unidade.nome
                      }))
                    ]}
                  />
                </div>
              </div>
            )}

            {/* Filtro de Período */}
            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Período
              </label>
              <SelectMenu
                value={filtroPeriodo}
                onChange={(value) => {
                  setFiltroPeriodo(value as 'hoje' | 'semana' | 'mes' | 'customizado')
                  if (value !== 'customizado') {
                    setDataInicio(null)
                    setDataFim(null)
                    setDataInicioString('')
                    setDataFimString('')
                  }
                }}
                options={[
                  { value: 'hoje', label: 'Hoje' },
                  { value: 'semana', label: 'Últimos 7 dias' },
                  { value: 'mes', label: 'Últimos 30 dias' },
                  { value: 'customizado', label: 'Personalizado' },
                ]}
              />
            </div>

            {/* Seletor de Data Customizada */}
            {filtroPeriodo === 'customizado' && (
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Período Personalizado
                </label>
                <DateRangePickerCompact
                  value="personalizado"
                  onChange={(value) => {
                    if (value !== 'personalizado') {
                      setFiltroPeriodo(value as 'hoje' | 'semana' | 'mes')
                    }
                  }}
                  dataInicio={dataInicioString}
                  dataFim={dataFimString}
                  onDataInicioChange={(data) => {
                    setDataInicioString(data)
                    if (data) {
                      const [ano, mes, dia] = data.split('-').map(Number)
                      setDataInicio(new Date(ano, mes - 1, dia))
                    } else {
                      setDataInicio(null)
                    }
                  }}
                  onDataFimChange={(data) => {
                    setDataFimString(data)
                    if (data) {
                      const [ano, mes, dia] = data.split('-').map(Number)
                      setDataFim(new Date(ano, mes - 1, dia))
                    } else {
                      setDataFim(null)
                    }
                  }}
                  open={dropdownCalendarioAberto}
                  onOpenChange={setDropdownCalendarioAberto}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid de Cards - Métricas Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Recebidos Hoje */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Recebidos Hoje
            </CardTitle>
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {formatarPreco(metricasFinanceiras.valoresRecebidosHoje)}
            </div>
            {metricasAnteriores.valoresRecebidosHoje > 0 && (
              <p className={`text-xs mt-1 ${metricasFinanceiras.valoresRecebidosHoje >= metricasAnteriores.valoresRecebidosHoje ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Math.abs(((metricasFinanceiras.valoresRecebidosHoje - metricasAnteriores.valoresRecebidosHoje) / metricasAnteriores.valoresRecebidosHoje) * 100).toFixed(1)}% vs dia anterior
              </p>
            )}
          </CardContent>
        </Card>

        {/* Valores Liberados */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Valores Liberados
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {formatarPreco(metricasFinanceiras.valoresLiberados)}
            </div>
            {metricasAnteriores.valoresLiberados > 0 && (
              <p className={`text-xs mt-1 ${metricasFinanceiras.valoresLiberados >= metricasAnteriores.valoresLiberados ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Math.abs(((metricasFinanceiras.valoresLiberados - metricasAnteriores.valoresLiberados) / metricasAnteriores.valoresLiberados) * 100).toFixed(1)}% vs dia anterior
              </p>
            )}
          </CardContent>
        </Card>

        {/* Valores Pendentes */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Valores Pendentes
            </CardTitle>
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {formatarPreco(metricasFinanceiras.valoresPendentes)}
            </div>
            {metricasAnteriores.valoresPendentes > 0 && (
              <p className={`text-xs mt-1 ${metricasFinanceiras.valoresPendentes >= metricasAnteriores.valoresPendentes ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Math.abs(((metricasFinanceiras.valoresPendentes - metricasAnteriores.valoresPendentes) / metricasAnteriores.valoresPendentes) * 100).toFixed(1)}% vs dia anterior
              </p>
            )}
          </CardContent>
        </Card>

        {/* Total de Pedidos */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Total de Pedidos
            </CardTitle>
            <ShoppingCart className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {totalPedidos}
            </div>
            {metricasAnteriores.totalPedidos > 0 && (
              <p className={`text-xs mt-1 ${totalPedidos >= metricasAnteriores.totalPedidos ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Math.abs(((totalPedidos - metricasAnteriores.totalPedidos) / metricasAnteriores.totalPedidos) * 100).toFixed(1)}% vs dia anterior
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Segunda Linha de Métricas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Clientes */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Total de Clientes
            </CardTitle>
            <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {totalClientes}
            </div>
            {metricasAnteriores.totalClientes > 0 && (
              <p className={`text-xs mt-1 ${totalClientes >= metricasAnteriores.totalClientes ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Math.abs(((totalClientes - metricasAnteriores.totalClientes) / metricasAnteriores.totalClientes) * 100).toFixed(1)}% vs dia anterior
              </p>
            )}
          </CardContent>
        </Card>

        {/* Total de Produtos */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Total de Produtos
            </CardTitle>
            <Package className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {totalProdutos}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {produtosAtivos} ativos
            </p>
          </CardContent>
        </Card>

        {/* Parcelamentos Ativos */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Parcelamentos
            </CardTitle>
            <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {parcelamentosAtivos}
            </div>
            {metricasAnteriores.parcelamentosAtivos > 0 && (
              <p className={`text-xs mt-1 ${parcelamentosAtivos >= metricasAnteriores.parcelamentosAtivos ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Math.abs(((parcelamentosAtivos - metricasAnteriores.parcelamentosAtivos) / metricasAnteriores.parcelamentosAtivos) * 100).toFixed(1)}% vs dia anterior
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pedidos Entregues */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Pedidos Entregues
            </CardTitle>
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {pedidosEntregues}
            </div>
            {metricasAnteriores.pedidosEntregues > 0 && (
              <p className={`text-xs mt-1 ${pedidosEntregues >= metricasAnteriores.pedidosEntregues ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Math.abs(((pedidosEntregues - metricasAnteriores.pedidosEntregues) / metricasAnteriores.pedidosEntregues) * 100).toFixed(1)}% vs dia anterior
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Modernos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Receita ao Longo do Tempo */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Receita ao Longo do Tempo</CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosGraficos.receitaTemporal && dadosGraficos.receitaTemporal.length > 0 ? (
              <ChartLineGradient
                data={dadosGraficos.receitaTemporal.map(item => ({
                  month: item.data,
                  receita: item.receita || 0,
                }))}
                config={receitaChartConfig}
                dataKey="receita"
                xAxisDataKey="month"
                className="h-[300px] w-full"
                xAxisFormatter={(value) => value}
                tooltipFormatter={(value) => `R$ ${value.toFixed(2)}`}
                strokeColor="#6366f1"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parcelamentos */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Parcelamentos</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosGraficos.parcelamentos && dadosGraficos.parcelamentos.some(d => d.value > 0) ? (
              <ChartPieLabeled
                data={dadosGraficos.parcelamentos}
                config={parcelamentosChartConfig}
                className="h-[300px] w-full"
                tooltipFormatter={(value) => `${value} parcelamentos`}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Volume de Pedidos Pix Parcelado - Largura Total */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Volume de Pedidos em Pix Parcelado</CardTitle>
          <CardDescription>Últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          {dadosGraficos.volumePixParcelado && dadosGraficos.volumePixParcelado.length > 0 ? (
            <ChartBarGradient
              data={dadosGraficos.volumePixParcelado.map(item => ({
                data: item.data,
                volume: item.volume || 0,
                fill: '#1fecff', // Ciano vibrante
              }))}
              config={volumePixParceladoChartConfig}
              dataKey="volume"
              categoryKey="data"
              className="h-[300px] w-full"
              tooltipFormatter={(value) => `${value} pedidos`}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-500 dark:text-neutral-400">
              <p>Nenhum dado disponível</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}

