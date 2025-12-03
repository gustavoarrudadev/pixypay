import { useState, useEffect, useMemo } from 'react'
import { 
  AlertCircle, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Search,
  Store,
  Phone,
  Mail,
  Eye,
  Clock,
  ChevronRight,
  LayoutGrid,
  List,
  ArrowLeft
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { DateRangePickerCompact } from '@/components/ui/date-range-picker-compact'
import { Dropdown } from '@/components/ui/dropdown'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { listarInadimplenciasAdmin } from '@/lib/gerenciarParcelamentos'
import { formatarPreco } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { FiltrosRevendaUnidade } from '@/components/admin/FiltrosRevendaUnidade'
import { FiltrosAvancados } from '@/components/admin/FiltrosAvancados'

interface Inadimplencia {
  cliente_id: string
  cliente: {
    id: string
    nome_completo: string | null
    email: string
    telefone: string | null
    cpf: string | null
  }
  pedido_id: string
  pedido: {
    id: string
    valor_total: number
    criado_em: string
    revenda: {
      id: string
      nome_revenda: string
    }
  }
  parcelamento_id: string
  parcelasAtrasadas: Array<{
    id: string
    numero_parcela: number
    valor: number
    data_vencimento: string
    status: string
  }>
  totalAtrasado: number
}

export default function InadimplenciaAdmin() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(false)
  const [carregandoDashboard, setCarregandoDashboard] = useState(false)
  const [inadimplencias, setInadimplencias] = useState<Inadimplencia[]>([])
  const [inadimplenciasTodos, setInadimplenciasTodos] = useState<Inadimplencia[]>([])
  const [revendaSelecionada, setRevendaSelecionada] = useState<string | null>(null)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string | null>(null)
  const [metricasAnteriores, setMetricasAnteriores] = useState({
    totalClientesInadimplentes: 0,
    totalPedidosInadimplentes: 0,
    totalParcelasAtrasadas: 0,
    valorTotalAtrasado: 0,
  })
  const [erro, setErro] = useState<string | null>(null)
  const [sheetDetalhesAberto, setSheetDetalhesAberto] = useState(false)
  const [inadimplenciaSelecionada, setInadimplenciaSelecionada] = useState<Inadimplencia | null>(null)

  // Filtros avançados
  const [busca, setBusca] = useState('')
  const [dataFiltro, setDataFiltro] = useState<'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'>('tudo')
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('')
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid')

  useEffect(() => {
    if (revendaSelecionada) {
      carregarDados()
    } else {
      carregarDadosDashboard()
    }
  }, [revendaSelecionada, unidadeSelecionada])

  const carregarDadosDashboard = async () => {
    setCarregandoDashboard(true)
    setErro(null)
    try {
      const inadimplenciasResult = await listarInadimplenciasAdmin()
      if (inadimplenciasResult.error) {
        console.error('❌ Erro ao carregar inadimplências:', inadimplenciasResult.error)
        setErro('Erro ao carregar inadimplências')
        setInadimplenciasTodos([])
      } else {
        setInadimplenciasTodos(inadimplenciasResult.inadimplencias || [])
        
        // Calcular métricas anteriores (dia anterior) filtrando por data do pedido
        const hoje = new Date()
        const ontem = new Date(hoje)
        ontem.setDate(ontem.getDate() - 1)
        ontem.setHours(0, 0, 0, 0)
        const fimOntem = new Date(ontem)
        fimOntem.setHours(23, 59, 59, 999)
        
        const inadimplenciasOntem = (inadimplenciasResult.inadimplencias || []).filter(i => {
          const dataPedido = new Date(i.pedido.criado_em)
          return dataPedido >= ontem && dataPedido <= fimOntem
        })
        
        const totalClientesOntem = new Set(inadimplenciasOntem.map(i => i.cliente_id)).size
        
        setMetricasAnteriores({
          totalClientesInadimplentes: totalClientesOntem,
          totalPedidosInadimplentes: inadimplenciasOntem.length,
          totalParcelasAtrasadas: inadimplenciasOntem.reduce((sum, i) => sum + i.parcelasAtrasadas.length, 0),
          valorTotalAtrasado: inadimplenciasOntem.reduce((sum, i) => sum + i.totalAtrasado, 0),
        })
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar dados:', error)
      setErro('Erro inesperado ao carregar dados')
      setInadimplenciasTodos([])
    } finally {
      setCarregandoDashboard(false)
      setCarregando(false)
    }
  }

  const carregarDados = async () => {
    if (!revendaSelecionada) {
      setInadimplencias([])
      setCarregando(false)
      return
    }

    setCarregando(true)
    setErro(null)
    try {
      const inadimplenciasResult = await listarInadimplenciasAdmin(revendaSelecionada, unidadeSelecionada || undefined)

      if (inadimplenciasResult.error) {
        console.error('❌ Erro ao carregar inadimplências:', inadimplenciasResult.error)
        setErro('Erro ao carregar inadimplências')
        setInadimplencias([])
      } else {
        setInadimplencias(inadimplenciasResult.inadimplencias || [])
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar dados:', error)
      setErro('Erro inesperado ao carregar dados')
      setInadimplencias([])
    } finally {
      setCarregando(false)
    }
  }

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

  const limparFiltros = () => {
    setBusca('')
    setDataFiltro('tudo')
    setDataInicioPersonalizada('')
    setDataFimPersonalizada('')
    setDropdownCalendarioAberto(false)
  }

  // Cálculo de métricas para revenda selecionada
  const metricas = useMemo(() => {
    const totalClientesInadimplentes = new Set(inadimplencias.map(i => i.cliente_id)).size
    const totalPedidosInadimplentes = inadimplencias.length
    const totalParcelasAtrasadas = inadimplencias.reduce((sum, i) => sum + i.parcelasAtrasadas.length, 0)
    const valorTotalAtrasado = inadimplencias.reduce((sum, i) => sum + i.totalAtrasado, 0)
    const mediaParcelasPorCliente = totalClientesInadimplentes > 0 
      ? (totalParcelasAtrasadas / totalClientesInadimplentes).toFixed(1)
      : '0'
    const mediaValorPorCliente = totalClientesInadimplentes > 0
      ? valorTotalAtrasado / totalClientesInadimplentes
      : 0
    
    // Calcular média de tempo atrasado (em dias)
    let totalDiasAtraso = 0
    let totalParcelasComAtraso = 0
    inadimplencias.forEach(i => {
      i.parcelasAtrasadas.forEach(parcela => {
        const dataVencimento = new Date(parcela.data_vencimento)
        const hoje = new Date()
        const diasAtraso = Math.floor((hoje.getTime() - dataVencimento.getTime()) / (1000 * 60 * 60 * 24))
        if (diasAtraso > 0) {
          totalDiasAtraso += diasAtraso
          totalParcelasComAtraso++
        }
      })
    })
    const mediaTempoAtrasado = totalParcelasComAtraso > 0 
      ? (totalDiasAtraso / totalParcelasComAtraso).toFixed(1)
      : '0'

    // Distribuição por revenda
    const porRevenda = new Map<string, number>()
    inadimplencias.forEach(i => {
      const revendaNome = i.pedido.revenda.nome_publico || i.pedido.revenda.nome_revenda
      const unidadeNome = i.pedido.unidade ? ` - ${i.pedido.unidade.nome_publico || i.pedido.unidade.nome}` : ''
      const nomeCompleto = revendaNome + unidadeNome
      const count = porRevenda.get(revendaNome) || 0
      porRevenda.set(revendaNome, count + 1)
    })

    // Distribuição por faixa de valor
    const faixas = {
      'Até R$ 100': 0,
      'R$ 100 - R$ 500': 0,
      'R$ 500 - R$ 1.000': 0,
      'Acima de R$ 1.000': 0,
    }

    inadimplencias.forEach(i => {
      const valor = i.totalAtrasado
      if (valor <= 100) faixas['Até R$ 100']++
      else if (valor <= 500) faixas['R$ 100 - R$ 500']++
      else if (valor <= 1000) faixas['R$ 500 - R$ 1.000']++
      else faixas['Acima de R$ 1.000']++
    })

    return {
      totalClientesInadimplentes,
      totalPedidosInadimplentes,
      totalParcelasAtrasadas,
      valorTotalAtrasado,
      mediaParcelasPorCliente,
      mediaValorPorCliente,
      mediaTempoAtrasado,
      porRevenda: Array.from(porRevenda.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
      faixas,
    }
  }, [inadimplencias])

  // Cálculo de métricas para dashboard (todas as revendas)
  const metricasDashboard = useMemo(() => {
    const totalClientesInadimplentes = new Set(inadimplenciasTodos.map(i => i.cliente_id)).size
    const totalPedidosInadimplentes = inadimplenciasTodos.length
    const totalParcelasAtrasadas = inadimplenciasTodos.reduce((sum, i) => sum + i.parcelasAtrasadas.length, 0)
    const valorTotalAtrasado = inadimplenciasTodos.reduce((sum, i) => sum + i.totalAtrasado, 0)

    // Distribuição por revenda
    const porRevenda = new Map<string, number>()
    inadimplenciasTodos.forEach(i => {
      const revendaNome = i.pedido.revenda.nome_publico || i.pedido.revenda.nome_revenda
      const unidadeNome = i.pedido.unidade ? ` - ${i.pedido.unidade.nome_publico || i.pedido.unidade.nome}` : ''
      const nomeCompleto = revendaNome + unidadeNome
      const count = porRevenda.get(revendaNome) || 0
      porRevenda.set(revendaNome, count + 1)
    })

    // Calcular média de tempo atrasado (em dias) para dashboard
    let totalDiasAtraso = 0
    let totalParcelasComAtraso = 0
    inadimplenciasTodos.forEach(i => {
      i.parcelasAtrasadas.forEach(parcela => {
        const dataVencimento = new Date(parcela.data_vencimento)
        const hoje = new Date()
        const diasAtraso = Math.floor((hoje.getTime() - dataVencimento.getTime()) / (1000 * 60 * 60 * 24))
        if (diasAtraso > 0) {
          totalDiasAtraso += diasAtraso
          totalParcelasComAtraso++
        }
      })
    })
    const mediaTempoAtrasado = totalParcelasComAtraso > 0 
      ? (totalDiasAtraso / totalParcelasComAtraso).toFixed(1)
      : '0'
    
    return {
      totalClientesInadimplentes,
      totalPedidosInadimplentes,
      totalParcelasAtrasadas,
      valorTotalAtrasado,
      mediaTempoAtrasado,
      porRevenda: Array.from(porRevenda.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
    }
  }, [inadimplenciasTodos])

  // Filtragem das inadimplências
  const inadimplenciasFiltradas = useMemo(() => {
    if (!inadimplencias || inadimplencias.length === 0) return []
    let filtrados = [...inadimplencias]

    // Filtro de busca
    if (busca) {
      const buscaLower = busca.toLowerCase()
      filtrados = filtrados.filter(inadimplencia => {
        const clienteNome = inadimplencia.cliente.nome_completo?.toLowerCase() || ''
        const clienteEmail = inadimplencia.cliente.email?.toLowerCase() || ''
        const clienteTelefone = inadimplencia.cliente.telefone?.toLowerCase() || ''
        const pedidoId = inadimplencia.pedido_id?.toLowerCase() || ''
        const revendaNome = (inadimplencia.pedido.revenda.nome_publico || inadimplencia.pedido.revenda.nome_revenda)?.toLowerCase() || ''
        const unidadeNome = inadimplencia.pedido.unidade ? (inadimplencia.pedido.unidade.nome_publico || inadimplencia.pedido.unidade.nome)?.toLowerCase() || '' : ''
        const nomeCompleto = revendaNome + (unidadeNome ? ' ' + unidadeNome : '')
        return (
          clienteNome.includes(buscaLower) ||
          clienteEmail.includes(buscaLower) ||
          clienteTelefone.includes(buscaLower) ||
          pedidoId.includes(buscaLower) ||
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

      filtrados = filtrados.filter(inadimplencia => {
        const dataPedido = new Date(inadimplencia.pedido.criado_em)
        return dataPedido >= dataInicio && dataPedido <= dataFim
      })
    }

    return filtrados
  }, [inadimplencias, busca, dataFiltro, dataInicioPersonalizada, dataFimPersonalizada])

  const abrirDetalhes = (inadimplencia: Inadimplencia) => {
    setInadimplenciaSelecionada(inadimplencia)
    setSheetDetalhesAberto(true)
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
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            Inadimplência
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {revendaSelecionada 
              ? `Inadimplências da revenda selecionada (${inadimplencias.length} ${inadimplencias.length === 1 ? 'inadimplência' : 'inadimplências'})`
              : 'Gerencie e monitore clientes inadimplentes e parcelas atrasadas de todas as revendas'}
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
          {revendaSelecionada && inadimplencias.length > 0 && (
            <div className="flex items-center gap-2 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1 bg-neutral-50 dark:bg-neutral-900">
              <Button
                variant={visualizacao === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVisualizacao('grid')}
                className={`h-8 px-3 ${
                  visualizacao === 'grid'
                    ? 'bg-violet-600 hover:bg-violet-700 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={visualizacao === 'lista' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVisualizacao('lista')}
                className={`h-8 px-3 ${
                  visualizacao === 'lista'
                    ? 'bg-violet-600 hover:bg-violet-700 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
                }`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Seletor de Revenda */}
      <FiltrosRevendaUnidade
        revendaSelecionada={revendaSelecionada}
        unidadeSelecionada={unidadeSelecionada}
        onRevendaSelecionada={setRevendaSelecionada}
        onUnidadeSelecionada={setUnidadeSelecionada}
        obrigatorio={false}
      />

      {erro && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        </div>
      )}

      {/* Métricas Gerais - Sempre visíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Clientes Inadimplentes</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {revendaSelecionada ? metricas.totalClientesInadimplentes : metricasDashboard.totalClientesInadimplentes}
                </p>
                {(() => {
                  const atual = revendaSelecionada ? metricas.totalClientesInadimplentes : metricasDashboard.totalClientesInadimplentes
                  const anterior = metricasAnteriores.totalClientesInadimplentes
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
              <Users className="w-8 h-8 text-red-600 dark:text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Pedidos Inadimplentes</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {revendaSelecionada ? metricas.totalPedidosInadimplentes : metricasDashboard.totalPedidosInadimplentes}
                </p>
                {(() => {
                  const atual = revendaSelecionada ? metricas.totalPedidosInadimplentes : metricasDashboard.totalPedidosInadimplentes
                  const anterior = metricasAnteriores.totalPedidosInadimplentes
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
              <ShoppingCart className="w-8 h-8 text-orange-600 dark:text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Parcelas Atrasadas</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {revendaSelecionada ? metricas.totalParcelasAtrasadas : metricasDashboard.totalParcelasAtrasadas}
                </p>
                {(() => {
                  const atual = revendaSelecionada ? metricas.totalParcelasAtrasadas : metricasDashboard.totalParcelasAtrasadas
                  const anterior = metricasAnteriores.totalParcelasAtrasadas
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
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Valor Total Atrasado</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatarPreco(revendaSelecionada ? metricas.valorTotalAtrasado : metricasDashboard.valorTotalAtrasado)}
                </p>
                {(() => {
                  const atual = revendaSelecionada ? metricas.valorTotalAtrasado : metricasDashboard.valorTotalAtrasado
                  const anterior = metricasAnteriores.valorTotalAtrasado
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
              <DollarSign className="w-8 h-8 text-red-600 dark:text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard quando não há revenda selecionada */}
      {!revendaSelecionada ? (
        <>

          {/* Top Revendas e Média de Tempo Atrasado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  Top Revendas por Inadimplências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metricasDashboard.porRevenda.length === 0 ? (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                      Nenhuma inadimplência encontrada
                    </p>
                  ) : (
                    metricasDashboard.porRevenda.map(([nome, quantidade], index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                            #{index + 1}
                          </span>
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {nome}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                            {quantidade} inadimplência(s)
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  Média de Tempo Atrasado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-4xl font-bold text-violet-600 dark:text-violet-400 mb-2">
                    {metricasDashboard.mediaTempoAtrasado}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    dias em média
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

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
                    Use o seletor acima para filtrar por revenda específica e visualizar inadimplências detalhadas, parcelas atrasadas e histórico completo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Filtros Simplificados */}
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
            placeholderBusca="Cliente, pedido, loja..."
            onLimparFiltros={limparFiltros}
          />

          {/* Lista de Inadimplências */}
          {inadimplenciasFiltradas.length === 0 ? (
            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                  {inadimplencias.length === 0
                    ? 'Nenhuma inadimplência encontrada'
                    : 'Nenhuma inadimplência corresponde aos filtros aplicados'}
                </p>
              </CardContent>
            </Card>
          ) : visualizacao === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inadimplenciasFiltradas.map((inadimplencia) => (
                <Card
                  key={`${inadimplencia.cliente_id}_${inadimplencia.pedido_id}`}
                  className="border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                            {inadimplencia.cliente.nome_completo || 'Cliente sem nome'}
                          </h3>
                          {inadimplencia.cliente.email && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 truncate">
                              {inadimplencia.cliente.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500 dark:text-neutral-500">Loja</span>
                          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-50 flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            {inadimplencia.pedido.revenda.nome_publico || inadimplencia.pedido.revenda.nome_revenda}
                            {inadimplencia.pedido.unidade && ` - ${inadimplencia.pedido.unidade.nome_publico || inadimplencia.pedido.unidade.nome}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500 dark:text-neutral-500">Pedido</span>
                          <span className="text-xs font-medium text-neutral-900 dark:text-neutral-50 flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" />
                            #{inadimplencia.pedido_id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500 dark:text-neutral-500">Total Atrasado</span>
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">
                            {formatarPreco(inadimplencia.totalAtrasado)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500 dark:text-neutral-500">Parcelas</span>
                          <span className="text-xs text-red-600 dark:text-red-400">
                            {inadimplencia.parcelasAtrasadas.length} atrasada{inadimplencia.parcelasAtrasadas.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-red-200 dark:border-red-800">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirDetalhes(inadimplencia)}
                          className="w-full border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {inadimplenciasFiltradas.map((inadimplencia) => (
                <Card
                  key={`${inadimplencia.cliente_id}_${inadimplencia.pedido_id}`}
                  className="border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                              {inadimplencia.cliente.nome_completo || 'Cliente sem nome'}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              {inadimplencia.cliente.email && (
                                <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                                  <Mail className="w-4 h-4" />
                                  {inadimplencia.cliente.email}
                                </div>
                              )}
                              {inadimplencia.cliente.telefone && (
                                <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                                  <Phone className="w-4 h-4" />
                                  {inadimplencia.cliente.telefone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Loja</p>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 flex items-center gap-1">
                              <Store className="w-4 h-4" />
                              {inadimplencia.pedido.revenda.nome_publico || inadimplencia.pedido.revenda.nome_revenda}
                            {inadimplencia.pedido.unidade && ` - ${inadimplencia.pedido.unidade.nome_publico || inadimplencia.pedido.unidade.nome}`}
                            </p>
                          </div>
                          <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Pedido</p>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 flex items-center gap-1">
                              <ShoppingCart className="w-4 h-4" />
                              #{inadimplencia.pedido_id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                              {formatarData(inadimplencia.pedido.criado_em)}
                            </p>
                          </div>
                          <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Total Atrasado</p>
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">
                              {formatarPreco(inadimplencia.totalAtrasado)}
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {inadimplencia.parcelasAtrasadas.length} parcela{inadimplencia.parcelasAtrasadas.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirDetalhes(inadimplencia)}
                            className="flex-1 border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/pedidos/${inadimplencia.pedido_id}`)}
                            className="flex-1 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Ver Pedido
                          </Button>
                        </div>

                        {/* Parcelas Atrasadas */}
                        <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                            Parcelas Atrasadas:
                          </p>
                          <div className="space-y-2">
                            {inadimplencia.parcelasAtrasadas.map((parcela) => (
                              <div
                                key={parcela.id}
                                className="flex items-center justify-between p-2 bg-white dark:bg-neutral-900 rounded border border-red-200 dark:border-red-800"
                              >
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                    {parcela.numero_parcela}ª Parcela
                                  </span>
                                  <span className="text-xs text-neutral-500 dark:text-neutral-500">
                                    - Vencida em {formatarDataCompleta(parcela.data_vencimento)}
                                  </span>
                                </div>
                                <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                  {formatarPreco(parcela.valor)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirDetalhes(inadimplencia)}
                          className="border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 whitespace-nowrap"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/pedidos/${inadimplencia.pedido_id}`)}
                          className="border-neutral-300 dark:border-neutral-700 whitespace-nowrap"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Ver Pedido
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

        </>
      )}

      {/* Sheet de Detalhes - sempre disponível */}
      <Sheet open={sheetDetalhesAberto} onOpenChange={setSheetDetalhesAberto}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              Detalhes da Inadimplência
            </SheetTitle>
            <SheetDescription>
              Informações completas sobre o cliente, pedido e parcelas atrasadas
            </SheetDescription>
          </SheetHeader>

          {inadimplenciaSelecionada && (
            <div className="mt-6 space-y-6">
              {/* Dados do Cliente */}
              <Card className="border-neutral-200 dark:border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Nome</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {inadimplenciaSelecionada.cliente.nome_completo || 'Não informado'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">E-mail</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {inadimplenciaSelecionada.cliente.email}
                      </p>
                    </div>
                    {inadimplenciaSelecionada.cliente.telefone && (
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Telefone</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {inadimplenciaSelecionada.cliente.telefone}
                        </p>
                      </div>
                    )}
                    {inadimplenciaSelecionada.cliente.cpf && (
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">CPF</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {inadimplenciaSelecionada.cliente.cpf}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Dados do Pedido */}
              <Card className="border-neutral-200 dark:border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    Dados do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">ID do Pedido</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        #{inadimplenciaSelecionada.pedido_id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Data do Pedido</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {formatarDataCompleta(inadimplenciaSelecionada.pedido.criado_em)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Loja</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {inadimplenciaSelecionada.pedido.revenda.nome_revenda}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Valor Total do Pedido</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {formatarPreco(inadimplenciaSelecionada.pedido.valor_total)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSheetDetalhesAberto(false)
                        navigate(`/admin/pedidos/${inadimplenciaSelecionada.pedido_id}`)
                      }}
                      className="w-full border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes do Pedido
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Parcelas Atrasadas */}
              <Card className="border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-red-900 dark:text-red-100">
                    <CreditCard className="w-5 h-5" />
                    Parcelas Atrasadas ({inadimplenciaSelecionada.parcelasAtrasadas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {inadimplenciaSelecionada.parcelasAtrasadas.map((parcela) => (
                    <div
                      key={parcela.id}
                      className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {parcela.numero_parcela}ª Parcela
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-red-600 dark:text-red-400" />
                            <p className="text-xs text-red-600 dark:text-red-400">
                              Vencida em {formatarDataCompleta(parcela.data_vencimento)}
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          {formatarPreco(parcela.valor)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Total Atrasado:</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {formatarPreco(inadimplenciaSelecionada.totalAtrasado)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

