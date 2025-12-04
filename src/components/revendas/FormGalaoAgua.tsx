import { ArrowLeft, Droplet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { obterImagemGalaoAgua, obterNomeGalaoAgua } from '@/lib/produtosPadrao'

interface FormGalaoAguaProps {
  onVoltar: () => void
  onSelecionar: (config: { imagemUrl: string; nome: string }) => void
}

export function FormGalaoAgua({ onVoltar, onSelecionar }: FormGalaoAguaProps) {
  const imagemUrl = obterImagemGalaoAgua()
  const nome = obterNomeGalaoAgua()

  const handleContinuar = () => {
    onSelecionar({ imagemUrl, nome })
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
          Cadastrar Galão de Água
        </h3>
      </div>

      {/* Preview */}
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
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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

      {/* Botão Continuar */}
      <Button
        type="button"
        onClick={handleContinuar}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white"
      >
        <Droplet className="w-4 h-4 mr-2" />
        Continuar
      </Button>
    </div>
  )
}

