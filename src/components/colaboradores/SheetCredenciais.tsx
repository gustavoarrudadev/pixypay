import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface SheetCredenciaisProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  email: string
  senha: string
}

export function SheetCredenciais({
  aberto,
  onOpenChange,
  email,
  senha,
}: SheetCredenciaisProps) {
  const [copiado, setCopiado] = useState(false)

  const copiarCredenciais = async () => {
    const texto = `Email: ${email}\nSenha: ${senha}`
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Credenciais do Colaborador</SheetTitle>
          <SheetDescription>
            Compartilhe essas credenciais com o colaborador
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Email
              </label>
              <p className="mt-1 text-base font-mono text-neutral-900 dark:text-neutral-50 break-all">
                {email}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Senha
              </label>
              <p className="mt-1 text-base font-mono text-neutral-900 dark:text-neutral-50 break-all">
                {senha}
              </p>
            </div>
          </div>
        </div>

        <SheetFooter className="gap-2 sm:gap-0 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
          <Button
            onClick={copiarCredenciais}
            className="w-full sm:w-auto"
          >
            {copiado ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Credenciais
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

