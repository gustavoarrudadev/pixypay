import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'
import { gerarSenhaAleatoria } from '@/lib/colaboradores'
import { Colaborador } from '@/lib/colaboradores'

interface SheetEditarColaboradorProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  colaborador: Colaborador | null
  tipo: 'admin' | 'revenda'
  unidades?: Array<{ id: string; nome: string }> // Unidades disponíveis (apenas para revenda)
  onSalvar: (dados: {
    colaborador_id: string
    nome_completo: string
    email: string
    senha?: string // Opcional: só atualiza se fornecido
    unidade_id?: string | null // null = todas as unidades, string = unidade específica (apenas para revenda)
  }) => Promise<void>
}

export function SheetEditarColaborador({
  aberto,
  onOpenChange,
  colaborador,
  tipo,
  unidades = [],
  onSalvar,
}: SheetEditarColaboradorProps) {
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [alterarSenha, setAlterarSenha] = useState(false)
  const [gerarSenhaAuto, setGerarSenhaAuto] = useState(true)
  const [tipoAcesso, setTipoAcesso] = useState<'todas' | 'unidade'>('todas')
  const [unidadeId, setUnidadeId] = useState<string>('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Carregar dados do colaborador quando o sheet abrir
  useEffect(() => {
    if (aberto && colaborador) {
      setNomeCompleto(colaborador.nome_completo || '')
      setEmail(colaborador.email || '')
      setSenha('')
      setAlterarSenha(false)
      setGerarSenhaAuto(true)
      
      // Configurar tipo de acesso baseado no colaborador
      if (colaborador.unidade_id) {
        setTipoAcesso('unidade')
        setUnidadeId(colaborador.unidade_id)
      } else {
        setTipoAcesso('todas')
        setUnidadeId('')
      }
      
      setErro(null)
    } else if (!aberto) {
      // Limpar formulário ao fechar
      setNomeCompleto('')
      setEmail('')
      setSenha('')
      setAlterarSenha(false)
      setTipoAcesso('todas')
      setUnidadeId('')
      setErro(null)
    }
  }, [aberto, colaborador])

  useEffect(() => {
    if (alterarSenha && gerarSenhaAuto && aberto) {
      setSenha(gerarSenhaAleatoria())
    } else if (!alterarSenha) {
      setSenha('')
    }
  }, [alterarSenha, gerarSenhaAuto, aberto])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!colaborador) {
      setErro('Colaborador não selecionado')
      return
    }

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

    // Se escolheu alterar senha, validar
    if (alterarSenha && (!senha || senha.length < 8)) {
      setErro('Senha deve ter no mínimo 8 caracteres')
      return
    }

    // Validação específica para revenda: se escolheu unidade específica, deve selecionar uma
    if (tipo === 'revenda' && tipoAcesso === 'unidade' && !unidadeId) {
      setErro('Selecione uma unidade específica ou escolha acesso a todas as unidades')
      return
    }

    setCarregando(true)

    try {
      await onSalvar({
        colaborador_id: colaborador.id,
        nome_completo: nomeCompleto.trim(),
        email: email.trim().toLowerCase(),
        senha: alterarSenha ? senha : undefined, // Só envia senha se escolheu alterar
        unidade_id: tipo === 'revenda' && tipoAcesso === 'unidade' && unidadeId ? unidadeId : null,
      })

      // Limpar formulário
      setNomeCompleto('')
      setEmail('')
      setSenha('')
      setAlterarSenha(false)
      setTipoAcesso('todas')
      setUnidadeId('')
      onOpenChange(false)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao atualizar colaborador')
    } finally {
      setCarregando(false)
    }
  }

  if (!colaborador) {
    return null
  }

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Colaborador {tipo === 'admin' ? 'Admin' : 'da Revenda'}</SheetTitle>
          <SheetDescription>
            {tipo === 'admin'
              ? 'Atualize os dados do colaborador. Colaboradores admin têm acesso completo como admin.'
              : 'Atualize os dados e tipo de acesso do colaborador'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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

            {/* Alterar Senha */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="alterar-senha"
                  checked={alterarSenha}
                  onCheckedChange={(checked) => {
                    setAlterarSenha(checked === true)
                    if (checked && gerarSenhaAuto) {
                      setSenha(gerarSenhaAleatoria())
                    } else if (!checked) {
                      setSenha('')
                    }
                  }}
                />
                <Label
                  htmlFor="alterar-senha"
                  className="text-sm font-medium cursor-pointer"
                >
                  Alterar senha
                </Label>
              </div>

              {alterarSenha && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="senha">Nova Senha *</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="gerar-senha"
                        checked={gerarSenhaAuto}
                        onCheckedChange={(checked) => {
                          setGerarSenhaAuto(checked === true)
                          if (checked) {
                            setSenha(gerarSenhaAleatoria())
                          }
                        }}
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
                    placeholder="Nova senha do colaborador"
                    required={alterarSenha}
                    disabled={gerarSenhaAuto}
                    className="mt-1 font-mono"
                  />
                  {senha && (
                    <p className="mt-1 text-xs text-neutral-500">
                      {senha.length} caracteres
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Seleção de Tipo de Acesso (apenas para revenda) */}
            {tipo === 'revenda' && unidades.length > 0 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Tipo de Acesso</Label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    Escolha o tipo de acesso que o colaborador terá
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="acesso-todas"
                        checked={tipoAcesso === 'todas'}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTipoAcesso('todas')
                            setUnidadeId('')
                          }
                        }}
                      />
                      <Label
                        htmlFor="acesso-todas"
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        Acesso a todas as unidades
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="acesso-unidade"
                        checked={tipoAcesso === 'unidade'}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTipoAcesso('unidade')
                          } else {
                            setTipoAcesso('todas')
                            setUnidadeId('')
                          }
                        }}
                      />
                      <Label
                        htmlFor="acesso-unidade"
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        Acesso a unidade específica
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Seleção de Unidade Específica (quando tipoAcesso = 'unidade') */}
                {tipoAcesso === 'unidade' && (
                  <div>
                    <Label htmlFor="unidade">Selecione a Unidade *</Label>
                    <Select
                      id="unidade"
                      value={unidadeId}
                      onChange={(e) => setUnidadeId(e.target.value)}
                      className="mt-1"
                      required
                    >
                      <option value="">Selecione uma unidade</option>
                      {unidades.map((unidade) => (
                        <option key={unidade.id} value={unidade.id}>
                          {unidade.nome}
                        </option>
                      ))}
                    </Select>
                    <p className="mt-1 text-xs text-neutral-500">
                      O colaborador terá acesso apenas aos dados desta unidade específica
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {erro && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{erro}</p>
            </div>
          )}

          <SheetFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={carregando}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={carregando} className="w-full sm:w-auto">
              {carregando ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

