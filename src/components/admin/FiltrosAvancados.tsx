import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SelectMenu } from '@/components/ui/select-menu'
import { Button } from '@/components/ui/button'
import { DateRangePickerCompact } from '@/components/ui/date-range-picker-compact'

interface FiltrosAvancadosProps {
  busca: string
  onBuscaChange: (value: string) => void
  statusFiltro?: {
    value: string
    onChange: (value: string) => void
    options: Array<{ value: string; label: string }>
    label?: string
  }
  statusFiltro2?: {
    value: string
    onChange: (value: string) => void
    options: Array<{ value: string; label: string }>
    label?: string
  }
  modalidadeFiltro?: {
    value: string
    onChange: (value: string) => void
    options: Array<{ value: string; label: string }>
  }
  dataFiltro: {
    value: 'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'
    onChange: (value: 'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado') => void
    dataInicio?: string
    dataFim?: string
    onDataInicioChange?: (value: string) => void
    onDataFimChange?: (value: string) => void
  }
  onLimparFiltros?: () => void
  placeholderBusca?: string
  mostrarLimpar?: boolean
}

export function FiltrosAvancados({
  busca,
  onBuscaChange,
  statusFiltro,
  statusFiltro2,
  modalidadeFiltro,
  dataFiltro,
  onLimparFiltros,
  placeholderBusca = 'Buscar...',
  mostrarLimpar = true,
}: FiltrosAvancadosProps) {
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)
  const temFiltrosAtivos = busca || 
    (statusFiltro && statusFiltro.value !== 'todos' && statusFiltro.value !== 'tudo') ||
    (statusFiltro2 && statusFiltro2.value !== 'todos' && statusFiltro2.value !== 'tudo') ||
    (modalidadeFiltro && modalidadeFiltro.value !== 'todos') ||
    dataFiltro.value !== 'tudo'

  const handleLimpar = () => {
    onBuscaChange('')
    statusFiltro?.onChange(statusFiltro.options[0]?.value || 'todos')
    statusFiltro2?.onChange(statusFiltro2.options[0]?.value || 'todos')
    modalidadeFiltro?.onChange('todos')
    dataFiltro.onChange('tudo')
    if (dataFiltro.onDataInicioChange) dataFiltro.onDataInicioChange('')
    if (dataFiltro.onDataFimChange) dataFiltro.onDataFimChange('')
    onLimparFiltros?.()
  }

  return (
    <Card className="border-neutral-200 dark:border-neutral-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Busca */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder={placeholderBusca}
                value={busca}
                onChange={(e) => onBuscaChange(e.target.value)}
                className="pl-10 border-neutral-300 dark:border-neutral-700"
              />
            </div>
          </div>

          {/* Status 1 */}
          {statusFiltro && (
            <div className="min-w-[140px]">
              <SelectMenu
                value={statusFiltro.value}
                onChange={statusFiltro.onChange}
                options={statusFiltro.options}
                placeholder={statusFiltro.label || 'Status'}
              />
            </div>
          )}

          {/* Status 2 */}
          {statusFiltro2 && (
            <div className="min-w-[140px]">
              <SelectMenu
                value={statusFiltro2.value}
                onChange={statusFiltro2.onChange}
                options={statusFiltro2.options}
                placeholder={statusFiltro2.label || 'Status'}
              />
            </div>
          )}

          {/* Modalidade */}
          {modalidadeFiltro && (
            <div className="min-w-[120px]">
              <SelectMenu
                value={modalidadeFiltro.value}
                onChange={modalidadeFiltro.onChange}
                options={modalidadeFiltro.options}
                placeholder="Modalidade"
              />
            </div>
          )}

          {/* Data */}
          <div className="min-w-[160px]">
            <DateRangePickerCompact
              value={dataFiltro.value}
              onChange={dataFiltro.onChange}
              dataInicio={dataFiltro.dataInicio}
              dataFim={dataFiltro.dataFim}
              onDataInicioChange={dataFiltro.onDataInicioChange || (() => {})}
              onDataFimChange={dataFiltro.onDataFimChange || (() => {})}
              open={dropdownCalendarioAberto}
              onOpenChange={setDropdownCalendarioAberto}
            />
          </div>

          {/* Botão Limpar */}
          {mostrarLimpar && temFiltrosAtivos && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLimpar}
              className="whitespace-nowrap border-neutral-300 dark:border-neutral-700"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

















