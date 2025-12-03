import { useState, useEffect } from 'react'
import { Users, Plus, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SheetConvidarColaborador } from '@/components/colaboradores/SheetConvidarColaborador'
import { SheetEditarColaborador } from '@/components/colaboradores/SheetEditarColaborador'
import { SheetCredenciais } from '@/components/colaboradores/SheetCredenciais'
import { TabelaColaboradores } from '@/components/colaboradores/TabelaColaboradores'
import {
  listarColaboradoresAdmin,
  criarColaboradorAdmin,
  atualizarColaborador,
  atualizarStatusColaborador,
  removerColaborador,
  buscarPermissoesColaborador,
  resetarSenhaColaborador,
  type Colaborador,
  type PermissaoForm,
} from '@/lib/colaboradores'
import { Dialog, DialogActions } from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [carregando, setCarregando] = useState(false)
  const [dialogConvidarAberto, setDialogConvidarAberto] = useState(false)
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false)
  const [dialogCredenciaisAberto, setDialogCredenciaisAberto] = useState(false)
  const [dialogRemoverAberto, setDialogRemoverAberto] = useState(false)
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<Colaborador | null>(null)
  const [credenciais, setCredenciais] = useState<{ email: string; senha: string } | null>(null)
  const [removendo, setRemovendo] = useState(false)

  useEffect(() => {
    carregarColaboradores()
  }, [])

  const carregarColaboradores = async () => {
    setCarregando(true)
    const { colaboradores: dados, error } = await listarColaboradoresAdmin()
    if (error) {
      toast.error('Erro ao carregar colaboradores')
      console.error(error)
    } else {
      setColaboradores(dados)
    }
    setCarregando(false)
  }

  const handleConvidar = async (dados: {
    nome_completo: string
    email: string
    senha: string
    unidade_id?: string | null
  }) => {
    const resultado = await criarColaboradorAdmin(dados)
    if (resultado.success && resultado.email && resultado.senha) {
      setCredenciais({
        email: resultado.email,
        senha: resultado.senha,
      })
      setDialogCredenciaisAberto(true)
      await carregarColaboradores()
      toast.success('Colaborador criado com sucesso!')
    } else {
      toast.error(resultado.error || 'Erro ao criar colaborador')
    }
  }

  const handleAtivarDesativar = async (colaborador: Colaborador) => {
    const novoStatus = !colaborador.ativo
    const { success, error } = await atualizarStatusColaborador(
      colaborador.id,
      novoStatus
    )
    if (success) {
      await carregarColaboradores()
      toast.success(
        `Colaborador ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`
      )
    } else {
      toast.error(error?.message || 'Erro ao atualizar status')
    }
  }

  const handleEditar = (colaborador: Colaborador) => {
    setColaboradorSelecionado(colaborador)
    setDialogEditarAberto(true)
  }

  const handleSalvarEdicao = async (dados: {
    colaborador_id: string
    nome_completo: string
    email: string
    senha?: string
    unidade_id?: string | null
  }) => {
    const { success, error } = await atualizarColaborador(dados.colaborador_id, {
      nome_completo: dados.nome_completo,
      email: dados.email,
      senha: dados.senha,
      // Admin colaboradores não têm unidade_id
    })

    if (success) {
      await carregarColaboradores()
      toast.success('Colaborador atualizado com sucesso!')
      setDialogEditarAberto(false)
      setColaboradorSelecionado(null)
    } else {
      toast.error(error?.message || 'Erro ao atualizar colaborador')
      throw error || new Error('Erro ao atualizar colaborador')
    }
  }

  const handleRemover = async () => {
    if (!colaboradorSelecionado) return

    setRemovendo(true)
    const { success, error } = await removerColaborador(colaboradorSelecionado.id)
    setRemovendo(false)

    if (success) {
      setDialogRemoverAberto(false)
      setColaboradorSelecionado(null)
      await carregarColaboradores()
      toast.success('Colaborador removido com sucesso!')
    } else {
      toast.error(error?.message || 'Erro ao remover colaborador')
    }
  }

  const handleResetarSenha = async (colaborador: Colaborador) => {
    const { success, senha, error } = await resetarSenhaColaborador(colaborador.id)
    
    if (success && senha) {
      setCredenciais({
        email: colaborador.email,
        senha: senha,
      })
      setDialogCredenciaisAberto(true)
      toast.success('Senha resetada com sucesso!')
    } else {
      toast.error(error?.message || 'Erro ao resetar senha')
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Colaboradores Admin
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Gerencie colaboradores do painel administrativo. Colaboradores admin têm acesso completo como admin.
          </p>
        </div>
        <Button onClick={() => setDialogConvidarAberto(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Convidar Colaborador
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Total de Colaboradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              {colaboradores.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Colaboradores Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-500">
              {colaboradores.filter((c) => c.ativo).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Colaboradores Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-neutral-500 dark:text-neutral-400">
              {colaboradores.filter((c) => !c.ativo).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle>Lista de Colaboradores</CardTitle>
          <CardDescription>
            {colaboradores.length === 0
              ? 'Nenhum colaborador cadastrado'
              : `${colaboradores.length} colaborador${colaboradores.length !== 1 ? 'es' : ''} cadastrado${colaboradores.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TabelaColaboradores
            colaboradores={colaboradores}
            carregando={carregando}
            onAtivarDesativar={handleAtivarDesativar}
            onEditar={handleEditar}
            onResetarSenha={handleResetarSenha}
            onRemover={(colaborador) => {
              setColaboradorSelecionado(colaborador)
              setDialogRemoverAberto(true)
            }}
          />
        </CardContent>
      </Card>

      {/* Sheets */}
      <SheetConvidarColaborador
        aberto={dialogConvidarAberto}
        onOpenChange={setDialogConvidarAberto}
        tipo="admin"
        onConvidar={handleConvidar}
      />

      {colaboradorSelecionado && (
        <SheetEditarColaborador
          aberto={dialogEditarAberto}
          onOpenChange={setDialogEditarAberto}
          colaborador={colaboradorSelecionado}
          tipo="admin"
          onSalvar={handleSalvarEdicao}
        />
      )}

      {credenciais && (
        <SheetCredenciais
          aberto={dialogCredenciaisAberto}
          onOpenChange={setDialogCredenciaisAberto}
          email={credenciais.email}
          senha={credenciais.senha}
        />
      )}

      {/* Dialog Remover */}
      <Dialog
        aberto={dialogRemoverAberto}
        onOpenChange={setDialogRemoverAberto}
        titulo="Remover Colaborador"
        descricao={`Tem certeza que deseja remover ${colaboradorSelecionado?.nome_completo}? Esta ação não pode ser desfeita.`}
      >
        <DialogActions>
          <Button
            variant="outline"
            onClick={() => {
              setDialogRemoverAberto(false)
              setColaboradorSelecionado(null)
            }}
            disabled={removendo}
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleRemover} disabled={removendo}>
            {removendo ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removendo...
              </>
            ) : (
              'Remover'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

