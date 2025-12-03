import { useState, useEffect } from 'react'
import { Users, Plus, AlertCircle, Loader2, Store, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SheetConvidarColaborador } from '@/components/colaboradores/SheetConvidarColaborador'
import { SheetEditarColaborador } from '@/components/colaboradores/SheetEditarColaborador'
import { SheetCredenciais } from '@/components/colaboradores/SheetCredenciais'
import { TabelaColaboradores } from '@/components/colaboradores/TabelaColaboradores'
import {
  listarColaboradoresRevenda,
  criarColaboradorRevenda,
  atualizarColaborador,
  atualizarStatusColaborador,
  removerColaborador,
  resetarSenhaColaborador,
  type Colaborador,
  type PermissaoForm,
} from '@/lib/colaboradores'
import { obterRevendaId } from '@/lib/impersonation'
import { Dialog, DialogActions } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { listarUnidades, type UnidadeRevenda } from '@/lib/gerenciarUnidades'
import { Badge } from '@/components/ui/badge'

export default function Colaboradores() {
  const [revendaId, setRevendaId] = useState<string | null>(null)
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [carregando, setCarregando] = useState(false)
  const [dialogConvidarAberto, setDialogConvidarAberto] = useState(false)
  const [dialogEditarAberto, setDialogEditarAberto] = useState(false)
  const [dialogCredenciaisAberto, setDialogCredenciaisAberto] = useState(false)
  const [dialogRemoverAberto, setDialogRemoverAberto] = useState(false)
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<Colaborador | null>(null)
  const [credenciais, setCredenciais] = useState<{ email: string; senha: string } | null>(null)
  const [removendo, setRemovendo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  
  // Estado de unidades
  const [unidades, setUnidades] = useState<UnidadeRevenda[]>([])
  const [carregandoUnidades, setCarregandoUnidades] = useState(true)
  const [unidadeSelecionadaId, setUnidadeSelecionadaId] = useState<string | null>(null)

  useEffect(() => {
    const carregarRevendaId = async () => {
      const id = await obterRevendaId()
      if (!id) {
        setErro('Erro ao carregar dados da revenda. Por favor, faça login novamente.')
        setCarregando(false)
        return
      }
      setRevendaId(id)
    }
    carregarRevendaId()
  }, [])

  useEffect(() => {
    if (revendaId) {
      carregarUnidades()
      carregarColaboradores()
    }
  }, [revendaId])

  const carregarUnidades = async () => {
    if (!revendaId) return

    setCarregandoUnidades(true)
    try {
      const { unidades: unidadesData, error } = await listarUnidades(revendaId)
      if (error) {
        console.error('❌ Erro ao carregar unidades:', error)
        return
      }

      setUnidades(unidadesData || [])

      // Seleciona primeira unidade se não houver selecionada
      if (!unidadeSelecionadaId && unidadesData && unidadesData.length > 0) {
        setUnidadeSelecionadaId(unidadesData[0].id)
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar unidades:', error)
    } finally {
      setCarregandoUnidades(false)
    }
  }

  const carregarColaboradores = async () => {
    if (!revendaId) return
    setCarregando(true)
    const { colaboradores: dados, error } = await listarColaboradoresRevenda(revendaId)
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
    if (!revendaId) {
      toast.error('Erro: ID da revenda não encontrado')
      return
    }

    const resultado = await criarColaboradorRevenda(revendaId, dados)
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
      unidade_id: dados.unidade_id,
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


  if (erro) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
            Erro ao carregar
          </p>
          <p className="text-neutral-600 dark:text-neutral-400">{erro}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Colaboradores
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Gerencie colaboradores do seu painel
          </p>
        </div>
        <Button onClick={() => setDialogConvidarAberto(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Convidar Colaborador
        </Button>
      </div>

      {/* Seleção de Unidade */}
      {revendaId && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Selecione uma unidade para contexto
          </h2>
          {carregandoUnidades ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : unidades.length === 0 ? (
            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardContent className="py-12 text-center">
                <Store className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                  Nenhuma unidade cadastrada
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Crie uma unidade em "Presença na Loja" para começar
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unidades.map((unidade) => {
                const isSelecionada = unidadeSelecionadaId === unidade.id
                return (
                  <Card
                    key={unidade.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelecionada
                        ? 'border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-600 dark:ring-violet-400'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                    onClick={() => setUnidadeSelecionadaId(unidade.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            isSelecionada
                              ? 'bg-violet-600 dark:bg-violet-400'
                              : 'bg-violet-100 dark:bg-violet-900/30'
                          }`}>
                            <Store className={`w-5 h-5 ${
                              isSelecionada
                                ? 'text-white'
                                : 'text-violet-600 dark:text-violet-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                              {unidade.nome}
                              {unidade.ativo ? (
                                <Badge variant="default" className="bg-green-500 text-xs">
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Inativa
                                </Badge>
                              )}
                            </h3>
                            {unidade.nome_publico && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                {unidade.nome_publico}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelecionada && (
                        <div className="mt-3 pt-3 border-t border-violet-300 dark:border-violet-700">
                          <p className="text-xs font-medium text-violet-700 dark:text-violet-300 flex items-center gap-1">
                            ✓ Unidade selecionada
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

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
        tipo="revenda"
        unidades={unidades.map((u) => ({ id: u.id, nome: u.nome }))}
        onConvidar={handleConvidar}
      />

      {colaboradorSelecionado && (
        <SheetEditarColaborador
          aberto={dialogEditarAberto}
          onOpenChange={setDialogEditarAberto}
          colaborador={colaboradorSelecionado}
          tipo="revenda"
          unidades={unidades.map((u) => ({ id: u.id, nome: u.nome }))}
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

