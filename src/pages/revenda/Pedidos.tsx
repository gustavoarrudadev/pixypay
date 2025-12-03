import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, AlertCircle, CheckCircle2, XCircle, Clock, Truck, ShoppingBag, Eye, CreditCard, LayoutGrid, List, Search, Calendar, Store, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Dropdown } from '@/components/ui/dropdown'
import { Select } from '@/components/ui/select'
import { listarPedidosRevenda, atualizarStatusPedido, type Pedido, type StatusPedido } from '@/lib/gerenciarPedidos'
import { formatarPreco } from '@/lib/utils'
import { obterRevendaId, obterUnidadeIdColaborador } from '@/lib/impersonation'
import { listarUnidades, type UnidadeRevenda } from '@/lib/gerenciarUnidades'
import { Badge } from '@/components/ui/badge'

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  pronto: 'Pronto',
  em_transito: 'Em Trânsito',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

const STATUS_OPTIONS: StatusPedido[] = [
  'pendente',
  'confirmado',
  'preparando',
  'pronto',
  'em_transito',
  'entregue',
  'cancelado',
]

export default function Pedidos() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [revendaId, setRevendaId] = useState<string | null>(null)
  const [atualizandoStatus, setAtualizandoStatus] = useState<string | null>(null)
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid')
  
  // Estado de unidades
  const [unidades, setUnidades] = useState<UnidadeRevenda[]>([])
  const [carregandoUnidades, setCarregandoUnidades] = useState(true)
  const [unidadeSelecionadaId, setUnidadeSelecionadaId] = useState<string | null>(null)
  const [pedidosPorUnidade, setPedidosPorUnidade] = useState<Record<string, number>>({})
  
  // Filtros avançados
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'pendente' | 'confirmado' | 'preparando' | 'pronto' | 'em_transito' | 'entregue' | 'cancelado'>('todos')
  const [dataFiltro, setDataFiltro] = useState<'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'>('tudo')
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('')
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)

  useEffect(() => {
    carregarRevendaId()
  }, [])

  useEffect(() => {
    if (revendaId) {
      carregarUnidades()
    }
  }, [revendaId])

  useEffect(() => {
    if (revendaId) {
      carregarPedidos()
    }
  }, [revendaId, unidadeSelecionadaId])

  const carregarRevendaId = async () => {
    try {
      const revendaIdAtual = await obterRevendaId()
      if (revendaIdAtual) {
        setRevendaId(revendaIdAtual)
      } else {
        setErro('Erro ao carregar dados da revenda.')
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error)
      setErro('Erro ao carregar dados.')
    }
  }

  const carregarUnidades = async () => {
    if (!revendaId) return

    setCarregandoUnidades(true)
    try {
      const { unidades: unidadesData, error } = await listarUnidades(revendaId)
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

      // Carrega contagem de pedidos por unidade (apenas das unidades filtradas)
      const pedidosCount: Record<string, number> = {}
      for (const unidade of unidadesFiltradas) {
        try {
          const { pedidos: pedidosData } = await listarPedidosRevenda(revendaId, unidade.id)
          pedidosCount[unidade.id] = pedidosData?.length || 0
        } catch (error) {
          console.error(`❌ Erro ao contar pedidos da unidade ${unidade.id}:`, error)
          pedidosCount[unidade.id] = 0
        }
      }
      setPedidosPorUnidade(pedidosCount)

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

  const carregarPedidos = async () => {
    if (!revendaId) return

    // Se não houver unidade selecionada, não carrega pedidos
    if (!unidadeSelecionadaId) {
      setPedidos([])
      setCarregando(false)
      return
    }

    setCarregando(true)
    setErro(null)
    try {
      const { pedidos: pedidosData, error } = await listarPedidosRevenda(revendaId, unidadeSelecionadaId)
      if (error) {
        setErro('Erro ao carregar pedidos')
        return
      }
      setPedidos(pedidosData || [])
    } catch (error) {
      console.error('❌ Erro ao carregar pedidos:', error)
      setErro('Erro inesperado ao carregar pedidos')
    } finally {
      setCarregando(false)
    }
  }

  const handleAtualizarStatus = async (pedidoId: string, novoStatus: StatusPedido) => {
    setAtualizandoStatus(pedidoId)
    try {
      const { error } = await atualizarStatusPedido(pedidoId, novoStatus)
      if (error) {
        setErro('Erro ao atualizar status do pedido')
        return
      }
      await carregarPedidos()
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error)
      setErro('Erro inesperado ao atualizar status')
    } finally {
      setAtualizandoStatus(null)
    }
  }

  // Filtragem dos pedidos
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(pedido => {
      // Filtro por busca de texto
      const termo = busca.trim().toLowerCase()
      const correspondeBusca =
        termo.length === 0 ||
        pedido.id.toLowerCase().includes(termo) ||
        (pedido.dados_cliente?.nome || '').toLowerCase().includes(termo) ||
        (pedido.dados_cliente?.email || '').toLowerCase().includes(termo) ||
        (pedido.dados_cliente?.telefone || '').includes(busca) ||
        (pedido.cliente?.nome_completo || '').toLowerCase().includes(termo) ||
        (pedido.cliente?.email || '').toLowerCase().includes(termo)

      // Filtro por status
      const correspondeStatus = statusFiltro === 'todos' || pedido.status === statusFiltro

      // Filtro por data de criação
      const correspondeData = (() => {
        const createdAt = new Date(pedido.criado_em)
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
    })
  }, [pedidos, busca, statusFiltro, dataFiltro, dataInicioPersonalizada, dataFimPersonalizada])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Pedidos
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Gerencie os pedidos recebidos pela sua revenda
          </p>
        </div>
        {/* Toggle de Visualização */}
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
      </div>

      {erro && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        </div>
      )}

      {/* Seleção de Unidade */}
      {revendaId && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Selecione uma unidade para visualizar pedidos
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
                  Crie uma unidade em "Presença na Loja" para começar a receber pedidos
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
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  <XCircle className="w-3 h-3 mr-1" />
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
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                          <p className="text-neutral-500 dark:text-neutral-400 text-xs">Pedidos</p>
                          <p className="font-medium flex items-center gap-1 text-neutral-900 dark:text-neutral-50">
                            <ShoppingBag className="w-4 h-4" />
                            {pedidosPorUnidade[unidade.id] || 0}
                          </p>
                        </div>
                      </div>
                      {isSelecionada && (
                        <div className="mt-3 pt-3 border-t border-violet-300 dark:border-violet-700">
                          <p className="text-xs font-medium text-violet-700 dark:text-violet-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Unidade selecionada
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

      {/* Filtros Avançados */}
      {unidadeSelecionadaId && (
        <Card className="relative z-10 border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Busca */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              <Input
                placeholder="Buscar por número do pedido, cliente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 border-neutral-300 dark:border-neutral-700"
              />
            </div>

            {/* Status */}
            <div className="w-[200px]">
              <SelectMenu
                value={statusFiltro}
                onChange={(v) => setStatusFiltro(v as any)}
                options={[
                  { value: 'todos', label: 'Status: Todos' },
                  { value: 'pendente', label: 'Status: Pendente' },
                  { value: 'confirmado', label: 'Status: Confirmado' },
                  { value: 'preparando', label: 'Status: Preparando' },
                  { value: 'pronto', label: 'Status: Pronto' },
                  { value: 'em_transito', label: 'Status: Em Trânsito' },
                  { value: 'entregue', label: 'Status: Entregue' },
                  { value: 'cancelado', label: 'Status: Cancelado' },
                ]}
              />
            </div>

            {/* Data */}
            <div className="w-[200px]">
              <SelectMenu
                value={dataFiltro}
                onChange={(v) => setDataFiltro(v as any)}
                options={[
                  { value: 'tudo', label: 'Data: Tudo' },
                  { value: 'hoje', label: 'Data: Hoje' },
                  { value: '7', label: 'Data: 7 dias' },
                  { value: '15', label: 'Data: 15 dias' },
                  { value: '30', label: 'Data: 30 dias' },
                  { value: 'personalizado', label: 'Data: Personalizada' },
                ]}
              />
            </div>

            {/* Calendário dropdown */}
            {dataFiltro === 'personalizado' && (
              <Dropdown
                aberto={dropdownCalendarioAberto}
                onToggle={setDropdownCalendarioAberto}
                alinhamento="inicio"
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center justify-between gap-2 h-10 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 min-w-[240px]"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-500" />
                      <span>
                        {dataInicioPersonalizada && dataFimPersonalizada
                          ? `${new Date(dataInicioPersonalizada).toLocaleDateString('pt-BR')} — ${new Date(dataFimPersonalizada).toLocaleDateString('pt-BR')}`
                          : dataInicioPersonalizada
                            ? `${new Date(dataInicioPersonalizada).toLocaleDateString('pt-BR')} — …`
                            : 'Selecionar período'}
                      </span>
                    </div>
                  </button>
                }
              >
                <DateRangePicker
                  variant="compact"
                  dataInicio={dataInicioPersonalizada}
                  dataFim={dataFimPersonalizada}
                  onChange={(inicio, fim) => {
                    setDataInicioPersonalizada(inicio)
                    setDataFimPersonalizada(fim)
                  }}
                />
                <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
                  <Button
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={() => setDropdownCalendarioAberto(false)}
                  >
                    Aplicar
                  </Button>
                </div>
              </Dropdown>
            )}

            {/* Limpar filtros */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBusca('')
                setStatusFiltro('todos')
                setDataFiltro('tudo')
                setDataInicioPersonalizada('')
                setDataFimPersonalizada('')
                setDropdownCalendarioAberto(false)
              }}
              className="text-neutral-700 dark:text-neutral-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-700 dark:hover:text-violet-300"
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Lista de Pedidos */}
      {unidadeSelecionadaId && (
        <>
          {carregando ? (
            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-neutral-600 dark:text-neutral-400">Carregando pedidos...</p>
              </CardContent>
            </Card>
          ) : pedidos.length === 0 ? (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center">
              Você ainda não recebeu nenhum pedido
            </p>
          </CardContent>
        </Card>
      ) : pedidosFiltrados.length === 0 ? (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center mb-6">
              Nenhum pedido corresponde aos filtros aplicados
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setBusca('')
                setStatusFiltro('todos')
                setDataFiltro('tudo')
                setDataInicioPersonalizada('')
                setDataFimPersonalizada('')
              }}
            >
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      ) : visualizacao === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pedidosFiltrados.map((pedido) => (
            <Card
              key={pedido.id}
              className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="space-y-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      Pedido #{pedido.id.slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      {new Date(pedido.criado_em).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {pedido.unidade && (
                      <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-1">
                        Unidade: {pedido.unidade.nome_publico || pedido.unidade.nome}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      pedido.status === 'entregue' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      pedido.status === 'cancelado' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                      pedido.status === 'pendente' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }`}>
                      {STATUS_LABELS[pedido.status] || pedido.status}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/revenda/pedidos/${pedido.id}`)}
                      className="border-neutral-300 dark:border-neutral-700 shrink-0"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cliente */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">Cliente:</span>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {pedido.dados_cliente.nome}
                  </span>
                </div>

                {/* Itens */}
                {pedido.itens && pedido.itens.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Itens:</p>
                    <div className="space-y-1">
                      {pedido.itens.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                          <span>
                            {item.produto?.nome || 'Produto'} x{item.quantidade}
                          </span>
                          <span>{formatarPreco(item.subtotal || (item.preco_unitario || 0) * (item.quantidade || 0))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informações de Entrega e Pagamento */}
                <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-neutral-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-neutral-900 dark:text-neutral-50">Entrega</p>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {pedido.tipo_entrega === 'retirar_local' && 'Retirada no local'}
                        {pedido.tipo_entrega === 'receber_endereco' && 'Entrega no endereço'}
                        {pedido.tipo_entrega === 'agendar' && 'Entrega agendada'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-neutral-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-neutral-900 dark:text-neutral-50">Pagamento</p>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {pedido.forma_pagamento === 'pix_vista' 
                          ? 'PIX à Vista' 
                          : `PIX Parcelado (${pedido.parcelas_total}x)`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parcelamento */}
                {pedido.parcelamento && pedido.parcelamento.parcelas && pedido.parcelamento.parcelas.length > 0 && (
                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        Parcelamento
                      </p>
                    </div>
                    <div className="space-y-1">
                      {pedido.parcelamento.parcelas.map((parcela) => (
                        <div key={parcela.id} className="flex justify-between text-sm">
                          <span className={`${
                            parcela.status === 'paga' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-neutral-600 dark:text-neutral-400'
                          }`}>
                            {parcela.numero_parcela}ª parcela - Venc: {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
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
                    </div>
                  </div>
                )}

                {/* Observações */}
                {pedido.observacoes && (
                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                      Observações:
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {pedido.observacoes}
                    </p>
                  </div>
                )}

                {/* Informações Financeiras */}
                {pedido.transacao_financeira && (
                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      Informações Financeiras
                    </h4>
                    <div className="space-y-2">
                      {(() => {
                        const valorBruto = typeof pedido.transacao_financeira.valor_bruto === 'string' 
                          ? parseFloat(pedido.transacao_financeira.valor_bruto) 
                          : (pedido.transacao_financeira.valor_bruto || 0)
                        const valorLiquido = typeof pedido.transacao_financeira.valor_liquido === 'string' 
                          ? parseFloat(pedido.transacao_financeira.valor_liquido) 
                          : (pedido.transacao_financeira.valor_liquido || 0)
                        const taxaPercentual = typeof pedido.transacao_financeira.taxa_percentual === 'string' 
                          ? parseFloat(pedido.transacao_financeira.taxa_percentual) 
                          : (pedido.transacao_financeira.taxa_percentual || 0)
                        const taxaFixa = typeof pedido.transacao_financeira.taxa_fixa === 'string' 
                          ? parseFloat(pedido.transacao_financeira.taxa_fixa) 
                          : (pedido.transacao_financeira.taxa_fixa || 0)
                        
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-neutral-600 dark:text-neutral-400">Valor Total (Cliente):</span>
                              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                {formatarPreco(valorBruto || pedido.valor_total || 0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-neutral-600 dark:text-neutral-400">Valor a Receber:</span>
                              <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                                {formatarPreco(valorLiquido)}
                              </span>
                            </div>
                          </>
                        )
                      })()}
                      {pedido.transacao_financeira.modalidade && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">Modalidade de Repasse:</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                            {pedido.transacao_financeira.modalidade}
                          </span>
                        </div>
                      )}
                      {(() => {
                        const taxaPercentual = typeof pedido.transacao_financeira.taxa_percentual === 'string' 
                          ? parseFloat(pedido.transacao_financeira.taxa_percentual) 
                          : (pedido.transacao_financeira.taxa_percentual || 0)
                        const taxaFixa = typeof pedido.transacao_financeira.taxa_fixa === 'string' 
                          ? parseFloat(pedido.transacao_financeira.taxa_fixa) 
                          : (pedido.transacao_financeira.taxa_fixa || 0)
                        
                        return (taxaPercentual !== null && taxaPercentual !== undefined && !isNaN(taxaPercentual)) ||
                               (taxaFixa !== null && taxaFixa !== undefined && !isNaN(taxaFixa)) ? (
                          <div className="pt-2 mt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Taxas Descontadas:</p>
                            {taxaPercentual !== null && taxaPercentual !== undefined && !isNaN(taxaPercentual) && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-500 dark:text-neutral-500">Taxa Percentual:</span>
                                <span className="text-neutral-700 dark:text-neutral-300">
                                  {taxaPercentual.toFixed(2)}%
                                </span>
                              </div>
                            )}
                            {taxaFixa !== null && taxaFixa !== undefined && !isNaN(taxaFixa) && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-500 dark:text-neutral-500">Taxa Fixa:</span>
                                <span className="text-neutral-700 dark:text-neutral-300">
                                  {formatarPreco(taxaFixa)}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : null
                      })()}
                    </div>
                  </div>
                )}

                {/* Total e Atualizar Status */}
                <div className="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <div>
                    <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Total: </span>
                    <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                      {formatarPreco(pedido.valor_total)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-neutral-600 dark:text-neutral-400">Status:</label>
                    <select
                      value={pedido.status}
                      onChange={(e) => handleAtualizarStatus(pedido.id, e.target.value as StatusPedido)}
                      disabled={atualizandoStatus === pedido.id}
                      className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600 disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
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
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">
                          Pedido #{pedido.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {new Date(pedido.criado_em).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {pedido.unidade && (
                          <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-1">
                            Unidade: {pedido.unidade.nome_publico || pedido.unidade.nome}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Cliente</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {pedido.dados_cliente.nome}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Entrega</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {pedido.tipo_entrega === 'retirar_local' && 'Retirada no local'}
                          {pedido.tipo_entrega === 'receber_endereco' && 'Entrega no endereço'}
                          {pedido.tipo_entrega === 'agendar' && 'Entrega agendada'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Pagamento</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {pedido.forma_pagamento === 'pix_vista' 
                            ? 'PIX à Vista' 
                            : `PIX Parcelado (${pedido.parcelas_total}x)`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Itens */}
                    {pedido.itens && pedido.itens.length > 0 && (
                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">Itens:</p>
                        <div className="space-y-1">
                          {pedido.itens.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                              <span>
                                {item.produto?.nome || 'Produto'} x{item.quantidade}
                              </span>
                              <span>{formatarPreco(item.subtotal || (item.preco_unitario || 0) * (item.quantidade || 0))}</span>
                            </div>
                          ))}
                          {pedido.itens.length > 3 && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              +{pedido.itens.length - 3} {pedido.itens.length - 3 === 1 ? 'item' : 'itens'} mais
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Informações Financeiras */}
                    {pedido.transacao_financeira && (
                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2 mb-2">
                          <DollarSign className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                          Informações Financeiras
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-neutral-500 dark:text-neutral-500">Valor Total (Cliente):</span>
                            <span className="ml-1 font-semibold text-neutral-900 dark:text-neutral-50">
                              {formatarPreco(pedido.transacao_financeira.valor_bruto || pedido.valor_total || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-500 dark:text-neutral-500">Valor a Receber:</span>
                            <span className="ml-1 font-bold text-violet-600 dark:text-violet-400">
                              {formatarPreco(pedido.transacao_financeira.valor_liquido || 0)}
                            </span>
                          </div>
                          {pedido.transacao_financeira.modalidade && (
                            <div>
                              <span className="text-neutral-500 dark:text-neutral-500">Modalidade:</span>
                              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs">
                                {pedido.transacao_financeira.modalidade}
                              </span>
                            </div>
                          )}
                          {((pedido.transacao_financeira.taxa_percentual !== null && pedido.transacao_financeira.taxa_percentual !== undefined) ||
                            (pedido.transacao_financeira.taxa_fixa !== null && pedido.transacao_financeira.taxa_fixa !== undefined)) && (
                            <div className="col-span-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                              <span className="text-neutral-500 dark:text-neutral-500">Taxas: </span>
                              {pedido.transacao_financeira.taxa_percentual !== null && pedido.transacao_financeira.taxa_percentual !== undefined && (
                                <span className="text-neutral-600 dark:text-neutral-400">
                                  {pedido.transacao_financeira.taxa_percentual.toFixed(2)}%
                                </span>
                              )}
                              {pedido.transacao_financeira.taxa_fixa !== null && pedido.transacao_financeira.taxa_fixa !== undefined && (
                                <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                                  + {formatarPreco(pedido.transacao_financeira.taxa_fixa)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      pedido.status === 'entregue' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      pedido.status === 'cancelado' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                      pedido.status === 'pendente' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }`}>
                      {STATUS_LABELS[pedido.status] || pedido.status}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Total</p>
                      <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                        {formatarPreco(pedido.valor_total)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-neutral-600 dark:text-neutral-400">Status:</label>
                      <select
                        value={pedido.status}
                        onChange={(e) => handleAtualizarStatus(pedido.id, e.target.value as StatusPedido)}
                        disabled={atualizandoStatus === pedido.id}
                        className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/revenda/pedidos/${pedido.id}`)}
                      className="border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30"
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
          )}
        </>
      )}
    </div>
  )
}
