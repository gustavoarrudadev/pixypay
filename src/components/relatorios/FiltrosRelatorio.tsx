import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface FiltrosRelatorioProps {
  tipo: 'vendas' | 'produtos' | 'clientes' | 'financeiro' | 'parcelamentos' | 'agendamentos'
  filtroPeriodo: 'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'
  onFiltroPeriodoChange: (value: 'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado') => void
  dataInicio: string
  dataFim: string
  onDataInicioChange: (data: string) => void
  onDataFimChange: (data: string) => void
  dropdownCalendarioAberto: boolean
  onDropdownCalendarioChange: (open: boolean) => void
  filtrosEspecificos: Record<string, any>
  onFiltroEspecificoChange: (chave: string, valor: any) => void
  onAtualizar: () => void
  carregando: boolean
  desabilitado?: boolean
  // Opcional: filtro de revenda para Admin
  revendaSelecionada?: string
  revendas?: Array<{ id: string; nome: string }>
  onRevendaChange?: (revendaId: string) => void
}

export function FiltrosRelatorio({
  tipo,
  filtroPeriodo,
  onFiltroPeriodoChange,
  dataInicio,
  dataFim,
  onDataInicioChange,
  onDataFimChange,
  dropdownCalendarioAberto,
  onDropdownCalendarioChange,
  filtrosEspecificos,
  onFiltroEspecificoChange,
  onAtualizar,
  carregando,
  desabilitado,
  revendaSelecionada,
  revendas,
  onRevendaChange,
}: FiltrosRelatorioProps) {
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
        onDropdownCalendarioChange(false)
      }
    }
  }

  const nomeMes = mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const periodoSelectRef = useRef<HTMLDivElement>(null)
  const [calendarioPos, setCalendarioPos] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    if (filtroPeriodo === 'personalizado' && dropdownCalendarioAberto && periodoSelectRef.current) {
      const rect = periodoSelectRef.current.getBoundingClientRect()
      setCalendarioPos({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      })
    } else {
      setCalendarioPos(null)
    }
  }, [filtroPeriodo, dropdownCalendarioAberto])

  useEffect(() => {
    if (!dropdownCalendarioAberto) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        periodoSelectRef.current &&
        !periodoSelectRef.current.contains(target) &&
        !(e.target as Element)?.closest('[data-calendario-dropdown]')
      ) {
        onDropdownCalendarioChange(false)
      }
    }

    const handleScroll = () => {
      if (periodoSelectRef.current) {
        const rect = periodoSelectRef.current.getBoundingClientRect()
        setCalendarioPos({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
        })
      }
    }

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true)
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleScroll, true)
    }, 10)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll, true)
    }
  }, [dropdownCalendarioAberto, onDropdownCalendarioChange])

  const renderFiltrosEspecificos = () => {
    switch (tipo) {
      case 'vendas':
        return (
          <>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                Status
              </label>
              <Select
                value={filtrosEspecificos.status || 'todos'}
                onChange={(e) => onFiltroEspecificoChange('status', e.target.value)}
                className="w-full"
              >
                <option value="todos">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="preparando">Preparando</option>
                <option value="pronto">Pronto</option>
                <option value="em_transito">Em Trânsito</option>
                <option value="entregue">Entregue</option>
                <option value="cancelado">Cancelado</option>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                Forma Pagamento
              </label>
              <Select
                value={filtrosEspecificos.formaPagamento || 'todas'}
                onChange={(e) => onFiltroEspecificoChange('formaPagamento', e.target.value)}
                className="w-full"
              >
                <option value="todas">Todas</option>
                <option value="pix_vista">PIX à Vista</option>
                <option value="pix_parcelado">PIX Parcelado</option>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                Tipo Entrega
              </label>
              <Select
                value={filtrosEspecificos.tipoEntrega || 'todos'}
                onChange={(e) => onFiltroEspecificoChange('tipoEntrega', e.target.value)}
                className="w-full"
              >
                <option value="todos">Todos</option>
                <option value="retirar_local">Retirar no Local</option>
                <option value="receber_endereco">Receber no Endereço</option>
                <option value="agendar">Agendar</option>
              </Select>
            </div>
          </>
        )

      case 'produtos':
        return (
          <>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                Ordenar por
              </label>
              <Select
                value={filtrosEspecificos.ordenarPor || 'quantidade'}
                onChange={(e) => onFiltroEspecificoChange('ordenarPor', e.target.value)}
                className="w-full"
              >
                <option value="quantidade">Quantidade</option>
                <option value="valor">Valor Total</option>
                <option value="nome">Nome</option>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                Ordem
              </label>
              <Select
                value={filtrosEspecificos.ordem || 'desc'}
                onChange={(e) => onFiltroEspecificoChange('ordem', e.target.value)}
                className="w-full"
              >
                <option value="desc">Maior → Menor</option>
                <option value="asc">Menor → Maior</option>
              </Select>
            </div>
          </>
        )

      case 'clientes':
        return (
          <>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                Tipo Cliente
              </label>
              <Select
                value={filtrosEspecificos.tipoCliente || 'todos'}
                onChange={(e) => onFiltroEspecificoChange('tipoCliente', e.target.value)}
                className="w-full"
              >
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="recorrentes">Recorrentes</option>
                <option value="novos">Novos</option>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                Ordenar por
              </label>
              <Select
                value={filtrosEspecificos.ordenarPor || 'total_pedidos'}
                onChange={(e) => onFiltroEspecificoChange('ordenarPor', e.target.value)}
                className="w-full"
              >
                <option value="total_pedidos">Total de Pedidos</option>
                <option value="ticket_medio">Ticket Médio</option>
                <option value="nome">Nome</option>
              </Select>
            </div>
          </>
        )

      case 'financeiro':
        return (
          <>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                Status
              </label>
              <Select
                value={filtrosEspecificos.status || 'todos'}
                onChange={(e) => onFiltroEspecificoChange('status', e.target.value)}
                className="w-full"
              >
                <option value="todos">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="liberado">Liberado</option>
                <option value="repassado">Repassado</option>
                <option value="cancelado">Cancelado</option>
                </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                Modalidade
              </label>
              <Select
                value={filtrosEspecificos.modalidade || 'todas'}
                onChange={(e) => onFiltroEspecificoChange('modalidade', e.target.value)}
                className="w-full"
              >
                <option value="todas">Todas</option>
                <option value="D+1">D+1</option>
                <option value="D+15">D+15</option>
                <option value="D+30">D+30</option>
              </Select>
            </div>
          </>
        )

      case 'parcelamentos':
        return (
          <>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                Status
              </label>
              <Select
                value={filtrosEspecificos.status || 'todos'}
                onChange={(e) => onFiltroEspecificoChange('status', e.target.value)}
                className="w-full"
              >
                <option value="todos">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="quitado">Quitado</option>
                <option value="cancelado">Cancelado</option>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                Situação
              </label>
              <Select
                value={filtrosEspecificos.situacao || 'todos'}
                onChange={(e) => onFiltroEspecificoChange('situacao', e.target.value)}
                className="w-full"
              >
                <option value="todos">Todos</option>
                <option value="em_dia">Em Dia</option>
                <option value="atrasado">Atrasado</option>
              </Select>
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <Card className="border-neutral-200 dark:border-neutral-800">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-4 items-end">
          {revendaSelecionada !== undefined && revendas && onRevendaChange && (
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                Revenda
              </label>
              <Select
                value={revendaSelecionada}
                onChange={(e) => onRevendaChange(e.target.value)}
                className="w-full"
              >
                <option value="todas">Todas as Revendas</option>
                {revendas.map((revenda) => (
                  <option key={revenda.id} value={revenda.id}>
                    {revenda.nome}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex-1 min-w-[200px] relative">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
              Período
            </label>
            <div ref={periodoSelectRef}>
              <Select
                value={filtroPeriodo}
                onChange={(e) => {
                  const valor = e.target.value as 'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'
                  onFiltroPeriodoChange(valor)
                  if (valor === 'personalizado') {
                    setTimeout(() => {
                      onDropdownCalendarioChange(true)
                    }, 150)
                  } else {
                    onDropdownCalendarioChange(false)
                  }
                }}
                className="w-full"
              >
                <option value="tudo">Todo momento</option>
                <option value="hoje">Hoje</option>
                <option value="7">7 dias</option>
                <option value="15">15 dias</option>
                <option value="30">30 dias</option>
                <option value="personalizado">Personalizado</option>
              </Select>
            </div>
            {filtroPeriodo === 'personalizado' && dropdownCalendarioAberto && calendarioPos && 
              createPortal(
                <div
                  data-calendario-dropdown
                  className="fixed z-[9999] rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg shadow-neutral-200/40 dark:shadow-black/20 animate-fade-in min-w-[320px]"
                  style={{
                    top: calendarioPos.top,
                    left: calendarioPos.left,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
              <div className="p-3">
                {/* Opções rápidas */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {(['hoje', '7', '15', '30'] as const).map((opcao) => (
                    <button
                      key={opcao}
                      onClick={() => {
                        onFiltroPeriodoChange(opcao)
                        onDataInicioChange('')
                        onDataFimChange('')
                        onDropdownCalendarioChange(false)
                      }}
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                        filtroPeriodo === opcao
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
                            onFiltroPeriodoChange('personalizado')
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
                      onFiltroPeriodoChange('tudo')
                      onDataInicioChange('')
                      onDataFimChange('')
                      onDropdownCalendarioChange(false)
                    }}
                    className="flex-1 text-xs"
                  >
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      onFiltroPeriodoChange('personalizado')
                      onDropdownCalendarioChange(false)
                    }}
                    className="flex-1 text-xs bg-violet-600 hover:bg-violet-700"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
              </div>,
              document.body
            )}
          </div>

          {renderFiltrosEspecificos()}
        </div>
      </CardContent>
    </Card>
  )
}

