import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatarMoeda, formatarData, formatarNumero } from '@/lib/relatorios/exportar'

interface Coluna {
  chave: string
  titulo: string
  formatar?: (valor: any) => string
  alinhamento?: 'left' | 'center' | 'right'
}

interface TabelaRelatorioProps {
  titulo?: string
  colunas: Coluna[]
  dados: Array<Record<string, any>>
  className?: string
}

export function TabelaRelatorio({ titulo, colunas, dados, className }: TabelaRelatorioProps) {
  const formatarValor = (coluna: Coluna, valor: any): string => {
    if (coluna.formatar) {
      return coluna.formatar(valor)
    }

    // Formatação automática baseada no tipo
    if (typeof valor === 'number') {
      // Se parece ser monetário (tem centavos)
      if (valor % 1 !== 0 && valor < 10000) {
        return formatarMoeda(valor)
      }
      return formatarNumero(valor)
    }

    if (typeof valor === 'string' && valor.match(/^\d{4}-\d{2}-\d{2}/)) {
      return formatarData(valor)
    }

    return String(valor || '')
  }

  return (
    <Card className={className}>
      {titulo && (
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {colunas.map((coluna) => (
                  <TableHead
                    key={coluna.chave}
                    className={coluna.alinhamento === 'right' ? 'text-right' : coluna.alinhamento === 'center' ? 'text-center' : ''}
                  >
                    {coluna.titulo}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colunas.length} className="text-center text-neutral-500 py-8">
                    Nenhum dado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                dados.map((linha, index) => (
                  <TableRow key={index}>
                    {colunas.map((coluna) => (
                      <TableCell
                        key={coluna.chave}
                        className={coluna.alinhamento === 'right' ? 'text-right' : coluna.alinhamento === 'center' ? 'text-center' : ''}
                      >
                        {formatarValor(coluna, linha[coluna.chave])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

