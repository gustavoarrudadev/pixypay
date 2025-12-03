import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, Settings, Trash2, AlertCircle, Eye, LayoutGrid, List, Search, Store, CheckCircle2, XCircle, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Dropdown } from '@/components/ui/dropdown'
import { buscarConfiguracaoAgendamento, atualizarConfiguracaoAgendamento, listarAgendamentosEntregaRevenda } from '@/lib/gerenciarAgendamentoEntrega'
import { obterRevendaId, obterUnidadeIdColaborador } from '@/lib/impersonation'
import { formatarPreco } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { listarUnidades, type UnidadeRevenda } from '@/lib/gerenciarUnidades'
import { Badge } from '@/components/ui/badge'

export default function Agendamentos() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [revendaId, setRevendaId] = useState<string | null>(null)
  
  // Estado de unidades
  const [unidades, setUnidades] = useState<UnidadeRevenda[]>([])
  const [carregandoUnidades, setCarregandoUnidades] = useState(true)
  const [unidadeSelecionadaId, setUnidadeSelecionadaId] = useState<string | null>(null)
  const [agendamentosPorUnidade, setAgendamentosPorUnidade] = useState<Record<string, number>>({})
  
  // Configuração de agendamento
  const [agendamentoLivre, setAgendamentoLivre] = useState(true)
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([])
  const [diasDisponiveis, setDiasDisponiveis] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [novoHorario, setNovoHorario] = useState('09:00')
  
  const DIAS_SEMANA = [
    { valor: 0, label: 'Domingo' },
    { valor: 1, label: 'Segunda-feira' },
    { valor: 2, label: 'Terça-feira' },
    { valor: 3, label: 'Quarta-feira' },
    { valor: 4, label: 'Quinta-feira' },
    { valor: 5, label: 'Sexta-feira' },
    { valor: 6, label: 'Sábado' },
  ]
  
  // Lista de agendamentos
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [carregandoAgendamentos, setCarregandoAgendamentos] = useState(false)
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid')
  
  // Filtros avançados
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'agendado' | 'confirmado' | 'realizado' | 'cancelado'>('todos')
  const [dataFiltro, setDataFiltro] = useState<'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'>('tudo')
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('')
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    if (revendaId) {
      carregarUnidades()
    }
  }, [revendaId])

  useEffect(() => {
    if (revendaId && unidadeSelecionadaId) {
      carregarConfiguracaoUnidade()
      carregarAgendamentos()
    }
  }, [revendaId, unidadeSelecionadaId])

  const carregarDados = async () => {
    setCarregando(true)
    setErro(null)
    try {
      const revendaIdAtual = await obterRevendaId()
      if (!revendaIdAtual) {
        setErro('Erro ao carregar dados da revenda')
        return
      }

      setRevendaId(revendaIdAtual)
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      setErro('Erro inesperado ao carregar dados')
    } finally {
      setCarregando(false)
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

      // Carrega contagem de agendamentos por unidade (apenas das unidades filtradas)
      const agendamentosCount: Record<string, number> = {}
      for (const unidade of unidadesFiltradas) {
        try {
          const { agendamentos: agendamentosData, error: agendamentosError } = await listarAgendamentosEntregaRevenda(revendaId, unidade.id)
          if (agendamentosError) {
            console.error(`❌ Erro ao contar agendamentos da unidade ${unidade.id}:`, agendamentosError)
            agendamentosCount[unidade.id] = 0
          } else {
            agendamentosCount[unidade.id] = agendamentosData?.length || 0
            console.log(`📊 Unidade ${unidade.nome}: ${agendamentosCount[unidade.id]} agendamentos`)
          }
        } catch (error) {
          console.error(`❌ Erro ao contar agendamentos da unidade ${unidade.id}:`, error)
          agendamentosCount[unidade.id] = 0
        }
      }
      setAgendamentosPorUnidade(agendamentosCount)

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

  const carregarConfiguracaoUnidade = async () => {
    if (!revendaId || !unidadeSelecionadaId) return

    try {
      const { configuracao, error } = await buscarConfiguracaoAgendamento(revendaId, unidadeSelecionadaId)
      if (error) {
        console.error('❌ Erro ao carregar configuração:', error)
        return
      }

      if (configuracao) {
        setAgendamentoLivre(configuracao.agendamento_entrega_livre)
        setHorariosDisponiveis(configuracao.agendamento_horarios_disponiveis || [])
        setDiasDisponiveis(configuracao.agendamento_dias_disponiveis || [0, 1, 2, 3, 4, 5, 6])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configuração:', error)
    }
  }

  const carregarAgendamentos = async () => {
    if (!revendaId || !unidadeSelecionadaId) {
      setCarregandoAgendamentos(false)
      setAgendamentos([])
      return
    }

    setCarregandoAgendamentos(true)
    try {
      const { agendamentos: agendamentosData, error } = await listarAgendamentosEntregaRevenda(revendaId, unidadeSelecionadaId)
      if (error) {
        setErro(`Erro ao carregar agendamentos: ${error.message || 'Erro desconhecido'}`)
        setAgendamentos([])
        return
      }
      setAgendamentos(agendamentosData || [])
    } catch (error) {
      setErro('Erro inesperado ao carregar agendamentos')
      setAgendamentos([])
    } finally {
      setCarregandoAgendamentos(false)
    }
  }

  const handleSalvarConfiguracao = async () => {
    if (!revendaId || !unidadeSelecionadaId) return

    setSalvando(true)
    setErro(null)
    setSucesso(null)

    try {
      const { error } = await atualizarConfiguracaoAgendamento(revendaId, {
        agendamento_entrega_livre: agendamentoLivre,
        agendamento_horarios_disponiveis: agendamentoLivre ? [] : horariosDisponiveis,
        agendamento_dias_disponiveis: diasDisponiveis,
      }, unidadeSelecionadaId)

      if (error) {
        setErro('Erro ao salvar configuração')
        return
      }

      setSucesso('Configuração salva com sucesso!')
      setTimeout(() => setSucesso(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', error)
      setErro('Erro inesperado ao salvar configuração')
    } finally {
      setSalvando(false)
    }
  }

  const handleAdicionarHorario = () => {
    if (novoHorario && !horariosDisponiveis.includes(novoHorario)) {
      setHorariosDisponiveis([...horariosDisponiveis, novoHorario].sort())
      setNovoHorario('09:00')
    }
  }

  const handleRemoverHorario = (horario: string) => {
    setHorariosDisponiveis(horariosDisponiveis.filter(h => h !== horario))
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatarDataSimples = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Filtrar agendamentos
  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter((agendamento) => {
      // Filtro de busca
      const termo = busca.trim().toLowerCase()
      const correspondeBusca =
        termo.length === 0 ||
        (agendamento.pedido?.dados_cliente?.nome || '').toLowerCase().includes(termo) ||
        (agendamento.pedido?.id || '').toLowerCase().includes(termo) ||
        (agendamento.observacoes || '').toLowerCase().includes(termo)

      // Filtro de status
      const correspondeStatus =
        statusFiltro === 'todos' || agendamento.status === statusFiltro

      // Filtro por data
      const correspondeData = (() => {
        const dataAgendamento = agendamento.data_agendamento ? new Date(agendamento.data_agendamento) : null
        if (!dataAgendamento) return false

        const agora = new Date()
        const inicioHoje = new Date()
        inicioHoje.setHours(0, 0, 0, 0)

        if (dataFiltro === 'tudo') return true
        if (dataFiltro === 'hoje') return dataAgendamento >= inicioHoje

        const diasNum = dataFiltro === '7' || dataFiltro === '15' || dataFiltro === '30' ? parseInt(dataFiltro, 10) : null
        if (diasNum) {
          const limite = new Date(agora)
          limite.setDate(limite.getDate() - diasNum)
          return dataAgendamento >= limite
        }

        // Personalizado
        if (dataFiltro === 'personalizado') {
          if (!dataInicioPersonalizada && !dataFimPersonalizada) return true

          const inicio = dataInicioPersonalizada ? new Date(dataInicioPersonalizada) : null
          const fim = dataFimPersonalizada ? new Date(dataFimPersonalizada) : null
          if (inicio) inicio.setHours(0, 0, 0, 0)
          if (fim) fim.setHours(23, 59, 59, 999)

          if (inicio && fim) return dataAgendamento >= inicio && dataAgendamento <= fim
          if (inicio && !fim) return dataAgendamento >= inicio
          if (!inicio && fim) return dataAgendamento <= fim
          return true
        }

        return true
      })()

      return correspondeBusca && correspondeStatus && correspondeData
    })
  }, [agendamentos, busca, statusFiltro, dataFiltro, dataInicioPersonalizada, dataFimPersonalizada])

  const limparFiltros = () => {
    setBusca('')
    setStatusFiltro('todos')
    setDataFiltro('tudo')
    setDataInicioPersonalizada('')
    setDataFimPersonalizada('')
    setDropdownCalendarioAberto(false)
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
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <Calendar className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          Agendamentos de Entrega
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Configure os horários disponíveis para agendamento e visualize os agendamentos realizados por unidade
        </p>
      </div>

      {erro && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        </div>
      )}

      {sucesso && (
        <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-600 dark:text-green-400">{sucesso}</p>
        </div>
      )}

      {/* Seleção de Unidade */}
      {revendaId && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Selecione uma unidade para gerenciar agendamentos
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
                  Crie uma unidade em "Presença na Loja" para começar a gerenciar agendamentos
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
                          <p className="text-neutral-500 dark:text-neutral-400 text-xs">Agendamentos</p>
                          <p className="font-medium flex items-center gap-1 text-neutral-900 dark:text-neutral-50">
                            <Calendar className="w-4 h-4" />
                            {agendamentosPorUnidade[unidade.id] || 0}
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

      {/* Configuração de Agendamento */}
      {unidadeSelecionadaId && (
        <>
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                Configuração de Agendamento
                {unidades.find(u => u.id === unidadeSelecionadaId) && (
                  <span className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
                    - {unidades.find(u => u.id === unidadeSelecionadaId)?.nome}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="agendamentoLivre" className="text-base font-medium">
                    Agendamento Livre
                  </Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Permite que o cliente escolha qualquer horário
                  </p>
                </div>
                <Switch
                  id="agendamentoLivre"
                  checked={agendamentoLivre}
                  onCheckedChange={setAgendamentoLivre}
                  disabled={salvando}
                />
              </div>

              {!agendamentoLivre && (
                <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Dias da Semana Disponíveis
                    </Label>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                      Selecione os dias da semana em que os clientes podem agendar entregas
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                      {DIAS_SEMANA.map((dia) => (
                        <label
                          key={dia.valor}
                          className="flex items-center gap-2 p-2 rounded-md border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={diasDisponiveis.includes(dia.valor)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDiasDisponiveis([...diasDisponiveis, dia.valor].sort())
                              } else {
                                setDiasDisponiveis(diasDisponiveis.filter(d => d !== dia.valor))
                              }
                            }}
                            disabled={salvando}
                            className="rounded border-neutral-300 dark:border-neutral-700 text-violet-600 focus:ring-violet-600"
                          />
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">{dia.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Horários Disponíveis
                    </Label>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                      Configure os horários que os clientes podem escolher para agendamento
                    </p>
                    
                    <div className="flex gap-2 mb-3">
                      <Input
                        type="time"
                        value={novoHorario}
                        onChange={(e) => setNovoHorario(e.target.value)}
                        className="border-neutral-300 dark:border-neutral-700"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAdicionarHorario}
                        disabled={salvando}
                        className="border-neutral-300 dark:border-neutral-700"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {horariosDisponiveis.length > 0 ? (
                      <div className="space-y-2">
                        {horariosDisponiveis.map((horario) => (
                          <div
                            key={horario}
                            className="flex items-center justify-between p-2 rounded-md bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-neutral-500" />
                              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                {horario}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoverHorario(horario)}
                              disabled={salvando}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500 dark:text-neutral-500 text-center py-4">
                        Nenhum horário configurado. Adicione horários acima.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSalvarConfiguracao}
                disabled={salvando || (!agendamentoLivre && horariosDisponiveis.length === 0)}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              >
                {salvando ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
            </CardContent>
          </Card>

          {/* Agendamentos Realizados */}
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  Agendamentos Realizados
                  {agendamentos.length > 0 && (
                    <span className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
                      ({agendamentosFiltrados.length} {agendamentosFiltrados.length === 1 ? 'agendamento' : 'agendamentos'})
                    </span>
                  )}
                </CardTitle>
                {agendamentos.length > 0 && (
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
            </CardHeader>
            <CardContent>
              {carregandoAgendamentos ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : agendamentos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Calendar className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                    Nenhum agendamento encontrado para esta unidade
                  </p>
                </div>
              ) : (
                <>
                  {/* Filtros Avançados */}
                  <Card className="mb-6 border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[200px]">
                          <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">
                            Buscar
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                            <Input
                              placeholder="Cliente, pedido, observações..."
                              value={busca}
                              onChange={(e) => setBusca(e.target.value)}
                              className="pl-10 border-neutral-300 dark:border-neutral-700"
                            />
                          </div>
                        </div>

                        <div className="min-w-[150px]">
                          <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">
                            Status
                          </label>
                          <SelectMenu
                            value={statusFiltro}
                            onChange={(value) => setStatusFiltro(value as typeof statusFiltro)}
                            options={[
                              { value: 'todos', label: 'Todos' },
                              { value: 'agendado', label: 'Agendado' },
                              { value: 'confirmado', label: 'Confirmado' },
                              { value: 'realizado', label: 'Realizado' },
                              { value: 'cancelado', label: 'Cancelado' },
                            ]}
                          />
                        </div>

                        <div className="min-w-[150px]">
                          <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">
                            Data
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
                                    ? `${formatarDataSimples(dataInicioPersonalizada)} - ${formatarDataSimples(dataFimPersonalizada)}`
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

                  {/* Lista de Agendamentos */}
                  {agendamentosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Calendar className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                        {agendamentos.length === 0
                          ? 'Nenhum agendamento encontrado'
                          : 'Nenhum agendamento corresponde aos filtros aplicados'}
                      </p>
                    </div>
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
                                  <span className="font-medium text-neutral-900 dark:text-neutral-50 text-sm">
                                    {formatarDataSimples(agendamento.data_agendamento)}
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
                              {agendamento.pedido && (
                                <div className="space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                                  <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                    Pedido #{agendamento.pedido.id.slice(0, 8).toUpperCase()}
                                  </p>
                                  {agendamento.pedido.dados_cliente && (
                                    <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                                      {agendamento.pedido.dados_cliente.nome}
                                    </p>
                                  )}
                                  <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                                    {formatarPreco(agendamento.pedido.valor_total)}
                                  </p>
                                </div>
                              )}
                              {agendamento.observacoes && (
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                                  {agendamento.observacoes}
                                </p>
                              )}
                              {agendamento.pedido && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/revenda/pedidos/${agendamento.pedido.id}`)}
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
                          className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
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
                                      onClick={() => navigate(`/revenda/pedidos/${agendamento.pedido.id}`)}
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
