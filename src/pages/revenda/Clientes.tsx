import { useState, useEffect, useMemo } from 'react'
import { Users, Search, Calendar, Eye, ShoppingCart, DollarSign, Mail, Phone, User, LayoutGrid, List, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Dropdown } from '@/components/ui/dropdown'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { listarClientesRevenda } from '@/lib/gerenciarCliente'
import { listarPedidosRevenda, type Pedido } from '@/lib/gerenciarPedidos'
import { obterRevendaId, obterUnidadeIdColaborador } from '@/lib/impersonation'
import { formatarPreco } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { listarUnidades, type UnidadeRevenda } from '@/lib/gerenciarUnidades'
import { Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function ClientesRevenda() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [clientes, setClientes] = useState<Array<{
    id: string
    nome_completo: string | null
    email: string
    telefone: string | null
    cpf: string | null
    total_pedidos: number
    valor_total_gasto: number
    ultimo_pedido: string | null
    inadimplente: boolean
    total_parcelas_atrasadas: number
    pedido_inadimplente_id?: string | null
  }>>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<typeof clientes[0] | null>(null)
  const [pedidosCliente, setPedidosCliente] = useState<Pedido[]>([])
  const [carregandoPedidos, setCarregandoPedidos] = useState(false)
  const [sheetAberto, setSheetAberto] = useState(false)
  const [revendaId, setRevendaId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid')
  
  // Estado de unidades
  const [unidades, setUnidades] = useState<UnidadeRevenda[]>([])
  const [carregandoUnidades, setCarregandoUnidades] = useState(true)
  const [unidadeSelecionadaId, setUnidadeSelecionadaId] = useState<string | null>(null)
  const [clientesPorUnidade, setClientesPorUnidade] = useState<Record<string, number>>({})
  
  // Filtros avançados
  const [busca, setBusca] = useState('')
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
      carregarClientes()
    }
  }, [revendaId, unidadeSelecionadaId])

  const carregarRevendaId = async () => {
    try {
      const idRevenda = await obterRevendaId()
      if (!idRevenda) {
        setErro('Erro ao carregar dados da revenda. Por favor, faça login novamente.')
        setCarregando(false)
        setRevendaId(null)
        return
      }
      setRevendaId(idRevenda)
    } catch (error) {
      console.error('❌ Erro ao carregar revendaId:', error)
      setErro('Erro ao carregar dados da revenda.')
      setCarregando(false)
      setRevendaId(null)
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

      // Carrega contagem de clientes por unidade (apenas das unidades filtradas)
      const clientesCount: Record<string, number> = {}
      for (const unidade of unidadesFiltradas) {
        try {
          const { clientes: clientesData } = await listarClientesRevenda(revendaId, unidade.id)
          clientesCount[unidade.id] = clientesData?.length || 0
        } catch (error) {
          console.error(`❌ Erro ao contar clientes da unidade ${unidade.id}:`, error)
          clientesCount[unidade.id] = 0
        }
      }
      setClientesPorUnidade(clientesCount)

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

  const carregarClientes = async () => {
    if (!revendaId) {
      setCarregando(false)
      return
    }

    // Se não houver unidade selecionada, não carrega clientes
    if (!unidadeSelecionadaId) {
      setClientes([])
      setCarregando(false)
      return
    }

    setCarregando(true)
    setErro(null)
    try {
      const { clientes: clientesData, error } = await listarClientesRevenda(revendaId, unidadeSelecionadaId)
      if (error) {
        console.error('❌ Erro ao carregar clientes:', error)
        setErro('Erro ao carregar clientes')
        setClientes([])
        return
      }
      setClientes(clientesData || [])
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar clientes:', error)
      setErro('Erro inesperado ao carregar clientes')
      setClientes([])
    } finally {
      setCarregando(false)
    }
  }

  const carregarPedidosCliente = async (clienteId: string) => {
    if (!revendaId) return

    setCarregandoPedidos(true)
    try {
      const { pedidos: pedidosData, error } = await listarPedidosRevenda(revendaId)
      if (!error && pedidosData) {
        // Filtra apenas pedidos deste cliente
        const pedidosFiltrados = pedidosData.filter(p => p.cliente_id === clienteId)
        setPedidosCliente(pedidosFiltrados)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar pedidos do cliente:', error)
    } finally {
      setCarregandoPedidos(false)
    }
  }

  const abrirDetalhesCliente = async (cliente: typeof clientes[0]) => {
    setClienteSelecionado(cliente)
    setSheetAberto(true)
    await carregarPedidosCliente(cliente.id)
  }

  // Filtragem dos clientes
  const clientesFiltrados = useMemo(() => {
    if (!clientes || clientes.length === 0) return []
    let filtrados = [...clientes]

    // Filtro de busca
    if (busca) {
      const buscaLower = busca.toLowerCase()
      filtrados = filtrados.filter(cliente => {
        const nome = cliente.nome_completo?.toLowerCase() || ''
        const email = cliente.email?.toLowerCase() || ''
        const telefone = cliente.telefone?.toLowerCase() || ''
        const cpf = cliente.cpf?.toLowerCase() || ''
        
        return nome.includes(buscaLower) ||
               email.includes(buscaLower) ||
               telefone.includes(buscaLower) ||
               cpf.includes(buscaLower)
      })
    }

    // Filtro de data (baseado no último pedido)
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
          filtrados = filtrados.filter(cliente => {
            if (!cliente.ultimo_pedido) return false
            const dataUltimoPedido = new Date(cliente.ultimo_pedido)
            return dataUltimoPedido >= dataInicio && dataUltimoPedido <= dataFim
          })
        }
        return filtrados
      } else {
        const dias = parseInt(dataFiltro)
        dataInicio = new Date(hoje)
        dataInicio.setDate(hoje.getDate() - dias)
      }
      
      filtrados = filtrados.filter(cliente => {
        if (!cliente.ultimo_pedido) return false
        const dataUltimoPedido = new Date(cliente.ultimo_pedido)
        return dataUltimoPedido >= dataInicio
      })
    }

    return filtrados
  }, [clientes, busca, dataFiltro, dataInicioPersonalizada, dataFimPersonalizada])

  const limparFiltros = () => {
    setBusca('')
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

  if (carregando && clientes.length === 0) {
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
            <Users className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Clientes
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Visualize e gerencie todos os clientes que realizaram pedidos na sua revenda
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
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        </div>
      )}

      {/* Seleção de Unidade */}
      {revendaId && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Selecione uma unidade para visualizar clientes
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
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                          <p className="text-neutral-500 dark:text-neutral-400 text-xs">Clientes</p>
                          <p className="font-medium flex items-center gap-1 text-neutral-900 dark:text-neutral-50">
                            <Users className="w-4 h-4" />
                            {clientesPorUnidade[unidade.id] || 0}
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

      {/* Filtros e Lista de Clientes - Só mostra se houver unidade selecionada */}
      {unidadeSelecionadaId && (
        <>
          {/* Filtros Avançados */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">
                Buscar
              </label>
              <Input
                placeholder="Nome, email, telefone, CPF..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="border-neutral-300 dark:border-neutral-700"
              />
            </div>

            <div className="min-w-[180px]">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">
                Data do Último Pedido
              </label>
              <SelectMenu
                value={dataFiltro}
                onChange={(value) => setDataFiltro(value as typeof dataFiltro)}
                options={[
                  { value: 'tudo', label: 'Tudo' },
                  { value: 'hoje', label: 'Hoje' },
                  { value: '7', label: 'Últimos 7 dias' },
                  { value: '15', label: 'Últimos 15 dias' },
                  { value: '30', label: 'Últimos 30 dias' },
                  { value: 'personalizado', label: 'Personalizado' },
                ]}
              />
            </div>

            {dataFiltro === 'personalizado' && (
              <div className="min-w-[250px]">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">
                  Data Personalizada
                </label>
                <Dropdown
                  isOpen={dropdownCalendarioAberto}
                  onToggle={setDropdownCalendarioAberto}
                  trigger={
                    <Button
                      variant="outline"
                      className="w-full justify-start border-neutral-300 dark:border-neutral-700"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {dataInicioPersonalizada && dataFimPersonalizada
                        ? `${formatarData(dataInicioPersonalizada)} - ${formatarData(dataFimPersonalizada)}`
                        : 'Selecione o período'}
                    </Button>
                  }
                >
                  <DateRangePicker
                    startDate={dataInicioPersonalizada}
                    endDate={dataFimPersonalizada}
                    onStartDateChange={setDataInicioPersonalizada}
                    onEndDateChange={setDataFimPersonalizada}
                    onClose={() => setDropdownCalendarioAberto(false)}
                  />
                </Dropdown>
              </div>
            )}

            <Button
              variant="outline"
              onClick={limparFiltros}
              className="border-neutral-300 dark:border-neutral-700 whitespace-nowrap"
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      {clientesFiltrados.length === 0 ? (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
              {clientes.length === 0
                ? 'Nenhum cliente encontrado'
                : 'Nenhum cliente corresponde aos filtros aplicados'}
            </p>
          </CardContent>
        </Card>
      ) : visualizacao === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientesFiltrados.map((cliente) => (
            <Card
              key={cliente.id}
              className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    {cliente.nome_completo || 'Cliente sem nome'}
                  </div>
                  {cliente.inadimplente && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Inadimplente
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-600 dark:text-neutral-400">{cliente.email}</span>
                  </div>
                  {cliente.telefone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-neutral-500" />
                      <span className="text-neutral-600 dark:text-neutral-400">{cliente.telefone}</span>
                    </div>
                  )}
                  {cliente.cpf && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-neutral-500" />
                      <span className="text-neutral-600 dark:text-neutral-400">{cliente.cpf}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Total de Pedidos</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                      {cliente.total_pedidos}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Valor Total</p>
                    <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                      {formatarPreco(cliente.valor_total_gasto)}
                    </p>
                  </div>
                </div>
                {cliente.inadimplente && (
                  <div className="pt-3 border-t border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-2 space-y-2">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-xs font-medium">
                        {cliente.total_parcelas_atrasadas} parcela{cliente.total_parcelas_atrasadas > 1 ? 's' : ''} atrasada{cliente.total_parcelas_atrasadas > 1 ? 's' : ''}
                      </p>
                    </div>
                    {cliente.pedido_inadimplente_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/revenda/pedidos/${cliente.pedido_inadimplente_id}`)}
                        className="w-full border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 text-xs"
                      >
                        <ShoppingCart className="w-3 h-3 mr-2" />
                        Ver Pedido Relacionado
                      </Button>
                    )}
                  </div>
                )}
                {cliente.ultimo_pedido && (
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Último Pedido</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {formatarData(cliente.ultimo_pedido)}
                    </p>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abrirDetalhesCliente(cliente)}
                  className="w-full border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalhes e Histórico
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {clientesFiltrados.map((cliente) => (
            <Card
              key={cliente.id}
              className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <User className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                            {cliente.nome_completo || 'Cliente sem nome'}
                          </h3>
                          {cliente.inadimplente && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Inadimplente
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{cliente.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {cliente.telefone && (
                        <div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Telefone</p>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {cliente.telefone}
                          </p>
                        </div>
                      )}
                      {cliente.cpf && (
                        <div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">CPF</p>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {cliente.cpf}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Total de Pedidos</p>
                        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                          {cliente.total_pedidos}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Valor Total</p>
                        <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                          {formatarPreco(cliente.valor_total_gasto)}
                        </p>
                      </div>
                    </div>
                    {cliente.inadimplente && (
                      <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-2 space-y-2">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                          <AlertCircle className="w-4 h-4" />
                          <p className="text-xs font-medium">
                            {cliente.total_parcelas_atrasadas} parcela{cliente.total_parcelas_atrasadas > 1 ? 's' : ''} atrasada{cliente.total_parcelas_atrasadas > 1 ? 's' : ''}
                          </p>
                        </div>
                        {cliente.pedido_inadimplente_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/revenda/pedidos/${cliente.pedido_inadimplente_id}`)}
                            className="w-full border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 text-xs"
                          >
                            <ShoppingCart className="w-3 h-3 mr-2" />
                            Ver Pedido Relacionado
                          </Button>
                        )}
                      </div>
                    )}
                    {cliente.ultimo_pedido && (
                      <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                        <p className="text-xs text-neutral-500 dark:text-neutral-500">Último Pedido</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {formatarData(cliente.ultimo_pedido)}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirDetalhesCliente(cliente)}
                      className="border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
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

      {/* Sheet de Detalhes do Cliente */}
      <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do Cliente</SheetTitle>
            <SheetDescription>
              Informações completas e histórico de compras
            </SheetDescription>
          </SheetHeader>

          {clienteSelecionado && (
            <div className="mt-6 space-y-6">
              <Tabs defaultValue="dados" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="dados">Dados do Cliente</TabsTrigger>
                  <TabsTrigger value="historico">Histórico de Compras</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Nome Completo</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {clienteSelecionado.nome_completo || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Email</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {clienteSelecionado.email}
                        </p>
                      </div>
                      {clienteSelecionado.telefone && (
                        <div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Telefone</p>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {clienteSelecionado.telefone}
                          </p>
                        </div>
                      )}
                      {clienteSelecionado.cpf && (
                        <div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">CPF</p>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {clienteSelecionado.cpf}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Estatísticas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Total de Pedidos</p>
                          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                            {clienteSelecionado.total_pedidos}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Valor Total Gasto</p>
                          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                            {formatarPreco(clienteSelecionado.valor_total_gasto)}
                          </p>
                        </div>
                      </div>
                      {clienteSelecionado.inadimplente && (
                        <div className="pt-3 border-t border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-sm font-medium">
                              Cliente Inadimplente
                            </p>
                          </div>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {clienteSelecionado.total_parcelas_atrasadas} parcela{clienteSelecionado.total_parcelas_atrasadas > 1 ? 's' : ''} atrasada{clienteSelecionado.total_parcelas_atrasadas > 1 ? 's' : ''}
                          </p>
                          {clienteSelecionado.pedido_inadimplente_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSheetAberto(false)
                                navigate(`/revenda/pedidos/${clienteSelecionado.pedido_inadimplente_id}`)
                              }}
                              className="w-full border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Ver Pedido com Parcelas Atrasadas
                            </Button>
                          )}
                        </div>
                      )}
                      {clienteSelecionado.ultimo_pedido && (
                        <div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Último Pedido</p>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {formatarData(clienteSelecionado.ultimo_pedido)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="historico" className="space-y-4 mt-4">
                  {carregandoPedidos ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : pedidosCliente.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <ShoppingCart className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                          Nenhum pedido encontrado para este cliente
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {pedidosCliente.map((pedido) => (
                        <Card key={pedido.id} className="border-neutral-200 dark:border-neutral-800">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <ShoppingCart className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                  <span className="font-medium text-neutral-900 dark:text-neutral-50">
                                    Pedido #{pedido.id.slice(0, 8).toUpperCase()}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    pedido.status === 'pendente' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                    pedido.status === 'confirmado' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                    pedido.status === 'preparando' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                                    pedido.status === 'pronto' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' :
                                    pedido.status === 'em_transito' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' :
                                    pedido.status === 'entregue' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  }`}>
                                    {pedido.status === 'pendente' ? 'Pendente' :
                                     pedido.status === 'confirmado' ? 'Confirmado' :
                                     pedido.status === 'preparando' ? 'Preparando' :
                                     pedido.status === 'pronto' ? 'Pronto' :
                                     pedido.status === 'em_transito' ? 'Em Trânsito' :
                                     pedido.status === 'entregue' ? 'Entregue' :
                                     'Cancelado'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Data</p>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-50">
                                      {formatarData(pedido.criado_em)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-500">Valor Total</p>
                                    <p className="font-medium text-violet-600 dark:text-violet-400">
                                      {formatarPreco(pedido.valor_total)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSheetAberto(false)
                                  navigate(`/revenda/pedidos/${pedido.id}`)
                                }}
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
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
        </>
      )}
    </div>
  )
}

