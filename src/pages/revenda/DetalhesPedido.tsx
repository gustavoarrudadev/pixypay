import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, MapPin, CreditCard, Calendar, AlertCircle, CheckCircle2, User, Mail, Phone, FileText, Clock, MoreVertical, Copy, QrCode, Trash2, Store } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { buscarPedidoRevenda, buscarPedido, atualizarStatusPedidoRevenda, excluirPedidoRevenda, type Pedido, type StatusPedido, type Parcela } from '@/lib/gerenciarPedidos'
import { marcarParcelaComoPaga, marcarParcelaComoVencida, reverterParcela, gerarPixParaParcela, type Parcelamento } from '@/lib/gerenciarParcelamentos'
import { ParcelaCard } from '@/components/parcelamentos/ParcelaCard'
import { QRCode } from '@/components/revendas/QRCode'
import { formatarPreco } from '@/lib/utils'
import { obterRevendaId } from '@/lib/impersonation'
import { obterRoleDeUsuario } from '@/lib/roles'
import { obterSessao } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

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

const STATUS_OPTIONS: StatusPedido[] = [
  'pendente',
  'confirmado',
  'preparando',
  'pronto',
  'em_transito',
  'entregue',
  'cancelado',
]

export default function DetalhesPedido() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [pedido, setPedido] = useState<any>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizandoStatus, setAtualizandoStatus] = useState(false)
  const [parcelaSelecionada, setParcelaSelecionada] = useState<Parcela | null>(null)
  const [parcelamentoSelecionado, setParcelamentoSelecionado] = useState<Parcelamento | null>(null)
  const [sheetAberto, setSheetAberto] = useState(false)
  const [processandoBaixa, setProcessandoBaixa] = useState<string | null>(null)
  const [parcelaParaBaixa, setParcelaParaBaixa] = useState<Parcela | null>(null)
  const [dialogBaixaAberto, setDialogBaixaAberto] = useState(false)
  const [parcelaParaReverter, setParcelaParaReverter] = useState<Parcela | null>(null)
  const [dialogReverterAberto, setDialogReverterAberto] = useState(false)
  const [novoStatusReverter, setNovoStatusReverter] = useState<'pendente' | 'atrasada'>('pendente')
  const [parcelaParaVencida, setParcelaParaVencida] = useState<Parcela | null>(null)
  const [dialogVencidaAberto, setDialogVencidaAberto] = useState(false)
  const [mostrarPixNoSheet, setMostrarPixNoSheet] = useState(false)
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [ehAdmin, setEhAdmin] = useState(false)
  const [totalPedidosCliente, setTotalPedidosCliente] = useState<number | null>(null)

  // Função para verificar se o PIX ainda está visível (3 horas)
  const isPixVisible = (parcelaId: string): boolean => {
    const storageKey = `pix_visible_${parcelaId}`
    const timestamp = localStorage.getItem(storageKey)
    if (!timestamp) return false
    
    const now = Date.now()
    const visibleTime = parseInt(timestamp, 10)
    const threeHours = 3 * 60 * 60 * 1000 // 3 horas em milissegundos
    
    return (now - visibleTime) < threeHours
  }

  // Função para marcar o PIX como visível
  const setPixVisible = (parcelaId: string): void => {
    const storageKey = `pix_visible_${parcelaId}`
    localStorage.setItem(storageKey, Date.now().toString())
  }

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
      // Verifica se é Admin (pode ver qualquer pedido)
      const session = await obterSessao()
      const isAdmin = session?.user ? obterRoleDeUsuario(session.user) === 'admin' : false
      setEhAdmin(isAdmin)

      let pedidoData: Pedido | null = null
      let error: Error | null = null

      if (isAdmin) {
        // Admin pode ver qualquer pedido sem precisar de revendaId
        console.log('🔍 Carregando pedido (Admin):', { id })
        const result = await buscarPedido(id)
        pedidoData = result.pedido
        error = result.error
      } else {
        // Revenda precisa do revendaId
        const revendaId = await obterRevendaId()
        if (!revendaId) {
          setErro('Erro ao carregar dados da revenda')
          setCarregando(false)
          return
        }

        console.log('🔍 Carregando pedido:', { id, revendaId })
        const result = await buscarPedidoRevenda(revendaId, id)
        pedidoData = result.pedido
        error = result.error
      }
      
      console.log('📦 Resultado da busca:', { pedidoData, error })

      if (error) {
        console.error('❌ Erro ao buscar pedido:', error)
        setErro(`Erro ao buscar pedido: ${error.message || 'Pedido não encontrado'}`)
        setCarregando(false)
        return
      }

      if (!pedidoData) {
        setErro('Pedido não encontrado ou você não tem permissão para visualizá-lo')
        setCarregando(false)
        return
      }

      console.log('📦 Pedido carregado:', {
        pedido: pedidoData,
        formaPagamento: pedidoData?.forma_pagamento,
        tipoEntrega: pedidoData?.tipo_entrega,
        temParcelamento: !!pedidoData?.parcelamento,
        parcelamento: pedidoData?.parcelamento,
        parcelas: pedidoData?.parcelamento?.parcelas?.length || 0,
        parcelasArray: pedidoData?.parcelamento?.parcelas,
        parcelasIsArray: Array.isArray(pedidoData?.parcelamento?.parcelas),
        parcelasType: typeof pedidoData?.parcelamento?.parcelas,
        enderecoEntrega: pedidoData?.endereco_entrega,
        temEnderecoEntrega: !!pedidoData?.endereco_entrega,
        agendamentoEntrega: pedidoData?.agendamento_entrega,
        temAgendamentoEntrega: !!pedidoData?.agendamento_entrega,
      })

      setPedido(pedidoData)
      
      // Carrega total de pedidos do cliente
      if (pedidoData?.cliente_id) {
        carregarTotalPedidosAnteriores(pedidoData.cliente_id)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar pedido:', error)
      setErro(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro ao carregar detalhes do pedido'}`)
    } finally {
      setCarregando(false)
    }
  }

  const carregarTotalPedidosAnteriores = async (clienteId: string) => {
    try {
      // Conta o total de pedidos do cliente (incluindo o atual)
      const { count, error } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', clienteId)

      if (error) {
        console.error('❌ Erro ao contar total de pedidos:', error)
        return
      }

      setTotalPedidosCliente(count || 0)
    } catch (error) {
      console.error('❌ Erro inesperado ao contar total de pedidos:', error)
    }
  }

  const handleAtualizarStatus = async (novoStatus: StatusPedido) => {
    if (!id || !pedido) return

    setAtualizandoStatus(true)
    try {
      const { error } = await atualizarStatusPedidoRevenda(id, novoStatus)
      if (error) {
        setErro('Erro ao atualizar status do pedido')
        return
      }
      await carregarPedido()
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error)
      setErro('Erro inesperado ao atualizar status')
    } finally {
      setAtualizandoStatus(false)
    }
  }

  const formatarDataCurta = (data: string) => {
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

  const copiarPix = (pixCopiaCola: string) => {
    navigator.clipboard.writeText(pixCopiaCola)
    toast.success('PIX copiado para a área de transferência!')
  }

  const abrirDetalhesParcela = (parcela: Parcela, parcelamento: Parcelamento) => {
    setParcelaSelecionada(parcela)
    setParcelamentoSelecionado(parcelamento)
    setMostrarPixNoSheet(isPixVisible(parcela.id))
    setSheetAberto(true)
  }

  const handleVerPixNoSheet = () => {
    if (parcelaSelecionada) {
      setPixVisible(parcelaSelecionada.id)
      setMostrarPixNoSheet(true)
    }
  }

  const handleDarBaixaParcela = async (parcelaId: string) => {
    setProcessandoBaixa(parcelaId)
    try {
      const { error, mensagem } = await marcarParcelaComoPaga(parcelaId)
      
      if (error) {
        toast.error(mensagem || 'Erro ao dar baixa na parcela')
        setProcessandoBaixa(null)
        return
      }

      toast.success('Baixa registrada com sucesso!')
      await carregarPedido()
      setSheetAberto(false)
      setDialogBaixaAberto(false)
      setParcelaParaBaixa(null)
    } catch (error) {
      toast.error('Erro inesperado ao dar baixa')
    } finally {
      setProcessandoBaixa(null)
    }
  }

  const handleMarcarVencida = async (parcelaId: string) => {
    setProcessandoBaixa(parcelaId)
    try {
      const { error, mensagem } = await marcarParcelaComoVencida(parcelaId)
      
      if (error) {
        toast.error(mensagem || 'Erro ao marcar parcela como vencida')
        setProcessandoBaixa(null)
        return
      }

      toast.success('Parcela marcada como vencida!')
      await carregarPedido()
      setDialogVencidaAberto(false)
      setParcelaParaVencida(null)
    } catch (error) {
      toast.error('Erro inesperado ao marcar como vencida')
    } finally {
      setProcessandoBaixa(null)
    }
  }

  const handleReverterParcela = async () => {
    if (!parcelaParaReverter) return

    setProcessandoBaixa(parcelaParaReverter.id)
    try {
      const { error, mensagem } = await reverterParcela(parcelaParaReverter.id, novoStatusReverter)
      
      if (error) {
        toast.error(mensagem || 'Erro ao reverter parcela')
        setProcessandoBaixa(null)
        return
      }

      toast.success(`Parcela revertida para ${novoStatusReverter === 'atrasada' ? 'vencida' : 'pendente'}!`)
      await carregarPedido()
      setDialogReverterAberto(false)
      setParcelaParaReverter(null)
    } catch (error) {
      toast.error('Erro inesperado ao reverter parcela')
    } finally {
      setProcessandoBaixa(null)
    }
  }

  const handleExcluirPedido = async () => {
    if (!pedido || !id) return

    setExcluindo(true)
    try {
      const revendaId = await obterRevendaId()
      if (!revendaId) {
        toast.error('Erro ao identificar revenda')
        setExcluindo(false)
        return
      }

      const { error, mensagem } = await excluirPedidoRevenda(revendaId, id)
      
      if (error) {
        toast.error(mensagem || 'Erro ao excluir pedido')
        setExcluindo(false)
        return
      }

      toast.success('Pedido excluído com sucesso!')
      navigate('/revenda/pedidos')
    } catch (error) {
      toast.error('Erro inesperado ao excluir pedido')
      setExcluindo(false)
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
          onClick={() => navigate('/revenda/pedidos')}
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
            onClick={() => navigate('/revenda/pedidos')}
            className="border-neutral-300 dark:border-neutral-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Package className="w-8 h-8 text-violet-600 dark:text-violet-400" />
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
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${STATUS_COLORS[pedido.status] || STATUS_COLORS.pendente}`}>
            {STATUS_LABELS[pedido.status] || pedido.status}
          </span>
          <select
            value={pedido.status}
            onChange={(e) => handleAtualizarStatus(e.target.value as StatusPedido)}
            disabled={atualizandoStatus}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600 disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <Button
            variant="destructive"
            onClick={() => setDialogExcluirAberto(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Pedido
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do Cliente */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nome</p>
              <p className="text-neutral-900 dark:text-neutral-50">{pedido.dados_cliente.nome}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</p>
              <p className="text-neutral-900 dark:text-neutral-50">{pedido.dados_cliente.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Telefone</p>
              <p className="text-neutral-900 dark:text-neutral-50">{pedido.dados_cliente.telefone}</p>
            </div>
            {pedido.dados_cliente.cpf && (
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">CPF</p>
                <p className="text-neutral-900 dark:text-neutral-50">{pedido.dados_cliente.cpf}</p>
              </div>
            )}
            {totalPedidosCliente !== null && (
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Total de Pedidos</p>
                <p className="text-neutral-900 dark:text-neutral-50">
                  {totalPedidosCliente === 0 
                    ? 'Nenhum pedido' 
                    : `${totalPedidosCliente} pedido${totalPedidosCliente > 1 ? 's' : ''}`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações do Pedido */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Informações do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Revenda e Unidade */}
            {(pedido.revenda || pedido.unidade) && (
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Loja
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {pedido.revenda && (
                    <p className="text-neutral-900 dark:text-neutral-50">
                      {pedido.revenda.nome_publico || pedido.revenda.nome_revenda}
                    </p>
                  )}
                  {pedido.unidade && (
                    <>
                      {pedido.revenda && (
                        <span className="text-neutral-400 dark:text-neutral-600">•</span>
                      )}
                      <p className="font-medium text-violet-600 dark:text-violet-400">
                        {pedido.unidade.nome_publico || pedido.unidade.nome}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Data do Pedido */}
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data do Pedido
              </p>
              <p className="text-neutral-900 dark:text-neutral-50">
                {new Date(pedido.criado_em).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

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
              {pedido.valor_entrada && (
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                  Entrada: {formatarPreco(pedido.valor_entrada)}
                </p>
              )}
            </div>

            {/* Tipo de Entrega */}
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Tipo de Entrega
              </p>
              <div className="flex items-center gap-2">
                <p className="text-neutral-900 dark:text-neutral-50">
                  {pedido.tipo_entrega === 'retirar_local' && 'Retirada no local'}
                  {pedido.tipo_entrega === 'receber_endereco' && 'Entrega no endereço'}
                  {pedido.tipo_entrega === 'agendar' && 'Entrega agendada'}
                </p>
                {pedido.tipo_entrega === 'agendar' && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Agendado
                  </span>
                )}
              </div>
              
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
                    CEP: {pedido.endereco_entrega.cep}
                  </p>
                </div>
              )}

              {/* Agendamento (quando há agendamento_entrega) - Logo abaixo do Tipo de Entrega */}
              {pedido.agendamento_entrega && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    Agendamento de Entrega
                  </p>
                  <div className="space-y-2 pl-6 border-l-2 border-violet-200 dark:border-violet-800">
                    <div>
                      <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-0.5">Data</p>
                      <p className="text-sm text-neutral-900 dark:text-neutral-50">
                        {formatarDataCompleta(pedido.agendamento_entrega.data_agendamento)}
                      </p>
                    </div>
                    {pedido.agendamento_entrega.horario && (
                      <div>
                        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-0.5">Horário</p>
                        <p className="text-sm text-neutral-900 dark:text-neutral-50">
                          {pedido.agendamento_entrega.horario}
                        </p>
                      </div>
                    )}
                    {pedido.agendamento_entrega.observacoes && (
                      <div>
                        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-0.5">Observações</p>
                        <p className="text-sm text-neutral-900 dark:text-neutral-50">
                          {pedido.agendamento_entrega.observacoes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Observações */}
            {pedido.observacoes && (
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Observações</p>
                <p className="text-neutral-900 dark:text-neutral-50">{pedido.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                      Quantidade: {item.quantidade} × {formatarPreco(item.preco_unitario)}
                    </p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mt-1">
                      Subtotal: {formatarPreco(item.subtotal || (item.preco_unitario || 0) * (item.quantidade || 0))}
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

      {/* Endereço de Entrega */}
      {pedido.tipo_entrega === 'receber_endereco' && pedido.endereco_entrega && (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Endereço de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pedido.endereco_entrega.nome_endereco && (
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nome do Endereço</p>
                <p className="text-neutral-900 dark:text-neutral-50">{pedido.endereco_entrega.nome_endereco}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Endereço Completo</p>
              <p className="text-neutral-900 dark:text-neutral-50">
                {pedido.endereco_entrega.logradouro}, {pedido.endereco_entrega.numero}
                {pedido.endereco_entrega.complemento && ` - ${pedido.endereco_entrega.complemento}`}
              </p>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
                {pedido.endereco_entrega.bairro} - {pedido.endereco_entrega.cidade}/{pedido.endereco_entrega.estado}
              </p>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                CEP: {pedido.endereco_entrega.cep}
              </p>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Parcelamento Completo */}
      {pedido.forma_pagamento === 'pix_parcelado' && (
        pedido.parcelamento && pedido.parcelamento.parcelas && pedido.parcelamento.parcelas.length > 0 ? (
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
                {pedido.parcelamento.parcelas.map((parcela: Parcela) => (
                  <ParcelaCard
                    key={parcela.id}
                    parcela={parcela}
                    isRevenda={!ehAdmin}
                    onVerDetalhes={() => abrirDetalhesParcela(parcela, pedido.parcelamento)}
                    onVerPix={() => {
                      // Gera PIX se não tiver
                      if (!parcela.pix_copia_cola) {
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
                    onCopiarPix={() => {
                      if (parcela.pix_copia_cola) {
                        copiarPix(parcela.pix_copia_cola)
                      }
                    }}
                    onDarBaixa={ehAdmin ? () => {
                      setParcelaParaBaixa(parcela)
                      setDialogBaixaAberto(true)
                    } : undefined}
                    onMarcarVencida={ehAdmin ? () => {
                      setParcelaParaVencida(parcela)
                      setDialogVencidaAberto(true)
                    } : undefined}
                    onReverterParcela={ehAdmin ? () => {
                      setParcelaParaReverter(parcela)
                      setNovoStatusReverter('pendente')
                      setDialogReverterAberto(true)
                    } : undefined}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                Crediário Digital
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-600 dark:text-neutral-400">
                  Parcelamentos não encontrados para este pedido.
                </p>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Total e Informações Financeiras */}
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
          
          {/* Informações de Repasse (apenas para revenda e admin) */}
          {pedido.transacao_financeira && (
            <div className="mt-4 pt-4 border-t border-violet-200 dark:border-violet-800 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  Informações de Repasse
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Modalidade</p>
                  <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                    {pedido.transacao_financeira.modalidade}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Status</p>
                  {(() => {
                    const status = pedido.transacao_financeira?.status
                    if (!status || status === 'pendente') {
                      return (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                          Pendente
                        </span>
                      )
                    }
                    if (status === 'repassado') {
                      return (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          Repassado
                        </span>
                      )
                    }
                    if (status === 'liberado') {
                      return (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          Liberado
                        </span>
                      )
                    }
                    if (status === 'cancelado') {
                      return (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                          Cancelado
                        </span>
                      )
                    }
                    return (
                      <span className="text-xs font-medium px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                        Pendente
                      </span>
                    )
                  })()}
                </div>
              </div>
              
              {(() => {
                // Converte valores de string para número (DECIMAL do PostgreSQL vem como string)
                const valorBruto = typeof pedido.transacao_financeira.valor_bruto === 'string' 
                  ? parseFloat(pedido.transacao_financeira.valor_bruto) 
                  : (pedido.transacao_financeira.valor_bruto || 0)
                const valorLiquido = typeof pedido.transacao_financeira.valor_liquido === 'string' 
                  ? parseFloat(pedido.transacao_financeira.valor_liquido) 
                  : (pedido.transacao_financeira.valor_liquido || 0)
                const taxaPercentual = typeof pedido.transacao_financeira.taxa_percentual === 'string' 
                  ? parseFloat(pedido.transacao_financeira.taxa_percentual) 
                  : (pedido.transacao_financeira.taxa_percentual || 0)
                const taxaFixa = typeof pedido.transacao_financeira.taxa_fixa === 'string' 
                  ? parseFloat(pedido.transacao_financeira.taxa_fixa) 
                  : (pedido.transacao_financeira.taxa_fixa || 0)
                
                const taxaPercentualValor = (valorBruto * taxaPercentual) / 100
                const totalTaxas = taxaPercentualValor + taxaFixa
                
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Valor Total (Cliente pagou)</p>
                        <p className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                          {formatarPreco(valorBruto)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Valor de Repasse</p>
                        <p className="text-base font-bold text-green-600 dark:text-green-400">
                          {formatarPreco(valorLiquido)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Taxas Descontadas</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Taxa Percentual</p>
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                            {taxaPercentual.toFixed(2)}% = {formatarPreco(taxaPercentualValor)}
                          </p>
                        </div>
                        <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Taxa Fixa</p>
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                            {formatarPreco(taxaFixa)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Total de Taxas</p>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">
                          {formatarPreco(totalTaxas)}
                        </p>
                      </div>
                    </div>
                  </>
                )
              })()}
              
              {pedido.transacao_financeira.data_repasse_prevista && (
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Data Prevista de Repasse</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                    {new Date(pedido.transacao_financeira.data_repasse_prevista).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet para detalhes da parcela */}
      <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Parcela</SheetTitle>
            <SheetDescription>
              Informações completas da parcela selecionada
            </SheetDescription>
          </SheetHeader>
          {parcelaSelecionada && parcelamentoSelecionado && (
            <div className="mt-6 space-y-6">
              {/* Informações da Parcela */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Número da Parcela</p>
                  <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                    {parcelaSelecionada.numero_parcela}ª Parcela
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Valor</p>
                  <p className="text-xl font-bold text-violet-600 dark:text-violet-400">
                    {formatarPreco(parcelaSelecionada.valor)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Data de Vencimento</p>
                  <p className="text-neutral-900 dark:text-neutral-50">
                    {formatarDataCompleta(parcelaSelecionada.data_vencimento)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    {parcelaSelecionada.status === 'paga' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">Paga</span>
                      </>
                    ) : parcelaSelecionada.status === 'atrasada' ? (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">Vencida</span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-neutral-500 dark:text-neutral-500">Pendente</span>
                    )}
                  </div>
                </div>
                {parcelaSelecionada.data_pagamento && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Data de Pagamento</p>
                    <p className="text-neutral-900 dark:text-neutral-50">
                      {formatarDataCompleta(parcelaSelecionada.data_pagamento)}
                    </p>
                  </div>
                )}
              </div>

              {/* PIX Copia e Cola - Revenda só vê se clicou em "Ver PIX" */}
              {parcelaSelecionada.status !== 'paga' && (
                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  {mostrarPixNoSheet && parcelaSelecionada.pix_copia_cola ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">PIX Copia e Cola</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500 dark:text-neutral-500">Visível por 3 horas</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copiarPix(parcelaSelecionada.pix_copia_cola!)}
                            className="border-violet-300 dark:border-violet-700"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-md border border-neutral-200 dark:border-neutral-800">
                        <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 break-all">
                          {parcelaSelecionada.pix_copia_cola}
                        </p>
                      </div>
                      <div className="flex justify-center pt-2">
                        <QRCode url={parcelaSelecionada.pix_copia_cola} size={180} />
                      </div>
                    </>
                  ) : parcelaSelecionada.pix_copia_cola ? (
                    <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col items-center">
                      <QrCode className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-3" />
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 text-center">
                        Clique em "Ver PIX" no card da parcela para visualizar o código PIX e QR Code
                      </p>
                      <Button
                        variant="default"
                        onClick={handleVerPixNoSheet}
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Ver PIX
                      </Button>
                    </div>
                  ) : (
                    <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col items-center">
                      <QrCode className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-3" />
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                        Gerando código PIX...
                      </p>
                      <Button
                        variant="default"
                        onClick={async () => {
                          const { error } = await gerarPixParaParcela(
                            parcelaSelecionada.id,
                            parcelaSelecionada.valor,
                            `Parcela ${parcelaSelecionada.numero_parcela} - Pedido ${pedido.id.slice(0, 8)}`
                          )
                          if (!error) {
                            await carregarPedido()
                            toast.success('PIX gerado com sucesso!')
                            setPixVisible(parcelaSelecionada.id)
                            setMostrarPixNoSheet(true)
                          } else {
                            toast.error('Erro ao gerar PIX')
                          }
                        }}
                      >
                        Gerar PIX
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Ações para Revenda */}
              {parcelaSelecionada.status !== 'paga' && (
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30"
                    onClick={() => {
                      setSheetAberto(false)
                      setParcelaParaBaixa(parcelaSelecionada)
                      setDialogBaixaAberto(true)
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Dar Baixa
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                    onClick={() => {
                      setSheetAberto(false)
                      setParcelaParaVencida(parcelaSelecionada)
                      setDialogVencidaAberto(true)
                    }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Marcar como Vencida
                  </Button>
                </div>
              )}
              {parcelaSelecionada.status === 'paga' && (
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <Button
                    variant="outline"
                    className="w-full border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                    onClick={() => {
                      setSheetAberto(false)
                      setParcelaParaReverter(parcelaSelecionada)
                      setNovoStatusReverter('pendente')
                      setDialogReverterAberto(true)
                    }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Reverter Parcela
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog de confirmação de baixa - apenas para ADMIN */}
      {ehAdmin && (
        <AlertDialog open={dialogBaixaAberto} onOpenChange={setDialogBaixaAberto}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Dar Baixa na Parcela</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja dar baixa na {parcelaParaBaixa?.numero_parcela}ª parcela?
                Esta ação irá marcar a parcela como paga.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDialogBaixaAberto(false)
                setParcelaParaBaixa(null)
              }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => parcelaParaBaixa && handleDarBaixaParcela(parcelaParaBaixa.id)}
                disabled={processandoBaixa === parcelaParaBaixa?.id}
                className="bg-green-600 hover:bg-green-700"
              >
                {processandoBaixa === parcelaParaBaixa?.id ? 'Processando...' : 'Confirmar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Dialog para marcar como vencida - apenas para ADMIN */}
      {ehAdmin && (
        <AlertDialog open={dialogVencidaAberto} onOpenChange={setDialogVencidaAberto}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Marcar Parcela como Vencida</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja marcar a {parcelaParaVencida?.numero_parcela}ª parcela como vencida?
                {parcelaParaVencida?.status === 'paga' && ' Esta ação irá reverter o status de paga para vencida.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDialogVencidaAberto(false)
                setParcelaParaVencida(null)
              }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => parcelaParaVencida && handleMarcarVencida(parcelaParaVencida.id)}
                disabled={processandoBaixa === parcelaParaVencida?.id}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {processandoBaixa === parcelaParaVencida?.id ? 'Processando...' : 'Confirmar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Dialog para reverter parcela - apenas para ADMIN */}
      {ehAdmin && (
        <AlertDialog open={dialogReverterAberto} onOpenChange={setDialogReverterAberto}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reverter Parcela</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja reverter a {parcelaParaReverter?.numero_parcela}ª parcela?
                Esta ação irá remover o status de paga e alterar para o status selecionado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                Novo Status:
              </label>
              <select
                value={novoStatusReverter}
                onChange={(e) => setNovoStatusReverter(e.target.value as 'pendente' | 'atrasada')}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
              >
                <option value="pendente">Pendente</option>
                <option value="atrasada">Vencida</option>
              </select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDialogReverterAberto(false)
                setParcelaParaReverter(null)
              }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReverterParcela}
                disabled={processandoBaixa === parcelaParaReverter?.id}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {processandoBaixa === parcelaParaReverter?.id ? 'Processando...' : 'Confirmar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Dialog para excluir pedido */}
      <AlertDialog open={dialogExcluirAberto} onOpenChange={setDialogExcluirAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              Excluir Pedido
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
              </p>
              <p className="font-semibold text-red-600 dark:text-red-400">
                ⚠️ Atenção: Ao excluir o pedido, todos os parcelamentos e parcelas associados também serão excluídos automaticamente.
              </p>
              {pedido?.parcelamento && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Este pedido possui {pedido.parcelamento.total_parcelas} parcela(s) que serão removidas.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirPedido}
              disabled={excluindo}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {excluindo ? 'Excluindo...' : 'Sim, excluir pedido'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de reverter parcela removido - ação exclusiva de ADMIN */}
    </div>
  )
}

