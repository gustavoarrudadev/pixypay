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

interface SheetConvidarColaboradorProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  tipo: 'admin' | 'revenda'
  unidades?: Array<{ id: string; nome: string }> // Unidades disponíveis (apenas para revenda)
  onConvidar: (dados: {
    nome_completo: string
    email: string
    senha: string
    unidade_id?: string | null // null = todas as unidades, string = unidade específica
  }) => Promise<void>
}

export function SheetConvidarColaborador({
  aberto,
  onOpenChange,
  tipo,
  unidades = [],
  onConvidar,
}: SheetConvidarColaboradorProps) {
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [gerarSenhaAuto, setGerarSenhaAuto] = useState(true)
  const [tipoAcesso, setTipoAcesso] = useState<'todas' | 'unidade'>('todas') // 'todas' = todas unidades, 'unidade' = unidade específica
  const [unidadeId, setUnidadeId] = useState<string>('') // ID da unidade específica (quando tipoAcesso = 'unidade')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (aberto) {
      // Reset formulário
      setNomeCompleto('')
      setEmail('')
      setTipoAcesso('todas')
      setUnidadeId('')
      setErro(null)

      // Gerar senha automática se necessário
      if (gerarSenhaAuto) {
        setSenha(gerarSenhaAleatoria())
      }
    } else {
      // Limpar formulário ao fechar
      setNomeCompleto('')
      setEmail('')
      setSenha('')
      setTipoAcesso('todas')
      setUnidadeId('')
      setErro(null)
    }
  }, [aberto, gerarSenhaAuto])

  useEffect(() => {
    if (gerarSenhaAuto && aberto) {
      setSenha(gerarSenhaAleatoria())
    }
  }, [gerarSenhaAuto, aberto])

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

    // Validação específica para revenda: se escolheu unidade específica, deve selecionar uma
    if (tipo === 'revenda' && tipoAcesso === 'unidade' && !unidadeId) {
      setErro('Selecione uma unidade específica ou escolha acesso a todas as unidades')
      return
    }

    setCarregando(true)

    try {
      await onConvidar({
        nome_completo: nomeCompleto.trim(),
        email: email.trim().toLowerCase(),
        senha,
        unidade_id: tipo === 'revenda' && tipoAcesso === 'unidade' && unidadeId ? unidadeId : null,
      })

      // Limpar formulário
      setNomeCompleto('')
      setEmail('')
      setSenha('')
      setTipoAcesso('todas')
      setUnidadeId('')
      onOpenChange(false)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao criar colaborador')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Convidar Colaborador {tipo === 'admin' ? 'Admin' : 'da Revenda'}</SheetTitle>
          <SheetDescription>
            {tipo === 'admin' 
              ? 'Preencha os dados do colaborador. Colaboradores admin têm acesso completo como admin.'
              : 'Preencha os dados e defina o tipo de acesso do colaborador'}
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
              {carregando ? 'Criando...' : 'Convidar Colaborador'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

