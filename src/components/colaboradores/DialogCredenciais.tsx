import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Dialog, DialogActions } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DialogCredenciaisProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  email: string
  senha: string
}

export function DialogCredenciais({
  aberto,
  onOpenChange,
  email,
  senha,
}: DialogCredenciaisProps) {
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
    <Dialog
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo="Credenciais do Colaborador"
      descricao="Compartilhe essas credenciais com o colaborador"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Email
            </label>
            <p className="mt-1 text-base font-mono text-neutral-900 dark:text-neutral-50">
              {email}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Senha
            </label>
            <p className="mt-1 text-base font-mono text-neutral-900 dark:text-neutral-50">
              {senha}
            </p>
          </div>
        </div>

        <DialogActions>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            Fechar
          </Button>
          <Button
            onClick={copiarCredenciais}
            className="flex-1 sm:flex-none"
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
        </DialogActions>
      </div>
    </Dialog>
  )
}

