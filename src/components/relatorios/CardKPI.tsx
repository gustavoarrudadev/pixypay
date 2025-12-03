import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CardKPIProps {
  titulo: string
  valor: string | number
  icone?: LucideIcon
  descricao?: string
  variacao?: {
    valor: number
    tipo: 'positivo' | 'negativo' | 'neutro'
  }
  className?: string
}

export function CardKPI({ titulo, valor, icone: Icone, descricao, variacao, className }: CardKPIProps) {
  const valorFormatado = typeof valor === 'number' ? valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) : valor

  return (
    <Card className={cn('border-neutral-200 dark:border-neutral-800', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {titulo}
        </CardTitle>
        {Icone && (
          <Icone className="h-4 w-4 text-neutral-400 dark:text-neutral-600" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          {valorFormatado}
        </div>
        {descricao && (
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
            {descricao}
          </p>
        )}
        {variacao && (
          <div className={cn(
            'text-xs mt-1',
            variacao.tipo === 'positivo' && 'text-green-600 dark:text-green-400',
            variacao.tipo === 'negativo' && 'text-red-600 dark:text-red-400',
            variacao.tipo === 'neutro' && 'text-neutral-500'
          )}>
            {variacao.tipo === 'positivo' && '+'}
            {variacao.valor.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            {' '}vs período anterior
          </div>
        )}
      </CardContent>
    </Card>
  )
}

