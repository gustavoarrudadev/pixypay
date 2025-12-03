import { AlertCircle, UserPlus, LogIn, LayoutDashboard, LogOut } from 'lucide-react'
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

interface DialogRestricaoCompraProps {
  aberto: boolean
  onClose: () => void
  tipo: 'revenda' | 'admin'
  onDeslogarEIrParaRegistro?: () => void
  onVoltarDashboard?: () => void
}

export function DialogRestricaoCompra({
  aberto,
  onClose,
  tipo,
  onDeslogarEIrParaRegistro,
  onVoltarDashboard,
}: DialogRestricaoCompraProps) {
  return (
    <AlertDialog open={aberto} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md mx-auto my-8 rounded-xl">
        <AlertDialogHeader className="text-center">
          <div className="flex flex-col items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-center">
              {tipo === 'revenda' ? 'Revenda não pode comprar' : 'Admin não pode comprar'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base text-neutral-600 dark:text-neutral-400 text-center mt-2">
            {tipo === 'revenda' 
              ? 'Você está logado como Revenda e não pode comprar produtos de outras revendas ou da sua própria loja. Para fazer compras, é necessário ter uma conta de Cliente.'
              : 'Você está logado como Administrador e não pode realizar compras. Use uma conta de Cliente para fazer compras.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
          <AlertDialogCancel asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Fechar
            </Button>
          </AlertDialogCancel>
          {tipo === 'revenda' && onDeslogarEIrParaRegistro && (
            <AlertDialogAction asChild>
              <Button
                onClick={onDeslogarEIrParaRegistro}
                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Deslogar e ir para Registro/Login
              </Button>
            </AlertDialogAction>
          )}
          {tipo === 'admin' && onDeslogarEIrParaRegistro && (
            <AlertDialogAction asChild>
              <Button
                onClick={onDeslogarEIrParaRegistro}
                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Deslogar e ir para Registro/Login
              </Button>
            </AlertDialogAction>
          )}
          {tipo === 'admin' && onVoltarDashboard && (
            <AlertDialogAction asChild>
              <Button
                onClick={onVoltarDashboard}
                variant="outline"
                className="w-full sm:w-auto border-neutral-300 dark:border-neutral-700"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

