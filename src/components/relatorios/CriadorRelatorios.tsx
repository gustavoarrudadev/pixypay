import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { TabelaRelatorio } from './TabelaRelatorio'
import { Download, Eye, RefreshCw } from 'lucide-react'
import { exportarRelatorioGenerico, formatarMoeda, formatarData, formatarNumero } from '@/lib/relatorios/exportar'

interface Campo {
  chave: string
  titulo: string
  categoria: 'vendas' | 'produtos' | 'clientes' | 'financeiro' | 'parcelamentos' | 'agendamentos'
  formatar?: (valor: any) => string
  alinhamento?: 'left' | 'center' | 'right'
}

interface Metrica {
  chave: string
  titulo: string
  categoria: 'vendas' | 'produtos' | 'clientes' | 'financeiro' | 'parcelamentos' | 'agendamentos'
  calcular: (dados: any[]) => number | string
}

interface CriadorRelatoriosProps {
  revendaId?: string
  dataInicio?: string
  dataFim?: string
  onDadosCarregados?: (dados: Array<Record<string, any>>) => void
}

const CAMPOS_DISPONIVEIS: Campo[] = [
  // Vendas
  { chave: 'id', titulo: 'ID do Pedido', categoria: 'vendas' },
  { chave: 'data', titulo: 'Data do Pedido', categoria: 'vendas', formatar: formatarData },
  { chave: 'cliente', titulo: 'Cliente', categoria: 'vendas' },
  { chave: 'revenda', titulo: 'Revenda', categoria: 'vendas' },
  { chave: 'valor_total', titulo: 'Valor Total', categoria: 'vendas', formatar: formatarMoeda, alinhamento: 'right' },
  { chave: 'valor_liquido', titulo: 'Valor Líquido', categoria: 'vendas', formatar: formatarMoeda, alinhamento: 'right' },
  { chave: 'status', titulo: 'Status', categoria: 'vendas' },
  { chave: 'forma_pagamento', titulo: 'Forma de Pagamento', categoria: 'vendas' },
  { chave: 'tipo_entrega', titulo: 'Tipo de Entrega', categoria: 'vendas' },
  { chave: 'parcelas', titulo: 'Número de Parcelas', categoria: 'vendas', formatar: formatarNumero, alinhamento: 'right' },
  
  // Produtos
  { chave: 'produto_id', titulo: 'ID do Produto', categoria: 'produtos' },
  { chave: 'nome', titulo: 'Nome do Produto', categoria: 'produtos' },
  { chave: 'descricao', titulo: 'Descrição', categoria: 'produtos' },
  { chave: 'quantidade', titulo: 'Quantidade Vendida', categoria: 'produtos', formatar: formatarNumero, alinhamento: 'right' },
  { chave: 'valor_total', titulo: 'Valor Total Vendido', categoria: 'produtos', formatar: formatarMoeda, alinhamento: 'right' },
  { chave: 'preco_medio', titulo: 'Preço Médio', categoria: 'produtos', formatar: formatarMoeda, alinhamento: 'right' },
  
  // Clientes
  { chave: 'cliente_id', titulo: 'ID do Cliente', categoria: 'clientes' },
  { chave: 'nome', titulo: 'Nome', categoria: 'clientes' },
  { chave: 'email', titulo: 'Email', categoria: 'clientes' },
  { chave: 'telefone', titulo: 'Telefone', categoria: 'clientes' },
  { chave: 'cpf', titulo: 'CPF', categoria: 'clientes' },
  { chave: 'total_pedidos', titulo: 'Total de Pedidos', categoria: 'clientes', formatar: formatarNumero, alinhamento: 'right' },
  { chave: 'ticket_medio', titulo: 'Ticket Médio', categoria: 'clientes', formatar: formatarMoeda, alinhamento: 'right' },
  { chave: 'ultima_compra', titulo: 'Última Compra', categoria: 'clientes', formatar: formatarData },
  
  // Financeiro
  { chave: 'id', titulo: 'ID da Transação', categoria: 'financeiro' },
  { chave: 'pedido_id', titulo: 'ID do Pedido', categoria: 'financeiro' },
  { chave: 'valor_bruto', titulo: 'Valor Bruto', categoria: 'financeiro', formatar: formatarMoeda, alinhamento: 'right' },
  { chave: 'valor_liquido', titulo: 'Valor Líquido', categoria: 'financeiro', formatar: formatarMoeda, alinhamento: 'right' },
  { chave: 'taxa_percentual', titulo: 'Taxa Percentual (%)', categoria: 'financeiro', formatar: formatarNumero, alinhamento: 'right' },
  { chave: 'taxa_fixa', titulo: 'Taxa Fixa', categoria: 'financeiro', formatar: formatarMoeda, alinhamento: 'right' },
  { chave: 'modalidade', titulo: 'Modalidade', categoria: 'financeiro' },
  { chave: 'data_pagamento', titulo: 'Data de Pagamento', categoria: 'financeiro', formatar: formatarData },
  { chave: 'data_repasse_prevista', titulo: 'Data de Repasse Prevista', categoria: 'financeiro', formatar: formatarData },
  { chave: 'status', titulo: 'Status', categoria: 'financeiro' },
  
  // Parcelamentos
  { chave: 'id', titulo: 'ID do Parcelamento', categoria: 'parcelamentos' },
  { chave: 'pedido_id', titulo: 'ID do Pedido', categoria: 'parcelamentos' },
  { chave: 'cliente', titulo: 'Cliente', categoria: 'parcelamentos' },
  { chave: 'total_parcelas', titulo: 'Total de Parcelas', categoria: 'parcelamentos', formatar: formatarNumero, alinhamento: 'right' },
  { chave: 'valor_total', titulo: 'Valor Total', categoria: 'parcelamentos', formatar: formatarMoeda, alinhamento: 'right' },
  { chave: 'valor_parcela', titulo: 'Valor da Parcela', categoria: 'parcelamentos', formatar: formatarMoeda, alinhamento: 'right' },
  { chave: 'parcelas_pagas', titulo: 'Parcelas Pagas', categoria: 'parcelamentos', formatar: formatarNumero, alinhamento: 'right' },
  { chave: 'parcelas_pendentes', titulo: 'Parcelas Pendentes', categoria: 'parcelamentos', formatar: formatarNumero, alinhamento: 'right' },
  { chave: 'status', titulo: 'Status', categoria: 'parcelamentos' },
]

const METRICAS_DISPONIVEIS: Metrica[] = [
  // Vendas
  {
    chave: 'total_vendas_bruto',
    titulo: 'Total de Vendas (Bruto)',
    categoria: 'vendas',
    calcular: (dados) => dados.reduce((acc, d) => acc + Number(d.valor_total || 0), 0),
  },
  {
    chave: 'total_vendas_liquido',
    titulo: 'Total de Vendas (Líquido)',
    categoria: 'vendas',
    calcular: (dados) => dados.reduce((acc, d) => acc + Number(d.valor_liquido || d.valor_total || 0), 0),
  },
  {
    chave: 'numero_pedidos',
    titulo: 'Número de Pedidos',
    categoria: 'vendas',
    calcular: (dados) => dados.length,
  },
  {
    chave: 'ticket_medio',
    titulo: 'Ticket Médio',
    categoria: 'vendas',
    calcular: (dados) => {
      const total = dados.reduce((acc, d) => acc + Number(d.valor_total || 0), 0)
      return dados.length > 0 ? total / dados.length : 0
    },
  },
  {
    chave: 'pedidos_pendentes',
    titulo: 'Pedidos Pendentes',
    categoria: 'vendas',
    calcular: (dados) => dados.filter((d) => d.status === 'pendente').length,
  },
  {
    chave: 'pedidos_confirmados',
    titulo: 'Pedidos Confirmados',
    categoria: 'vendas',
    calcular: (dados) => dados.filter((d) => d.status === 'confirmado').length,
  },
  {
    chave: 'pedidos_entregues',
    titulo: 'Pedidos Entregues',
    categoria: 'vendas',
    calcular: (dados) => dados.filter((d) => d.status === 'entregue').length,
  },
  {
    chave: 'pedidos_cancelados',
    titulo: 'Pedidos Cancelados',
    categoria: 'vendas',
    calcular: (dados) => dados.filter((d) => d.status === 'cancelado').length,
  },
  {
    chave: 'vendas_pix_vista',
    titulo: 'Vendas PIX à Vista',
    categoria: 'vendas',
    calcular: (dados) => dados.filter((d) => d.forma_pagamento === 'pix_vista').length,
  },
  {
    chave: 'vendas_pix_parcelado',
    titulo: 'Vendas PIX Parcelado',
    categoria: 'vendas',
    calcular: (dados) => dados.filter((d) => d.forma_pagamento === 'pix_parcelado').length,
  },
  {
    chave: 'valor_pix_vista',
    titulo: 'Valor PIX à Vista',
    categoria: 'vendas',
    calcular: (dados) => dados.filter((d) => d.forma_pagamento === 'pix_vista').reduce((acc, d) => acc + Number(d.valor_total || 0), 0),
  },
  {
    chave: 'valor_pix_parcelado',
    titulo: 'Valor PIX Parcelado',
    categoria: 'vendas',
    calcular: (dados) => dados.filter((d) => d.forma_pagamento === 'pix_parcelado').reduce((acc, d) => acc + Number(d.valor_total || 0), 0),
  },
  {
    chave: 'taxa_conversao',
    titulo: 'Taxa de Conversão (%)',
    categoria: 'vendas',
    calcular: (dados) => {
      const total = dados.length
      const entregues = dados.filter((d) => d.status === 'entregue').length
      return total > 0 ? (entregues / total) * 100 : 0
    },
  },
  
  // Produtos
  {
    chave: 'total_produtos',
    titulo: 'Total de Produtos',
    categoria: 'produtos',
    calcular: (dados) => dados.length,
  },
  {
    chave: 'quantidade_total',
    titulo: 'Quantidade Total Vendida',
    categoria: 'produtos',
    calcular: (dados) => dados.reduce((acc, d) => acc + Number(d.quantidade || 0), 0),
  },
  {
    chave: 'valor_total_produtos',
    titulo: 'Valor Total Vendido',
    categoria: 'produtos',
    calcular: (dados) => dados.reduce((acc, d) => acc + Number(d.valor_total || 0), 0),
  },
  {
    chave: 'preco_medio_produtos',
    titulo: 'Preço Médio dos Produtos',
    categoria: 'produtos',
    calcular: (dados) => {
      const total = dados.reduce((acc, d) => acc + Number(d.valor_total || 0), 0)
      const quantidade = dados.reduce((acc, d) => acc + Number(d.quantidade || 0), 0)
      return quantidade > 0 ? total / quantidade : 0
    },
  },
  {
    chave: 'produto_mais_vendido',
    titulo: 'Produto Mais Vendido (Qtd)',
    categoria: 'produtos',
    calcular: (dados) => {
      if (dados.length === 0) return 0
      const max = Math.max(...dados.map((d) => Number(d.quantidade || 0)))
      return max
    },
  },
  {
    chave: 'produto_maior_receita',
    titulo: 'Produto Maior Receita',
    categoria: 'produtos',
    calcular: (dados) => {
      if (dados.length === 0) return 0
      const max = Math.max(...dados.map((d) => Number(d.valor_total || 0)))
      return max
    },
  },
  
  // Clientes
  {
    chave: 'total_clientes',
    titulo: 'Total de Clientes',
    categoria: 'clientes',
    calcular: (dados) => dados.length,
  },
  {
    chave: 'ticket_medio_clientes',
    titulo: 'Ticket Médio por Cliente',
    categoria: 'clientes',
    calcular: (dados) => {
      const total = dados.reduce((acc, d) => acc + Number(d.ticket_medio || 0), 0)
      return dados.length > 0 ? total / dados.length : 0
    },
  },
  {
    chave: 'clientes_ativos',
    titulo: 'Clientes Ativos',
    categoria: 'clientes',
    calcular: (dados) => dados.filter((d) => Number(d.total_pedidos || 0) > 0).length,
  },
  {
    chave: 'clientes_recorrentes',
    titulo: 'Clientes Recorrentes',
    categoria: 'clientes',
    calcular: (dados) => dados.filter((d) => Number(d.total_pedidos || 0) > 1).length,
  },
  {
    chave: 'clientes_novos',
    titulo: 'Clientes Novos',
    categoria: 'clientes',
    calcular: (dados) => dados.filter((d) => Number(d.total_pedidos || 0) === 1).length,
  },
  {
    chave: 'maior_ticket_medio',
    titulo: 'Maior Ticket Médio',
    categoria: 'clientes',
    calcular: (dados) => {
      if (dados.length === 0) return 0
      return Math.max(...dados.map((d) => Number(d.ticket_medio || 0)))
    },
  },
  {
    chave: 'total_pedidos_clientes',
    titulo: 'Total de Pedidos (Clientes)',
    categoria: 'clientes',
    calcular: (dados) => dados.reduce((acc, d) => acc + Number(d.total_pedidos || 0), 0),
  },
  {
    chave: 'frequencia_media',
    titulo: 'Frequência Média',
    categoria: 'clientes',
    calcular: (dados) => {
      const totalPedidos = dados.reduce((acc, d) => acc + Number(d.total_pedidos || 0), 0)
      return dados.length > 0 ? totalPedidos / dados.length : 0
    },
  },
  
  // Financeiro
  {
    chave: 'receita_bruta',
    titulo: 'Receita Bruta',
    categoria: 'financeiro',
    calcular: (dados) => dados.reduce((acc, d) => acc + Number(d.valor_bruto || 0), 0),
  },
  {
    chave: 'receita_liquida',
    titulo: 'Receita Líquida',
    categoria: 'financeiro',
    calcular: (dados) => dados.reduce((acc, d) => acc + Number(d.valor_liquido || 0), 0),
  },
  {
    chave: 'taxas_totais',
    titulo: 'Taxas Totais',
    categoria: 'financeiro',
    calcular: (dados) => {
      const bruto = dados.reduce((acc, d) => acc + Number(d.valor_bruto || 0), 0)
      const liquido = dados.reduce((acc, d) => acc + Number(d.valor_liquido || 0), 0)
      return bruto - liquido
    },
  },
  {
    chave: 'taxa_media_percentual',
    titulo: 'Taxa Média Percentual (%)',
    categoria: 'financeiro',
    calcular: (dados) => {
      const total = dados.reduce((acc, d) => acc + Number(d.taxa_percentual || 0), 0)
      return dados.length > 0 ? total / dados.length : 0
    },
  },
  {
    chave: 'repasses_pendentes',
    titulo: 'Repasses Pendentes',
    categoria: 'financeiro',
    calcular: (dados) => dados.filter((d) => d.status === 'pendente' || d.status === 'liberado').reduce((acc, d) => acc + Number(d.valor_liquido || 0), 0),
  },
  {
    chave: 'repasses_realizados',
    titulo: 'Repasses Realizados',
    categoria: 'financeiro',
    calcular: (dados) => dados.filter((d) => d.status === 'repassado').reduce((acc, d) => acc + Number(d.valor_liquido || 0), 0),
  },
  {
    chave: 'transacoes_d1',
    titulo: 'Transações D+1',
    categoria: 'financeiro',
    calcular: (dados) => dados.filter((d) => d.modalidade === 'D+1').length,
  },
  {
    chave: 'transacoes_d15',
    titulo: 'Transações D+15',
    categoria: 'financeiro',
    calcular: (dados) => dados.filter((d) => d.modalidade === 'D+15').length,
  },
  {
    chave: 'transacoes_d30',
    titulo: 'Transações D+30',
    categoria: 'financeiro',
    calcular: (dados) => dados.filter((d) => d.modalidade === 'D+30').length,
  },
  {
    chave: 'valor_d1',
    titulo: 'Valor D+1',
    categoria: 'financeiro',
    calcular: (dados) => dados.filter((d) => d.modalidade === 'D+1').reduce((acc, d) => acc + Number(d.valor_liquido || 0), 0),
  },
  {
    chave: 'valor_d15',
    titulo: 'Valor D+15',
    categoria: 'financeiro',
    calcular: (dados) => dados.filter((d) => d.modalidade === 'D+15').reduce((acc, d) => acc + Number(d.valor_liquido || 0), 0),
  },
  {
    chave: 'valor_d30',
    titulo: 'Valor D+30',
    categoria: 'financeiro',
    calcular: (dados) => dados.filter((d) => d.modalidade === 'D+30').reduce((acc, d) => acc + Number(d.valor_liquido || 0), 0),
  },
  
  // Parcelamentos
  {
    chave: 'total_parcelamentos',
    titulo: 'Total de Parcelamentos',
    categoria: 'parcelamentos',
    calcular: (dados) => dados.length,
  },
  {
    chave: 'valor_total_parcelamentos',
    titulo: 'Valor Total em Parcelamentos',
    categoria: 'parcelamentos',
    calcular: (dados) => dados.reduce((acc, d) => acc + Number(d.valor_total || 0), 0),
  },
  {
    chave: 'parcelas_pagas',
    titulo: 'Parcelas Pagas',
    categoria: 'parcelamentos',
    calcular: (dados) => dados.reduce((acc, d) => acc + Number(d.parcelas_pagas || 0), 0),
  },
  {
    chave: 'parcelas_pendentes',
    titulo: 'Parcelas Pendentes',
    categoria: 'parcelamentos',
    calcular: (dados) => dados.reduce((acc, d) => acc + Number(d.parcelas_pendentes || 0), 0),
  },
  {
    chave: 'valor_parcelas_pagas',
    titulo: 'Valor Parcelas Pagas',
    categoria: 'parcelamentos',
    calcular: (dados) => dados.reduce((acc, d) => acc + Number(d.parcelas_pagas || 0) * Number(d.valor_parcela || 0), 0),
  },
  {
    chave: 'valor_parcelas_pendentes',
    titulo: 'Valor Parcelas Pendentes',
    categoria: 'parcelamentos',
    calcular: (dados) => dados.reduce((acc, d) => acc + Number(d.parcelas_pendentes || 0) * Number(d.valor_parcela || 0), 0),
  },
  {
    chave: 'taxa_inadimplencia',
    titulo: 'Taxa de Inadimplência (%)',
    categoria: 'parcelamentos',
    calcular: (dados) => {
      const totalParcelas = dados.reduce((acc, d) => acc + Number(d.parcelas_pagas || 0) + Number(d.parcelas_pendentes || 0), 0)
      const pendentes = dados.reduce((acc, d) => acc + Number(d.parcelas_pendentes || 0), 0)
      return totalParcelas > 0 ? (pendentes / totalParcelas) * 100 : 0
    },
  },
  {
    chave: 'parcelamento_medio',
    titulo: 'Parcelamento Médio',
    categoria: 'parcelamentos',
    calcular: (dados) => {
      const total = dados.reduce((acc, d) => acc + Number(d.total_parcelas || 0), 0)
      return dados.length > 0 ? total / dados.length : 0
    },
  },
  {
    chave: 'valor_parcela_medio',
    titulo: 'Valor Parcela Médio',
    categoria: 'parcelamentos',
    calcular: (dados) => {
      const total = dados.reduce((acc, d) => acc + Number(d.valor_parcela || 0), 0)
      return dados.length > 0 ? total / dados.length : 0
    },
  },
]

export function CriadorRelatorios({ revendaId, dataInicio, dataFim, onDadosCarregados }: CriadorRelatoriosProps) {
  const [camposSelecionados, setCamposSelecionados] = useState<Set<string>>(new Set())
  const [metricasSelecionadas, setMetricasSelecionadas] = useState<Set<string>>(new Set())
  const [categoriaAtiva, setCategoriaAtiva] = useState<'vendas' | 'produtos' | 'clientes' | 'financeiro' | 'parcelamentos' | 'agendamentos'>('vendas')
  const [dados, setDados] = useState<Array<Record<string, any>>>([])
  const [carregando, setCarregando] = useState(false)
  const [dadosCarregados, setDadosCarregados] = useState(false)

  // Carregar dados quando os filtros mudarem
  useEffect(() => {
    if (dataInicio && dataFim) {
      carregarDados()
    }
  }, [revendaId, dataInicio, dataFim, categoriaAtiva])

  const carregarDados = async () => {
    setCarregando(true)
    setDadosCarregados(false)

    try {
      const { buscarDadosVendas, buscarDadosProdutos, buscarDadosClientes, buscarDadosFinanceiro, buscarDadosParcelamentos } = await import('@/lib/relatorios/dados')

      let dadosCarregados: Array<Record<string, any>> = []

      switch (categoriaAtiva) {
        case 'vendas':
          const vendas = await buscarDadosVendas(revendaId, dataInicio, dataFim)
          dadosCarregados = vendas.dados
          break
        case 'produtos':
          const produtos = await buscarDadosProdutos(revendaId, dataInicio, dataFim)
          dadosCarregados = produtos.dados
          break
        case 'clientes':
          const clientes = await buscarDadosClientes(revendaId, dataInicio, dataFim)
          dadosCarregados = clientes.dados
          break
        case 'financeiro':
          const financeiro = await buscarDadosFinanceiro(revendaId, dataInicio, dataFim)
          dadosCarregados = financeiro.dados
          break
        case 'parcelamentos':
          const parcelamentos = await buscarDadosParcelamentos(revendaId, dataInicio, dataFim)
          dadosCarregados = parcelamentos.dados
          break
        case 'agendamentos':
          // Implementar quando necessário
          dadosCarregados = []
          break
      }

      setDados(dadosCarregados)
      setDadosCarregados(true)
      
      if (onDadosCarregados) {
        onDadosCarregados(dadosCarregados)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setCarregando(false)
    }
  }


  const selecionarTodosCampos = () => {
    const camposCategoria = CAMPOS_DISPONIVEIS.filter((c) => c.categoria === categoriaAtiva)
    const todosChaves = new Set(camposCategoria.map((c) => c.chave))
    setCamposSelecionados(todosChaves)
  }

  const deselecionarTodosCampos = () => {
    setCamposSelecionados(new Set())
  }

  const camposFiltrados = CAMPOS_DISPONIVEIS.filter((c) => c.categoria === categoriaAtiva)
  const metricasFiltradas = METRICAS_DISPONIVEIS.filter((m) => m.categoria === categoriaAtiva)

  const colunasSelecionadas = camposFiltrados.filter((c) => camposSelecionados.has(c.chave))
  const dadosFiltrados = dados.map((linha) => {
    const linhaFiltrada: Record<string, any> = {}
    colunasSelecionadas.forEach((col) => {
      linhaFiltrada[col.chave] = linha[col.chave]
    })
    return linhaFiltrada
  })

  const metricasCalculadas = metricasFiltradas
    .filter((m) => metricasSelecionadas.has(m.chave))
    .map((m) => ({
      titulo: m.titulo,
      valor: typeof m.calcular(dados) === 'number' && m.calcular(dados) > 1000
        ? formatarMoeda(m.calcular(dados) as number)
        : typeof m.calcular(dados) === 'number'
        ? formatarNumero(m.calcular(dados) as number)
        : String(m.calcular(dados)),
    }))

  const handleExportar = () => {
    const colunas = colunasSelecionadas.map((c) => ({
      chave: c.chave,
      titulo: c.titulo,
      formatar: c.formatar,
    }))

    exportarRelatorioGenerico(
      dadosFiltrados,
      colunas,
      `relatorio_personalizado_${categoriaAtiva}_${dataInicio}_${dataFim}`
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Painel de Seleção */}
      <div className="lg:col-span-1 space-y-4 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg">Selecionar Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(['vendas', 'produtos', 'clientes', 'financeiro', 'parcelamentos'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoriaAtiva(cat)
                    setCamposSelecionados(new Set())
                    setMetricasSelecionadas(new Set())
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    categoriaAtiva === cat
                      ? 'bg-violet-100 dark:bg-violet-900 text-violet-900 dark:text-violet-100'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Campos</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selecionarTodosCampos}
                  className="text-xs"
                >
                  Todos
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselecionarTodosCampos}
                  className="text-xs"
                >
                  Nenhum
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {camposFiltrados.map((campo) => (
                <div key={campo.chave} className="flex items-center space-x-2">
                  <Checkbox
                    id={`campo-${campo.chave}`}
                    checked={camposSelecionados.has(campo.chave)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setCamposSelecionados(new Set([...camposSelecionados, campo.chave]))
                      } else {
                        const novos = new Set(camposSelecionados)
                        novos.delete(campo.chave)
                        setCamposSelecionados(novos)
                      }
                    }}
                  />
                  <Label
                    htmlFor={`campo-${campo.chave}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {campo.titulo}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg">Métricas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {metricasFiltradas.map((metrica) => (
                <div key={metrica.chave} className="flex items-center space-x-2">
                  <Checkbox
                    id={`metrica-${metrica.chave}`}
                    checked={metricasSelecionadas.has(metrica.chave)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setMetricasSelecionadas(new Set([...metricasSelecionadas, metrica.chave]))
                      } else {
                        const novos = new Set(metricasSelecionadas)
                        novos.delete(metrica.chave)
                        setMetricasSelecionadas(novos)
                      }
                    }}
                  />
                  <Label
                    htmlFor={`metrica-${metrica.chave}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {metrica.titulo}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-neutral-200 dark:border-neutral-800 lg:sticky lg:top-6 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                Preview do Relatório
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={carregarDados}
                  disabled={carregando || !dataInicio || !dataFim}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${carregando ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportar}
                  disabled={colunasSelecionadas.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {carregando ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-neutral-500 dark:text-neutral-400">Carregando dados...</div>
              </div>
            ) : !dadosCarregados ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-neutral-500 dark:text-neutral-400 text-center">
                  Selecione os campos e métricas desejados e clique em "Atualizar" para gerar o preview.
                </div>
              </div>
            ) : colunasSelecionadas.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-neutral-500 dark:text-neutral-400 text-center">
                  Selecione pelo menos um campo para visualizar o relatório.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Métricas */}
                {metricasCalculadas.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metricasCalculadas.map((metrica, index) => (
                      <div
                        key={index}
                        className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800"
                      >
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          {metrica.titulo}
                        </div>
                        <div className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                          {metrica.valor}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tabela */}
                <TabelaRelatorio
                  colunas={colunasSelecionadas}
                  dados={dadosFiltrados}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

