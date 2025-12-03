import { useState, useEffect, useMemo } from 'react'
import { CreditCard, Search, Calendar, Store, Eye, LayoutGrid, List, ArrowLeft, CheckCircle2, Clock, XCircle, TrendingUp, PieChart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { DateRangePickerCompact } from '@/components/ui/date-range-picker-compact'
import { Dropdown } from '@/components/ui/dropdown'
import { Select } from '@/components/ui/select'
import { listarParcelamentosAdmin, type Parcelamento } from '@/lib/gerenciarParcelamentos'
import { ParcelaCard } from '@/components/parcelamentos/ParcelaCard'
import { formatarPreco } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { FiltrosRevendaUnidade } from '@/components/admin/FiltrosRevendaUnidade'
import { FiltrosAvancados } from '@/components/admin/FiltrosAvancados'

export default function ParcelamentosAdmin() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [carregandoDashboard, setCarregandoDashboard] = useState(false)
  const [parcelamentos, setParcelamentos] = useState<Parcelamento[]>([])
  const [parcelamentosTodos, setParcelamentosTodos] = useState<Parcelamento[]>([])
  const [revendaSelecionada, setRevendaSelecionada] = useState<string | null>(null)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid')
  const [metricasAnteriores, setMetricasAnteriores] = useState({
    totalParcelamentos: 0,
    parcelamentosAtivos: 0,
    parcelasPendentes: 0,
    valorTotal: 0,
  })
  
  // Filtros avançados
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'quitado' | 'cancelado'>('todos')
  const [statusParcelaFiltro, setStatusParcelaFiltro] = useState<'todos' | 'pendente' | 'paga' | 'atrasada'>('todos')
  const [dataFiltro, setDataFiltro] = useState<'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'>('tudo')
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('')
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)

  // Carregar dados iniciais quando o componente monta
  useEffect(() => {
    carregarParcelamentosDashboard()
  }, [])

  useEffect(() => {
    if (revendaSelecionada) {
      carregarParcelamentos()
    } else {
      carregarParcelamentosDashboard()
    }
  }, [revendaSelecionada, unidadeSelecionada])

  const carregarParcelamentosDashboard = async () => {
    console.log('🔄 [ParcelamentosAdmin] Carregando parcelamentos do dashboard...')
    setCarregandoDashboard(true)
    setCarregando(true)
    setErro(null)
    try {
      const { parcelamentos: parcelamentosData, error } = await listarParcelamentosAdmin()
      console.log('📦 [ParcelamentosAdmin] Resposta da API:', { parcelamentosData, error, quantidade: parcelamentosData?.length || 0 })
      if (error) {
        console.error('❌ Erro ao carregar parcelamentos:', error)
        setErro(`Erro ao carregar parcelamentos: ${error.message || 'Erro desconhecido'}`)
        setParcelamentosTodos([])
      } else {
        console.log(`✅ [ParcelamentosAdmin] ${parcelamentosData?.length || 0} parcelamentos carregados`)
        setParcelamentosTodos(parcelamentosData || [])
        
        // Calcular métricas anteriores (dia anterior) filtrando por data de criação
        const hoje = new Date()
        const ontem = new Date(hoje)
        ontem.setDate(ontem.getDate() - 1)
        ontem.setHours(0, 0, 0, 0)
        const fimOntem = new Date(ontem)
        fimOntem.setHours(23, 59, 59, 999)
        
        const parcelamentosOntem = (parcelamentosData || []).filter(p => {
          const dataCriacao = new Date(p.pedido?.criado_em || p.criado_em || '')
          return dataCriacao >= ontem && dataCriacao <= fimOntem
        })
        
        setMetricasAnteriores({
          totalParcelamentos: parcelamentosOntem.length,
          parcelamentosAtivos: parcelamentosOntem.filter(p => p.status === 'ativo').length,
          parcelasPendentes: parcelamentosOntem.reduce((sum, p) => sum + (p.parcelas?.filter(parc => parc.status === 'pendente').length || 0), 0),
          valorTotal: parcelamentosOntem.reduce((sum, p) => sum + (p.valor_total || 0), 0),
        })
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar parcelamentos:', error)
      setErro(`Erro inesperado ao carregar parcelamentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setParcelamentosTodos([])
    } finally {
      setCarregandoDashboard(false)
      setCarregando(false)
    }
  }

  const carregarParcelamentos = async () => {
    if (!revendaSelecionada) {
      setParcelamentos([])
      setCarregando(false)
      return
    }

    setCarregando(true)
    setErro(null)
    try {
      const { parcelamentos: parcelamentosData, error } = await listarParcelamentosAdmin(revendaSelecionada, unidadeSelecionada || undefined)
      if (error) {
        console.error('❌ Erro ao carregar parcelamentos:', error)
        setErro(`Erro ao carregar parcelamentos: ${error.message || 'Erro desconhecido'}`)
        setParcelamentos([])
      } else {
        setParcelamentos(parcelamentosData || [])
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar parcelamentos:', error)
      setErro(`Erro inesperado ao carregar parcelamentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setParcelamentos([])
    } finally {
      setCarregando(false)
    }
  }

  // Filtragem dos parcelamentos
  const parcelamentosFiltrados = useMemo(() => {
    // Usa parcelamentosTodos quando não há revenda selecionada, senão usa parcelamentos
    const listaBase = revendaSelecionada ? parcelamentos : parcelamentosTodos
    if (!listaBase || listaBase.length === 0) return []
    let filtrados = [...listaBase]

    // Filtro de busca
    if (busca) {
      const buscaLower = busca.toLowerCase()
      filtrados = filtrados.filter(parcelamento => {
        const pedidoId = parcelamento.pedido_id?.toLowerCase() || ''
        const revendaNome = parcelamento.pedido?.revenda?.nome_revenda?.toLowerCase() || ''
        const clienteNome = parcelamento.pedido?.dados_cliente?.nome?.toLowerCase() || ''
        const clienteEmail = parcelamento.pedido?.dados_cliente?.email?.toLowerCase() || ''
        const clienteTelefone = parcelamento.pedido?.dados_cliente?.telefone?.toLowerCase() || ''
        
        return pedidoId.includes(buscaLower) ||
               revendaNome.includes(buscaLower) ||
               clienteNome.includes(buscaLower) ||
               clienteEmail.includes(buscaLower) ||
               clienteTelefone.includes(buscaLower)
      })
    }

    // Filtro de status do parcelamento
    if (statusFiltro !== 'todos') {
      filtrados = filtrados.filter(parcelamento => parcelamento.status === statusFiltro)
    }

    // Filtro de status da parcela
    if (statusParcelaFiltro !== 'todos') {
      filtrados = filtrados.filter(parcelamento => {
        return parcelamento.parcelas && Array.isArray(parcelamento.parcelas) && parcelamento.parcelas.some(parcela => parcela.status === statusParcelaFiltro)
      })
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
          filtrados = filtrados.filter(parcelamento => {
            const dataPedido = new Date(parcelamento.pedido?.criado_em || parcelamento.criado_em)
            return dataPedido >= dataInicio && dataPedido <= dataFim
          })
        }
        return filtrados
      } else {
        const dias = parseInt(dataFiltro)
        dataInicio = new Date(hoje)
        dataInicio.setDate(hoje.getDate() - dias)
      }
      
      filtrados = filtrados.filter(parcelamento => {
        const dataPedido = new Date(parcelamento.pedido?.criado_em || parcelamento.criado_em)
        return dataPedido >= dataInicio
      })
    }

    return filtrados
  }, [revendaSelecionada, parcelamentos, parcelamentosTodos, busca, statusFiltro, statusParcelaFiltro, dataFiltro, dataInicioPersonalizada, dataFimPersonalizada])

  const limparFiltros = () => {
    setBusca('')
    setStatusFiltro('todos')
    setStatusParcelaFiltro('todos')
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

  if (carregando && parcelamentos.length === 0) {
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
            <CreditCard className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Crediário Digital
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {revendaSelecionada 
              ? `Parcelamentos da revenda selecionada (${parcelamentos.length} ${parcelamentos.length === 1 ? 'parcelamento' : 'parcelamentos'})`
              : 'Visualize e gerencie todos os parcelamentos da plataforma'}
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
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Total de Parcelamentos</p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                  {revendaSelecionada ? parcelamentos.length : parcelamentosTodos.length}
                </p>
                {(() => {
                  const atual = revendaSelecionada ? parcelamentos.length : parcelamentosTodos.length
                  const anterior = metricasAnteriores.totalParcelamentos
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
              <CreditCard className="w-8 h-8 text-violet-600 dark:text-violet-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Parcelamentos Ativos</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {(revendaSelecionada ? parcelamentos : parcelamentosTodos).filter(p => p.status === 'ativo').length}
                </p>
                {(() => {
                  const atual = (revendaSelecionada ? parcelamentos : parcelamentosTodos).filter(p => p.status === 'ativo').length
                  const anterior = metricasAnteriores.parcelamentosAtivos
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
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Parcelas Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {(revendaSelecionada ? parcelamentos : parcelamentosTodos).reduce((sum, p) => sum + (p.parcelas?.filter(parc => parc.status === 'pendente').length || 0), 0)}
                </p>
                {(() => {
                  const atual = (revendaSelecionada ? parcelamentos : parcelamentosTodos).reduce((sum, p) => sum + (p.parcelas?.filter(parc => parc.status === 'pendente').length || 0), 0)
                  const anterior = metricasAnteriores.parcelasPendentes
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
                  {formatarPreco((revendaSelecionada ? parcelamentos : parcelamentosTodos).reduce((sum, p) => sum + (p.valor_total || 0), 0))}
                </p>
                {(() => {
                  const atual = (revendaSelecionada ? parcelamentos : parcelamentosTodos).reduce((sum, p) => sum + (p.valor_total || 0), 0)
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

      {/* Dashboard quando não há revenda selecionada */}
      {!revendaSelecionada ? (
        <>

          {/* Distribuição por Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  Distribuição por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {parcelamentosTodos.length === 0 ? (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                      Nenhum parcelamento encontrado
                    </p>
                  ) : (
                    [
                      { status: 'ativo', label: 'Ativo' },
                      { status: 'quitado', label: 'Quitado' },
                      { status: 'atrasado', label: 'Atrasado' },
                      { status: 'cancelado', label: 'Cancelado' },
                    ].map(({ status, label }) => {
                      let count = 0
                      if (status === 'atrasado') {
                        // Contar parcelamentos com parcelas atrasadas
                        count = parcelamentosTodos.filter(p => {
                          const temParcelaAtrasada = p.parcelas?.some(parcela => 
                            parcela.status === 'atrasada' || 
                            (parcela.data_vencimento && new Date(parcela.data_vencimento) < new Date() && parcela.status === 'pendente')
                          )
                          return temParcelaAtrasada && p.status !== 'quitado' && p.status !== 'cancelado'
                        }).length
                      } else {
                        count = parcelamentosTodos.filter(p => p.status === status).length
                      }
                      const total = parcelamentosTodos.length
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
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Revendas */}
            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  Top Revendas por Parcelamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const porRevenda = new Map<string, { nome: string; quantidade: number; valor: number }>()
                    parcelamentosTodos.forEach(p => {
                      const revendaNome = p.pedido?.revenda?.nome_revenda || 'Desconhecida'
                      const existing = porRevenda.get(revendaNome) || { nome: revendaNome, quantidade: 0, valor: 0 }
                      existing.quantidade++
                      existing.valor += p.valor_total || 0
                      porRevenda.set(revendaNome, existing)
                    })
                    const topRevendas = Array.from(porRevenda.values())
                      .sort((a, b) => b.quantidade - a.quantidade)
                      .slice(0, 5)

                    return topRevendas.length === 0 ? (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                        Nenhum parcelamento encontrado
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
                              {revenda.quantidade} parcelamento(s)
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
                    Use o seletor acima para filtrar por revenda específica e visualizar parcelamentos detalhados, parcelas e histórico completo.
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
            statusFiltro={{
              value: statusFiltro,
              onChange: (value) => setStatusFiltro(value as typeof statusFiltro),
              options: [
                { value: 'todos', label: 'Todos' },
                { value: 'ativo', label: 'Ativo' },
                { value: 'quitado', label: 'Quitado' },
                { value: 'cancelado', label: 'Cancelado' },
              ],
              label: 'Status Parcelamento',
            }}
            statusFiltro2={{
              value: statusParcelaFiltro,
              onChange: (value) => setStatusParcelaFiltro(value as typeof statusParcelaFiltro),
              options: [
                { value: 'todos', label: 'Todos' },
                { value: 'pendente', label: 'Pendente' },
                { value: 'paga', label: 'Paga' },
                { value: 'atrasada', label: 'Atrasada' },
              ],
              label: 'Status Parcela',
            }}
            dataFiltro={{
              value: dataFiltro,
              onChange: setDataFiltro,
              dataInicio: dataInicioPersonalizada,
              dataFim: dataFimPersonalizada,
              onDataInicioChange: setDataInicioPersonalizada,
              onDataFimChange: setDataFimPersonalizada,
            }}
            placeholderBusca="Pedido, revenda, cliente..."
            onLimparFiltros={limparFiltros}
          />

          {/* Lista de Parcelamentos */}
          {parcelamentosFiltrados.length === 0 ? (
            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                  {(revendaSelecionada ? parcelamentos.length : parcelamentosTodos.length) === 0
                    ? 'Nenhum parcelamento encontrado'
                    : 'Nenhum parcelamento corresponde aos filtros aplicados'}
                </p>
              </CardContent>
            </Card>
          ) : visualizacao === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parcelamentosFiltrados.map((parcelamento) => (
                <Card
                  key={parcelamento.id}
                  className="border-neutral-200 dark:border-neutral-800"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          Pedido #{parcelamento.pedido_id?.slice(0, 8).toUpperCase() || 'N/A'}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {parcelamento.pedido?.revenda ? (
                            <>
                              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                {parcelamento.pedido.revenda.nome_publico || parcelamento.pedido.revenda.nome_revenda}
                              </p>
                              {parcelamento.pedido?.unidade && (
                                <>
                                  <span className="text-neutral-400 dark:text-neutral-600 text-xs">•</span>
                                  <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                                    {parcelamento.pedido.unidade.nome_publico || parcelamento.pedido.unidade.nome}
                                  </p>
                                </>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">N/A</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        parcelamento.status === 'ativo' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        parcelamento.status === 'quitado' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {parcelamento.status === 'ativo' ? 'Ativo' :
                         parcelamento.status === 'quitado' ? 'Quitado' : 'Cancelado'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">Cliente</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {parcelamento.pedido?.dados_cliente?.nome || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">Valor Total</p>
                      <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                        {formatarPreco(parcelamento.valor_total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">Parcelas</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        {parcelamento.parcelas.length} de {parcelamento.total_parcelas}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/pedidos/${parcelamento.pedido_id}`)}
                      className="w-full border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Pedido
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {parcelamentosFiltrados.map((parcelamento) => (
                <Card
                  key={parcelamento.id}
                  className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                            Pedido #{parcelamento.pedido_id?.slice(0, 8).toUpperCase() || 'N/A'}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            parcelamento.status === 'ativo' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            parcelamento.status === 'quitado' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}>
                            {parcelamento.status === 'ativo' ? 'Ativo' :
                             parcelamento.status === 'quitado' ? 'Quitado' : 'Cancelado'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              Loja
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {parcelamento.pedido?.revenda ? (
                                <>
                                  <p className="font-medium text-neutral-900 dark:text-neutral-50">
                                    {parcelamento.pedido.revenda.nome_publico || parcelamento.pedido.revenda.nome_revenda}
                                  </p>
                                  {parcelamento.pedido?.unidade && (
                                    <>
                                      <span className="text-neutral-400 dark:text-neutral-600">•</span>
                                      <p className="font-medium text-violet-600 dark:text-violet-400">
                                        {parcelamento.pedido.unidade.nome_publico || parcelamento.pedido.unidade.nome}
                                      </p>
                                    </>
                                  )}
                                </>
                              ) : (
                                <p className="font-medium text-neutral-900 dark:text-neutral-50">N/A</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">Cliente</p>
                            <p className="font-medium text-neutral-900 dark:text-neutral-50">
                              {parcelamento.pedido?.dados_cliente?.nome || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">Valor Total</p>
                            <p className="font-medium text-violet-600 dark:text-violet-400">
                              {formatarPreco(parcelamento.valor_total)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">Parcelas</p>
                            <p className="font-medium text-neutral-900 dark:text-neutral-50">
                              {parcelamento.parcelas.length} de {parcelamento.total_parcelas}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/pedidos/${parcelamento.pedido_id}`)}
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
    </div>
  )
}

