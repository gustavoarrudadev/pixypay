import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DialogoConfirmacaoProps {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  titulo: string;
  descricao: string;
  onConfirmar: () => void;
  onCancelar?: () => void;
  textoConfirmar?: string;
  textoCancelar?: string;
  varianteConfirmar?: "default" | "destructive";
  confirmando?: boolean;
}

export function DialogoConfirmacao({
  aberto,
  onOpenChange,
  titulo,
  descricao,
  onConfirmar,
  onCancelar,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  varianteConfirmar = "default",
  confirmando = false,
}: DialogoConfirmacaoProps) {
  const handleCancelar = () => {
    if (onCancelar) {
      onCancelar();
    }
    onOpenChange(false);
  };

  const handleConfirmar = () => {
    onConfirmar();
  };

  return (
    <AlertDialog open={aberto} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelar} disabled={confirmando}>
            {textoCancelar}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmar}
            disabled={confirmando}
            className={
              varianteConfirmar === "destructive"
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-600"
                : ""
            }
          >
            {confirmando ? "Processando..." : textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
