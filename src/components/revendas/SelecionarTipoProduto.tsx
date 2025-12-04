import { Package, Droplet, Wrench, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { TipoProduto } from '@/lib/produtosPadrao'

interface SelecionarTipoProdutoProps {
  onSelecionarTipo: (tipo: TipoProduto) => void
}

export function SelecionarTipoProduto({ onSelecionarTipo }: SelecionarTipoProdutoProps) {
  const tipos: { tipo: TipoProduto; label: string; descricao: string; icone: React.ReactNode }[] = [
    {
      tipo: 'botijoes',
      label: 'Botijões',
      descricao: 'Botijões de gás de diferentes marcas e tamanhos',
      icone: <Package className="w-6 h-6" />,
    },
    {
      tipo: 'galaodeagua',
      label: 'Galão de Água',
      descricao: 'Galão de água 20 litros',
      icone: <Droplet className="w-6 h-6" />,
    },
    {
      tipo: 'equipamentos',
      label: 'Equipamentos',
      descricao: 'Registros, mangueiras e kits',
      icone: <Wrench className="w-6 h-6" />,
    },
    {
      tipo: 'personalizado',
      label: 'Personalizado',
      descricao: 'Produto com imagem e nome personalizados',
      icone: <Sparkles className="w-6 h-6" />,
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
          Selecione o tipo de produto
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Escolha o tipo de produto que deseja cadastrar
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tipos.map(({ tipo, label, descricao, icone }) => (
          <Card
            key={tipo}
            className="cursor-pointer transition-all hover:shadow-md hover:border-violet-600 dark:hover:border-violet-400 border-neutral-200 dark:border-neutral-800"
            onClick={() => onSelecionarTipo(tipo)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex-shrink-0">
                  {icone}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
                    {label}
                  </h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {descricao}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

