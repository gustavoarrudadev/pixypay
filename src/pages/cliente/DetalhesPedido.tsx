import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, MapPin, CreditCard, Calendar, AlertCircle, CheckCircle2, Copy, QrCode, Store, Building2, User, Phone, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ParcelaCard } from '@/components/parcelamentos/ParcelaCard'
import { QRCode } from '@/components/revendas/QRCode'
import { buscarPedidoCliente, type Pedido } from '@/lib/gerenciarPedidos'
import { gerarPixParaParcela, type Parcela, type Parcelamento } from '@/lib/gerenciarParcelamentos'
import { formatarPreco } from '@/lib/utils'
import { aplicarMascaraCEP } from '@/lib/mascaras'
import { toast } from 'sonner'

const formatarDataCompleta = (data: string) => {
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  pronto: 'Pronto',
  em_transito: 'Em Trânsito',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  confirmado: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  preparando: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  pronto: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  em_transito: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  entregue: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  cancelado: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
}

export default function DetalhesPedido() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [parcelaSelecionada, setParcelaSelecionada] = useState<Parcela | null>(null)
  const [sheetAberto, setSheetAberto] = useState(false)

  useEffect(() => {
    if (id) {
      carregarPedido()
    }
  }, [id])

  const carregarPedido = async () => {
    if (!id) return

    setCarregando(true)
    setErro(null)
    try {
      const { pedido: pedidoData, error } = await buscarPedidoCliente(id)
      if (error || !pedidoData) {
        setErro('Pedido não encontrado')
        return
      }
      console.log('📦 [DetalhesPedido] Pedido carregado:', {
        pedidoId: pedidoData.id,
        revendaId: pedidoData.revenda_id,
        unidadeId: pedidoData.unidade_id,
        revenda: pedidoData.revenda,
        unidade: pedidoData.unidade,
        temUnidade: !!pedidoData.unidade,
        unidadeNome: pedidoData.unidade?.nome,
        unidadeNomePublico: pedidoData.unidade?.nome_publico,
        unidadeLink: pedidoData.unidade?.link_publico,
      })
      setPedido(pedidoData)
    } catch (error) {
      console.error('❌ Erro ao carregar pedido:', error)
      setErro('Erro ao carregar detalhes do pedido')
    } finally {
      setCarregando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (erro || !pedido) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button
          variant="outline"
          onClick={() => navigate('/cliente/compras')}
          className="border-neutral-300 dark:border-neutral-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-16 h-16 text-red-400 dark:text-red-600 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              {erro || 'Pedido não encontrado'}
            </h3>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            onClick={() => navigate('/cliente/compras')}
            className="border-neutral-300 dark:border-neutral-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-violet-600 dark:text-violet-400" />
            Pedido #{pedido.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {new Date(pedido.criado_em).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${STATUS_COLORS[pedido.status] || STATUS_COLORS.pendente}`}>
          {STATUS_LABELS[pedido.status] || pedido.status}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do Pedido */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle>Informações do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Revenda - Resumo */}
            {pedido.revenda && (
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  {pedido.revenda.logo_url ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 flex-shrink-0">
                      <img
                        src={pedido.revenda.logo_url}
                        alt={pedido.revenda.nome_publico || pedido.revenda.nome_revenda}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-0.5">Loja</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                        {pedido.revenda.nome_publico || pedido.revenda.nome_revenda}
                      </p>
                      {pedido.unidade && (
                        <>
                          <span className="text-neutral-400 dark:text-neutral-600">•</span>
                          <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                            {pedido.unidade.nome_publico || pedido.unidade.nome}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Forma de Pagamento */}
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pagamento
              </p>
              <p className="text-neutral-900 dark:text-neutral-50">
                {pedido.forma_pagamento === 'pix_vista' 
                  ? 'PIX à Vista' 
                  : `PIX Parcelado (${pedido.parcelas_total}x)`
                }
              </p>
            </div>

            {/* Tipo de Entrega */}
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Entrega
              </p>
              <p className="text-neutral-900 dark:text-neutral-50">
                {pedido.tipo_entrega === 'retirar_local' && 'Retirada no local'}
                {pedido.tipo_entrega === 'receber_endereco' && 'Entrega no endereço'}
                {pedido.tipo_entrega === 'agendar' && 'Entrega agendada'}
              </p>
              
              {/* Endereço de Entrega (quando tipo é receber_endereco ou quando há agendamento) */}
              {(pedido.tipo_entrega === 'receber_endereco' || pedido.agendamento_entrega) && pedido.endereco_entrega && (
                <div className="mt-2 space-y-1 pl-6 border-l-2 border-neutral-200 dark:border-neutral-700">
                  {pedido.endereco_entrega.nome_endereco && (
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      {pedido.endereco_entrega.nome_endereco}
                    </p>
                  )}
                  <p className="text-sm text-neutral-900 dark:text-neutral-50">
                    {pedido.endereco_entrega.logradouro}, {pedido.endereco_entrega.numero}
                    {pedido.endereco_entrega.complemento && ` - ${pedido.endereco_entrega.complemento}`}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {pedido.endereco_entrega.bairro} - {pedido.endereco_entrega.cidade}/{pedido.endereco_entrega.estado}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    CEP: {aplicarMascaraCEP(pedido.endereco_entrega.cep)}
                  </p>
                </div>
              )}
            </div>

            {/* Agendamento (quando há agendamento_entrega) */}
            {pedido.agendamento_entrega && (
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Agendamento
                </p>
                <div className="space-y-1">
                  <p className="text-sm text-neutral-900 dark:text-neutral-50">
                    {formatarDataCompleta(pedido.agendamento_entrega.data_agendamento)}
                  </p>
                  {pedido.agendamento_entrega.horario && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Horário: {pedido.agendamento_entrega.horario}
                    </p>
                  )}
                  {pedido.agendamento_entrega.observacoes && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      Obs: {pedido.agendamento_entrega.observacoes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Observações */}
            {pedido.observacoes && (
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Observações</p>
                <p className="text-neutral-900 dark:text-neutral-50">{pedido.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Itens do Pedido */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle>Itens do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pedido.itens && pedido.itens.length > 0 ? (
              <div className="space-y-3">
                {pedido.itens.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800 last:border-0">
                    {item.produto?.imagem_url && (
                      <img
                        src={item.produto.imagem_url}
                        alt={item.produto.nome || 'Produto'}
                        className="w-16 h-16 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900 dark:text-neutral-50">
                        {item.produto?.nome || 'Produto'}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Quantidade: {item.quantidade}
                      </p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mt-1">
                        {formatarPreco(item.subtotal || (item.preco_unitario || 0) * (item.quantidade || 0))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-600 dark:text-neutral-400">Nenhum item encontrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Parcelamento Completo */}
      {pedido.forma_pagamento === 'pix_parcelado' && pedido.parcelamento && pedido.parcelamento.parcelas && pedido.parcelamento.parcelas.length > 0 && (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Crediário Digital ({pedido.parcelamento.total_parcelas}x)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800 mb-6">
              <div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Total</p>
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                  {formatarPreco(pedido.parcelamento.valor_total)}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Pagas</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {pedido.parcelamento.parcelas.filter(p => p.status === 'paga').length}/{pedido.parcelamento.total_parcelas}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Pendentes</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                  {pedido.parcelamento.parcelas.filter(p => p.status !== 'paga').length}
                </p>
              </div>
            </div>
            
            {/* Grid de Parcelas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pedido.parcelamento.parcelas.map((parcela) => (
                <ParcelaCard
                  key={parcela.id}
                  parcela={parcela}
                  onVerDetalhes={() => {
                    setParcelaSelecionada(parcela)
                    setSheetAberto(true)
                  }}
                  onCopiarPix={() => {
                    if (parcela.pix_copia_cola) {
                      navigator.clipboard.writeText(parcela.pix_copia_cola)
                      toast.success('PIX copiado para a área de transferência!')
                    } else {
                      // Gera PIX se não tiver
                      gerarPixParaParcela(
                        parcela.id,
                        parcela.valor,
                        `Parcela ${parcela.numero_parcela} - Pedido ${pedido.id.slice(0, 8)}`
                      ).then(() => {
                        carregarPedido()
                        toast.success('PIX gerado com sucesso!')
                      })
                    }
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados Completos da Revenda */}
      {pedido.revenda && (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Dados da Loja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Header da Revenda */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
                {pedido.revenda.logo_url ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 flex-shrink-0">
                    <img
                      src={pedido.revenda.logo_url}
                      alt={pedido.revenda.nome_publico || pedido.revenda.nome_revenda}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                    <Store className="w-10 h-10 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">
                    {pedido.revenda.nome_publico || pedido.revenda.nome_revenda}
                  </h3>
                  {pedido.unidade && (
                    <p className="text-base font-medium text-violet-600 dark:text-violet-400 mb-2">
                      {pedido.unidade.nome_publico || pedido.unidade.nome}
                    </p>
                  )}
                </div>
              </div>

              {/* Informações de Cadastro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dados da Empresa */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    Dados da Empresa
                  </h4>
                  <div className="space-y-3">
                    {pedido.revenda.cnpj && (
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">CNPJ</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{pedido.revenda.cnpj}</p>
                      </div>
                    )}
                    {pedido.revenda.nome_responsavel && (
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Responsável
                        </p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{pedido.revenda.nome_responsavel}</p>
                      </div>
                    )}
                    {pedido.revenda.marcas_trabalhadas && (
                      (() => {
                        let marcas: string[] = []
                        if (Array.isArray(pedido.revenda.marcas_trabalhadas)) {
                          marcas = pedido.revenda.marcas_trabalhadas
                        } else if (typeof pedido.revenda.marcas_trabalhadas === 'string') {
                          try {
                            marcas = JSON.parse(pedido.revenda.marcas_trabalhadas)
                          } catch {
                            marcas = [pedido.revenda.marcas_trabalhadas]
                          }
                        }
                        return marcas.length > 0 ? (
                          <div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Marcas Trabalhadas</p>
                            <div className="flex flex-wrap gap-2">
                              {marcas.map((marca, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                >
                                  {typeof marca === 'string' ? marca : String(marca)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null
                      })()
                    )}
                  </div>
                </div>

                {/* Contato e Endereço */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    Contato e Localização
                  </h4>
                  <div className="space-y-3">
                    {pedido.revenda.telefone && (
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Telefone
                        </p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{pedido.revenda.telefone}</p>
                      </div>
                    )}
                    {(pedido.revenda.logradouro || pedido.revenda.cep) && (
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Endereço</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {pedido.revenda.logradouro && pedido.revenda.numero && (
                            <>
                              {pedido.revenda.logradouro}, {pedido.revenda.numero}
                              {pedido.revenda.complemento && ` - ${pedido.revenda.complemento}`}
                            </>
                          )}
                          {pedido.revenda.bairro && (
                            <>
                              <br />
                              {pedido.revenda.bairro}
                            </>
                          )}
                          {pedido.revenda.cidade && pedido.revenda.estado && (
                            <>
                              <br />
                              {pedido.revenda.cidade} - {pedido.revenda.estado}
                            </>
                          )}
                          {pedido.revenda.cep && (
                            <>
                              <br />
                              CEP: {pedido.revenda.cep}
                            </>
                          )}
                        </p>
                      </div>
                    )}
                    {((pedido.unidade?.link_publico && pedido.unidade?.link_publico_ativo) || pedido.revenda.link_publico) && (
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Loja Online</p>
                        <a
                          href={pedido.unidade?.link_publico && pedido.unidade?.link_publico_ativo
                            ? `/loja/${pedido.unidade.link_publico}` 
                            : pedido.revenda.link_publico 
                              ? `/loja/${pedido.revenda.link_publico}`
                              : '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          Visitar Loja Pública
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-violet-50 dark:bg-violet-900/20">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Total do Pedido</span>
            <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {formatarPreco(pedido.valor_total)}
            </span>
          </div>
          {pedido.valor_entrada && (
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-violet-200 dark:border-violet-800">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Entrada (1ª parcela)</span>
              <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                {formatarPreco(pedido.valor_entrada)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet de Detalhes da Parcela */}
      <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Parcela</SheetTitle>
            <SheetDescription>
              Informações completas e opções de pagamento
            </SheetDescription>
          </SheetHeader>
          {parcelaSelecionada && (
            <div className="mt-6 space-y-6">
              {/* Informações da Parcela */}
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Parcela</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                      {parcelaSelecionada.numero_parcela}ª de {pedido.parcelamento?.total_parcelas || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Valor</p>
                    <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                      {formatarPreco(parcelaSelecionada.valor)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Vencimento</p>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {new Date(parcelaSelecionada.data_vencimento).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Status</p>
                    <p className={`text-sm font-semibold ${
                      parcelaSelecionada.status === 'paga'
                        ? 'text-green-600 dark:text-green-400'
                        : parcelaSelecionada.status === 'atrasada'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-neutral-900 dark:text-neutral-50'
                    }`}>
                      {parcelaSelecionada.status === 'paga' ? 'Paga' : parcelaSelecionada.status === 'atrasada' ? 'Atrasada' : 'Pendente'}
                    </p>
                  </div>
                </div>

                {parcelaSelecionada.data_pagamento && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-600 dark:text-green-400 mb-1">Data de Pagamento</p>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                      {new Date(parcelaSelecionada.data_pagamento).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* PIX para Pagamento */}
              {parcelaSelecionada.status !== 'paga' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                      Pagamento via PIX
                    </h3>
                  </div>

                  {parcelaSelecionada.pix_copia_cola ? (
                    <>
                      {/* QR Code */}
                      <div className="flex justify-center p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <QRCode
                          url={parcelaSelecionada.pix_copia_cola}
                          size={180}
                        />
                      </div>

                      {/* Código PIX Copia e Cola */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Código PIX (Copia e Cola)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={parcelaSelecionada.pix_copia_cola}
                            className="flex-1 px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-neutral-50"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(parcelaSelecionada.pix_copia_cola || '')
                              toast.success('PIX copiado para a área de transferência!')
                            }}
                            className="shrink-0"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Gerando informações de pagamento...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}


