import { useState, useEffect, useMemo } from 'react'
import { Handshake, AlertCircle, ShoppingCart, Clock, Phone, Mail, MapPin, Search, Store, CreditCard, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { listarNegociacoes, type Parcela } from '@/lib/gerenciarParcelamentos'
import { buscarDetalhesRevenda } from '@/lib/gerenciarRevenda'
import { formatarPreco } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface Negociacao {
  pedido_id: string
  pedido: {
    id: string
    valor_total: number
    criado_em: string
    revenda: {
      id: string
      nome_revenda: string
    }
  }
  parcelamento_id: string
  parcelasAtrasadas: Parcela[]
}

interface ContatosRevenda {
  telefone: string | null
  email: string | null
  endereco: string | null
}

export default function Negociacoes() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [negociacoes, setNegociacoes] = useState<Negociacao[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [sheetContatoAberto, setSheetContatoAberto] = useState(false)
  const [revendaSelecionada, setRevendaSelecionada] = useState<{ id: string; nome_revenda: string } | null>(null)
  const [contatosRevenda, setContatosRevenda] = useState<ContatosRevenda | null>(null)
  const [carregandoContatos, setCarregandoContatos] = useState(false)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregarNegociacoes()
  }, [])

  const carregarNegociacoes = async () => {
    setCarregando(true)
    setErro(null)
    try {
      const { negociacoes: negociacoesData, error } = await listarNegociacoes()
      if (error) {
        console.error('❌ Erro ao carregar negociações:', error)
        setErro('Erro ao carregar negociações')
        setNegociacoes([])
        return
      }
      setNegociacoes(negociacoesData || [])
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar negociações:', error)
      setErro('Erro inesperado ao carregar negociações')
      setNegociacoes([])
    } finally {
      setCarregando(false)
    }
  }

  const abrirContatoRevenda = async (revendaId: string, nomeRevenda: string) => {
    setRevendaSelecionada({ id: revendaId, nome_revenda: nomeRevenda })
    setCarregandoContatos(true)
    setSheetContatoAberto(true)

    try {
      const { revenda, error } = await buscarDetalhesRevenda(revendaId)
      if (error || !revenda) {
        console.error('❌ Erro ao buscar contatos da revenda:', error)
        setContatosRevenda({
          telefone: null,
          email: null,
          endereco: null,
        })
        return
      }

      // Monta endereço completo
      const enderecoParts = []
      if (revenda.logradouro) enderecoParts.push(revenda.logradouro)
      if (revenda.numero) enderecoParts.push(revenda.numero)
      if (revenda.complemento) enderecoParts.push(revenda.complemento)
      if (revenda.bairro) enderecoParts.push(revenda.bairro)
      if (revenda.cidade) enderecoParts.push(revenda.cidade)
      if (revenda.estado) enderecoParts.push(revenda.estado)
      if (revenda.cep) enderecoParts.push(`CEP: ${revenda.cep}`)

      setContatosRevenda({
        telefone: revenda.telefone || null,
        email: revenda.email || null,
        endereco: enderecoParts.length > 0 ? enderecoParts.join(', ') : null,
      })
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar contatos:', error)
      setContatosRevenda({
        telefone: null,
        email: null,
        endereco: null,
      })
    } finally {
      setCarregandoContatos(false)
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatarDataCompleta = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  // Filtragem simples das negociações (apenas busca)
  const negociacoesFiltradas = useMemo(() => {
    if (!negociacoes || negociacoes.length === 0) return []
    if (!busca.trim()) return negociacoes
    
    const buscaLower = busca.trim().toLowerCase()
    return negociacoes.filter(negociacao => {
      const pedidoId = negociacao.pedido_id?.toLowerCase() || ''
      const revendaNome = negociacao.pedido?.revenda?.nome_revenda?.toLowerCase() || ''
      const revendaNomePublico = negociacao.pedido?.revenda?.nome_publico?.toLowerCase() || ''
      return pedidoId.includes(buscaLower) || revendaNome.includes(buscaLower) || revendaNomePublico.includes(buscaLower)
    })
  }, [negociacoes, busca])

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
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <Handshake className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-violet-600 dark:text-violet-400" />
          Negociações
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Gerencie suas parcelas atrasadas e entre em contato com as lojas
        </p>
      </div>

      {erro && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        </div>
      )}

      {/* Busca Simples */}
      {negociacoes.length > 0 && (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              <Input
                placeholder="Buscar por número do pedido ou nome da loja..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 border-neutral-300 dark:border-neutral-700"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Negociações */}
      {negociacoesFiltradas.length === 0 ? (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Handshake className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
              {negociacoes.length === 0
                ? 'Você não possui parcelas atrasadas no momento'
                : 'Nenhuma negociação corresponde aos filtros aplicados'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {negociacoesFiltradas.map((negociacao) => {
            const totalAtrasado = negociacao.parcelasAtrasadas.reduce((sum, p) => sum + parseFloat(p.valor.toString()), 0)
            const primeiraParcelaAtrasada = negociacao.parcelasAtrasadas[0]

            return (
              <Card
                key={negociacao.pedido_id}
                className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="text-red-900 dark:text-red-100">Parcelas Atrasadas</span>
                      </CardTitle>
                      <div className="space-y-1">
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">
                          <strong>Loja:</strong> {negociacao.pedido.revenda.nome_revenda}
                        </p>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">
                          <strong>Pedido:</strong> #{negociacao.pedido_id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">
                          <strong>Data do Pedido:</strong> {formatarDataCompleta(negociacao.pedido.criado_em)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Total Atrasado</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatarPreco(totalAtrasado)}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {negociacao.parcelasAtrasadas.length} parcela{negociacao.parcelasAtrasadas.length > 1 ? 's' : ''} atrasada{negociacao.parcelasAtrasadas.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Lista de Parcelas Atrasadas */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      Parcelas Atrasadas:
                    </p>
                    {negociacao.parcelasAtrasadas.map((parcela) => (
                      <div
                        key={parcela.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 rounded-lg border border-red-200 dark:border-red-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                              {parcela.numero_parcela}ª Parcela
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-red-600 dark:text-red-400" />
                              <p className="text-xs text-red-600 dark:text-red-400">
                                Vencida em {formatarDataCompleta(parcela.data_vencimento)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          {formatarPreco(parcela.valor)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Botão de Ações */}
                  <div className="flex items-center gap-3 pt-3 border-t border-red-200 dark:border-red-800">
                    <Button
                      variant="default"
                      onClick={() => abrirContatoRevenda(
                        negociacao.pedido.revenda.id,
                        negociacao.pedido.revenda.nome_revenda
                      )}
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Entrar em Contato com a Loja
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/cliente/compras/${negociacao.pedido_id}`)}
                      className="border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Ver Pedido
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Sheet de Contato da Revenda */}
      <Sheet open={sheetContatoAberto} onOpenChange={setSheetContatoAberto}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Contatos da Loja
            </SheetTitle>
            <SheetDescription>
              {revendaSelecionada?.nome_revenda && (
                <p className="text-base font-medium text-neutral-900 dark:text-neutral-50 mt-2">
                  {revendaSelecionada.nome_revenda}
                </p>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {carregandoContatos ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {contatosRevenda?.telefone && (
                  <Card className="border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                          <Phone className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Telefone</p>
                          <a
                            href={`tel:${contatosRevenda.telefone}`}
                            className="text-base font-medium text-violet-600 dark:text-violet-400 hover:underline"
                          >
                            {contatosRevenda.telefone}
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {contatosRevenda?.email && (
                  <Card className="border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">E-mail</p>
                          <a
                            href={`mailto:${contatosRevenda.email}`}
                            className="text-base font-medium text-violet-600 dark:text-violet-400 hover:underline break-all"
                          >
                            {contatosRevenda.email}
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {contatosRevenda?.endereco && (
                  <Card className="border-neutral-200 dark:border-neutral-800">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Endereço</p>
                          <p className="text-sm text-neutral-900 dark:text-neutral-50">
                            {contatosRevenda.endereco}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(!contatosRevenda?.telefone && !contatosRevenda?.email && !contatosRevenda?.endereco) && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Informações de contato não disponíveis
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
