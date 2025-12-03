/**
 * Funções para exportar relatórios em CSV bem formatado
 */

/**
 * Formata valor monetário para exibição
 */
export function formatarMoeda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') {
    return 'R$ 0,00'
  }

  const num = typeof valor === 'string' ? parseFloat(valor) : valor

  if (isNaN(num)) {
    return 'R$ 0,00'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num)
}

/**
 * Formata data para exibição
 */
export function formatarData(data: string | null | undefined): string {
  if (!data) {
    return ''
  }

  try {
    const date = new Date(data)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return data
  }
}

/**
 * Formata número com separador de milhares
 */
export function formatarNumero(numero: number | string | null | undefined): string {
  if (numero === null || numero === undefined || numero === '') {
    return '0'
  }

  const num = typeof numero === 'string' ? parseFloat(numero) : numero

  if (isNaN(num)) {
    return '0'
  }

  return new Intl.NumberFormat('pt-BR').format(num)
}

/**
 * Escapa valores para CSV
 */
function escaparCSV(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) {
    return ''
  }

  const str = String(valor)

  // Se contém vírgula, aspas ou quebra de linha, envolver em aspas e duplicar aspas internas
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Converte array de objetos para CSV
 */
export function converterParaCSV(
  dados: Array<Record<string, any>>,
  colunas: Array<{ chave: string; titulo: string; formatar?: (valor: any) => string }>
): string {
  // Adicionar BOM para UTF-8 (para Excel reconhecer corretamente)
  let csv = '\uFEFF'

  // Cabeçalhos
  const cabecalhos = colunas.map((col) => escaparCSV(col.titulo))
  csv += cabecalhos.join(',') + '\n'

  // Dados
  dados.forEach((linha) => {
    const valores = colunas.map((col) => {
      const valor = linha[col.chave]
      const valorFormatado = col.formatar ? col.formatar(valor) : valor
      return escaparCSV(valorFormatado)
    })
    csv += valores.join(',') + '\n'
  })

  return csv
}

/**
 * Faz download do CSV
 */
export function baixarCSV(csv: string, nomeArquivo: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${nomeArquivo}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Exporta relatório de vendas para CSV
 */
export function exportarRelatorioVendas(
  dados: Array<Record<string, any>>,
  nomeArquivo: string = 'relatorio_vendas'
): void {
  const colunas = [
    { chave: 'id', titulo: 'ID do Pedido' },
    { chave: 'data', titulo: 'Data', formatar: formatarData },
    { chave: 'cliente', titulo: 'Cliente' },
    { chave: 'valor_total', titulo: 'Valor Total', formatar: formatarMoeda },
    { chave: 'valor_liquido', titulo: 'Valor Líquido', formatar: formatarMoeda },
    { chave: 'status', titulo: 'Status' },
    { chave: 'forma_pagamento', titulo: 'Forma de Pagamento' },
    { chave: 'tipo_entrega', titulo: 'Tipo de Entrega' },
    { chave: 'parcelas', titulo: 'Número de Parcelas', formatar: formatarNumero },
  ]

  const csv = converterParaCSV(dados, colunas)
  baixarCSV(csv, nomeArquivo)
}

/**
 * Exporta relatório de produtos para CSV
 */
export function exportarRelatorioProdutos(
  dados: Array<Record<string, any>>,
  nomeArquivo: string = 'relatorio_produtos'
): void {
  const colunas = [
    { chave: 'produto_id', titulo: 'ID do Produto' },
    { chave: 'nome', titulo: 'Nome do Produto' },
    { chave: 'quantidade', titulo: 'Quantidade Vendida', formatar: formatarNumero },
    { chave: 'valor_total', titulo: 'Valor Total Vendido', formatar: formatarMoeda },
    { chave: 'preco_medio', titulo: 'Preço Médio', formatar: formatarMoeda },
  ]

  const csv = converterParaCSV(dados, colunas)
  baixarCSV(csv, nomeArquivo)
}

/**
 * Exporta relatório de clientes para CSV
 */
export function exportarRelatorioClientes(
  dados: Array<Record<string, any>>,
  nomeArquivo: string = 'relatorio_clientes'
): void {
  const colunas = [
    { chave: 'cliente_id', titulo: 'ID do Cliente' },
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'email', titulo: 'Email' },
    { chave: 'telefone', titulo: 'Telefone' },
    { chave: 'total_pedidos', titulo: 'Total de Pedidos', formatar: formatarNumero },
    { chave: 'ticket_medio', titulo: 'Ticket Médio', formatar: formatarMoeda },
    { chave: 'ultima_compra', titulo: 'Última Compra', formatar: formatarData },
  ]

  const csv = converterParaCSV(dados, colunas)
  baixarCSV(csv, nomeArquivo)
}

/**
 * Exporta relatório financeiro para CSV
 */
export function exportarRelatorioFinanceiro(
  dados: Array<Record<string, any>>,
  nomeArquivo: string = 'relatorio_financeiro'
): void {
  const colunas = [
    { chave: 'id', titulo: 'ID da Transação' },
    { chave: 'pedido_id', titulo: 'ID do Pedido' },
    { chave: 'valor_bruto', titulo: 'Valor Bruto', formatar: formatarMoeda },
    { chave: 'valor_liquido', titulo: 'Valor Líquido', formatar: formatarMoeda },
    { chave: 'taxa_percentual', titulo: 'Taxa Percentual (%)', formatar: formatarNumero },
    { chave: 'taxa_fixa', titulo: 'Taxa Fixa', formatar: formatarMoeda },
    { chave: 'modalidade', titulo: 'Modalidade' },
    { chave: 'data_pagamento', titulo: 'Data de Pagamento', formatar: formatarData },
    { chave: 'data_repasse_prevista', titulo: 'Data de Repasse Prevista', formatar: formatarData },
    { chave: 'status', titulo: 'Status' },
  ]

  const csv = converterParaCSV(dados, colunas)
  baixarCSV(csv, nomeArquivo)
}

/**
 * Exporta relatório de parcelamentos para CSV
 */
export function exportarRelatorioParcelamentos(
  dados: Array<Record<string, any>>,
  nomeArquivo: string = 'relatorio_parcelamentos'
): void {
  const colunas = [
    { chave: 'id', titulo: 'ID do Parcelamento' },
    { chave: 'pedido_id', titulo: 'ID do Pedido' },
    { chave: 'cliente', titulo: 'Cliente' },
    { chave: 'total_parcelas', titulo: 'Total de Parcelas', formatar: formatarNumero },
    { chave: 'valor_total', titulo: 'Valor Total', formatar: formatarMoeda },
    { chave: 'valor_parcela', titulo: 'Valor da Parcela', formatar: formatarMoeda },
    { chave: 'parcelas_pagas', titulo: 'Parcelas Pagas', formatar: formatarNumero },
    { chave: 'parcelas_pendentes', titulo: 'Parcelas Pendentes', formatar: formatarNumero },
    { chave: 'status', titulo: 'Status' },
  ]

  const csv = converterParaCSV(dados, colunas)
  baixarCSV(csv, nomeArquivo)
}

/**
 * Exporta relatório genérico para CSV
 */
export function exportarRelatorioGenerico(
  dados: Array<Record<string, any>>,
  colunas: Array<{ chave: string; titulo: string; formatar?: (valor: any) => string }>,
  nomeArquivo: string = 'relatorio'
): void {
  const csv = converterParaCSV(dados, colunas)
  baixarCSV(csv, nomeArquivo)
}

