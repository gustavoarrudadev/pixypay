import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Package, AlertCircle, Eye, LayoutGrid, List, Search, Calendar, Store } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Dropdown } from '@/components/ui/dropdown'
import { listarPedidosCliente, type Pedido } from '@/lib/gerenciarPedidos'
import { formatarPreco } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  pronto: 'Pronto',
  em_transito: 'Em Trânsito',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  confirmado: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  preparando: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  pronto: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  em_transito: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  entregue: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  cancelado: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
}

export default function Pedidos() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid')
  
  // Filtros avançados
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'pendente' | 'confirmado' | 'preparando' | 'pronto' | 'em_transito' | 'entregue' | 'cancelado'>('todos')
  const [dataFiltro, setDataFiltro] = useState<'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'>('tudo')
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('')
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)

  useEffect(() => {
    carregarPedidos()
  }, [])

  const carregarPedidos = async () => {
    setCarregando(true)
    setErro(null)
    try {
      const { pedidos: pedidosData, error } = await listarPedidosCliente()
      if (error) {
        console.error('❌ Erro detalhado:', error)
        setErro(`Erro ao carregar pedidos: ${error.message || 'Erro desconhecido'}`)
        return
      }
      setPedidos(pedidosData || [])
    } catch (error) {
      console.error('❌ Erro ao carregar pedidos:', error)
      setErro(`Erro inesperado ao carregar pedidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setCarregando(false)
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
      (pedido.revenda?.nome_revenda || '').toLowerCase().includes(termo) ||
      (pedido.revenda?.nome_publico || '').toLowerCase().includes(termo) ||
      (pedido.unidade?.nome || '').toLowerCase().includes(termo) ||
      (pedido.unidade?.nome_publico || '').toLowerCase().includes(termo) ||
      (pedido.dados_cliente?.nome || '').toLowerCase().includes(termo) ||
        (pedido.dados_cliente?.email || '').toLowerCase().includes(termo) ||
        (pedido.dados_cliente?.telefone || '').includes(busca)

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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-violet-600 dark:text-violet-400" />
            Pedidos
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Histórico e consulta rápida dos seus pedidos
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

      {/* Filtros Avançados */}
      <Card className="relative z-10 border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Busca */}
            <div className="relative flex-1 w-full sm:min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              <Input
                placeholder="Buscar por número do pedido, revenda..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 border-neutral-300 dark:border-neutral-700 min-h-[44px] text-base"
              />
            </div>

            {/* Status */}
            <div className="w-full sm:w-[200px]">
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
            <div className="w-full sm:w-[200px]">
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
              <div className="w-full sm:w-auto">
                <Dropdown
                  aberto={dropdownCalendarioAberto}
                  onToggle={setDropdownCalendarioAberto}
                  alinhamento="inicio"
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center justify-between gap-2 w-full sm:min-w-[240px] h-11 sm:h-10 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 min-h-[44px] sm:min-h-0"
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
              </div>
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
              className="w-full sm:w-auto text-neutral-700 dark:text-neutral-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-700 dark:hover:text-violet-300 min-h-[44px] sm:min-h-0"
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {pedidos.length === 0 ? (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center">
              Você ainda não realizou nenhum pedido
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
              className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/cliente/compras/${pedido.id}`)}
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
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[pedido.status] || STATUS_COLORS.pendente}`}>
                      {STATUS_LABELS[pedido.status] || pedido.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Revenda */}
                {pedido.revenda && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
                    {pedido.revenda.logo_url ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 flex-shrink-0">
                        <img
                          src={pedido.revenda.logo_url}
                          alt={pedido.revenda.nome_publico || pedido.revenda.nome_revenda}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                        <Store className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-0.5">Loja</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
                        {pedido.revenda.nome_publico || pedido.revenda.nome_revenda}
                        {pedido.unidade && ` - ${pedido.unidade.nome_publico || pedido.unidade.nome}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Total</span>
                  <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                    {formatarPreco(pedido.valor_total)}
                  </span>
                </div>

                {/* Botão Ver Detalhes */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/cliente/compras/${pedido.id}`)
                  }}
                  className="w-full border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {pedidosFiltrados.map((pedido) => (
            <Card
              key={pedido.id}
              className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/cliente/compras/${pedido.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <Package className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">
                          Pedido #{pedido.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[pedido.status] || STATUS_COLORS.pendente}`}>
                          {STATUS_LABELS[pedido.status] || pedido.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        <span>
                          {new Date(pedido.criado_em).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-violet-600 dark:text-violet-400">
                          {formatarPreco(pedido.valor_total)}
                        </span>
                      </div>
                      {pedido.revenda && (
                        <div className="flex items-center gap-2">
                          {pedido.revenda.logo_url ? (
                            <div className="w-6 h-6 rounded overflow-hidden bg-white dark:bg-neutral-800 flex-shrink-0">
                              <img
                                src={pedido.revenda.logo_url}
                                alt={pedido.revenda.nome_publico || pedido.revenda.nome_revenda}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <Store className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
                            {pedido.revenda.nome_publico || pedido.revenda.nome_revenda}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/cliente/compras/${pedido.id}`)
                    }}
                    className="flex-shrink-0 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
