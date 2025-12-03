import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface DateRangePickerProps {
  dataInicio?: string // formato YYYY-MM-DD
  dataFim?: string // formato YYYY-MM-DD
  onChange: (inicio: string, fim: string) => void
  className?: string
  label?: string
  variant?: 'default' | 'compact'
}

// Utilitário: formata Date para YYYY-MM-DD (sem timezone)
function formatarYYYYMMDD(d: Date): string {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

// Utilitário: cria Date a partir de YYYY-MM-DD com horário local
function criarDataLocal(yyyyMMdd: string): Date | null {
  if (!yyyyMMdd) return null
  const [y, m, d] = yyyyMMdd.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function DateRangePicker({ dataInicio, dataFim, onChange, className, label, variant = 'default' }: DateRangePickerProps) {
  // Estado do mês exibido
  const hoje = new Date()
  const [mesAtual, setMesAtual] = useState<Date>(criarDataLocal(dataInicio || '') || new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const [diaHover, setDiaHover] = useState<Date | null>(null)

  const inicioSelecionado = useMemo(() => criarDataLocal(dataInicio || ''), [dataInicio])
  const fimSelecionado = useMemo(() => criarDataLocal(dataFim || ''), [dataFim])

  const nomeMes = useMemo(() => {
    return mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }, [mesAtual])

  const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  // Calcula grid do mês
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

  const estaNoMesAtual = (d: Date) => d.getMonth() === mesAtual.getMonth() && d.getFullYear() === mesAtual.getFullYear()
  const ehHoje = (d: Date) => {
    const t = new Date()
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
  }

  const estaSelecionado = (d: Date) => {
    if (inicioSelecionado && !fimSelecionado) {
      // Em seleção de início, destaca hover range
      if (diaHover) {
        const min = inicioSelecionado < diaHover ? inicioSelecionado : diaHover
        const max = inicioSelecionado > diaHover ? inicioSelecionado : diaHover
        return d >= min && d <= max
      }
      return d.getTime() === inicioSelecionado.getTime()
    }
    if (inicioSelecionado && fimSelecionado) {
      return d >= inicioSelecionado && d <= fimSelecionado
    }
    return false
  }

  const ehBordaSelecionada = (d: Date) => {
    if (inicioSelecionado && d.getTime() === inicioSelecionado.getTime()) return true
    if (fimSelecionado && d.getTime() === fimSelecionado.getTime()) return true
    return false
  }

  const selecionarDia = (d: Date) => {
    // Lógica de seleção: primeiro clique define início, segundo define fim
    if (!inicioSelecionado || (inicioSelecionado && fimSelecionado)) {
      onChange(formatarYYYYMMDD(d), '')
      setDiaHover(null)
      return
    }

    if (inicioSelecionado && !fimSelecionado) {
      if (d < inicioSelecionado) {
        // Se clicou antes do início, reinicia início
        onChange(formatarYYYYMMDD(d), '')
        setDiaHover(null)
      } else if (d.getTime() === inicioSelecionado.getTime()) {
        // Clicar no mesmo dia marca início apenas
        onChange(formatarYYYYMMDD(d), '')
        setDiaHover(null)
      } else {
        // Define fim
        onChange(formatarYYYYMMDD(inicioSelecionado), formatarYYYYMMDD(d))
        setDiaHover(null)
      }
    }
  }

  const irMesAnterior = () => {
    setMesAtual(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  const irProximoMes = () => {
    setMesAtual(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  return (
    <div className={`w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 ${className || ''}`}>
      <div className={`${variant === 'compact' ? 'p-2' : 'p-3'} border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          {label && variant !== 'compact' && (
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{label}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={irMesAnterior}
            className={`inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${variant === 'compact' ? 'w-7 h-7' : 'w-8 h-8'}`}
          >
            <ChevronLeft className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          </button>
          <span className={`text-sm text-neutral-700 dark:text-neutral-300 ${variant === 'compact' ? 'min-w-[100px]' : 'min-w-[120px]'} text-center`}>
            {nomeMes}
          </span>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={irProximoMes}
            className={`inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${variant === 'compact' ? 'w-7 h-7' : 'w-8 h-8'}`}
          >
            <ChevronRight className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          </button>
        </div>
      </div>

      <div className={`${variant === 'compact' ? 'p-2' : 'p-3'}`}>
        {/* Cabeçalho dias da semana */}
        <div className="grid grid-cols-7 text-center text-xs text-neutral-500 dark:text-neutral-400 mb-2">
          {diasSemana.map((dw) => (
            <div key={dw} className="py-1">{dw}</div>
          ))}
        </div>
        {/* Grid dias */}
        <div className="grid grid-cols-7 gap-1">
          {diasDoMes.map((d) => {
            const noMes = estaNoMesAtual(d)
            const selecionado = estaSelecionado(d)
            const borda = ehBordaSelecionada(d)
            const hojeFlag = ehHoje(d)
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => selecionarDia(d)}
                onMouseEnter={() => setDiaHover(d)}
                onMouseLeave={() => setDiaHover(null)}
                className={
                  `relative py-2 text-sm rounded-md transition-colors ` +
                  `${noMes ? 'text-neutral-900 dark:text-neutral-50' : 'text-neutral-400 dark:text-neutral-500'} ` +
                  `${selecionado ? 'bg-violet-50 dark:bg-violet-950/30' : ''} ` +
                  `${borda ? 'ring-2 ring-violet-600 dark:ring-violet-500' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'} ` +
                  `focus:outline-none focus:ring-2 focus:ring-violet-600`
                }
              >
                {/* Indicador leve para hoje */}
                {hojeFlag && (
                  <span className="absolute top-1 right-1 inline-block w-1.5 h-1.5 rounded-full bg-violet-600" />
                )}
                <span>{d.getDate()}</span>
              </button>
            )
          })}
        </div>

        {/* Rodapé com datas selecionadas */}
        <div className={`${variant === 'compact' ? 'mt-2 text-[11px]' : 'mt-3 text-xs'} flex items-center justify-between`}>
          <div className="text-neutral-600 dark:text-neutral-400">
            Início: <span className="font-medium">{dataInicio || '—'}</span>
          </div>
          <div className="text-neutral-600 dark:text-neutral-400">
            Fim: <span className="font-medium">{dataFim || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange('', '')}
              className="px-2 py-1 rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}