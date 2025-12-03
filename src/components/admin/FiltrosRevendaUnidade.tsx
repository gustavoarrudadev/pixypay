import { useState, useEffect, useMemo } from 'react'
import { Store } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SelectMenu } from '@/components/ui/select-menu'
import { listarUnidades, type UnidadeRevenda } from '@/lib/gerenciarUnidades'
import { listarRevendas, type RevendaCompleta } from '@/lib/gerenciarRevenda'

interface FiltrosRevendaUnidadeProps {
  revendaSelecionada: string | null
  unidadeSelecionada: string | null
  onRevendaSelecionada: (revendaId: string | null) => void
  onUnidadeSelecionada: (unidadeId: string | null) => void
  obrigatorio?: boolean
}

export function FiltrosRevendaUnidade({
  revendaSelecionada,
  unidadeSelecionada,
  onRevendaSelecionada,
  onUnidadeSelecionada,
  obrigatorio = false
}: FiltrosRevendaUnidadeProps) {
  const [revendas, setRevendas] = useState<RevendaCompleta[]>([])
  const [unidades, setUnidades] = useState<UnidadeRevenda[]>([])
  const [carregandoRevendas, setCarregandoRevendas] = useState(true)
  const [carregandoUnidades, setCarregandoUnidades] = useState(false)

  useEffect(() => {
    carregarRevendas()
  }, [])

  useEffect(() => {
    if (revendaSelecionada) {
      carregarUnidades(revendaSelecionada)
    } else {
      setUnidades([])
      onUnidadeSelecionada(null)
    }
  }, [revendaSelecionada])

  const carregarRevendas = async () => {
    setCarregandoRevendas(true)
    try {
      const { revendas: revendasData, error } = await listarRevendas()
      if (!error && revendasData) {
        setRevendas(revendasData)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar revendas:', error)
    } finally {
      setCarregandoRevendas(false)
    }
  }

  const carregarUnidades = async (revendaId: string) => {
    setCarregandoUnidades(true)
    try {
      const { unidades: unidadesData, error } = await listarUnidades(revendaId)
      if (!error && unidadesData) {
        setUnidades(unidadesData)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar unidades:', error)
    } finally {
      setCarregandoUnidades(false)
    }
  }

  const opcoesRevendas = useMemo(() => {
    return obrigatorio
      ? revendas.map(rev => ({
          value: rev.id,
          label: rev.nome_revenda || rev.id.slice(0, 8)
        }))
      : [
          { value: '', label: 'Todas as Revendas' },
          ...revendas.map(rev => ({
            value: rev.id,
            label: rev.nome_revenda || rev.id.slice(0, 8)
          })),
        ]
  }, [revendas, obrigatorio])

  const opcoesUnidades = useMemo(() => {
    return [
      { value: 'tudo', label: 'Todas as Unidades' },
      ...unidades.map(u => ({
        value: u.id,
        label: u.nome,
      })),
    ]
  }, [unidades])

  return (
    <Card className="border-neutral-200 dark:border-neutral-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <Store className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          
          <div className="flex-1 min-w-[180px]">
            <SelectMenu
              value={revendaSelecionada || (obrigatorio ? '' : '')}
              onChange={(value) => {
                onRevendaSelecionada(value === '' ? null : value)
                onUnidadeSelecionada(null) // Reset unidade quando revenda muda
              }}
              disabled={carregandoRevendas}
              options={opcoesRevendas}
              placeholder={obrigatorio ? 'Selecione uma revenda...' : 'Todas as Revendas'}
            />
          </div>

          {/* Filtro de Unidade - só aparece quando uma revenda está selecionada */}
          {revendaSelecionada && revendaSelecionada !== '' && (
            <>
              <div className="h-8 w-px bg-neutral-300 dark:bg-neutral-700" />
              <div className="flex-1 min-w-[180px]">
                <SelectMenu
                  value={unidadeSelecionada || 'tudo'}
                  onChange={(value) => {
                    onUnidadeSelecionada(value === 'tudo' ? null : value)
                  }}
                  disabled={carregandoUnidades}
                  options={opcoesUnidades}
                  placeholder="Todas as Unidades"
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

