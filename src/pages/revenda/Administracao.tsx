import { Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Página de Administração - Revenda
 * 
 * Esta página será implementada futuramente com funcionalidades administrativas para revendas.
 */
export default function AdministracaoRevenda() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <Settings className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          Administração
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Configurações e ferramentas administrativas da sua revenda
        </p>
      </div>

      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-12">
          <div className="text-center">
            <Settings className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Em Desenvolvimento
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Esta funcionalidade será implementada em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
