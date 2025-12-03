import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Store, 
  Users, 
  TrendingUp,
  UserCheck,
  Mail,
  Ban,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  CreditCard,
  Search
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePickerCompact } from '@/components/ui/date-range-picker-compact'
import { listarClientes } from '@/lib/usuarios'
import { listarRevendas, type RevendaCompleta } from '@/lib/gerenciarRevenda'
import { listarPedidosAdmin } from '@/lib/gerenciarPedidos'
import { calcularMetricasGerais, listarTodasTransacoes } from '@/lib/financeiro'
import { listarParcelamentosAdmin } from '@/lib/gerenciarParcelamentos'
import { formatarPreco } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  ChartConfig,
} from '@/components/ui/chart'
import { ChartLineGradient } from '@/components/charts/ChartLineGradient'
import { ChartPieLabeled } from '@/components/charts/ChartPieLabeled'
import { ChartBarGradient } from '@/components/charts/ChartBarGradient'

interface Estatisticas {
  receitaTotal: number
  totalTransacoes: number
  totalParcelamentos: number
  totalInadimplencias: number
  valorTotalInadimplencia: number
  totalRevendas: number
  totalClientes: number
  repassesASeremFeitos: number
  repassesFinalizados: number
}


export default function AdminDashboard() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date())
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    receitaTotal: 0,
    totalTransacoes: 0,
    totalParcelamentos: 0,
    totalInadimplencias: 0,
    valorTotalInadimplencia: 0,
    totalRevendas: 0,
    totalClientes: 0,
    repassesASeremFeitos: 0,
    repassesFinalizados: 0,
  })
  const [erro, setErro] = useState<string | null>(null)
  const [dadosGraficos, setDadosGraficos] = useState({
    receitaTemporal: [] as Array<{ data: string; receita: number }>,
    distribuicaoModalidade: [] as Array<{ name: string; value: number }>,
    topRevendas: [] as Array<{ id: string; name: string; logo_url: string | null; valor: number; quantidade: number }>,
    tiposParcelamento: [] as Array<{ name: string; value: number }>,
    distribuicaoParcelamentos: [] as Array<{ name: string; value: number; porcentagem: number }>,
  })
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'customizado' | 'tudo'>('tudo')
  const [dataInicio, setDataInicio] = useState<Date | null>(null)
  const [dataFim, setDataFim] = useState<Date | null>(null)
  const [dataInicioString, setDataInicioString] = useState<string>('')
  const [dataFimString, setDataFimString] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)
  const [revendas, setRevendas] = useState<RevendaCompleta[]>([])
  const [buscaGlobal, setBuscaGlobal] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultadosBusca, setResultadosBusca] = useState<Array<{
    tipo: 'cliente' | 'revenda' | 'pedido' | 'parcelamento'
    id: string
    titulo: string
    subtitulo?: string
    rota: string
  }>>([])
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const buscaTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const buscaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    carregarDados()
    
    // Atualização automática a cada 30 segundos
    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        carregarDados(true)
      }
    }, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])


  // Função de busca global - definida antes do useEffect
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
        tipo: 'cliente' | 'revenda' | 'pedido' | 'parcelamento' | 'funcionalidade'
        id?: string
        titulo: string
        subtitulo?: string
        rota: string
      }> = []

      // Busca em funcionalidades/páginas do sistema
      const funcionalidades = [
        { nome: 'Dashboard', rota: '/admin/dashboard', palavras: ['dashboard', 'inicio', 'principal', 'home'] },
        { nome: 'Revendas', rota: '/admin/revendas', palavras: ['revendas', 'revenda', 'lojas', 'loja'] },
        { nome: 'Clientes', rota: '/admin/clientes', palavras: ['clientes', 'cliente', 'usuarios', 'usuario'] },
        { nome: 'Pedidos', rota: '/admin/pedidos', palavras: ['pedidos', 'pedido', 'vendas', 'venda'] },
        { nome: 'Parcelamentos', rota: '/admin/parcelamentos', palavras: ['parcelamentos', 'parcelamento', 'parcelas', 'parcela'] },
        { nome: 'Agendamentos', rota: '/admin/agendamentos', palavras: ['agendamentos', 'agendamento', 'agenda'] },
        { nome: 'Repasses', rota: '/admin/repasses', palavras: ['repasses', 'repasse', 'transferencias', 'transferencia'] },
        { nome: 'Financeiro', rota: '/admin/financeiro', palavras: ['financeiro', 'financeira', 'financas', 'receita', 'taxas'] },
        { nome: 'Inadimplência', rota: '/admin/inadimplencia', palavras: ['inadimplencia', 'inadimplente', 'atrasados', 'atrasado'] },
        { nome: 'Relatórios', rota: '/admin/relatorios', palavras: ['relatorios', 'relatorio', 'relatórios', 'relatório'] },
        { nome: 'Ajuda', rota: '/admin/ajuda', palavras: ['ajuda', 'help', 'suporte', 'faq', 'duvidas'] },
        { nome: 'Administração', rota: '/admin/administracao', palavras: ['administracao', 'admin', 'configuracoes', 'configurações'] },
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

      // Busca em clientes
      try {
        const { clientes } = await listarClientes()
        clientes.forEach(c => {
          if (
            c.email?.toLowerCase().includes(termoLower) ||
            c.nome_completo?.toLowerCase().includes(termoLower) ||
            c.id.toLowerCase().includes(termoLower)
          ) {
            resultados.push({
              tipo: 'cliente',
              id: c.id,
              titulo: c.nome_completo || c.email || 'Cliente sem nome',
              subtitulo: c.email,
              rota: `/admin/clientes`
            })
          }
        })
      } catch (error) {
        console.error('Erro ao buscar clientes:', error)
      }

      // Busca em revendas
      try {
        const { revendas: todasRevendas } = await listarRevendas()
        todasRevendas.forEach(r => {
          if (
            r.nome_revenda?.toLowerCase().includes(termoLower) ||
            r.email?.toLowerCase().includes(termoLower) ||
            r.id.toLowerCase().includes(termoLower)
          ) {
            resultados.push({
              tipo: 'revenda',
              id: r.id,
              titulo: r.nome_revenda || r.email || 'Revenda sem nome',
              subtitulo: r.email,
              rota: `/admin/revendas`
            })
          }
        })
      } catch (error) {
        console.error('Erro ao buscar revendas:', error)
      }

      // Busca em pedidos
      try {
        const { pedidos } = await listarPedidosAdmin()
        pedidos.forEach(p => {
          if (
            p.id.toLowerCase().includes(termoLower) ||
            p.revenda?.nome_revenda?.toLowerCase().includes(termoLower) ||
            p.dados_cliente?.nome?.toLowerCase().includes(termoLower) ||
            p.dados_cliente?.email?.toLowerCase().includes(termoLower)
          ) {
            resultados.push({
              tipo: 'pedido',
              id: p.id,
              titulo: `Pedido #${p.id.slice(0, 8).toUpperCase()}`,
              subtitulo: `${p.dados_cliente?.nome || 'Cliente'} - ${p.revenda?.nome_revenda || 'Revenda'}`,
              rota: `/admin/pedidos`
            })
          }
        })
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error)
      }

      // Busca em parcelamentos
      try {
        const { parcelamentos } = await listarParcelamentosAdmin()
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
              rota: `/admin/parcelamentos`
            })
          }
        })
      } catch (error) {
        console.error('Erro ao buscar parcelamentos:', error)
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
  }, [navigate])

  // Recarregar dados quando filtros mudarem
  useEffect(() => {
    if (!carregando) {
      carregarDados(true)
    }
  }, [filtroPeriodo, dataInicio, dataFim])

  // Busca em tempo real com debounce
  useEffect(() => {
    // Limpa timeout anterior
    if (buscaTimeoutRef.current) {
      clearTimeout(buscaTimeoutRef.current)
    }

    // Se a busca estiver vazia, limpa resultados
    if (!buscaGlobal.trim()) {
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
  }, [buscaGlobal, handleBuscaGlobal])

  // Pausar atualização quando a aba está inativa
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      } else {
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
  }, [])

  const carregarDados = async (silencioso: boolean = false) => {
    try {
      if (!silencioso) {
      setCarregando(true)
      } else {
        setAtualizando(true)
      }
      setErro(null)

      // Carrega todos os dados em paralelo
      const [
        clientesResult,
        revendasResult,
        pedidosResult,
        metricasFinanceirasResult,
        transacoesResult,
        parcelamentosResult
      ] = await Promise.all([
        listarClientes(),
        listarRevendas(),
        listarPedidosAdmin(),
        calcularMetricasGerais(),
        listarTodasTransacoes({}),
        listarParcelamentosAdmin(),
      ])

      // Carregar todas as unidades para contar o total
      let totalUnidades = 0
      if (revendasResult.revendas) {
        const { listarUnidades } = await import('@/lib/gerenciarUnidades')
        const unidadesPromises = revendasResult.revendas.map(revenda => listarUnidades(revenda.id))
        const unidadesResults = await Promise.all(unidadesPromises)
        totalUnidades = unidadesResults.reduce((sum, result) => sum + (result.unidades?.length || 0), 0)
      }

      if (clientesResult.error) {
        console.error('Erro ao carregar clientes:', clientesResult.error)
      }
      if (revendasResult.error) {
        console.error('Erro ao carregar revendas:', revendasResult.error)
      }

      const clientes = clientesResult.clientes || []
      const revendas = revendasResult.revendas || []
      const pedidos = pedidosResult.pedidos || []
      const transacoes = transacoesResult.transacoes || []
      const parcelamentos = parcelamentosResult.parcelamentos || []

      // Buscar logos das revendas se necessário
      const revendasComLogos = await Promise.all(
        revendas.map(async (revenda) => {
          if (!revenda.logo_url) {
            // Buscar logo_url da tabela revendas usando o import estático
            const { supabase: supabaseClient } = await import('@/lib/supabase')
            const { data: revendaData } = await supabaseClient
              .from('revendas')
              .select('logo_url')
              .eq('id', revenda.id)
              .single()
            return {
              ...revenda,
              logo_url: revendaData?.logo_url || null,
            }
          }
          return revenda
        })
      )

      setRevendas(revendasComLogos)

      // Aplicar filtros
      let dataInicioFiltro: Date | null = null
      let dataFimFiltro: Date | null = null
      
      if (filtroPeriodo === 'hoje') {
        dataInicioFiltro = new Date()
        dataFimFiltro = new Date()
        dataInicioFiltro.setHours(0, 0, 0, 0)
        dataFimFiltro.setHours(23, 59, 59, 999)
      } else if (filtroPeriodo === 'semana') {
        dataInicioFiltro = new Date()
        dataFimFiltro = new Date()
        dataInicioFiltro.setDate(dataInicioFiltro.getDate() - 7)
        dataInicioFiltro.setHours(0, 0, 0, 0)
      } else if (filtroPeriodo === 'mes') {
        dataInicioFiltro = new Date()
        dataFimFiltro = new Date()
        dataInicioFiltro.setDate(dataInicioFiltro.getDate() - 30)
        dataInicioFiltro.setHours(0, 0, 0, 0)
      } else if (filtroPeriodo === 'customizado' && dataInicio && dataFim) {
        dataInicioFiltro = dataInicio
        dataFimFiltro = dataFim
      }
      // Se filtroPeriodo === 'tudo', não aplica filtro de data (dataInicioFiltro e dataFimFiltro permanecem null)

      // Filtrar dados por período (se houver filtro aplicado)
      const pedidosFiltrados = dataInicioFiltro && dataFimFiltro
        ? pedidos.filter(p => {
            const dataPedido = new Date(p.criado_em)
            return dataPedido >= dataInicioFiltro! && dataPedido <= dataFimFiltro!
          })
        : pedidos

      const transacoesFiltradas = dataInicioFiltro && dataFimFiltro
        ? transacoes.filter(t => {
            const dataTransacao = new Date(t.data_pagamento || t.criado_em)
            return dataTransacao >= dataInicioFiltro! && dataTransacao <= dataFimFiltro!
          })
        : transacoes

      // Sem filtros de revenda/unidade - mostrar todos os dados
      const pedidosFinais = pedidosFiltrados
      const transacoesFinais = transacoesFiltradas

      // Métricas financeiras (usando dados filtrados)
      const receitaTotal = transacoesFinais.reduce((sum, t) => {
        const taxaPercentualValor = ((t.valor_bruto || 0) * (t.taxa_percentual || 0)) / 100
        return sum + taxaPercentualValor + (t.taxa_fixa || 0)
      }, 0)
      const totalTransacoes = transacoesFinais.length
      const repassesASeremFeitos = transacoesFinais.filter(t => t.status === 'liberado').length
      const repassesFinalizados = transacoesFinais.filter(t => t.status === 'repassado').length

      // Parcelamentos (filtrar apenas por período)
      const parcelamentosFiltrados = dataInicioFiltro && dataFimFiltro
        ? parcelamentos.filter(p => {
            const dataParcelamento = new Date(p.criado_em || p.pedido?.criado_em || '')
            return dataParcelamento >= dataInicioFiltro! && dataParcelamento <= dataFimFiltro!
          })
        : parcelamentos
      const totalParcelamentos = parcelamentosFiltrados.length

      // Calcular inadimplências (clientes únicos com parcelas atrasadas) e valor total
      const { supabase } = await import('@/lib/supabase')
      let totalInadimplencias = 0
      let valorTotalInadimplencia = 0
      try {
        const { data: parcelasAtrasadas } = await supabase
          .from('parcelas')
          .select(`
            id,
            valor,
            parcelamento_id,
            parcelamentos!inner(
              pedido_id,
              pedidos!inner(
                cliente_id
              )
            )
          `)
          .eq('status', 'atrasada')
        
        const clientesInadimplentesSet = new Set(
          parcelasAtrasadas?.map((p: any) => p.parcelamentos?.pedidos?.cliente_id).filter(Boolean) || []
        )
        totalInadimplencias = clientesInadimplentesSet.size
        
        // Calcular valor total em inadimplência
        valorTotalInadimplencia = parcelasAtrasadas?.reduce((sum, p: any) => {
          const valor = typeof p.valor === 'string' ? parseFloat(p.valor) : (p.valor || 0)
          return sum + valor
        }, 0) || 0
      } catch (error) {
        console.error('Erro ao calcular inadimplências:', error)
      }

      setEstatisticas({
        receitaTotal,
        totalTransacoes,
        totalParcelamentos,
        totalInadimplencias,
        valorTotalInadimplencia,
        totalRevendas: revendas.length,
        totalClientes: clientes.length,
        repassesASeremFeitos,
        repassesFinalizados,
      })

      // Preparar dados para gráficos (usando dados filtrados)
      await prepararDadosGraficos(transacoesFinais, pedidosFinais, revendasComLogos, parcelamentosFiltrados)


      setUltimaAtualizacao(new Date())
      setCarregando(false)
      setAtualizando(false)
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
      setErro('Erro ao carregar dados do dashboard')
      setCarregando(false)
      setAtualizando(false)
    }
  }

  const prepararDadosGraficos = async (
    transacoes: any[],
    pedidos: any[],
    revendas: RevendaCompleta[],
    parcelamentos: any[]
  ) => {
    // Receita ao longo do tempo (últimos 7 dias)
    const receitaTemporal: Array<{ data: string; receita: number }> = []
    for (let i = 6; i >= 0; i--) {
      const data = new Date()
      data.setDate(data.getDate() - i)
      data.setHours(0, 0, 0, 0)
      const dataStr = data.toISOString().split('T')[0]
      
      const receitaDia = transacoes
        .filter(t => {
          const dataPagamento = new Date(t.data_pagamento).toISOString().split('T')[0]
          return dataPagamento === dataStr
        })
        .reduce((sum, t) => {
          const taxaPercentualValor = ((t.valor_bruto || 0) * (t.taxa_percentual || 0)) / 100
          return sum + taxaPercentualValor + (t.taxa_fixa || 0)
        }, 0)
      
      receitaTemporal.push({
        data: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        receita: Math.round(receitaDia * 100) / 100,
      })
    }

    // Distribuição por modalidade
    const distribuicaoModalidade = [
      {
        name: 'D+1',
        value: transacoes.filter(t => t.modalidade === 'D+1').length,
      },
      {
        name: 'D+15',
        value: transacoes.filter(t => t.modalidade === 'D+15').length,
      },
      {
        name: 'D+30',
        value: transacoes.filter(t => t.modalidade === 'D+30').length,
      },
    ]

    // Top revendas por volume
    const revendasPorVolume = new Map<string, { valor: number; quantidade: number }>()
    transacoes.forEach(t => {
      const revendaId = t.revenda_id
      const revendaNome = t.revenda?.nome_revenda || revendaId || 'Desconhecida'
      const existing = revendasPorVolume.get(revendaId) || { valor: 0, quantidade: 0 }
      existing.valor += t.valor_liquido || 0
      existing.quantidade++
      revendasPorVolume.set(revendaId, existing)
    })

    const topRevendas = Array.from(revendasPorVolume.entries())
      .map(([id, dados]) => {
        const revenda = revendas.find(r => r.id === id)
        return {
          id: id,
          name: revenda?.nome_revenda || id.slice(0, 8),
          logo_url: revenda?.logo_url || null,
          valor: Math.round(dados.valor * 100) / 100,
          quantidade: dados.quantidade,
        }
      })
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)

    // Distribuição de Tipos de Parcelamento (Pix à vista, Pix 2x, Pix 3x)
    const tiposParcelamento = [
      {
        name: 'Pix à Vista',
        value: pedidos.filter(p => p.forma_pagamento === 'pix_vista' || (p.forma_pagamento === 'pix_parcelado' && (!p.parcelas_total || p.parcelas_total === 1))).length,
      },
      {
        name: 'Pix 2x',
        value: pedidos.filter(p => p.forma_pagamento === 'pix_parcelado' && p.parcelas_total === 2).length,
      },
      {
        name: 'Pix 3x',
        value: pedidos.filter(p => p.forma_pagamento === 'pix_parcelado' && p.parcelas_total === 3).length,
      },
    ].filter(item => item.value > 0)

    // Distribuição de Parcelamentos (% da base em aberto, quitados, inadimplência)
    const { supabase } = await import('@/lib/supabase')
    let parcelamentosEmAberto = 0
    let parcelamentosQuitados = 0
    let parcelamentosInadimplentes = 0
    
    try {
      // Contar parcelamentos por status
      parcelamentosEmAberto = parcelamentos.filter(p => p.status === 'ativo').length
      parcelamentosQuitados = parcelamentos.filter(p => p.status === 'quitado').length
      
      // Contar parcelamentos com parcelas atrasadas (inadimplentes)
      const parcelamentosIds = parcelamentos.map(p => p.id)
      if (parcelamentosIds.length > 0) {
        const { data: parcelasAtrasadas } = await supabase
          .from('parcelas')
          .select('parcelamento_id')
          .in('parcelamento_id', parcelamentosIds)
          .eq('status', 'atrasada')
        
        const parcelamentosComAtraso = new Set(
          parcelasAtrasadas?.map((p: any) => p.parcelamento_id).filter(Boolean) || []
        )
        parcelamentosInadimplentes = parcelamentosComAtraso.size
      }
    } catch (error) {
      console.error('Erro ao calcular distribuição de parcelamentos:', error)
    }

    const totalParcelamentos = parcelamentosEmAberto + parcelamentosQuitados + parcelamentosInadimplentes
    const distribuicaoParcelamentos = [
      {
        name: 'Em Aberto',
        value: parcelamentosEmAberto,
        porcentagem: totalParcelamentos > 0 ? Math.round((parcelamentosEmAberto / totalParcelamentos) * 100 * 100) / 100 : 0,
      },
      {
        name: 'Quitados',
        value: parcelamentosQuitados,
        porcentagem: totalParcelamentos > 0 ? Math.round((parcelamentosQuitados / totalParcelamentos) * 100 * 100) / 100 : 0,
      },
      {
        name: 'Inadimplência',
        value: parcelamentosInadimplentes,
        porcentagem: totalParcelamentos > 0 ? Math.round((parcelamentosInadimplentes / totalParcelamentos) * 100 * 100) / 100 : 0,
      },
    ].filter(item => item.value > 0)

    setDadosGraficos({
      receitaTemporal,
      distribuicaoModalidade,
      topRevendas,
      tiposParcelamento,
      distribuicaoParcelamentos,
    })
  }


  // Configuração dos gráficos com cores vibrantes estilo React Native Chart Kit
  const receitaChartConfig = {
    receita: {
      label: 'Receita',
      color: '#6366f1', // Indigo vibrante
    },
  } satisfies ChartConfig

  const modalidadeChartConfig = {
    'D+1': {
      label: 'D+1',
      color: '#8b5cf6', // Violeta
    },
    'D+15': {
      label: 'D+15',
      color: '#a78bfa', // Violeta claro
    },
    'D+30': {
      label: 'D+30',
      color: '#9333ea', // Roxo
    },
  } satisfies ChartConfig

  const tiposParcelamentoChartConfig = {
    'Pix à Vista': {
      label: 'Pix à Vista',
      color: '#10b981', // Verde
    },
    'Pix 2x': {
      label: 'Pix 2x',
      color: '#3b82f6', // Azul
    },
    'Pix 3x': {
      label: 'Pix 3x',
      color: '#8b5cf6', // Violeta
    },
  } satisfies ChartConfig

  const distribuicaoParcelamentosChartConfig = {
    'Em Aberto': {
      label: 'Em Aberto',
      color: '#3b82f6', // Azul
    },
    'Quitados': {
      label: 'Quitados',
      color: '#10b981', // Verde
    },
    'Inadimplência': {
      label: 'Inadimplência',
      color: '#ef4444', // Vermelho
    },
  } satisfies ChartConfig



  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2 mb-2">
          <LayoutDashboard className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          Dashboard Admin
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Visão geral do sistema Pixy Pay
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

      {erro && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
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
                  placeholder="Buscar clientes, revendas, pedidos, funcionalidades..."
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
                        resultado.tipo === 'revenda' ? Store :
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
            {/* Filtro de Período */}
            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Período
              </label>
              <SelectMenu
                value={filtroPeriodo}
                onChange={(value) => {
                  setFiltroPeriodo(value as 'hoje' | 'semana' | 'mes' | 'customizado' | 'tudo')
                  if (value !== 'customizado') {
                    setDataInicio(null)
                    setDataFim(null)
                    setDataInicioString('')
                    setDataFimString('')
                  }
                }}
                options={[
                  { value: 'tudo', label: 'Todo o momento' },
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

      {/* Cards de Estatísticas Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Receita Total */}
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm hover:border-green-300 dark:hover:border-green-700 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Receita Total
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {formatarPreco(estatisticas.receitaTotal)}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Total de taxas cobradas
            </p>
          </CardContent>
        </Card>

        {/* Transações */}
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Transações
            </CardTitle>
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {estatisticas.totalTransacoes}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Total de transações financeiras
            </p>
          </CardContent>
        </Card>

        {/* Parcelamentos */}
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Parcelamentos
            </CardTitle>
            <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {estatisticas.totalParcelamentos}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Total de parcelamentos
            </p>
          </CardContent>
        </Card>

        {/* Inadimplências */}
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm hover:border-red-300 dark:hover:border-red-700 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Inadimplências
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <span>{estatisticas.totalInadimplencias}</span>
              <span className="text-lg text-neutral-500 dark:text-neutral-400">({formatarPreco(estatisticas.valorTotalInadimplencia)})</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Clientes com parcelas atrasadas
            </p>
          </CardContent>
        </Card>

        {/* Total de Revendas */}
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Total de Revendas
            </CardTitle>
            <Store className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {estatisticas.totalRevendas}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Revendas cadastradas
            </p>
          </CardContent>
        </Card>

        {/* Total de Clientes */}
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Total de Clientes
            </CardTitle>
            <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {estatisticas.totalClientes}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>

        {/* Repasses a serem feitos */}
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Repasses a serem feitos
            </CardTitle>
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {estatisticas.repassesASeremFeitos}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Transações liberadas
            </p>
          </CardContent>
        </Card>

        {/* Repasses finalizados */}
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm hover:border-green-300 dark:hover:border-green-700 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Repasses finalizados
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {estatisticas.repassesFinalizados}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Transações repassadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Modernos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Receita ao Longo do Tempo */}
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
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

        {/* Distribuição por Modalidade */}
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribuição por Modalidade</CardTitle>
            <CardDescription>Transações por modalidade de repasse</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosGraficos.distribuicaoModalidade.some(d => d.value > 0) ? (
              <ChartBarGradient
                data={dadosGraficos.distribuicaoModalidade.map(item => ({
                  modalidade: item.name,
                  quantidade: item.value,
                  fill: modalidadeChartConfig[item.name as keyof typeof modalidadeChartConfig]?.color || '#8b5cf6',
                }))}
                config={modalidadeChartConfig}
                dataKey="quantidade"
                categoryKey="modalidade"
                className="h-[300px] w-full"
                tooltipFormatter={(value) => `${value} transações`}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                <p>Nenhum dado disponível</p>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Top Revendas por Volume */}
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Revendas por Volume</CardTitle>
            <CardDescription>Top 5 revendas por valor repassado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {dadosGraficos.topRevendas.map((revenda, index) => (
                <Card
                  key={revenda.id}
                  className="border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 hover:shadow-lg transition-all duration-200"
                >
                  <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                    {/* Logo */}
                    <div className="w-16 h-16 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center overflow-hidden border-2 border-neutral-300 dark:border-neutral-600 relative">
                      {revenda.logo_url ? (
                        <img
                          src={revenda.logo_url}
                          alt={revenda.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent && !parent.querySelector('.logo-fallback')) {
                              const fallback = document.createElement('div')
                              fallback.className = 'logo-fallback w-full h-full flex items-center justify-center'
                              const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
                              icon.setAttribute('class', 'w-8 h-8 text-neutral-400 dark:text-neutral-500')
                              icon.setAttribute('fill', 'none')
                              icon.setAttribute('stroke', 'currentColor')
                              icon.setAttribute('viewBox', '0 0 24 24')
                              const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
                              path.setAttribute('stroke-linecap', 'round')
                              path.setAttribute('stroke-linejoin', 'round')
                              path.setAttribute('stroke-width', '2')
                              path.setAttribute('d', 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4')
                              icon.appendChild(path)
                              fallback.appendChild(icon)
                              parent.appendChild(fallback)
                            }
                          }}
                        />
                      ) : null}
                      {!revenda.logo_url && (
                        <Store className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                      )}
                    </div>
                    
                    {/* Nome */}
                    <div className="w-full">
                      <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-50 truncate">
                        {revenda.name}
                      </p>
                    </div>
                    
                    {/* Valor */}
                    <div className="w-full">
                      <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                        {formatarPreco(revenda.valor)}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {revenda.quantidade} {revenda.quantidade === 1 ? 'transação' : 'transações'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Cards vazios/mockup para completar até 5 */}
              {Array.from({ length: Math.max(0, 5 - dadosGraficos.topRevendas.length) }).map((_, index) => (
                <Card
                  key={`empty-${index}`}
                  className="border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 opacity-50"
                >
                  <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                    {/* Logo Mockup */}
                    <div className="w-16 h-16 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-600">
                      <Store className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                    </div>
                    
                    {/* Nome Mockup */}
                    <div className="w-full">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mx-auto"></div>
                    </div>
                    
                    {/* Valor Mockup */}
                    <div className="w-full">
                      <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 mx-auto mb-2"></div>
                      <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mx-auto"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Novos Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribuição de Tipos de Parcelamento */}
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribuição de Tipos de Compra</CardTitle>
            <CardDescription>Pix à vista, Pix 2x e Pix 3x</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosGraficos.tiposParcelamento.length > 0 ? (
              <ChartBarGradient
                data={dadosGraficos.tiposParcelamento.map(item => ({
                  tipo: item.name,
                  quantidade: item.value,
                  fill: tiposParcelamentoChartConfig[item.name as keyof typeof tiposParcelamentoChartConfig]?.color || '#8b5cf6',
                }))}
                config={tiposParcelamentoChartConfig}
                dataKey="quantidade"
                categoryKey="tipo"
                className="h-[300px] w-full"
                tooltipFormatter={(value) => `${value} compras`}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de Parcelamentos */}
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribuição de Parcelamentos</CardTitle>
            <CardDescription>% da base em aberto, quitados e inadimplência</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosGraficos.distribuicaoParcelamentos.length > 0 ? (
              <ChartPieLabeled
                data={dadosGraficos.distribuicaoParcelamentos.map(item => ({
                  name: item.name,
                  value: item.value, // Usar o valor absoluto, não a porcentagem
                  fill: distribuicaoParcelamentosChartConfig[item.name as keyof typeof distribuicaoParcelamentosChartConfig]?.color || '#8b5cf6',
                }))}
                config={distribuicaoParcelamentosChartConfig}
                className="h-[300px] w-full"
                tooltipFormatter={(value) => {
                  const item = dadosGraficos.distribuicaoParcelamentos.find(d => d.value === value)
                  return item ? `${item.porcentagem.toFixed(2)}% (${item.value} parcelamentos)` : `${value}`
                }}
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
