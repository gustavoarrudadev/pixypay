import { useState } from 'react'
import { Wrench, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SelectMenu } from '@/components/ui/select-menu'
import { Card, CardContent } from '@/components/ui/card'
import {
  TIPOS_EQUIPAMENTOS,
  obterImagemEquipamento,
  obterNomeEquipamento,
  type TipoEquipamento,
} from '@/lib/produtosPadrao'

interface FormEquipamentoProps {
  onVoltar: () => void
  onSelecionar: (config: { tipo: TipoEquipamento; imagemUrl: string; nome: string }) => void
}

export function FormEquipamento({ onVoltar, onSelecionar }: FormEquipamentoProps) {
  const [tipo, setTipo] = useState<TipoEquipamento | null>(null)

  const imagemUrl = tipo ? obterImagemEquipamento(tipo) : null
  const nome = tipo ? obterNomeEquipamento(tipo) : null

  const handleContinuar = () => {
    if (tipo && imagemUrl && nome) {
      onSelecionar({ tipo, imagemUrl, nome })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onVoltar}
          className="text-neutral-600 dark:text-neutral-400"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Cadastrar Equipamento
        </h3>
      </div>

      {/* Seleção de Tipo */}
      <div className="space-y-2">
        <Label htmlFor="tipo" className="text-neutral-700 dark:text-neutral-300">
          Tipo de Equipamento *
        </Label>
        <SelectMenu
          value={tipo || ''}
          options={TIPOS_EQUIPAMENTOS.map((e) => ({ value: e.value, label: e.label }))}
          onChange={(value) => setTipo(value as TipoEquipamento)}
          placeholder="Selecione o equipamento"
        />
      </div>

      {/* Preview */}
      {tipo && imagemUrl && nome && (
        <Card className="border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 flex-shrink-0 border border-neutral-200 dark:border-neutral-700">
                <img
                  src={imagemUrl}
                  alt={nome}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    `
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Preview do Produto</p>
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
                  {nome}
                </h4>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão Continuar */}
      <Button
        type="button"
        onClick={handleContinuar}
        disabled={!tipo}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white"
      >
        <Wrench className="w-4 h-4 mr-2" />
        Continuar
      </Button>
    </div>
  )
}

