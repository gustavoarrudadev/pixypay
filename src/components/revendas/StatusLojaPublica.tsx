import { useState } from 'react'
import { Circle, Power, Calendar, X, List, Trash2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog } from '@/components/ui/dialog'
import { Dropdown } from '@/components/ui/dropdown'
import { DatePicker } from '@/components/ui/date-picker'
import type { DadosAgendamento, TipoRepeticao, Agendamento } from '@/lib/gerenciarAgendamentos'

interface StatusLojaPublicaProps {
  ativo: boolean
  onToggle: (ativo: boolean) => void
  desabilitado?: boolean
  onCriarAgendamento?: (dados: DadosAgendamento) => Promise<void>
  agendamentos?: Agendamento[]
  onDeletarAgendamento?: (id: string) => Promise<void>
  onToggleAgendamento?: (id: string, ativo: boolean) => Promise<void>
}

const DIAS_SEMANA = [
  { valor: 0, label: 'Dom' },
  { valor: 1, label: 'Seg' },
  { valor: 2, label: 'Ter' },
  { valor: 3, label: 'Qua' },
  { valor: 4, label: 'Qui' },
  { valor: 5, label: 'Sex' },
  { valor: 6, label: 'Sáb' },
]

export function StatusLojaPublica({ 
  ativo, 
  onToggle, 
  desabilitado = false, 
  onCriarAgendamento,
  agendamentos = [],
  onDeletarAgendamento,
  onToggleAgendamento
}: StatusLojaPublicaProps) {
  const [mostrarAgendamento, setMostrarAgendamento] = useState(false)
  const [mostrarListaAgendamentos, setMostrarListaAgendamentos] = useState(false)
  const [salvando, setSalvando] = useState(false)
  
  const [tipoRepeticao, setTipoRepeticao] = useState<TipoRepeticao>('diario')
  const [diasSemana, setDiasSemana] = useState<number[]>([])
  const [horaAtivacao, setHoraAtivacao] = useState('09:00')
  const [horaDesativacao, setHoraDesativacao] = useState('18:00')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [dataFim, setDataFim] = useState('')
  
  // Estados para dropdowns de calendário
  const [dropdownDataInicio, setDropdownDataInicio] = useState(false)
  const [dropdownDataFim, setDropdownDataFim] = useState(false)

  const handleToggleDiaSemana = (dia: number) => {
    if (diasSemana.includes(dia)) {
      setDiasSemana(diasSemana.filter(d => d !== dia))
    } else {
      setDiasSemana([...diasSemana, dia])
    }
  }

  const handleSalvarAgendamento = async () => {
    if (!onCriarAgendamento) return
    
    if (tipoRepeticao === 'semanal' && diasSemana.length === 0) {
      alert('Selecione pelo menos um dia da semana')
      return
    }

    setSalvando(true)
    try {
      await onCriarAgendamento({
        tipo_repeticao: tipoRepeticao,
        dias_semana: tipoRepeticao === 'semanal' ? diasSemana : null,
        hora_ativacao: horaAtivacao,
        hora_desativacao: horaDesativacao,
        data_inicio: dataInicio,
        data_fim: dataFim || null,
      })
      
      // Reset form
      setTipoRepeticao('diario')
      setDiasSemana([])
      setHoraAtivacao('09:00')
      setHoraDesativacao('18:00')
      setDataInicio(new Date().toISOString().split('T')[0])
      setDataFim('')
      setMostrarAgendamento(false)
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between p-6 rounded-lg bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900/50 dark:to-neutral-800/50 border-2 border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          {/* Ícone de status pulsante */}
          <div className="relative">
            <div className={`absolute inset-0 rounded-full ${
              ativo 
                ? 'bg-green-500/20 animate-ping' 
                : 'bg-red-500/20 animate-ping'
            }`} />
            <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
              ativo 
                ? 'bg-green-500 dark:bg-green-600' 
                : 'bg-red-500 dark:bg-red-600'
            } shadow-lg`}>
              <Power className={`w-6 h-6 text-white ${ativo ? 'animate-pulse' : ''}`} />
            </div>
          </div>

          {/* Texto do status */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Label className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 cursor-pointer">
                Status da Loja
              </Label>
              <div className="flex items-center gap-1.5">
                <Circle 
                  className={`w-2 h-2 ${
                    ativo 
                      ? 'text-green-500 fill-green-500 animate-pulse' 
                      : 'text-red-500 fill-red-500 animate-pulse'
                  }`} 
                />
                <span className={`text-sm font-medium ${
                  ativo 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {ativo ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {ativo 
                ? 'Sua loja está visível e acessível pelo link público'
                : 'Sua loja está oculta e não será acessível pelo link público'
              }
            </p>
          </div>
        </div>

        {/* Switch e Botões */}
        <div className="flex items-center gap-4">
          <Switch
            checked={ativo}
            onCheckedChange={onToggle}
            disabled={desabilitado}
            className="scale-125"
          />
          {onCriarAgendamento && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarAgendamento(true)}
                className="border-neutral-300 dark:border-neutral-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Agendar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarListaAgendamentos(true)}
                className="border-neutral-300 dark:border-neutral-700"
                disabled={agendamentos.length === 0}
              >
                <List className="w-4 h-4 mr-2" />
                Ver Agendamentos
                {agendamentos.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">
                    {agendamentos.length}
                  </span>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modal de Agendamento Simplificado */}
      {onCriarAgendamento && (
        <Dialog 
          aberto={mostrarAgendamento} 
          onOpenChange={setMostrarAgendamento}
          titulo="Agendar Ativação/Desativação"
          descricao="Configure horários para ativar e desativar sua loja automaticamente"
        >
          <div className="space-y-4">
              {/* Tipo de Repetição */}
              <div className="space-y-2">
                <Label htmlFor="tipoRepeticao">Repetir</Label>
                <Select
                  id="tipoRepeticao"
                  value={tipoRepeticao}
                  onChange={(e) => setTipoRepeticao(e.target.value as TipoRepeticao)}
                >
                  <option value="diario">Todos os dias</option>
                  <option value="semanal">Dias da semana</option>
                  <option value="unico">Apenas uma vez</option>
                </Select>
              </div>

              {/* Dias da Semana (apenas para semanal) */}
              {tipoRepeticao === 'semanal' && (
                <div className="space-y-2">
                  <Label>Dias da Semana</Label>
                  <div className="flex flex-wrap gap-2">
                    {DIAS_SEMANA.map((dia) => (
                      <div key={dia.valor} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dia-${dia.valor}`}
                          checked={diasSemana.includes(dia.valor)}
                          onCheckedChange={() => handleToggleDiaSemana(dia.valor)}
                        />
                        <Label
                          htmlFor={`dia-${dia.valor}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {dia.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data de Início */}
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Dropdown
                  aberto={dropdownDataInicio}
                  onToggle={setDropdownDataInicio}
                  alinhamento="inicio"
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center justify-between gap-2 h-10 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-500" />
                        <span>
                          {dataInicio
                            ? new Date(dataInicio).toLocaleDateString('pt-BR')
                            : 'Selecionar data'}
                        </span>
                      </div>
                    </button>
                  }
                >
                  <DatePicker
                    variant="compact"
                    data={dataInicio}
                    onChange={(data) => {
                      setDataInicio(data)
                      setDropdownDataInicio(false)
                    }}
                  />
                </Dropdown>
              </div>

              {/* Data de Fim (opcional) */}
              <div className="space-y-2">
                <Label htmlFor="dataFim">Data de Fim (opcional)</Label>
                <Dropdown
                  aberto={dropdownDataFim}
                  onToggle={setDropdownDataFim}
                  alinhamento="inicio"
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center justify-between gap-2 h-10 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-500" />
                        <span>
                          {dataFim
                            ? new Date(dataFim).toLocaleDateString('pt-BR')
                            : 'Selecionar data'}
                        </span>
                      </div>
                    </button>
                  }
                >
                  <DatePicker
                    variant="compact"
                    data={dataFim}
                    onChange={(data) => {
                      setDataFim(data)
                      setDropdownDataFim(false)
                    }}
                    min={dataInicio}
                  />
                </Dropdown>
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horaAtivacao">Ativar às</Label>
                  <Input
                    id="horaAtivacao"
                    type="time"
                    value={horaAtivacao}
                    onChange={(e) => setHoraAtivacao(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaDesativacao">Desativar às</Label>
                  <Input
                    id="horaDesativacao"
                    type="time"
                    value={horaDesativacao}
                    onChange={(e) => setHoraDesativacao(e.target.value)}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSalvarAgendamento}
                  disabled={salvando}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {salvando ? 'Salvando...' : 'Salvar Agendamento'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMostrarAgendamento(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
        </Dialog>
      )}

      {/* Modal de Lista de Agendamentos */}
      {agendamentos.length > 0 && (
        <Dialog 
          aberto={mostrarListaAgendamentos} 
          onOpenChange={setMostrarListaAgendamentos}
          titulo="Agendamentos da Loja"
          descricao="Gerencie os horários programados para ativar e desativar sua loja"
        >
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {agendamentos.map((agendamento) => {
              const formatarRepeticao = () => {
                if (agendamento.tipo_repeticao === 'diario') return 'Todos os dias'
                if (agendamento.tipo_repeticao === 'semanal') {
                  const dias = agendamento.dias_semana?.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ') || ''
                  return `Semanal (${dias})`
                }
                if (agendamento.tipo_repeticao === 'unico') return 'Uma vez'
                return agendamento.tipo_repeticao
              }

              return (
                <div
                  key={agendamento.id}
                  className="flex items-start justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 dark:text-neutral-50">
                        {formatarRepeticao()}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        agendamento.ativo 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}>
                        {agendamento.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Horário:</span>
                        <span>{agendamento.hora_ativacao} - {agendamento.hora_desativacao}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Período:</span>
                        <span>
                          {new Date(agendamento.data_inicio).toLocaleDateString('pt-BR')}
                          {agendamento.data_fim && ` até ${new Date(agendamento.data_fim).toLocaleDateString('pt-BR')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {onToggleAgendamento && (
                      <Switch
                        checked={agendamento.ativo}
                        onCheckedChange={(ativo) => onToggleAgendamento(agendamento.id, ativo)}
                        className="scale-90"
                      />
                    )}
                    {onDeletarAgendamento && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeletarAgendamento(agendamento.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-4">
            <Button
              variant="outline"
              onClick={() => setMostrarListaAgendamentos(false)}
            >
              Fechar
            </Button>
          </div>
        </Dialog>
      )}
    </>
  )
}

