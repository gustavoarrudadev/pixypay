import { useState, useEffect } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { Dialog, DialogActions } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PermissaoForm, gerarSenhaAleatoria } from '@/lib/colaboradores'
import { AlertCircle } from 'lucide-react'

// Funcionalidades disponíveis para Admin
const FUNCIONALIDADES_ADMIN = [
  { chave: 'dashboard', nome: 'Dashboard' },
  { chave: 'revendas', nome: 'Revendas' },
  { chave: 'clientes', nome: 'Clientes' },
  { chave: 'pedidos', nome: 'Pedidos' },
  { chave: 'parcelamentos', nome: 'Parcelamentos' },
  { chave: 'agendamentos', nome: 'Agendamentos' },
  { chave: 'repasses', nome: 'Repasses' },
  { chave: 'financeiro', nome: 'Financeiro' },
  { chave: 'inadimplencia', nome: 'Inadimplência' },
  { chave: 'relatorios', nome: 'Relatórios' },
  { chave: 'administracao', nome: 'Administração' },
]

// Funcionalidades disponíveis para Revenda
const FUNCIONALIDADES_REVENDA = [
  { chave: 'dashboard', nome: 'Dashboard' },
  { chave: 'presenca', nome: 'Presença na Loja' },
  { chave: 'produtos', nome: 'Produtos' },
  { chave: 'pedidos', nome: 'Pedidos' },
  { chave: 'agendamentos', nome: 'Agendamentos' },
  { chave: 'clientes', nome: 'Clientes' },
  { chave: 'parcelamentos', nome: 'Parcelamentos' },
  { chave: 'historico_vendas', nome: 'Histórico de Vendas' },
  { chave: 'financeiro', nome: 'Financeiro' },
  { chave: 'relatorios', nome: 'Relatórios' },
  { chave: 'ajuda', nome: 'Ajuda' },
  { chave: 'administracao', nome: 'Administração' },
]

interface DialogConvidarColaboradorProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  tipo: 'admin' | 'revenda'
  onConvidar: (dados: {
    nome_completo: string
    email: string
    senha: string
    permissoes: PermissaoForm[]
  }) => Promise<void>
}

export function DialogConvidarColaborador({
  aberto,
  onOpenChange,
  tipo,
  onConvidar,
}: DialogConvidarColaboradorProps) {
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [gerarSenhaAuto, setGerarSenhaAuto] = useState(true)
  const [permissoes, setPermissoes] = useState<Map<string, PermissaoForm>>(new Map())
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const funcionalidades =
    tipo === 'admin' ? FUNCIONALIDADES_ADMIN : FUNCIONALIDADES_REVENDA

  useEffect(() => {
    if (aberto) {
      // Inicializar permissões vazias
      const novasPermissoes = new Map<string, PermissaoForm>()
      funcionalidades.forEach((func) => {
        novasPermissoes.set(func.chave, {
          funcionalidade: func.chave,
          pode_visualizar: false,
          pode_criar: false,
          pode_editar: false,
          pode_excluir: false,
        })
      })
      setPermissoes(novasPermissoes)

      // Gerar senha automática se necessário
      if (gerarSenhaAuto) {
        setSenha(gerarSenhaAleatoria())
      }
    }
  }, [aberto, gerarSenhaAuto, tipo])

  useEffect(() => {
    if (gerarSenhaAuto && aberto) {
      setSenha(gerarSenhaAleatoria())
    }
  }, [gerarSenhaAuto, aberto])

  const handleTogglePermissao = (
    funcionalidade: string,
    campo: 'pode_visualizar' | 'pode_criar' | 'pode_editar' | 'pode_excluir'
  ) => {
    const novaPermissao = permissoes.get(funcionalidade)
    if (!novaPermissao) return

    const atualizado = {
      ...novaPermissao,
      [campo]: !novaPermissao[campo],
    }

    // Se desmarcar visualizar, desmarcar todas as outras
    if (campo === 'pode_visualizar' && !atualizado.pode_visualizar) {
      atualizado.pode_criar = false
      atualizado.pode_editar = false
      atualizado.pode_excluir = false
    }

    setPermissoes(new Map(permissoes.set(funcionalidade, atualizado)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    // Validações
    if (!nomeCompleto.trim()) {
      setErro('Nome completo é obrigatório')
      return
    }

    if (!email.trim()) {
      setErro('Email é obrigatório')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErro('Email inválido')
      return
    }

    if (!senha || senha.length < 8) {
      setErro('Senha deve ter no mínimo 8 caracteres')
      return
    }

    // Verificar se pelo menos uma permissão de visualizar foi concedida
    const temPermissaoVisualizar = Array.from(permissoes.values()).some(
      (p) => p.pode_visualizar
    )

    if (!temPermissaoVisualizar) {
      setErro('É necessário conceder pelo menos uma permissão de visualizar')
      return
    }

    setCarregando(true)

    try {
      const permissoesArray = Array.from(permissoes.values()).filter(
        (p) => p.pode_visualizar
      )

      await onConvidar({
        nome_completo: nomeCompleto.trim(),
        email: email.trim().toLowerCase(),
        senha,
        permissoes: permissoesArray,
      })

      // Limpar formulário
      setNomeCompleto('')
      setEmail('')
      setSenha('')
      setPermissoes(new Map())
      onOpenChange(false)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao criar colaborador')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Dialog
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo={`Convidar Colaborador ${tipo === 'admin' ? 'Admin' : 'da Revenda'}`}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Básicos */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              placeholder="Nome completo do colaborador"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
              className="mt-1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="senha">Senha *</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="gerar-senha"
                  checked={gerarSenhaAuto}
                  onCheckedChange={(checked) => setGerarSenhaAuto(checked === true)}
                />
                <Label
                  htmlFor="gerar-senha"
                  className="text-sm font-normal cursor-pointer"
                >
                  Gerar senha automaticamente
                </Label>
                {gerarSenhaAuto && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSenha(gerarSenhaAleatoria())}
                    className="h-8 px-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <Input
              id="senha"
              type="text"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha do colaborador"
              required
              disabled={gerarSenhaAuto}
              className="mt-1 font-mono"
            />
            {senha && (
              <p className="mt-1 text-xs text-neutral-500">
                {senha.length} caracteres
              </p>
            )}
          </div>
        </div>

        {/* Permissões */}
        <div>
          <Label className="text-base font-semibold">Permissões</Label>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Selecione as funcionalidades e permissões que o colaborador terá acesso
          </p>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {funcionalidades.map((func) => {
              const permissao = permissoes.get(func.chave)
              if (!permissao) return null

              return (
                <Card key={func.chave} className="border-neutral-200 dark:border-neutral-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={permissao.pode_visualizar}
                        onCheckedChange={() =>
                          handleTogglePermissao(func.chave, 'pode_visualizar')
                        }
                      />
                      <CardTitle className="text-sm font-semibold">
                        {func.nome}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  {permissao.pode_visualizar && (
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={permissao.pode_criar}
                            onCheckedChange={() =>
                              handleTogglePermissao(func.chave, 'pode_criar')
                            }
                            disabled={!permissao.pode_visualizar}
                          />
                          <Label className="text-xs cursor-pointer">Criar</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={permissao.pode_editar}
                            onCheckedChange={() =>
                              handleTogglePermissao(func.chave, 'pode_editar')
                            }
                            disabled={!permissao.pode_visualizar}
                          />
                          <Label className="text-xs cursor-pointer">Editar</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={permissao.pode_excluir}
                            onCheckedChange={() =>
                              handleTogglePermissao(func.chave, 'pode_excluir')
                            }
                            disabled={!permissao.pode_visualizar}
                          />
                          <Label className="text-xs cursor-pointer">Excluir</Label>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </div>

        {erro && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{erro}</p>
          </div>
        )}

        <DialogActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={carregando}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={carregando}>
            {carregando ? 'Criando...' : 'Convidar Colaborador'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

