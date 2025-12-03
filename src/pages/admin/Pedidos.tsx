import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, AlertCircle, LayoutGrid, List, Search, Calendar, Store, Eye, ArrowLeft, CheckCircle2, Clock, XCircle, TrendingUp, DollarSign, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { DateRangePickerCompact } from '@/components/ui/date-range-picker-compact'
import { Dropdown } from '@/components/ui/dropdown'
import { Select } from '@/components/ui/select'
import { listarPedidosAdmin, type Pedido, type StatusPedido } from '@/lib/gerenciarPedidos'
import { formatarPreco } from '@/lib/utils'
import { FiltrosRevendaUnidade } from '@/components/admin/FiltrosRevendaUnidade'
import { FiltrosAvancados } from '@/components/admin/FiltrosAvancados'

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  pronto: 'Pronto',
  em_transito: 'Em Trânsito',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export default function PedidosAdmin() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [revendaSelecionada, setRevendaSelecionada] = useState<string | null>(null)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid')
  
  // Filtros avançados
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'pendente' | 'confirmado' | 'preparando' | 'pronto' | 'em_transito' | 'entregue' | 'cancelado'>('todos')
  const [dataFiltro, setDataFiltro] = useState<'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'>('tudo')
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('')
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('')

  const [pedidosTodos, setPedidosTodos] = useState<Pedido[]>([])
  const [carregandoDashboard, setCarregandoDashboard] = useState(false)
  const [metricasAnteriores, setMetricasAnteriores] = useState({
    totalPedidos: 0,
    pedidosEntregues: 0,
    pedidosPendentes: 0,
    valorTotal: 0,
  })

  useEffect(() => {
    if (revendaSelecionada) {
      carregarPedidos()
    } else {
      carregarPedidosDashboard()
    }
  }, [revendaSelecionada, unidadeSelecionada])

  const carregarPedidosDashboard = async () => {
    setCarregandoDashboard(true)
    setErro(null)
    try {
      const pedidosResult = await listarPedidosAdmin()
      
      if (pedidosResult.error) {
        console.error('❌ Erro ao carregar pedidos:', pedidosResult.error)
        setErro(`Erro ao carregar pedidos: ${pedidosResult.error.message || 'Erro desconhecido'}`)
        setPedidosTodos([])
      } else {
        setPedidosTodos(pedidosResult.pedidos || [])
        
        // Calcular métricas anteriores (dia anterior) filtrando por data de criação
        const hoje = new Date()
        const ontem = new Date(hoje)
        ontem.setDate(ontem.getDate() - 1)
        ontem.setHours(0, 0, 0, 0)
        const fimOntem = new Date(ontem)
        fimOntem.setHours(23, 59, 59, 999)
        
        const pedidosOntem = (pedidosResult.pedidos || []).filter(p => {
          const dataCriacao = new Date(p.criado_em)
          return dataCriacao >= ontem && dataCriacao <= fimOntem
        })
        
        setMetricasAnteriores({
          totalPedidos: pedidosOntem.length,
          pedidosEntregues: pedidosOntem.filter(p => p.status === 'entregue').length,
          pedidosPendentes: pedidosOntem.filter(p => p.status === 'pendente').length,
          valorTotal: pedidosOntem.reduce((sum, p) => sum + p.valor_total, 0),
        })
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar pedidos:', error)
      setErro(`Erro inesperado ao carregar pedidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setPedidosTodos([])
    } finally {
      setCarregandoDashboard(false)
      setCarregando(false)
    }
  }

  const carregarPedidos = async () => {
    if (!revendaSelecionada) {
      setPedidos([])
      setCarregando(false)
      return
    }

    setCarregando(true)
    setErro(null)
    try {
      const { pedidos: pedidosData, error } = await listarPedidosAdmin(revendaSelecionada, unidadeSelecionada || undefined)
      if (error) {
        console.error('❌ Erro ao carregar pedidos:', error)
        setErro(`Erro ao carregar pedidos: ${error.message || 'Erro desconhecido'}`)
        setPedidos([])
      } else {
        setPedidos(pedidosData || [])
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar pedidos:', error)
      setErro(`Erro inesperado ao carregar pedidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setPedidos([])
    } finally {
      setCarregando(false)
    }
  }

  // Filtragem dos pedidos
  const pedidosFiltrados = useMemo(() => {
    if (!pedidos || pedidos.length === 0) return []
    let filtrados = [...pedidos]

    // Filtro de busca
    if (busca) {
      const buscaLower = busca.toLowerCase()
      filtrados = filtrados.filter(pedido => {
        const pedidoId = pedido.id.toLowerCase()
        const revendaNome = pedido.revenda?.nome_revenda?.toLowerCase() || ''
        const clienteNome = pedido.dados_cliente?.nome?.toLowerCase() || ''
        const clienteEmail = pedido.dados_cliente?.email?.toLowerCase() || ''
        const clienteTelefone = pedido.dados_cliente?.telefone?.toLowerCase() || ''
        
        return pedidoId.includes(buscaLower) ||
               revendaNome.includes(buscaLower) ||
               clienteNome.includes(buscaLower) ||
               clienteEmail.includes(buscaLower) ||
               clienteTelefone.includes(buscaLower)
      })
    }

    // Filtro de status
    if (statusFiltro !== 'todos') {
      filtrados = filtrados.filter(pedido => pedido.status === statusFiltro)
    }

    // Filtro de data
    if (dataFiltro !== 'tudo') {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      let dataInicio: Date
      if (dataFiltro === 'hoje') {
        dataInicio = new Date(hoje)
      } else if (dataFiltro === 'personalizado') {
        if (dataInicioPersonalizada && dataFimPersonalizada) {
          dataInicio = new Date(dataInicioPersonalizada)
          const dataFim = new Date(dataFimPersonalizada)
          dataFim.setHours(23, 59, 59, 999)
          filtrados = filtrados.filter(pedido => {
            const dataPedido = new Date(pedido.criado_em)
            return dataPedido >= dataInicio && dataPedido <= dataFim
          })
        }
        return filtrados
      } else {
        const dias = parseInt(dataFiltro)
        dataInicio = new Date(hoje)
        dataInicio.setDate(hoje.getDate() - dias)
      }
      
      filtrados = filtrados.filter(pedido => {
        const dataPedido = new Date(pedido.criado_em)
        return dataPedido >= dataInicio
      })
    }

    return filtrados
  }, [pedidos, busca, statusFiltro, dataFiltro, dataInicioPersonalizada, dataFimPersonalizada])

  const limparFiltros = () => {
    setBusca('')
    setRevendaFiltro('todas')
    setStatusFiltro('todos')
    setDataFiltro('tudo')
    setDataInicioPersonalizada('')
    setDataFimPersonalizada('')
    setDropdownCalendarioAberto(false)
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (carregando && pedidos.length === 0) {
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
            <ShoppingCart className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Pedidos
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {revendaSelecionada 
              ? `Pedidos da revenda selecionada (${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'})`
              : 'Visualize e gerencie todos os pedidos da plataforma'}
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
          {revendaSelecionada && (
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
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Total de Pedidos</p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                  {revendaSelecionada ? pedidos.length : pedidosTodos.length}
                </p>
                {(() => {
                  const atual = revendaSelecionada ? pedidos.length : pedidosTodos.length
                  const anterior = metricasAnteriores.totalPedidos
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
              <ShoppingCart className="w-8 h-8 text-violet-600 dark:text-violet-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Pedidos Entregues</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {(revendaSelecionada ? pedidos : pedidosTodos).filter(p => p.status === 'entregue').length}
                </p>
                {(() => {
                  const atual = (revendaSelecionada ? pedidos : pedidosTodos).filter(p => p.status === 'entregue').length
                  const anterior = metricasAnteriores.pedidosEntregues
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
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Pedidos Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {(revendaSelecionada ? pedidos : pedidosTodos).filter(p => p.status === 'pendente').length}
                </p>
                {(() => {
                  const atual = (revendaSelecionada ? pedidos : pedidosTodos).filter(p => p.status === 'pendente').length
                  const anterior = metricasAnteriores.pedidosPendentes
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

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Valor Total</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatarPreco((revendaSelecionada ? pedidos : pedidosTodos).reduce((sum, p) => sum + p.valor_total, 0))}
                </p>
                {(() => {
                  const atual = (revendaSelecionada ? pedidos : pedidosTodos).reduce((sum, p) => sum + p.valor_total, 0)
                  const anterior = metricasAnteriores.valorTotal
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
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Simplificados */}
      <FiltrosAvancados
        busca={busca}
        onBuscaChange={setBusca}
        statusFiltro={{
          value: statusFiltro,
          onChange: (value) => setStatusFiltro(value as any),
          options: [
            { value: 'todos', label: 'Todos os Status' },
            { value: 'pendente', label: 'Pendente' },
            { value: 'confirmado', label: 'Confirmado' },
            { value: 'preparando', label: 'Preparando' },
            { value: 'pronto', label: 'Pronto' },
            { value: 'em_transito', label: 'Em Trânsito' },
            { value: 'entregue', label: 'Entregue' },
            { value: 'cancelado', label: 'Cancelado' },
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

      {/* Dashboard quando não há revenda selecionada */}
      {!revendaSelecionada ? (
        <>

          {/* Distribuição por Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  Distribuição por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(STATUS_LABELS).map(([status, label]) => {
                    const count = pedidosTodos.filter(p => p.status === status).length
                    const total = pedidosTodos.length
                    const percentual = total > 0 ? (count / total) * 100 : 0

                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-neutral-900 dark:text-neutral-50">
                            {label}
                          </span>
                          <span className="text-neutral-600 dark:text-neutral-400">
                            {count} ({percentual.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                          <div
                            className="bg-violet-600 dark:bg-violet-400 h-2 rounded-full transition-all"
                            style={{ width: `${percentual}%` }}
                          />
                        </div>
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
                  Top Revendas por Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const porRevenda = new Map<string, { nome: string; quantidade: number; valor: number }>()
                    pedidosTodos.forEach(p => {
                      const revendaNome = p.revenda?.nome_revenda || 'Desconhecida'
                      const existing = porRevenda.get(revendaNome) || { nome: revendaNome, quantidade: 0, valor: 0 }
                      existing.quantidade++
                      existing.valor += p.valor_total
                      porRevenda.set(revendaNome, existing)
                    })
                    const topRevendas = Array.from(porRevenda.values())
                      .sort((a, b) => b.quantidade - a.quantidade)
                      .slice(0, 10)

                    return topRevendas.length === 0 ? (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                        Nenhum pedido encontrado
                      </p>
                    ) : (
                      topRevendas.map((revenda, index) => (
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
                              {revenda.quantidade} pedidos
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              {formatarPreco(revenda.valor)}
                            </p>
                          </div>
                        </div>
                      ))
                    )
                  })()}
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
                    Use o seletor acima para filtrar por revenda específica e visualizar pedidos detalhados, histórico completo e gerenciar status.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Lista de Pedidos */}
          {pedidosFiltrados.length === 0 ? (
            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                  {pedidos.length === 0
                    ? 'Nenhum pedido encontrado'
                    : 'Nenhum pedido corresponde aos filtros aplicados'}
                </p>
              </CardContent>
            </Card>
          ) : visualizacao === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pedidosFiltrados.map((pedido) => (
                <Card
                  key={pedido.id}
                  className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">Pedido #{pedido.id.slice(0, 8).toUpperCase()}</CardTitle>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                          {formatarData(pedido.criado_em)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        pedido.status === 'pendente' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                        pedido.status === 'confirmado' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        pedido.status === 'preparando' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                        pedido.status === 'pronto' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' :
                        pedido.status === 'em_transito' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' :
                        pedido.status === 'entregue' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {STATUS_LABELS[pedido.status] || pedido.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">Revenda</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {pedido.revenda?.nome_publico || pedido.revenda?.nome_revenda || 'N/A'}
                      </p>
                      {pedido.unidade && (
                        <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-0.5">
                          {pedido.unidade.nome_publico || pedido.unidade.nome}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">Cliente</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {pedido.dados_cliente?.nome || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">Valor Total</p>
                      <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                        {formatarPreco(pedido.valor_total)}
                      </p>
                    </div>
                    {pedido.transacao_financeira && (
                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Valor a Repassar</p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatarPreco(typeof pedido.transacao_financeira.valor_liquido === 'string' ? parseFloat(pedido.transacao_financeira.valor_liquido) : (pedido.transacao_financeira.valor_liquido || 0))}
                        </p>
                        {pedido.transacao_financeira.modalidade && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                            Modalidade: <span className="font-medium">{pedido.transacao_financeira.modalidade}</span>
                          </p>
                        )}
                      </div>
                    )}
                    {pedido.forma_pagamento === 'pix_parcelado' && pedido.parcelamento && pedido.parcelamento.parcelas && pedido.parcelamento.parcelas.length > 0 && (
                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          <p className="text-xs font-medium text-neutral-900 dark:text-neutral-50">
                            Crediário Digital ({pedido.parcelamento.total_parcelas}x)
                          </p>
                        </div>
                        <div className="space-y-1">
                          {pedido.parcelamento.parcelas.slice(0, 3).map((parcela) => (
                            <div key={parcela.id} className="flex justify-between text-xs">
                              <span className={`${
                                parcela.status === 'paga' 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-neutral-600 dark:text-neutral-400'
                              }`}>
                                {parcela.numero_parcela}ª - {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                                {parcela.status === 'paga' && ' ✓'}
                              </span>
                              <span className={`font-medium ${
                                parcela.status === 'paga' 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-neutral-900 dark:text-neutral-50'
                              }`}>
                                {formatarPreco(parcela.valor)}
                              </span>
                            </div>
                          ))}
                          {pedido.parcelamento.parcelas.length > 3 && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              +{pedido.parcelamento.parcelas.length - 3} {pedido.parcelamento.parcelas.length - 3 === 1 ? 'parcela' : 'parcelas'} mais
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/pedidos/${pedido.id}`)}
                      className="w-full border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {pedidosFiltrados.map((pedido) => (
                <Card
                  key={pedido.id}
                  className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                            Pedido #{pedido.id.slice(0, 8).toUpperCase()}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            pedido.status === 'pendente' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                            pedido.status === 'confirmado' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                            pedido.status === 'preparando' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                            pedido.status === 'pronto' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' :
                            pedido.status === 'em_transito' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' :
                            pedido.status === 'entregue' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}>
                            {STATUS_LABELS[pedido.status] || pedido.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">Data</p>
                            <p className="font-medium text-neutral-900 dark:text-neutral-50">
                              {formatarData(pedido.criado_em)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">Revenda</p>
                            <p className="font-medium text-neutral-900 dark:text-neutral-50">
                              {pedido.revenda?.nome_publico || pedido.revenda?.nome_revenda || 'N/A'}
                            </p>
                          </div>
                          {pedido.unidade && (
                            <div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-500">Unidade</p>
                              <p className="font-medium text-neutral-900 dark:text-neutral-50">
                                {pedido.unidade.nome_publico || pedido.unidade.nome}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">Cliente</p>
                            <p className="font-medium text-neutral-900 dark:text-neutral-50">
                              {pedido.dados_cliente?.nome || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">Valor Total</p>
                            <p className="font-medium text-violet-600 dark:text-violet-400">
                              {formatarPreco(pedido.valor_total)}
                            </p>
                          </div>
                          {pedido.transacao_financeira && (
                            <>
                              <div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-500">Valor a Repassar</p>
                                <p className="font-medium text-green-600 dark:text-green-400">
                                  {formatarPreco(typeof pedido.transacao_financeira.valor_liquido === 'string' ? parseFloat(pedido.transacao_financeira.valor_liquido) : (pedido.transacao_financeira.valor_liquido || 0))}
                                </p>
                              </div>
                              {pedido.transacao_financeira.modalidade && (
                                <div>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-500">Modalidade</p>
                                  <p className="font-medium">
                                    <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs">
                                      {pedido.transacao_financeira.modalidade}
                                    </span>
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {pedido.forma_pagamento === 'pix_parcelado' && pedido.parcelamento && pedido.parcelamento.parcelas && pedido.parcelamento.parcelas.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center gap-2 mb-2">
                              <CreditCard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                Crediário Digital ({pedido.parcelamento.total_parcelas}x)
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-neutral-500 dark:text-neutral-500">Pagas</p>
                                <p className="font-semibold text-green-600 dark:text-green-400">
                                  {pedido.parcelamento.parcelas.filter(p => p.status === 'paga').length}/{pedido.parcelamento.total_parcelas}
                                </p>
                              </div>
                              <div>
                                <p className="text-neutral-500 dark:text-neutral-500">Valor/Parcela</p>
                                <p className="font-semibold text-neutral-900 dark:text-neutral-50">
                                  {formatarPreco(pedido.parcelamento.valor_parcela)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/pedidos/${pedido.id}`)}
                        className="ml-4 border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

