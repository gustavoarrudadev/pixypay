import React, { useMemo, useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Dropdown } from './dropdown'
import { Button } from './button'

interface DateRangePickerCompactProps {
  value: 'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'
  onChange: (value: 'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado') => void
  dataInicio?: string
  dataFim?: string
  onDataInicioChange: (data: string) => void
  onDataFimChange: (data: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DateRangePickerCompact({
  value,
  onChange,
  dataInicio,
  dataFim,
  onDataInicioChange,
  onDataFimChange,
  open,
  onOpenChange,
}: DateRangePickerCompactProps) {
  const [mesAtual, setMesAtual] = useState<Date>(new Date())
  const [selecionandoInicio, setSelecionandoInicio] = useState(true)

  const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  const diasDoMes = useMemo(() => {
    const primeiroDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1)
    const ultimoDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0)
    const inicioGrid = new Date(primeiroDia)
    inicioGrid.setDate(primeiroDia.getDate() - primeiroDia.getDay())
    const fimGrid = new Date(ultimoDia)
    fimGrid.setDate(ultimoDia.getDate() + (6 - ultimoDia.getDay()))

    const dias: Date[] = []
    const cursor = new Date(inicioGrid)
    while (cursor <= fimGrid) {
      dias.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    return dias
  }, [mesAtual])

  const formatarData = (data: string) => {
    if (!data) return ''
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
  }

  const formatarYYYYMMDD = (d: Date): string => {
    const ano = d.getFullYear()
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const dia = String(d.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  const criarDataLocal = (yyyyMMdd: string): Date | null => {
    if (!yyyyMMdd) return null
    const [y, m, d] = yyyyMMdd.split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
  }

  const inicioSelecionado = useMemo(() => criarDataLocal(dataInicio || ''), [dataInicio])
  const fimSelecionado = useMemo(() => criarDataLocal(dataFim || ''), [dataFim])

  const estaNoMesAtual = (d: Date) => d.getMonth() === mesAtual.getMonth() && d.getFullYear() === mesAtual.getFullYear()
  const ehHoje = (d: Date) => {
    const t = new Date()
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
  }

  const estaSelecionado = (d: Date) => {
    if (inicioSelecionado && fimSelecionado) {
      return d >= inicioSelecionado && d <= fimSelecionado
    }
    if (inicioSelecionado && !fimSelecionado) {
      return d.getTime() === inicioSelecionado.getTime()
    }
    return false
  }

  const ehBorda = (d: Date) => {
    if (inicioSelecionado && d.getTime() === inicioSelecionado.getTime()) return true
    if (fimSelecionado && d.getTime() === fimSelecionado.getTime()) return true
    return false
  }

  const selecionarDia = (d: Date) => {
    if (selecionandoInicio) {
      onDataInicioChange(formatarYYYYMMDD(d))
      setSelecionandoInicio(false)
    } else {
      if (inicioSelecionado && d < inicioSelecionado) {
        onDataInicioChange(formatarYYYYMMDD(d))
        onDataFimChange('')
      } else {
        onDataFimChange(formatarYYYYMMDD(d))
        setSelecionandoInicio(true)
        onOpenChange?.(false)
      }
    }
  }

  const nomeMes = mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const textoExibido = useMemo(() => {
    if (value === 'tudo') return 'Todo o período'
    if (value === 'hoje') return 'Hoje'
    if (value === '7') return 'Últimos 7 dias'
    if (value === '15') return 'Últimos 15 dias'
    if (value === '30') return 'Últimos 30 dias'
    if (value === 'personalizado') {
      if (dataInicio && dataFim) {
        return `${formatarData(dataInicio)} - ${formatarData(dataFim)}`
      }
      if (dataInicio) {
        return `A partir de ${formatarData(dataInicio)}`
      }
      return 'Período personalizado'
    }
    return 'Selecionar período'
  }, [value, dataInicio, dataFim])

  return (
    <Dropdown
      aberto={open || false}
      onToggle={onOpenChange || (() => {})}
      trigger={
        <div>
          <Button
            variant="outline"
            size="sm"
            className="min-w-[180px] justify-start text-left font-normal"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            <span className="truncate">{textoExibido}</span>
          </Button>
        </div>
      }
    >
      <div className="w-[320px] p-3">
        {/* Opções rápidas */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(['hoje', '7', '15', '30'] as const).map((opcao) => (
            <button
              key={opcao}
              onClick={() => {
                onChange(opcao)
                onDataInicioChange('')
                onDataFimChange('')
                onOpenChange?.(false)
              }}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                value === opcao
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {opcao === 'hoje' ? 'Hoje' : `Últimos ${opcao} dias`}
            </button>
          ))}
        </div>

        {/* Calendário compacto */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
            >
              ←
            </button>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {nomeMes}
            </span>
            <button
              onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-neutral-500 dark:text-neutral-400 mb-1">
            {diasSemana.map((dw) => (
              <div key={dw} className="py-1">{dw}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {diasDoMes.map((d) => {
              const noMes = estaNoMesAtual(d)
              const selecionado = estaSelecionado(d)
              const borda = ehBorda(d)
              const hojeFlag = ehHoje(d)

              return (
                <button
                  key={d.toISOString()}
                  onClick={() => {
                    onChange('personalizado')
                    selecionarDia(d)
                  }}
                  className={`relative py-1.5 text-xs rounded transition-colors ${
                    !noMes ? 'text-neutral-300 dark:text-neutral-600' : ''
                  } ${
                    selecionado
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  } ${
                    borda ? 'ring-1 ring-violet-600 dark:ring-violet-400' : ''
                  }`}
                >
                  {hojeFlag && (
                    <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-violet-600" />
                  )}
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          {/* Datas selecionadas */}
          {(dataInicio || dataFim) && (
            <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center justify-between">
                <span>Início: {dataInicio ? formatarData(dataInicio) : '—'}</span>
                <span>Fim: {dataFim ? formatarData(dataFim) : '—'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onChange('tudo')
              onDataInicioChange('')
              onDataFimChange('')
              onOpenChange?.(false)
            }}
            className="flex-1 text-xs"
          >
            Limpar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onChange('personalizado')
              onOpenChange?.(false)
            }}
            className="flex-1 text-xs bg-violet-600 hover:bg-violet-700"
          >
            Aplicar
          </Button>
        </div>
      </div>
    </Dropdown>
  )
}

