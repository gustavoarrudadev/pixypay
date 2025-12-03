import { useState } from 'react'
import { Calendar, Clock, Repeat, X, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import type { Agendamento, DadosAgendamento, TipoRepeticao } from '@/lib/gerenciarAgendamentos'

interface AgendamentoLojaProps {
  revendaId: string
  agendamentos: Agendamento[]
  onCriar: (dados: DadosAgendamento) => Promise<void>
  onDeletar: (id: string) => Promise<void>
  onToggle: (id: string, ativo: boolean) => Promise<void>
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

export function AgendamentoLoja({ revendaId, agendamentos, onCriar, onDeletar, onToggle }: AgendamentoLojaProps) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [salvando, setSalvando] = useState(false)
  
  const [tipoRepeticao, setTipoRepeticao] = useState<TipoRepeticao>('diario')
  const [diasSemana, setDiasSemana] = useState<number[]>([])
  const [horaAtivacao, setHoraAtivacao] = useState('09:00')
  const [horaDesativacao, setHoraDesativacao] = useState('18:00')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [dataFim, setDataFim] = useState('')

  const handleToggleDiaSemana = (dia: number) => {
    if (diasSemana.includes(dia)) {
      setDiasSemana(diasSemana.filter(d => d !== dia))
    } else {
      setDiasSemana([...diasSemana, dia])
    }
  }

  const handleSalvar = async () => {
    if (tipoRepeticao === 'semanal' && diasSemana.length === 0) {
      alert('Selecione pelo menos um dia da semana')
      return
    }

    setSalvando(true)
    try {
      await onCriar({
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
      setMostrarFormulario(false)
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
    } finally {
      setSalvando(false)
    }
  }

  const formatarRepeticao = (agendamento: Agendamento) => {
    if (agendamento.tipo_repeticao === 'diario') {
      return 'Diário'
    } else if (agendamento.tipo_repeticao === 'semanal') {
      const dias = agendamento.dias_semana?.map(d => DIAS_SEMANA[d].label).join(', ') || ''
      return `Semanal (${dias})`
    } else if (agendamento.tipo_repeticao === 'unico') {
      return 'Único'
    }
    return agendamento.tipo_repeticao
  }

  return (
    <Card className="border-neutral-200 dark:border-neutral-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Agendamento Automático
            </CardTitle>
            <CardDescription>
              Configure horários para ativar e desativar sua loja automaticamente
            </CardDescription>
          </div>
          {!mostrarFormulario && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarFormulario(true)}
              className="border-neutral-300 dark:border-neutral-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário de Novo Agendamento */}
        {mostrarFormulario && (
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Novo Agendamento</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMostrarFormulario(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Tipo de Repetição */}
            <div className="space-y-2">
              <Label htmlFor="tipoRepeticao">Tipo de Repetição</Label>
              <Select
                id="tipoRepeticao"
                value={tipoRepeticao}
                onChange={(e) => setTipoRepeticao(e.target.value as TipoRepeticao)}
              >
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="unico">Único</option>
              </Select>
            </div>

            {/* Dias da Semana (apenas para semanal) */}
            {tipoRepeticao === 'semanal' && (
              <div className="space-y-2">
                <Label>Dias da Semana</Label>
                <div className="flex flex-wrap gap-3">
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
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            {/* Data de Fim (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data de Fim (opcional)</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                min={dataInicio}
              />
            </div>

            {/* Horários */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horaAtivacao">Hora de Ativação</Label>
                <Input
                  id="horaAtivacao"
                  type="time"
                  value={horaAtivacao}
                  onChange={(e) => setHoraAtivacao(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horaDesativacao">Hora de Desativação</Label>
                <Input
                  id="horaDesativacao"
                  type="time"
                  value={horaDesativacao}
                  onChange={(e) => setHoraDesativacao(e.target.value)}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2">
              <Button
                onClick={handleSalvar}
                disabled={salvando}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {salvando ? 'Salvando...' : 'Salvar Agendamento'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setMostrarFormulario(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de Agendamentos */}
        {agendamentos.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum agendamento configurado</p>
            <p className="text-sm mt-1">Configure horários para ativar/desativar sua loja automaticamente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agendamentos.map((agendamento) => (
              <div
                key={agendamento.id}
                className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-neutral-500" />
                      <span className="font-medium text-neutral-900 dark:text-neutral-50">
                        {formatarRepeticao(agendamento)}
                      </span>
                      <Switch
                        checked={agendamento.ativo}
                        onCheckedChange={(ativo: boolean) => onToggle(agendamento.id, ativo)}
                        className="ml-2"
                      />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{agendamento.hora_ativacao} - {agendamento.hora_desativacao}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(agendamento.data_inicio).toLocaleDateString('pt-BR')}
                          {agendamento.data_fim && ` até ${new Date(agendamento.data_fim).toLocaleDateString('pt-BR')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeletar(agendamento.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

