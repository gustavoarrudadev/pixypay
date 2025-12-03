import { useState, useEffect } from 'react'
import { Store, Save, X, AlertCircle, Link as LinkIcon, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadImagem } from './UploadImagem'
import { criarUnidade, atualizarUnidade, validarLinkPublicoUnidade, sugerirLinkPublicoUnidade, type UnidadeRevenda, type DadosUnidade } from '@/lib/gerenciarUnidades'
import { formatarPreco } from '@/lib/utils'
import { toast } from 'sonner'

interface FormularioUnidadeProps {
  unidade?: UnidadeRevenda | null
  revendaId: string
  onSalvar: () => void
  onCancelar: () => void
}

/**
 * Formulário para criar ou editar unidade de revenda
 */
export function FormularioUnidade({
  unidade,
  revendaId,
  onSalvar,
  onCancelar,
}: FormularioUnidadeProps) {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [linkPublicoValido, setLinkPublicoValido] = useState<boolean | null>(null)
  const [validandoLink, setValidandoLink] = useState(false)

  // Estados do formulário
  const [nome, setNome] = useState('')
  const [nomePublico, setNomePublico] = useState('')
  const [descricaoLoja, setDescricaoLoja] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [linkPublico, setLinkPublico] = useState('')
  const [linkPublicoAtivo, setLinkPublicoAtivo] = useState(true)
  const [taxaEntrega, setTaxaEntrega] = useState('0.00')
  const [oferecerEntrega, setOferecerEntrega] = useState(true)
  const [oferecerRetiradaLocal, setOferecerRetiradaLocal] = useState(true)
  const [oferecerAgendamento, setOferecerAgendamento] = useState(true)
  const [ativo, setAtivo] = useState(true)
  
  // Endereço
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  useEffect(() => {
    if (unidade) {
      // Modo edição - carrega dados da unidade
      setNome(unidade.nome)
      setNomePublico(unidade.nome_publico || '')
      setDescricaoLoja(unidade.descricao_loja || '')
      setLogoUrl(unidade.logo_url)
      setLinkPublico(unidade.link_publico || '')
      setLinkPublicoAtivo(unidade.link_publico_ativo)
      setTaxaEntrega(unidade.taxa_entrega.toFixed(2))
      setOferecerEntrega(unidade.oferecer_entrega)
      setOferecerRetiradaLocal(unidade.oferecer_retirada_local)
      setOferecerAgendamento(unidade.oferecer_agendamento)
      setAtivo(unidade.ativo)
      setCep(unidade.cep || '')
      setLogradouro(unidade.logradouro || '')
      setNumero(unidade.numero || '')
      setComplemento(unidade.complemento || '')
      setBairro(unidade.bairro || '')
      setCidade(unidade.cidade || '')
      setEstado(unidade.estado || '')
    } else {
      // Modo criação - valores padrão
      setNome('')
      setNomePublico('')
      setDescricaoLoja('')
      setLogoUrl(null)
      setLinkPublico('')
      setLinkPublicoAtivo(true)
      setTaxaEntrega('0.00')
      setOferecerEntrega(true)
      setOferecerRetiradaLocal(true)
      setOferecerAgendamento(true)
      setAtivo(true)
      setCep('')
      setLogradouro('')
      setNumero('')
      setComplemento('')
      setBairro('')
      setCidade('')
      setEstado('')
    }
  }, [unidade])

  // Validar link público em tempo real
  useEffect(() => {
    const linkLimpo = linkPublico.trim().toLowerCase()
    
    // Só valida se tiver pelo menos 3 caracteres (mínimo para link válido)
    if (linkLimpo.length >= 3) {
      const timeoutId = setTimeout(async () => {
        setValidandoLink(true)
        try {
          const { valido, error } = await validarLinkPublicoUnidade(linkPublico, unidade?.id)
          setLinkPublicoValido(valido)
          if (error && valido === false) {
            console.log('⚠️ Link inválido:', error.message)
          }
        } catch (err) {
          console.error('❌ Erro ao validar link:', err)
          setLinkPublicoValido(false)
        } finally {
          setValidandoLink(false)
        }
      }, 500)

      return () => clearTimeout(timeoutId)
    } else if (linkLimpo.length === 0) {
      // Se está vazio, limpa a validação
      setLinkPublicoValido(null)
      setValidandoLink(false)
    } else {
      // Se tem menos de 3 caracteres, marca como inválido (formato)
      setLinkPublicoValido(false)
      setValidandoLink(false)
    }
  }, [linkPublico, unidade?.id])

  const handleGerarSugestaoLink = () => {
    const sugestao = sugerirLinkPublicoUnidade(nome || 'unidade')
    setLinkPublico(sugestao)
  }

  const handleSalvar = async () => {
    setErro(null)
    setSalvando(true)

    try {
      // Validações
      if (!nome.trim()) {
        setErro('Nome da unidade é obrigatório')
        setSalvando(false)
        return
      }

      if (linkPublico.trim() && linkPublicoValido === false) {
        setErro('Link público inválido ou já está em uso')
        setSalvando(false)
        return
      }

      const dados: DadosUnidade = {
        nome: nome.trim(),
        nome_publico: nomePublico.trim() || null,
        descricao_loja: descricaoLoja.trim() || null,
        logo_url: logoUrl,
        link_publico: linkPublico.trim() || null,
        link_publico_ativo: linkPublicoAtivo,
        taxa_entrega: parseFloat(taxaEntrega) || 0.00,
        oferecer_entrega: Boolean(oferecerEntrega),
        oferecer_retirada_local: Boolean(oferecerRetiradaLocal),
        oferecer_agendamento: Boolean(oferecerAgendamento),
        ativo,
        cep: cep.trim() || null,
        logradouro: logradouro.trim() || null,
        numero: numero.trim() || null,
        complemento: complemento.trim() || null,
        bairro: bairro.trim() || null,
        cidade: cidade.trim() || null,
        estado: estado.trim() || null,
      }
      
      console.log('🔍 [FormularioUnidade] Dados para salvar:', {
        unidadeId: unidade?.id,
        oferecer_entrega: dados.oferecer_entrega,
        oferecer_retirada_local: dados.oferecer_retirada_local,
        oferecer_agendamento: dados.oferecer_agendamento,
        valoresOriginais: {
          oferecerEntrega,
          oferecerRetiradaLocal,
          oferecerAgendamento,
        }
      })

      if (unidade) {
        // Atualizar
        const { error } = await atualizarUnidade(unidade.id, dados)
        if (error) {
          setErro(error.message || 'Erro ao atualizar unidade')
          return
        }
        toast.success('Unidade atualizada com sucesso!')
      } else {
        // Criar
        const { unidade: novaUnidade, error } = await criarUnidade(revendaId, dados)
        if (error) {
          setErro(error.message || 'Erro ao criar unidade')
          return
        }
        toast.success('Unidade criada com sucesso!')
      }

      onSalvar()
    } catch (error) {
      console.error('❌ Erro ao salvar unidade:', error)
      setErro('Erro inesperado ao salvar unidade')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          {unidade ? 'Editar Unidade' : 'Nova Unidade'}
        </CardTitle>
        <CardDescription>
          {unidade ? 'Atualize as informações da unidade' : 'Configure uma nova unidade de loja'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {erro && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{erro}</p>
          </div>
        )}

        {/* Informações Básicas */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Informações Básicas
          </h3>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Unidade *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Loja Centro, Filial Norte"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nomePublico">Nome Público</Label>
            <Input
              id="nomePublico"
              value={nomePublico}
              onChange={(e) => setNomePublico(e.target.value)}
              placeholder="Nome que aparecerá na loja pública (opcional)"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Se deixar vazio, será usado o nome da unidade
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricaoLoja">Descrição da Loja</Label>
            <Textarea
              id="descricaoLoja"
              value={descricaoLoja}
              onChange={(e) => setDescricaoLoja(e.target.value)}
              placeholder="Descreva sua loja..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Logo da Unidade</Label>
            <UploadImagem
              revendaId={revendaId}
              tipo="logo"
              valorInicial={logoUrl}
              onUploadComplete={setLogoUrl}
              onError={(mensagem) => {
                setErro(mensagem)
              }}
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Se não enviar logo, será usado o logo da revenda
            </p>
          </div>
        </div>

        {/* Link Público */}
        <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Link Público da Loja
          </h3>

          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={linkPublico}
                  onChange={(e) => setLinkPublico(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="ex: loja-centro"
                  className={linkPublicoValido === false ? 'border-red-500' : linkPublicoValido === true ? 'border-green-500' : ''}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGerarSugestaoLink}
                disabled={!nome.trim()}
                title="Gerar sugestão baseada no nome"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
            {validandoLink && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Validando...</p>
            )}
            {linkPublicoValido === false && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Link inválido ou já está em uso
              </p>
            )}
            {linkPublicoValido === true && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Link disponível
              </p>
            )}
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Link único para acesso à loja pública desta unidade. Ex: /loja/{linkPublico || 'seu-link'}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="linkPublicoAtivo">Link Público Ativo</Label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Quando desativado, a loja pública não estará acessível
              </p>
            </div>
            <Switch
              id="linkPublicoAtivo"
              checked={linkPublicoAtivo}
              onCheckedChange={setLinkPublicoAtivo}
            />
          </div>
        </div>

        {/* Configurações de Entrega */}
        <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Configurações de Entrega
          </h3>

          <div className="space-y-2">
            <Label htmlFor="taxaEntrega">Taxa de Entrega (R$)</Label>
            <Input
              id="taxaEntrega"
              type="number"
              step="0.01"
              min="0"
              value={taxaEntrega}
              onChange={(e) => setTaxaEntrega(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="oferecerEntrega">Oferecer Entrega</Label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Clientes podem escolher receber em casa
                </p>
              </div>
              <Switch
                id="oferecerEntrega"
                checked={oferecerEntrega}
                onCheckedChange={setOferecerEntrega}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="oferecerRetiradaLocal">Oferecer Retirada Local</Label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Clientes podem retirar na loja
                </p>
              </div>
              <Switch
                id="oferecerRetiradaLocal"
                checked={oferecerRetiradaLocal}
                onCheckedChange={setOferecerRetiradaLocal}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="oferecerAgendamento">Oferecer Agendamento</Label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Clientes podem agendar data/horário de entrega
                </p>
              </div>
              <Switch
                id="oferecerAgendamento"
                checked={oferecerAgendamento}
                onCheckedChange={setOferecerAgendamento}
              />
            </div>
          </div>
        </div>

        {/* Endereço da Unidade (Opcional) */}
        <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Endereço da Unidade (Opcional)
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Se não preencher, será usado o endereço da revenda
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="SP"
                maxLength={2}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input
                id="logradouro"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                placeholder="Rua, Avenida, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Apto, Sala, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Centro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="São Paulo"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="space-y-0.5">
            <Label htmlFor="ativo">Unidade Ativa</Label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Unidades inativas não aparecem na lista e não podem receber pedidos
            </p>
          </div>
          <Switch
            id="ativo"
            checked={ativo}
            onCheckedChange={setAtivo}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSalvar}
            disabled={salvando || !nome.trim()}
            className="flex-1"
          >
            {salvando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {unidade ? 'Atualizar' : 'Criar'} Unidade
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onCancelar}
            disabled={salvando}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

