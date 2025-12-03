import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor numérico como preço em reais (R$)
 */
export function formatarPreco(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

/**
 * Formata uma data para formato brasileiro
 */
export function formatarData(data: string | Date | null | undefined): string {
  if (!data) return 'N/A'
  const dataObj = typeof data === 'string' ? new Date(data) : data
  if (isNaN(dataObj.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dataObj)
}

/**
 * Calcula e formata o valor parcelado de forma atrativa para clientes
 * SEMPRE mostra formato parcelado (padrão 3x) para tornar mais atrativo
 * 
 * @param preco Preço do produto
 * @param maxParcelas Número máximo de parcelas permitidas (padrão: 3 para sempre mostrar parcelado)
 * @returns Objeto com informações de parcelamento formatadas
 */
export function calcularValorParcelado(
  preco: number,
  maxParcelas: number | null | undefined = 3
): {
  valorParcela: number
  maxParcelas: number
  textoParcelado: string
  textoVista: string
  emAte: string
  parcelasTexto: string
  pixParcelado: string
} {
  // Sempre usa pelo menos 3 parcelas para mostrar formato atrativo
  // Se maxParcelas for fornecido e maior que 3, usa o valor fornecido
  // Caso contrário, usa 3 como padrão
  const parcelasValidas = maxParcelas && maxParcelas > 1 ? Math.min(maxParcelas, 3) : 3

  // Calcula o valor da parcela
  const valorParcela = preco / parcelasValidas

  // Formata o texto parcelado de forma atrativa
  const textoParcelado = `em até ${parcelasValidas}x de ${formatarPreco(valorParcela)} no pix parcelado`
  const textoVista = formatarPreco(preco)

  return {
    valorParcela,
    maxParcelas: parcelasValidas,
    textoParcelado,
    textoVista,
    // Retorna partes separadas para melhor formatação
    emAte: 'em até',
    parcelasTexto: `${parcelasValidas}x ${formatarPreco(valorParcela)}`, // Removido "de"
    pixParcelado: 'no PIX Parcelado',
  }
}

