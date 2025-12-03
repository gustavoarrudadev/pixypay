import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { ShoppingBag, ShoppingCart, CreditCard, TrendingUp, Clock, CheckCircle2, AlertCircle, LayoutDashboard, Filter, Search, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNavigate } from 'react-router-dom'
import { listarPedidosCliente } from '@/lib/gerenciarPedidos'
import { listarParcelamentos } from '@/lib/gerenciarParcelamentos'
import { formatarPreco } from '@/lib/utils'
import { obterSessao } from '@/lib/auth'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePickerCompact } from '@/components/ui/date-range-picker-compact'

/**
 * Dashboard Cliente
 * 
 * Visão simplificada e útil para o cliente com suas principais informações.
 */
export default function DashboardCliente() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [pedidos, setPedidos] = useState<any[]>([])
  const [parcelamentos, setParcelamentos] = useState<any[]>([])
  const [metricasAnteriores, setMetricasAnteriores] = useState({
    totalPedidos: 0,
    pedidosEntregues: 0,
    totalGasto: 0,
    parcelamentosAtivos: 0,
  })
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'customizado'>('mes')
  const [dataInicio, setDataInicio] = useState<Date | null>(null)
  const [dataFim, setDataFim] = useState<Date | null>(null)
  const [dataInicioString, setDataInicioString] = useState<string>('')
  const [dataFimString, setDataFimString] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)
  const [buscaGlobal, setBuscaGlobal] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultadosBusca, setResultadosBusca] = useState<Array<{
    tipo: 'pedido' | 'parcelamento' | 'funcionalidade'
    id?: string
    titulo: string
    subtitulo?: string
    rota: string
  }>>([])
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const buscaTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const buscaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    carregarDados()
    
    // Atualização automática a cada 60 segundos
    const interval = setInterval(() => {
      carregarDados()
    }, 60000)

    return () => clearInterval(interval)
  }, [filtroPeriodo, dataInicio, dataFim])

  // Função de busca global
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
        tipo: 'pedido' | 'parcelamento' | 'funcionalidade'
        id?: string
        titulo: string
        subtitulo?: string
        rota: string
      }> = []

      // Busca em funcionalidades/páginas do sistema
      const funcionalidades = [
        { nome: 'Dashboard', rota: '/cliente/dashboard', palavras: ['dashboard', 'inicio', 'principal', 'home'] },
        { nome: 'Minhas Compras', rota: '/cliente/compras', palavras: ['compras', 'compra', 'historico', 'histórico'] },
        { nome: 'Pedidos', rota: '/cliente/pedidos', palavras: ['pedidos', 'pedido', 'vendas', 'venda'] },
        { nome: 'Parcelamentos', rota: '/cliente/parcelamentos', palavras: ['parcelamentos', 'parcelamento', 'parcelas', 'parcela'] },
        { nome: 'Meus Favoritos', rota: '/cliente/favoritos', palavras: ['favoritos', 'favorito', 'favoritas', 'favorita'] },
        { nome: 'Negociações', rota: '/cliente/negociacoes', palavras: ['negociacoes', 'negociação', 'negociacoes', 'negociação'] },
        { nome: 'Ajuda', rota: '/cliente/ajuda', palavras: ['ajuda', 'help', 'suporte', 'faq', 'duvidas'] },
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

      // Busca em pedidos
      try {
        const session = await obterSessao()
        if (session?.user?.id) {
          const { pedidos: pedidosTodos } = await listarPedidosCliente(session.user.id)
          pedidosTodos.forEach(p => {
            if (
              p.id.toLowerCase().includes(termoLower) ||
              p.status?.toLowerCase().includes(termoLower)
            ) {
              resultados.push({
                tipo: 'pedido',
                id: p.id,
                titulo: `Pedido #${p.id.slice(0, 8).toUpperCase()}`,
                subtitulo: `Status: ${p.status}`,
                rota: `/cliente/pedidos`
              })
            }
          })
        }
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error)
      }

      // Busca em parcelamentos
      try {
        const session = await obterSessao()
        if (session?.user?.id) {
          const { parcelamentos: parcelamentosTodos } = await listarParcelamentos(session.user.id)
          parcelamentosTodos.forEach(parc => {
            if (
              parc.id.toLowerCase().includes(termoLower) ||
              parc.pedido?.id.toLowerCase().includes(termoLower)
            ) {
              resultados.push({
                tipo: 'parcelamento',
                id: parc.id,
                titulo: `Parcelamento #${parc.id.slice(0, 8).toUpperCase()}`,
                subtitulo: `Pedido: ${parc.pedido?.id.slice(0, 8).toUpperCase() || 'N/A'}`,
                rota: `/cliente/parcelamentos`
              })
            }
          })
        }
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

  // Busca em tempo real com debounce
  useEffect(() => {
    if (buscaTimeoutRef.current) {
      clearTimeout(buscaTimeoutRef.current)
    }
    buscaTimeoutRef.current = setTimeout(() => {
      handleBuscaGlobal(buscaGlobal)
    }, 300)

    return () => {
      if (buscaTimeoutRef.current) {
        clearTimeout(buscaTimeoutRef.current)
      }
    }
  }, [buscaGlobal, handleBuscaGlobal])

  const carregarDados = async () => {
    try {
      setCarregando(true)
      const session = await obterSessao()
      if (!session?.user?.id) {
        navigate('/login')
        return
      }

      const clienteId = session.user.id

      // Carregar pedidos e parcelamentos
      const [pedidosResult, parcelamentosResult] = await Promise.all([
        listarPedidosCliente(clienteId),
        listarParcelamentos(clienteId)
      ])

      if (!pedidosResult.error) {
        const pedidosTodos = pedidosResult.pedidos || []
        
        // Aplicar filtro de período
        const agora = new Date()
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

        const pedidosFiltrados = pedidosTodos.filter(p => {
          const dataPedido = new Date(p.criado_em)
          return dataPedido >= dataInicioFiltro && dataPedido <= dataFimFiltro
        })
        
        setPedidos(pedidosFiltrados)
        
        // Calcular métricas anteriores (mês anterior)
        const hoje = new Date()
        const mesAnterior = new Date(hoje)
        mesAnterior.setMonth(mesAnterior.getMonth() - 1)
        mesAnterior.setDate(1)
        mesAnterior.setHours(0, 0, 0, 0)
        const fimMesAnterior = new Date(mesAnterior)
        fimMesAnterior.setMonth(fimMesAnterior.getMonth() + 1)
        fimMesAnterior.setDate(0)
        fimMesAnterior.setHours(23, 59, 59, 999)
        
        const pedidosMesAnterior = pedidosTodos.filter(p => {
          const dataPedido = new Date(p.criado_em)
          return dataPedido >= mesAnterior && dataPedido <= fimMesAnterior
        })
        
        setMetricasAnteriores({
          totalPedidos: pedidosMesAnterior.length,
          pedidosEntregues: pedidosMesAnterior.filter(p => p.status === 'entregue').length,
          totalGasto: pedidosMesAnterior.reduce((sum, p) => sum + p.valor_total, 0),
          parcelamentosAtivos: 0, // Será calculado quando houver dados históricos
        })
      }

      if (!parcelamentosResult.error) {
        setParcelamentos(parcelamentosResult.parcelamentos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setCarregando(false)
    }
  }

  const metricas = useMemo(() => {
    const totalPedidos = pedidos.length
    const pedidosEntregues = pedidos.filter(p => p.status === 'entregue').length
    const pedidosPendentes = pedidos.filter(p => ['pendente', 'confirmado', 'preparando', 'pronto', 'em_transito'].includes(p.status)).length
    const totalGasto = pedidos.reduce((sum, p) => sum + p.valor_total, 0)
    const parcelamentosAtivos = parcelamentos.filter(p => p.status === 'ativo').length
    
    // Próxima parcela a vencer
    const proximaParcela = parcelamentos
      .flatMap(p => (p.parcelas || []).filter(parc => parc.status === 'pendente'))
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())[0]

    return {
      totalPedidos,
      pedidosEntregues,
      pedidosPendentes,
      totalGasto,
      parcelamentosAtivos,
      proximaParcela,
    }
  }, [pedidos, parcelamentos])

  const ultimosPedidos = useMemo(() => {
    return pedidos
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
      .slice(0, 3)
  }, [pedidos])

  const proximasParcelas = useMemo(() => {
    return parcelamentos
      .flatMap(p => (p.parcelas || []).filter(parc => parc.status === 'pendente'))
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
      .slice(0, 3)
  }, [parcelamentos])

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in dashboard-mobile">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-violet-600 dark:text-violet-400" />
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-1">
          Visão geral das suas compras e pedidos
        </p>
      </div>

      {/* Filtros Avançados */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-400" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Busca e Filtros em uma única linha */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 sm:gap-4">
            {/* Barra de Busca Global com Dropdown */}
            <div className="relative w-full sm:flex-1 sm:min-w-[250px]">
              <label className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                Busca Rápida
              </label>
              <div className="relative">
                <Input
                  ref={buscaInputRef}
                  type="text"
                  placeholder="Buscar pedidos, parcelamentos, funcionalidades..."
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
            <div className="space-y-2 w-full sm:flex-1 sm:min-w-[200px]">
              <label className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
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
              <div className="space-y-2 w-full sm:flex-1 sm:min-w-[200px]">
                <label className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
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

      {/* Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500">Total de Pedidos</p>
                <p className="text-xl sm:text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                  {metricas.totalPedidos}
                </p>
                {(() => {
                  const atual = metricas.totalPedidos
                  const anterior = metricasAnteriores.totalPedidos
                  if (anterior > 0) {
                    const variacao = ((atual - anterior) / anterior) * 100
                    return (
                      <p className={`text-xs mt-1 ${variacao >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {variacao >= 0 ? '↑' : '↓'} {Math.abs(variacao).toFixed(1)}% vs mês anterior
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
              <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-violet-600 dark:text-violet-400 opacity-50 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500">Pedidos Pendentes</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {metricas.pedidosPendentes}
                </p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 dark:text-yellow-400 opacity-50 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500">Pedidos Entregues</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {metricas.pedidosEntregues}
                </p>
                {(() => {
                  const atual = metricas.pedidosEntregues
                  const anterior = metricasAnteriores.pedidosEntregues
                  if (anterior > 0) {
                    const variacao = ((atual - anterior) / anterior) * 100
                    return (
                      <p className={`text-xs mt-1 ${variacao >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {variacao >= 0 ? '↑' : '↓'} {Math.abs(variacao).toFixed(1)}% vs mês anterior
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
              <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400 opacity-50 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500">Total Gasto</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 truncate">
                  {formatarPreco(metricas.totalGasto)}
                </p>
                {(() => {
                  const atual = metricas.totalGasto
                  const anterior = metricasAnteriores.totalGasto
                  if (anterior > 0) {
                    const variacao = ((atual - anterior) / anterior) * 100
                    return (
                      <p className={`text-xs mt-1 ${variacao >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {variacao >= 0 ? '↑' : '↓'} {Math.abs(variacao).toFixed(1)}% vs mês anterior
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 opacity-50 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda Linha de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Parcelamentos Ativos</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {metricas.parcelamentosAtivos}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-600 dark:text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Próxima Parcela</p>
                {metricas.proximaParcela ? (
                  <>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                      {formatarPreco(metricas.proximaParcela.valor)}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Vence em {new Date(metricas.proximaParcela.data_vencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </>
                ) : (
                  <p className="text-lg text-neutral-400 dark:text-neutral-500 mt-1">
                    Nenhuma parcela pendente
                  </p>
                )}
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Simples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Pedidos por Status */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg">Pedidos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {pedidos.length > 0 ? (
              <div className="space-y-3">
                {[
                  { status: 'entregue', label: 'Entregues', count: pedidos.filter(p => p.status === 'entregue').length, color: 'bg-green-500' },
                  { status: 'pendente', label: 'Pendentes', count: pedidos.filter(p => ['pendente', 'confirmado', 'preparando', 'pronto', 'em_transito'].includes(p.status)).length, color: 'bg-yellow-500' },
                  { status: 'cancelado', label: 'Cancelados', count: pedidos.filter(p => p.status === 'cancelado').length, color: 'bg-red-500' },
                ].map((item) => {
                  const percentual = pedidos.length > 0 ? (item.count / pedidos.length) * 100 : 0
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">{item.label}</span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-50">{item.count} ({percentual.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} transition-all duration-500`}
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">
                Nenhum pedido encontrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Parcelamentos */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg">Parcelamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {parcelamentos.length > 0 ? (
              <div className="space-y-3">
                {[
                  { status: 'paga', label: 'Parcelas Pagas', count: parcelamentos.reduce((sum, p) => sum + (p.parcelas?.filter(parc => parc.status === 'paga').length || 0), 0), color: 'bg-green-500' },
                  { status: 'pendente', label: 'Parcelas Pendentes', count: parcelamentos.reduce((sum, p) => sum + (p.parcelas?.filter(parc => parc.status === 'pendente').length || 0), 0), color: 'bg-yellow-500' },
                  { status: 'atrasada', label: 'Parcelas Atrasadas', count: parcelamentos.reduce((sum, p) => sum + (p.parcelas?.filter(parc => parc.status === 'atrasada').length || 0), 0), color: 'bg-red-500' },
                ].map((item) => {
                  const totalParcelas = parcelamentos.reduce((sum, p) => sum + (p.parcelas?.length || 0), 0)
                  const percentual = totalParcelas > 0 ? (item.count / totalParcelas) * 100 : 0
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">{item.label}</span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-50">{item.count} ({percentual.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} transition-all duration-500`}
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">
                Nenhum parcelamento encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximas Parcelas */}
      {proximasParcelas.length > 0 && (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Próximas Parcelas</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/cliente/parcelamentos')}
              >
                Ver Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximasParcelas.map((parcela, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/cliente/parcelamentos')}
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 dark:text-neutral-50">
                      Parcela {parcela.numero_parcela} de {parcela.total_parcelas}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Vence em {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-50">
                      {formatarPreco(parcela.valor)}
                    </p>
                    {parcela.status === 'atrasada' && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Atrasada
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Últimos Pedidos */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Últimos Pedidos</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/cliente/pedidos')}
            >
              Ver Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ultimosPedidos.length > 0 ? (
            <div className="space-y-3">
              {ultimosPedidos.map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/cliente/compras/${pedido.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 dark:text-neutral-50">
                      Pedido #{pedido.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {new Date(pedido.criado_em).toLocaleDateString('pt-BR')} • {formatarPreco(pedido.valor_total)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      pedido.status === 'entregue' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      pedido.status === 'cancelado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {pedido.status === 'entregue' ? 'Entregue' :
                       pedido.status === 'cancelado' ? 'Cancelado' :
                       'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">
              Nenhum pedido encontrado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

