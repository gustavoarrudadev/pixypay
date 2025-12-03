import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, Search, Store, Eye, LayoutGrid, List, ArrowLeft, CheckCircle2, XCircle, TrendingUp, PieChart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { DateRangePickerCompact } from '@/components/ui/date-range-picker-compact'
import { Dropdown } from '@/components/ui/dropdown'
import { Select } from '@/components/ui/select'
import { listarAgendamentosEntregaAdmin } from '@/lib/gerenciarAgendamentoEntrega'
import { formatarPreco } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { FiltrosRevendaUnidade } from '@/components/admin/FiltrosRevendaUnidade'
import { FiltrosAvancados } from '@/components/admin/FiltrosAvancados'

export default function AgendamentosAdmin() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(false)
  const [carregandoDashboard, setCarregandoDashboard] = useState(false)
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [agendamentosTodos, setAgendamentosTodos] = useState<any[]>([])
  const [metricasAnteriores, setMetricasAnteriores] = useState({
    totalAgendamentos: 0,
    agendados: 0,
    confirmados: 0,
    realizados: 0,
  })
  const [revendaSelecionada, setRevendaSelecionada] = useState<string | null>(null)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid')
  
  // Filtros avançados
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'agendado' | 'confirmado' | 'realizado' | 'cancelado'>('todos')
  const [dataFiltro, setDataFiltro] = useState<'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'>('tudo')
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('')
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)

  useEffect(() => {
    if (revendaSelecionada) {
      carregarAgendamentos()
    } else {
      carregarAgendamentosDashboard()
    }
  }, [revendaSelecionada, unidadeSelecionada])

  const carregarAgendamentosDashboard = async () => {
    setCarregandoDashboard(true)
    setErro(null)
    try {
      const { agendamentos: agendamentosData, error } = await listarAgendamentosEntregaAdmin()
      if (error) {
        console.error('❌ Erro ao carregar agendamentos:', error)
        setErro('Erro ao carregar agendamentos')
        setAgendamentosTodos([])
      } else {
        setAgendamentosTodos(agendamentosData || [])
        
        // Calcular métricas anteriores (dia anterior) filtrando por data de agendamento
        const hoje = new Date()
        const ontem = new Date(hoje)
        ontem.setDate(ontem.getDate() - 1)
        ontem.setHours(0, 0, 0, 0)
        const fimOntem = new Date(ontem)
        fimOntem.setHours(23, 59, 59, 999)
        
        const agendamentosOntem = (agendamentosData || []).filter(a => {
          const dataAgendamento = new Date(a.data_agendamento)
          return dataAgendamento >= ontem && dataAgendamento <= fimOntem
        })
        
        setMetricasAnteriores({
          totalAgendamentos: agendamentosOntem.length,
          agendados: agendamentosOntem.filter(a => a.status === 'agendado').length,
          confirmados: agendamentosOntem.filter(a => a.status === 'confirmado').length,
          realizados: agendamentosOntem.filter(a => a.status === 'realizado').length,
        })
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar agendamentos:', error)
      setErro('Erro inesperado ao carregar agendamentos')
      setAgendamentosTodos([])
    } finally {
      setCarregandoDashboard(false)
      setCarregando(false)
    }
  }

  const carregarAgendamentos = async () => {
    if (!revendaSelecionada) {
      setAgendamentos([])
      setCarregando(false)
      return
    }

    setCarregando(true)
    setErro(null)
    try {
      const { agendamentos: agendamentosData, error } = await listarAgendamentosEntregaAdmin(revendaSelecionada, unidadeSelecionada || undefined)
      if (error) {
        console.error('❌ Erro ao carregar agendamentos:', error)
        setErro('Erro ao carregar agendamentos')
        setAgendamentos([])
        return
      }
      setAgendamentos(agendamentosData || [])
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar agendamentos:', error)
      setErro('Erro inesperado ao carregar agendamentos')
      setAgendamentos([])
    } finally {
      setCarregando(false)
    }
  }

  // Lista base de agendamentos (dashboard ou filtrado por revenda)
  const listaAgendamentos = revendaSelecionada ? agendamentos : agendamentosTodos

  // Filtragem dos agendamentos
  const agendamentosFiltrados = useMemo(() => {
    if (!listaAgendamentos || listaAgendamentos.length === 0) return []
    let filtrados = [...listaAgendamentos]

    // Filtro de busca
    if (busca) {
      const buscaLower = busca.toLowerCase()
      filtrados = filtrados.filter(agendamento => {
        const pedidoId = agendamento.pedido?.id?.toLowerCase() || ''
        const revendaNome = (agendamento.pedido?.revenda?.nome_publico || agendamento.pedido?.revenda?.nome_revenda || agendamento.revenda?.nome_publico || agendamento.revenda?.nome_revenda)?.toLowerCase() || ''
        const unidadeNome = agendamento.pedido?.unidade ? (agendamento.pedido.unidade.nome_publico || agendamento.pedido.unidade.nome)?.toLowerCase() || '' : ''
        const clienteNome = agendamento.cliente?.nome_completo?.toLowerCase() || ''
        const clienteEmail = agendamento.cliente?.email?.toLowerCase() || ''
        const pedidoClienteNome = agendamento.pedido?.dados_cliente?.nome?.toLowerCase() || ''
        
        return pedidoId.includes(buscaLower) ||
               revendaNome.includes(buscaLower) ||
               unidadeNome.includes(buscaLower) ||
               clienteNome.includes(buscaLower) ||
               clienteEmail.includes(buscaLower) ||
               pedidoClienteNome.includes(buscaLower)
      })
    }

    // Filtro de status
    if (statusFiltro !== 'todos') {
      filtrados = filtrados.filter(agendamento => agendamento.status === statusFiltro)
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
          filtrados = filtrados.filter(agendamento => {
            const dataAgendamento = new Date(agendamento.data_agendamento)
            return dataAgendamento >= dataInicio && dataAgendamento <= dataFim
          })
        }
        return filtrados
      } else {
        const dias = parseInt(dataFiltro)
        dataInicio = new Date(hoje)
        dataInicio.setDate(hoje.getDate() - dias)
      }
      
      filtrados = filtrados.filter(agendamento => {
        const dataAgendamento = new Date(agendamento.data_agendamento)
        return dataAgendamento >= dataInicio
      })
    }

    return filtrados
  }, [listaAgendamentos, busca, statusFiltro, dataFiltro, dataInicioPersonalizada, dataFimPersonalizada])

  const limparFiltros = () => {
    setBusca('')
    setStatusFiltro('todos')
    setDataFiltro('tudo')
    setDataInicioPersonalizada('')
    setDataFimPersonalizada('')
    setDropdownCalendarioAberto(false)
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  if (carregando && agendamentos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Calendar className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Agendamentos de Entrega
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {revendaSelecionada 
              ? `Agendamentos da revenda selecionada (${agendamentos.length} ${agendamentos.length === 1 ? 'agendamento' : 'agendamentos'})`
              : 'Visualize e gerencie todos os agendamentos de entrega da plataforma'}
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
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        </div>
      )}

      {/* Métricas Gerais - Sempre visíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Total de Agendamentos</p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                  {listaAgendamentos.length}
                </p>
                {(() => {
                  const atual = listaAgendamentos.length
                  const anterior = metricasAnteriores.totalAgendamentos
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
              <Calendar className="w-8 h-8 text-violet-600 dark:text-violet-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Agendados</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {listaAgendamentos.filter(a => a.status === 'agendado').length}
                </p>
                {(() => {
                  const atual = listaAgendamentos.filter(a => a.status === 'agendado').length
                  const anterior = metricasAnteriores.agendados
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
              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Confirmados</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {listaAgendamentos.filter(a => a.status === 'confirmado').length}
                </p>
                {(() => {
                  const atual = listaAgendamentos.filter(a => a.status === 'confirmado').length
                  const anterior = metricasAnteriores.confirmados
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
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Realizados</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {listaAgendamentos.filter(a => a.status === 'realizado').length}
                </p>
                {(() => {
                  const atual = listaAgendamentos.filter(a => a.status === 'realizado').length
                  const anterior = metricasAnteriores.realizados
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
              <CheckCircle2 className="w-8 h-8 text-purple-600 dark:text-purple-400 opacity-50" />
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
            { value: 'agendado', label: 'Agendado' },
            { value: 'confirmado', label: 'Confirmado' },
            { value: 'realizado', label: 'Realizado' },
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
                    Use o seletor acima para filtrar por revenda específica e visualizar agendamentos detalhados, histórico completo e gerenciar status.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Lista de Agendamentos */}
          {agendamentosFiltrados.length === 0 ? (
            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                  {agendamentos.length === 0
                    ? 'Nenhum agendamento encontrado'
                    : 'Nenhum agendamento corresponde aos filtros aplicados'}
                </p>
              </CardContent>
            </Card>
          ) : visualizacao === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agendamentosFiltrados.map((agendamento) => (
                <Card
                  key={agendamento.id}
                  className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          <span className="font-medium text-neutral-900 dark:text-neutral-50">
                            {formatarData(agendamento.data_agendamento)}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          agendamento.status === 'realizado'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : agendamento.status === 'cancelado'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : agendamento.status === 'confirmado'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {agendamento.status === 'realizado' ? 'Realizado' :
                           agendamento.status === 'cancelado' ? 'Cancelado' :
                           agendamento.status === 'confirmado' ? 'Confirmado' : 'Agendado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          {agendamento.horario 
                            ? (typeof agendamento.horario === 'string' 
                                ? agendamento.horario.substring(0, 5) 
                                : agendamento.horario)
                            : agendamento.horario_inicio 
                              ? (typeof agendamento.horario_inicio === 'string'
                                  ? agendamento.horario_inicio.substring(0, 5)
                                  : agendamento.horario_inicio)
                              : 'Horário não definido'}
                        </span>
                      </div>
                      {agendamento.pedido?.revenda && (
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-neutral-500" />
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {agendamento.pedido.revenda.nome_publico || agendamento.pedido.revenda.nome_revenda}
                            {agendamento.pedido.unidade && ` - ${agendamento.pedido.unidade.nome_publico || agendamento.pedido.unidade.nome}`}
                          </span>
                        </div>
                      )}
                      {agendamento.pedido && (
                        <div className="space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                          <p className="text-xs text-neutral-500 dark:text-neutral-500">
                            Pedido #{agendamento.pedido.id.slice(0, 8).toUpperCase()}
                          </p>
                          {agendamento.pedido.dados_cliente && (
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                              Cliente: {agendamento.pedido.dados_cliente.nome}
                            </p>
                          )}
                          <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                            {formatarPreco(agendamento.pedido.valor_total)}
                          </p>
                        </div>
                      )}
                      {agendamento.pedido && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/pedidos/${agendamento.pedido.id}`)}
                          className="w-full border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Pedido
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {agendamentosFiltrados.map((agendamento) => (
                <Card
                  key={agendamento.id}
                  className="border-neutral-200 dark:border-neutral-800"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          <span className="font-medium text-neutral-900 dark:text-neutral-50">
                            {formatarData(agendamento.data_agendamento)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-neutral-500" />
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {agendamento.horario 
                              ? (typeof agendamento.horario === 'string' 
                                  ? agendamento.horario.substring(0, 5) 
                                  : agendamento.horario)
                              : agendamento.horario_inicio 
                                ? (typeof agendamento.horario_inicio === 'string'
                                    ? agendamento.horario_inicio.substring(0, 5)
                                    : agendamento.horario_inicio)
                                : 'Horário não definido'}
                          </span>
                        </div>
                        {agendamento.pedido?.revenda && (
                          <div className="flex items-center gap-2 mb-2">
                            <Store className="w-4 h-4 text-neutral-500" />
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                              {agendamento.pedido.revenda.nome_publico || agendamento.pedido.revenda.nome_revenda}
                              {agendamento.pedido.unidade && ` - ${agendamento.pedido.unidade.nome_publico || agendamento.pedido.unidade.nome}`}
                            </span>
                          </div>
                        )}
                        {agendamento.pedido && (
                          <div className="space-y-1">
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              Pedido #{agendamento.pedido.id.slice(0, 8).toUpperCase()}
                            </p>
                            {agendamento.pedido.dados_cliente && (
                              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                Cliente: {agendamento.pedido.dados_cliente.nome}
                              </p>
                            )}
                            <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                              {formatarPreco(agendamento.pedido.valor_total)}
                            </p>
                          </div>
                        )}
                        {agendamento.observacoes && (
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                            {agendamento.observacoes}
                          </p>
                        )}
                        {agendamento.pedido && (
                          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/pedidos/${agendamento.pedido.id}`)}
                              className="w-full border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Pedido
                            </Button>
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        agendamento.status === 'realizado'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : agendamento.status === 'cancelado'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : agendamento.status === 'confirmado'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {agendamento.status === 'realizado' ? 'Realizado' :
                         agendamento.status === 'cancelado' ? 'Cancelado' :
                         agendamento.status === 'confirmado' ? 'Confirmado' : 'Agendado'}
                      </span>
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

