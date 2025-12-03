import { useState, useEffect } from 'react'
import { Store, Plus, AlertCircle, CheckCircle2, Copy, Eye, QrCode } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { UnidadeCard } from '@/components/revendas/UnidadeCard'
import { FormularioUnidade } from '@/components/revendas/FormularioUnidade'
import { listarUnidades, deletarUnidade, contarProdutosUnidade, type UnidadeRevenda } from '@/lib/gerenciarUnidades'
import { obterRevendaId, obterUnidadeIdColaborador } from '@/lib/impersonation'
import { toast } from 'sonner'

export default function PresencaLoja() {
  const [revendaId, setRevendaId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [unidades, setUnidades] = useState<UnidadeRevenda[]>([])
  const [unidadeEditando, setUnidadeEditando] = useState<UnidadeRevenda | null>(null)
  const [sheetAberto, setSheetAberto] = useState(false)
  const [unidadeExcluindo, setUnidadeExcluindo] = useState<UnidadeRevenda | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [produtosPorUnidade, setProdutosPorUnidade] = useState<Record<string, number>>({})
  const [ehColaboradorUnidadeEspecifica, setEhColaboradorUnidadeEspecifica] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setCarregando(true)
    setErro(null)

    try {
      const revendaIdAtual = await obterRevendaId()
      if (!revendaIdAtual) {
        setErro('Erro ao carregar dados da revenda.')
        return
      }

      setRevendaId(revendaIdAtual)

      // Carrega unidades
      const { unidades: unidadesData, error } = await listarUnidades(revendaIdAtual)
      if (error) {
        setErro('Erro ao carregar unidades.')
        return
      }

      // Se for colaborador com unidade específica, filtrar apenas aquela unidade
      const unidadeIdColaborador = await obterUnidadeIdColaborador()
      let unidadesFinais: UnidadeRevenda[] = []
      
      if (unidadeIdColaborador !== undefined && unidadeIdColaborador !== null) {
        // Colaborador tem acesso apenas a uma unidade específica
        unidadesFinais = (unidadesData || []).filter(u => u.id === unidadeIdColaborador)
        setEhColaboradorUnidadeEspecifica(true)
      } else {
        // Revenda principal ou colaborador com acesso a todas as unidades
        unidadesFinais = unidadesData || []
        setEhColaboradorUnidadeEspecifica(false)
      }

      setUnidades(unidadesFinais)

      // Carrega contagem de produtos por unidade (apenas para as unidades visíveis)
      const produtosCount: Record<string, number> = {}
      for (const unidade of unidadesFinais) {
        const { total } = await contarProdutosUnidade(unidade.id)
        produtosCount[unidade.id] = total
      }
      setProdutosPorUnidade(produtosCount)
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      setErro('Erro inesperado ao carregar dados.')
    } finally {
      setCarregando(false)
    }
  }

  const handleCriarNova = () => {
    setUnidadeEditando(null)
    setSheetAberto(true)
  }

  const handleEditar = (unidade: UnidadeRevenda) => {
    setUnidadeEditando(unidade)
    setSheetAberto(true)
  }

  const handleExcluir = (unidade: UnidadeRevenda) => {
    setUnidadeExcluindo(unidade)
  }

  const confirmarExclusao = async () => {
    if (!unidadeExcluindo) return

    setExcluindo(true)
    try {
      const { error } = await deletarUnidade(unidadeExcluindo.id)
      if (error) {
        toast.error(error.message || 'Erro ao excluir unidade')
        return
      }

      toast.success('Unidade excluída com sucesso!')
      await carregarDados()
      setUnidadeExcluindo(null)
    } catch (error) {
      console.error('❌ Erro ao excluir unidade:', error)
      toast.error('Erro inesperado ao excluir unidade')
    } finally {
      setExcluindo(false)
    }
  }

  const handleSalvar = async () => {
    setUnidadeEditando(null)
    setSheetAberto(false)
    await carregarDados()
  }

  const handleCancelar = () => {
    setUnidadeEditando(null)
    setSheetAberto(false)
  }

  const handleVerLoja = (linkPublico: string) => {
    const url = `${window.location.origin}/loja/${linkPublico}`
    window.open(url, '_blank')
  }

  const handleCopiarLink = (linkPublico: string) => {
    const url = `${window.location.origin}/loja/${linkPublico}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado para a área de transferência!')
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Store className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Presença na Loja
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Gerencie suas unidades de loja, cada uma com produtos, preços e links públicos próprios
          </p>
        </div>
        {revendaId && !ehColaboradorUnidadeEspecifica && (
          <Button onClick={handleCriarNova} className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nova Unidade
          </Button>
        )}
      </div>

      {/* Mensagem de Erro */}
      {erro && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        </div>
      )}

      {/* Lista de Unidades */}
      {unidades.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Nenhuma unidade cadastrada
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Crie sua primeira unidade para começar a configurar produtos e links públicos
            </p>
            {revendaId && !ehColaboradorUnidadeEspecifica && (
              <Button onClick={handleCriarNova} className="bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Unidade
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unidades.map((unidade) => (
            <UnidadeCard
              key={unidade.id}
              unidade={unidade}
              totalProdutos={produtosPorUnidade[unidade.id] || 0}
              onEditar={handleEditar}
              onExcluir={handleExcluir}
              onVerLoja={handleVerLoja}
              onCopiarLink={handleCopiarLink}
            />
          ))}
        </div>
      )}

      {/* Sheet de Criar/Editar Unidade */}
      <Sheet open={sheetAberto} onOpenChange={(open) => {
        if (!open) {
          setSheetAberto(false)
          setUnidadeEditando(null)
        }
      }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {unidadeEditando ? 'Editar Unidade' : 'Nova Unidade'}
            </SheetTitle>
            <SheetDescription>
              {unidadeEditando
                ? 'Atualize as informações da unidade'
                : 'Configure uma nova unidade de loja com produtos e link público próprios'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {revendaId && (
              <FormularioUnidade
                unidade={unidadeEditando}
                revendaId={revendaId}
                onSalvar={handleSalvar}
                onCancelar={handleCancelar}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!unidadeExcluindo} onOpenChange={(open) => {
        if (!open) {
          setUnidadeExcluindo(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Unidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a unidade <strong>{unidadeExcluindo?.nome}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita. A unidade será removida permanentemente.
              {produtosPorUnidade[unidadeExcluindo?.id || ''] > 0 && (
                <div className="mt-2 p-2 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Esta unidade possui {produtosPorUnidade[unidadeExcluindo?.id || '']} produto(s) associado(s).
                    Você precisará remover ou transferir os produtos antes de excluir a unidade.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={excluindo || (produtosPorUnidade[unidadeExcluindo?.id || ''] || 0) > 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
