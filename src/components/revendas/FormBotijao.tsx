import { useState } from 'react'
import { Package, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SelectMenu } from '@/components/ui/select-menu'
import { Card, CardContent } from '@/components/ui/card'
import {
  MARCAS_BOTIJOES,
  TIPOS_BOTIJOES,
  obterImagemBotijao,
  obterNomeBotijao,
  type MarcaBotijao,
  type TipoBotijao,
} from '@/lib/produtosPadrao'

interface FormBotijaoProps {
  onVoltar: () => void
  onSelecionar: (config: { marca: MarcaBotijao; tipo: TipoBotijao; imagemUrl: string; nome: string }) => void
}

export function FormBotijao({ onVoltar, onSelecionar }: FormBotijaoProps) {
  const [marca, setMarca] = useState<MarcaBotijao | null>(null)
  const [tipo, setTipo] = useState<TipoBotijao | null>(null)

  const imagemUrl = marca && tipo ? obterImagemBotijao(marca, tipo) : null
  const nome = tipo ? obterNomeBotijao(tipo) : null

  const handleContinuar = () => {
    if (marca && tipo && imagemUrl && nome) {
      onSelecionar({ marca, tipo, imagemUrl, nome })
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
          Cadastrar Botijão
        </h3>
      </div>

      {/* Seleção de Marca */}
      <div className="space-y-2">
        <Label htmlFor="marca" className="text-neutral-700 dark:text-neutral-300">
          Marca do Botijão *
        </Label>
        <SelectMenu
          value={marca || ''}
          options={MARCAS_BOTIJOES.map((m) => ({ value: m.value, label: m.label }))}
          onChange={(value) => setMarca(value as MarcaBotijao)}
          placeholder="Selecione a marca"
        />
      </div>

      {/* Seleção de Tipo */}
      <div className="space-y-2">
        <Label htmlFor="tipo" className="text-neutral-700 dark:text-neutral-300">
          Tipo de Botijão *
        </Label>
        <SelectMenu
          value={tipo || ''}
          options={TIPOS_BOTIJOES.map((t) => ({ value: t.value, label: t.label }))}
          onChange={(value) => setTipo(value as TipoBotijao)}
          placeholder="Selecione o tipo"
        />
      </div>

      {/* Preview */}
      {marca && tipo && imagemUrl && nome && (
        <Card className="border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 flex-shrink-0 border border-neutral-200 dark:border-neutral-700">
                <img
                  src={imagemUrl}
                  alt={nome}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Se a imagem não carregar, mostra placeholder
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {MARCAS_BOTIJOES.find((m) => m.value === marca)?.label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão Continuar */}
      <Button
        type="button"
        onClick={handleContinuar}
        disabled={!marca || !tipo}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white"
      >
        <Package className="w-4 h-4 mr-2" />
        Continuar
      </Button>
    </div>
  )
}

