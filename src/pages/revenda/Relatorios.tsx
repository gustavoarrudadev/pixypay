import { useState, useEffect } from 'react'
import { FileText, Download, RefreshCw, TrendingUp, Users, DollarSign, Package, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select } from '@/components/ui/select'
import { DateRangePickerCompact } from '@/components/ui/date-range-picker-compact'
import { CardKPI } from '@/components/relatorios/CardKPI'
import { TabelaRelatorio } from '@/components/relatorios/TabelaRelatorio'
import { CriadorRelatorios } from '@/components/relatorios/CriadorRelatorios'
import { FiltrosRelatorio } from '@/components/relatorios/FiltrosRelatorio'
import {
  calcularKPIVendas,
  calcularKPIProdutos,
  calcularKPIClientes,
  calcularKPIFinanceiro,
  calcularKPIParcelamentos,
  calcularKPIAgendamentos,
} from '@/lib/relatorios/kpis'
import {
  buscarDadosVendas,
  buscarDadosProdutos,
  buscarDadosClientes,
  buscarDadosFinanceiro,
  buscarDadosParcelamentos,
} from '@/lib/relatorios/dados'
import {
  exportarRelatorioVendas,
  exportarRelatorioProdutos,
  exportarRelatorioClientes,
  exportarRelatorioFinanceiro,
  exportarRelatorioParcelamentos,
  formatarMoeda,
} from '@/lib/relatorios/exportar'
import { obterRevendaId, obterUnidadeIdColaborador } from '@/lib/impersonation'
import { listarUnidades, type UnidadeRevenda } from '@/lib/gerenciarUnidades'
import { Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function Relatorios() {
  const [abaAtiva, setAbaAtiva] = useState<'vendas' | 'produtos' | 'clientes' | 'financeiro' | 'parcelamentos' | 'agendamentos' | 'criador'>('vendas')
  const [carregando, setCarregando] = useState(false)
  const [revendaId, setRevendaId] = useState<string | null>(null)
  
  // Estado de unidades
  const [unidades, setUnidades] = useState<UnidadeRevenda[]>([])
  const [carregandoUnidades, setCarregandoUnidades] = useState(true)
  const [unidadeSelecionadaId, setUnidadeSelecionadaId] = useState<string | null>(null)
  
  // Filtros gerais
  const [filtroPeriodo, setFiltroPeriodo] = useState<'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'>('30')
  const [dataInicio, setDataInicio] = useState<string>('')
  const [dataFim, setDataFim] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)
  
  // Filtros específicos por tipo
  const [filtrosVendas, setFiltrosVendas] = useState({ status: 'todos', formaPagamento: 'todas', tipoEntrega: 'todos' })
  const [filtrosProdutos, setFiltrosProdutos] = useState({ ordenarPor: 'quantidade', ordem: 'desc' })
  const [filtrosClientes, setFiltrosClientes] = useState({ tipoCliente: 'todos', ordenarPor: 'total_pedidos' })
  const [filtrosFinanceiro, setFiltrosFinanceiro] = useState({ status: 'todos', modalidade: 'todas' })
  const [filtrosParcelamentos, setFiltrosParcelamentos] = useState({ status: 'todos', situacao: 'todos' })

  // KPIs
  const [kpisVendas, setKpisVendas] = useState<any>(null)
  const [kpisProdutos, setKpisProdutos] = useState<any>(null)
  const [kpisClientes, setKpisClientes] = useState<any>(null)
  const [kpisFinanceiro, setKpisFinanceiro] = useState<any>(null)
  const [kpisParcelamentos, setKpisParcelamentos] = useState<any>(null)
  const [kpisAgendamentos, setKpisAgendamentos] = useState<any>(null)

  // Dados detalhados
  const [dadosVendas, setDadosVendas] = useState<Array<Record<string, any>>>([])
  const [dadosProdutos, setDadosProdutos] = useState<Array<Record<string, any>>>([])
  const [dadosClientes, setDadosClientes] = useState<Array<Record<string, any>>>([])

  useEffect(() => {
    carregarRevendaId()
    calcularPeriodo()
  }, [])

  useEffect(() => {
    if (revendaId) {
      carregarUnidades()
    }
  }, [revendaId])

  useEffect(() => {
    if (filtroPeriodo !== 'personalizado') {
      calcularPeriodo()
    }
  }, [filtroPeriodo])

  useEffect(() => {
    if (revendaId && dataInicio && dataFim) {
      carregarRelatorios()
    }
  }, [revendaId, dataInicio, dataFim, filtrosVendas, filtrosProdutos, filtrosClientes, filtrosFinanceiro, filtrosParcelamentos, unidadeSelecionadaId])

  const carregarRevendaId = async () => {
    const id = await obterRevendaId()
    setRevendaId(id)
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

  const calcularPeriodo = () => {
    const hoje = new Date()
    let inicio: Date
    let fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)

    switch (filtroPeriodo) {
      case 'hoje':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0)
        break
      case '7':
        inicio = new Date(hoje)
        inicio.setDate(inicio.getDate() - 7)
        break
      case '15':
        inicio = new Date(hoje)
        inicio.setDate(inicio.getDate() - 15)
        break
      case '30':
        inicio = new Date(hoje)
        inicio.setDate(inicio.getDate() - 30)
        break
      case 'tudo':
        inicio = new Date(2020, 0, 1)
        break
      default:
        return
    }

    setDataInicio(inicio.toISOString().split('T')[0])
    setDataFim(fim.toISOString().split('T')[0])
  }

  const carregarRelatorios = async () => {
    if (!revendaId) return

    setCarregando(true)

    try {
      // Aplicar filtros específicos de vendas
      const statusFiltro = filtrosVendas.status === 'todos' ? undefined : filtrosVendas.status
      const formaPagamentoFiltro = filtrosVendas.formaPagamento === 'todas' ? undefined : filtrosVendas.formaPagamento
      const tipoEntregaFiltro = filtrosVendas.tipoEntrega === 'todos' ? undefined : filtrosVendas.tipoEntrega

      // Carregar KPIs
      const [vendas, produtos, clientes, financeiro, parcelamentos, agendamentos] = await Promise.all([
        calcularKPIVendas(revendaId, dataInicio, dataFim, unidadeSelecionadaId),
        calcularKPIProdutos(revendaId, dataInicio, dataFim, 10, unidadeSelecionadaId),
        calcularKPIClientes(revendaId, dataInicio, dataFim, 10, unidadeSelecionadaId),
        calcularKPIFinanceiro(revendaId, dataInicio, dataFim, unidadeSelecionadaId),
        calcularKPIParcelamentos(revendaId, dataInicio, dataFim, unidadeSelecionadaId),
        calcularKPIAgendamentos(revendaId, dataInicio, dataFim, unidadeSelecionadaId),
      ])

      setKpisVendas(vendas.kpis)
      setKpisProdutos(produtos.kpis)
      setKpisClientes(clientes.kpis)
      setKpisFinanceiro(financeiro.kpis)
      setKpisParcelamentos(parcelamentos.kpis)
      setKpisAgendamentos(agendamentos.kpis)

      // Carregar dados detalhados com filtros específicos
      const [vendasDetalhes, produtosDetalhes, clientesDetalhes, financeiroDetalhes, parcelamentosDetalhes] = await Promise.all([
        buscarDadosVendas(revendaId, dataInicio, dataFim, statusFiltro, formaPagamentoFiltro, tipoEntregaFiltro, unidadeSelecionadaId),
        buscarDadosProdutos(revendaId, dataInicio, dataFim, unidadeSelecionadaId),
        buscarDadosClientes(revendaId, dataInicio, dataFim, unidadeSelecionadaId),
        buscarDadosFinanceiro(
          revendaId,
          dataInicio,
          dataFim,
          filtrosFinanceiro.status === 'todos' ? undefined : filtrosFinanceiro.status,
          filtrosFinanceiro.modalidade === 'todas' ? undefined : filtrosFinanceiro.modalidade,
          unidadeSelecionadaId
        ),
        buscarDadosParcelamentos(
          revendaId,
          dataInicio,
          dataFim,
          filtrosParcelamentos.status === 'todos' ? undefined : filtrosParcelamentos.status,
          unidadeSelecionadaId
        ),
      ])

      setDadosVendas(vendasDetalhes.dados)
      setDadosProdutos(produtosDetalhes.dados)
      setDadosClientes(clientesDetalhes.dados)
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
    } finally {
      setCarregando(false)
    }
  }

  const handleExportarVendas = () => {
    exportarRelatorioVendas(dadosVendas, `relatorio_vendas_${dataInicio}_${dataFim}`)
  }

  const handleExportarProdutos = () => {
    exportarRelatorioProdutos(dadosProdutos, `relatorio_produtos_${dataInicio}_${dataFim}`)
  }

  const handleExportarClientes = () => {
    exportarRelatorioClientes(dadosClientes, `relatorio_clientes_${dataInicio}_${dataFim}`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <FileText className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Relatórios
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Gere e visualize relatórios detalhados da sua revenda
          </p>
        </div>
      </div>

      {/* Seleção de Unidade */}
      {revendaId && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Selecione uma unidade para filtrar relatórios
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
                  Crie uma unidade em "Presença na Loja" para começar
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

      {/* Relatórios - Só mostra se houver unidade selecionada */}
      {unidadeSelecionadaId && (
        <Tabs value={abaAtiva} onValueChange={(value) => setAbaAtiva(value as 'vendas' | 'produtos' | 'clientes' | 'financeiro' | 'parcelamentos' | 'agendamentos' | 'criador')}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="parcelamentos">Parcelamentos</TabsTrigger>
          <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
          <TabsTrigger value="criador">Criador</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-6">
          {/* Filtros */}
          <FiltrosRelatorio
            tipo="vendas"
            filtroPeriodo={filtroPeriodo}
            onFiltroPeriodoChange={setFiltroPeriodo}
            dataInicio={dataInicio}
            dataFim={dataFim}
            onDataInicioChange={setDataInicio}
            onDataFimChange={setDataFim}
            dropdownCalendarioAberto={dropdownCalendarioAberto}
            onDropdownCalendarioChange={setDropdownCalendarioAberto}
            filtrosEspecificos={filtrosVendas}
            onFiltroEspecificoChange={(chave, valor) => setFiltrosVendas({ ...filtrosVendas, [chave]: valor })}
            onAtualizar={carregarRelatorios}
            carregando={carregando}
            desabilitado={!revendaId}
          />

          {/* KPIs de Vendas */}
          {kpisVendas && (
            <>

              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  KPIs de Vendas
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <CardKPI
                    titulo="Total de Vendas (Bruto)"
                    valor={formatarMoeda(kpisVendas.totalVendasBruto)}
                    icone={DollarSign}
                  />
                  <CardKPI
                    titulo="Total de Vendas (Líquido)"
                    valor={formatarMoeda(kpisVendas.totalVendasLiquido)}
                    icone={DollarSign}
                  />
                  <CardKPI
                    titulo="Número de Pedidos"
                    valor={kpisVendas.numeroPedidos}
                    icone={FileText}
                  />
                  <CardKPI
                    titulo="Ticket Médio"
                    valor={formatarMoeda(kpisVendas.ticketMedio)}
                    icone={TrendingUp}
                  />
                </div>
              </div>

              <TabelaRelatorio
                titulo="Detalhes de Vendas"
                colunas={[
                  { chave: 'id', titulo: 'ID do Pedido' },
                  { chave: 'data', titulo: 'Data', formatar: (v) => new Date(v).toLocaleString('pt-BR') },
                  { chave: 'cliente', titulo: 'Cliente' },
                  { chave: 'valor_total', titulo: 'Valor Total', formatar: formatarMoeda, alinhamento: 'right' },
                  { chave: 'status', titulo: 'Status' },
                  { chave: 'forma_pagamento', titulo: 'Forma de Pagamento' },
                  { chave: 'tipo_entrega', titulo: 'Tipo de Entrega' },
                ]}
                dados={dadosVendas}
              />

              <div className="flex justify-end">
                <Button onClick={handleExportarVendas} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </>
          )}

        </TabsContent>

        <TabsContent value="produtos" className="space-y-6">
          {/* Filtros */}
          <FiltrosRelatorio
            tipo="produtos"
            filtroPeriodo={filtroPeriodo}
            onFiltroPeriodoChange={setFiltroPeriodo}
            dataInicio={dataInicio}
            dataFim={dataFim}
            onDataInicioChange={setDataInicio}
            onDataFimChange={setDataFim}
            dropdownCalendarioAberto={dropdownCalendarioAberto}
            onDropdownCalendarioChange={setDropdownCalendarioAberto}
            filtrosEspecificos={filtrosProdutos}
            onFiltroEspecificoChange={(chave, valor) => setFiltrosProdutos({ ...filtrosProdutos, [chave]: valor })}
            onAtualizar={carregarRelatorios}
            carregando={carregando}
            desabilitado={!revendaId}
          />

          {/* KPIs de Produtos */}
          {kpisProdutos && (
            <>

              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  KPIs de Produtos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <CardKPI
                    titulo="Total de Produtos"
                    valor={kpisProdutos.totalProdutos}
                    icone={Package}
                  />
                  <CardKPI
                    titulo="Produtos Mais Vendidos"
                    valor={kpisProdutos.produtosMaisVendidos.length}
                    icone={TrendingUp}
                  />
                  <CardKPI
                    titulo="Produtos Menos Vendidos"
                    valor={kpisProdutos.produtosMenosVendidos.length}
                    icone={TrendingUp}
                  />
                </div>
              </div>

              <TabelaRelatorio
                titulo="Produtos Mais Vendidos"
                colunas={[
                  { chave: 'nome', titulo: 'Nome do Produto' },
                  { chave: 'quantidade', titulo: 'Quantidade Vendida', formatar: (v) => v.toLocaleString('pt-BR'), alinhamento: 'right' },
                  { chave: 'valor_total', titulo: 'Valor Total', formatar: formatarMoeda, alinhamento: 'right' },
                  { chave: 'preco_medio', titulo: 'Preço Médio', formatar: formatarMoeda, alinhamento: 'right' },
                ]}
                dados={kpisProdutos.produtosMaisVendidos}
              />

              <div className="flex justify-end">
                <Button onClick={handleExportarProdutos} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </>
          )}

        </TabsContent>

        <TabsContent value="clientes" className="space-y-6">
          {/* Filtros */}
          <FiltrosRelatorio
            tipo="clientes"
            filtroPeriodo={filtroPeriodo}
            onFiltroPeriodoChange={setFiltroPeriodo}
            dataInicio={dataInicio}
            dataFim={dataFim}
            onDataInicioChange={setDataInicio}
            onDataFimChange={setDataFim}
            dropdownCalendarioAberto={dropdownCalendarioAberto}
            onDropdownCalendarioChange={setDropdownCalendarioAberto}
            filtrosEspecificos={filtrosClientes}
            onFiltroEspecificoChange={(chave, valor) => setFiltrosClientes({ ...filtrosClientes, [chave]: valor })}
            onAtualizar={carregarRelatorios}
            carregando={carregando}
            desabilitado={!revendaId}
          />

          {/* KPIs de Clientes */}
          {kpisClientes && (
            <>

              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  KPIs de Clientes
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <CardKPI
                    titulo="Total de Clientes"
                    valor={kpisClientes.totalClientes}
                    icone={Users}
                  />
                  <CardKPI
                    titulo="Clientes Mais Frequentes"
                    valor={kpisClientes.clientesMaisFrequentes.length}
                    icone={Users}
                  />
                  <CardKPI
                    titulo="Novos Clientes"
                    valor={kpisClientes.novosClientes}
                    icone={Users}
                  />
                  <CardKPI
                    titulo="Maior Ticket Médio"
                    valor={kpisClientes.clientesMaiorTicketMedio.length > 0 ? formatarMoeda(kpisClientes.clientesMaiorTicketMedio[0]?.ticket_medio || 0) : 'R$ 0,00'}
                    icone={DollarSign}
                  />
                </div>
              </div>

              <TabelaRelatorio
                titulo="Clientes Mais Frequentes"
                colunas={[
                  { chave: 'nome', titulo: 'Nome' },
                  { chave: 'email', titulo: 'Email' },
                  { chave: 'total_pedidos', titulo: 'Total de Pedidos', formatar: (v) => v.toLocaleString('pt-BR'), alinhamento: 'right' },
                  { chave: 'ticket_medio', titulo: 'Ticket Médio', formatar: formatarMoeda, alinhamento: 'right' },
                ]}
                dados={kpisClientes.clientesMaisFrequentes}
              />

              <div className="flex justify-end">
                <Button onClick={handleExportarClientes} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </>
          )}

        </TabsContent>

        <TabsContent value="financeiro" className="space-y-6">
          {/* Filtros */}
          <FiltrosRelatorio
            tipo="financeiro"
            filtroPeriodo={filtroPeriodo}
            onFiltroPeriodoChange={setFiltroPeriodo}
            dataInicio={dataInicio}
            dataFim={dataFim}
            onDataInicioChange={setDataInicio}
            onDataFimChange={setDataFim}
            dropdownCalendarioAberto={dropdownCalendarioAberto}
            onDropdownCalendarioChange={setDropdownCalendarioAberto}
            filtrosEspecificos={filtrosFinanceiro}
            onFiltroEspecificoChange={(chave, valor) => setFiltrosFinanceiro({ ...filtrosFinanceiro, [chave]: valor })}
            onAtualizar={carregarRelatorios}
            carregando={carregando}
            desabilitado={!revendaId}
          />

          {/* KPIs Financeiros */}
          {kpisFinanceiro && (
            <>

              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  KPIs Financeiros
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <CardKPI
                  titulo="Receita Bruta"
                  valor={formatarMoeda(kpisFinanceiro.receitaBruta)}
                  icone={DollarSign}
                />
                <CardKPI
                  titulo="Receita Líquida"
                  valor={formatarMoeda(kpisFinanceiro.receitaLiquida)}
                  icone={DollarSign}
                />
                <CardKPI
                  titulo="Taxas Totais"
                  valor={formatarMoeda(kpisFinanceiro.taxasTotais)}
                  icone={DollarSign}
                />
                <CardKPI
                  titulo="Repasses Pendentes"
                  valor={formatarMoeda(kpisFinanceiro.repassesPendentes)}
                  icone={DollarSign}
                />
                <CardKPI
                  titulo="Repasses Realizados"
                  valor={formatarMoeda(kpisFinanceiro.repassesRealizados)}
                  icone={DollarSign}
                />
                <CardKPI
                  titulo="Inadimplência"
                  valor={formatarMoeda(kpisFinanceiro.inadimplencia)}
                  icone={DollarSign}
                />
                </div>
              </div>
            </>
          )}

        </TabsContent>

        <TabsContent value="parcelamentos" className="space-y-6">
          {/* Filtros */}
          <FiltrosRelatorio
            tipo="parcelamentos"
            filtroPeriodo={filtroPeriodo}
            onFiltroPeriodoChange={setFiltroPeriodo}
            dataInicio={dataInicio}
            dataFim={dataFim}
            onDataInicioChange={setDataInicio}
            onDataFimChange={setDataFim}
            dropdownCalendarioAberto={dropdownCalendarioAberto}
            onDropdownCalendarioChange={setDropdownCalendarioAberto}
            filtrosEspecificos={filtrosParcelamentos}
            onFiltroEspecificoChange={(chave, valor) => setFiltrosParcelamentos({ ...filtrosParcelamentos, [chave]: valor })}
            onAtualizar={carregarRelatorios}
            carregando={carregando}
            desabilitado={!revendaId}
          />

          {/* KPIs de Parcelamentos */}
          {kpisParcelamentos && (
            <>

              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  KPIs de Parcelamentos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <CardKPI
                  titulo="Parcelamentos Ativos"
                  valor={kpisParcelamentos.totalParcelamentosAtivos}
                  icone={Calendar}
                />
                <CardKPI
                  titulo="Valor Total"
                  valor={formatarMoeda(kpisParcelamentos.valorTotalParcelamentos)}
                  icone={DollarSign}
                />
                <CardKPI
                  titulo="Parcelas Pagas"
                  valor={kpisParcelamentos.parcelasPagas}
                  icone={Calendar}
                />
                <CardKPI
                  titulo="Parcelas Pendentes"
                  valor={kpisParcelamentos.parcelasPendentes}
                  icone={Calendar}
                />
                <CardKPI
                  titulo="Taxa de Inadimplência"
                  valor={`${kpisParcelamentos.taxaInadimplencia.toFixed(2)}%`}
                  icone={TrendingUp}
                />
                </div>
              </div>
            </>
          )}

        </TabsContent>

        <TabsContent value="agendamentos" className="space-y-6">
          {/* KPIs de Agendamentos */}
          {kpisAgendamentos && (
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                Agendamentos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CardKPI
                  titulo="Total de Agendamentos"
                  valor={kpisAgendamentos.totalAgendamentos}
                  icone={Calendar}
                />
                <CardKPI
                  titulo="Taxa de Conclusão"
                  valor={`${kpisAgendamentos.taxaConclusao.toFixed(2)}%`}
                  icone={TrendingUp}
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="criador" className="space-y-6">
          <CriadorRelatorios
            revendaId={revendaId || undefined}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        </TabsContent>
      </Tabs>
      )}
    </div>
  )
}
