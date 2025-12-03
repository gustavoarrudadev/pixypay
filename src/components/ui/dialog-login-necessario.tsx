import { AlertCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface DialogLoginNecessarioProps {
  aberto: boolean
  onClose: () => void
  onConfirmar: () => void
  titulo?: string
  descricao?: string
}

export function DialogLoginNecessario({
  aberto,
  onClose,
  onConfirmar,
  titulo = 'Login Necessário',
  descricao = 'É necessário ter uma conta para continuar. Deseja fazer login ou criar uma conta?',
}: DialogLoginNecessarioProps) {
  return (
    <AlertDialog open={aberto} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md mx-auto my-8 rounded-xl">
        <AlertDialogHeader className="text-center">
          <div className="flex flex-col items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-center">
              {titulo}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base text-neutral-600 dark:text-neutral-400 text-center mt-2">
            {descricao}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
          <AlertDialogCancel asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Cancelar
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={onConfirmar}
              className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white"
            >
              Fazer Login / Criar Conta
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

