import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Package, MapPin, CreditCard, Eye, AlertCircle, LayoutGrid, List, Search, Store } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listarPedidosCliente, type Pedido } from '@/lib/gerenciarPedidos'
import { formatarPreco } from '@/lib/utils'

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

export default function MinhasCompras() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregarPedidos()
  }, [])

  const carregarPedidos = async () => {
    setCarregando(true)
    setErro(null)
    try {
      const { pedidos: pedidosData, error } = await listarPedidosCliente()
      if (error) {
        console.error('❌ Erro detalhado:', error)
        setErro(`Erro ao carregar pedidos: ${error.message || 'Erro desconhecido'}`)
        return
      }
      
      // Debug: verificar unidades
      console.log('📦 [MinhasCompras] Pedidos carregados:', {
        total: pedidosData?.length || 0,
        comUnidadeId: pedidosData?.filter(p => p.unidade_id).length || 0,
        comUnidadeObjeto: pedidosData?.filter(p => p.unidade).length || 0,
        pedidos: pedidosData?.map(p => ({
          id: p.id.slice(0, 8),
          unidadeId: p.unidade_id,
          temUnidade: !!p.unidade,
          unidadeNome: p.unidade?.nome_publico || p.unidade?.nome
        }))
      })
      
      setPedidos(pedidosData || [])
    } catch (error) {
      console.error('❌ Erro ao carregar pedidos:', error)
      setErro(`Erro inesperado ao carregar pedidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setCarregando(false)
    }
  }

  // Filtragem simples dos pedidos (apenas busca)
  const pedidosFiltrados = useMemo(() => {
    if (!busca.trim()) return pedidos
    
    const termo = busca.trim().toLowerCase()
    return pedidos.filter(pedido => 
      pedido.id.toLowerCase().includes(termo) ||
      (pedido.revenda?.nome_revenda || '').toLowerCase().includes(termo) ||
      (pedido.revenda?.nome_publico || '').toLowerCase().includes(termo) ||
      (pedido.unidade?.nome || '').toLowerCase().includes(termo) ||
      (pedido.unidade?.nome_publico || '').toLowerCase().includes(termo)
    )
  }, [pedidos, busca])

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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-violet-600 dark:text-violet-400" />
            Minhas Compras
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Visualize o histórico completo das suas compras
          </p>
        </div>
        {/* Toggle de Visualização */}
        <div className="flex items-center gap-2 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1 bg-neutral-50 dark:bg-neutral-900">
          <Button
            variant={visualizacao === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setVisualizacao('grid')}
            className={`h-8 px-3 ${
              visualizacao === 'grid'
                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={visualizacao === 'lista' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setVisualizacao('lista')}
            className={`h-8 px-3 ${
              visualizacao === 'lista'
                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
            }`}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {erro && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        </div>
      )}

      {/* Busca Simples */}
      {pedidos.length > 0 && (
        <Card className="border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
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

      {pedidos.length === 0 ? (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center mb-6">
              Você ainda não realizou nenhuma compra
            </p>
          </CardContent>
        </Card>
      ) : pedidosFiltrados.length === 0 ? (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center mb-6">
              Nenhum pedido corresponde à busca
            </p>
            <Button
              variant="outline"
              onClick={() => setBusca('')}
            >
              Limpar Busca
            </Button>
          </CardContent>
        </Card>
      ) : visualizacao === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pedidosFiltrados.map((pedido) => (
            <Card
              key={pedido.id}
              className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="space-y-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-400" />
                      Pedido #{pedido.id.slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      {new Date(pedido.criado_em).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[pedido.status] || STATUS_COLORS.pendente}`}>
                      {STATUS_LABELS[pedido.status] || pedido.status}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/cliente/compras/${pedido.id}`)}
                      className="border-neutral-300 dark:border-neutral-700 shrink-0"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Revenda */}
                {pedido.revenda && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
                    {pedido.revenda.logo_url ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 flex-shrink-0">
                        <img
                          src={pedido.revenda.logo_url}
                          alt={pedido.revenda.nome_publico || pedido.revenda.nome_revenda}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                        <Store className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-0.5">Loja</p>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                        {pedido.revenda.nome_publico || pedido.revenda.nome_revenda}
                      </p>
                      {pedido.unidade && (
                        <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-0.5">
                          Unidade: {pedido.unidade.nome_publico || pedido.unidade.nome}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Itens */}
                {pedido.itens && pedido.itens.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Itens:</p>
                    <div className="space-y-1">
                      {pedido.itens.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                          <span>
                            {item.produto?.nome || 'Produto'} x{item.quantidade}
                          </span>
                          <span>{formatarPreco(item.subtotal || (item.preco_unitario || 0) * (item.quantidade || 0))}</span>
                        </div>
                      ))}
                      {pedido.itens.length > 3 && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-500">
                          +{pedido.itens.length - 3} {pedido.itens.length - 3 === 1 ? 'item' : 'itens'} mais
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Informações de Entrega e Pagamento */}
                <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-neutral-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-neutral-900 dark:text-neutral-50">Entrega</p>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {pedido.tipo_entrega === 'retirar_local' && 'Retirada no local'}
                        {pedido.tipo_entrega === 'receber_endereco' && 'Entrega no endereço'}
                        {pedido.tipo_entrega === 'agendar' && 'Entrega agendada'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CreditCard className="w-4 h-4 text-neutral-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-neutral-900 dark:text-neutral-50">Pagamento</p>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {pedido.forma_pagamento === 'pix_vista' 
                          ? 'PIX à Vista' 
                          : `PIX Parcelado (${pedido.parcelas_total}x)`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parcelamento */}
                {pedido.parcelamento && (
                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                        Parcelamento
                      </p>
                    </div>
                    <div className="space-y-1">
                      {pedido.parcelamento.parcelas?.map((parcela) => (
                        <div key={parcela.id} className="flex justify-between text-sm">
                          <span className={`${
                            parcela.status === 'paga' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-neutral-600 dark:text-neutral-400'
                          }`}>
                            {parcela.numero_parcela}ª parcela - Venc: {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                            {parcela.status === 'paga' && ' ✓'}
                          </span>
                          <span className={`font-medium ${
                            parcela.status === 'paga' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-neutral-900 dark:text-neutral-50'
                          }`}>
                            {formatarPreco(parcela.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Total</span>
                  <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                    {formatarPreco(pedido.valor_total)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {pedidosFiltrados.map((pedido) => (
            <Card
              key={pedido.id}
              className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-400" />
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg text-neutral-900 dark:text-neutral-50">
                          Pedido #{pedido.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {new Date(pedido.criado_em).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                      {pedido.revenda && (
                        <div className="flex items-start gap-2">
                          {pedido.revenda.logo_url ? (
                            <div className="w-6 h-6 rounded overflow-hidden bg-white dark:bg-neutral-800 flex-shrink-0 mt-0.5">
                              <img
                                src={pedido.revenda.logo_url}
                                alt={pedido.revenda.nome_publico || pedido.revenda.nome_revenda}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <Store className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-1" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Loja</p>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
                              {pedido.revenda.nome_publico || pedido.revenda.nome_revenda}
                            </p>
                            {pedido.unidade && (
                              <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-0.5">
                                Unidade: {pedido.unidade.nome_publico || pedido.unidade.nome}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Pagamento</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {pedido.forma_pagamento === 'pix_vista' 
                            ? 'PIX à Vista' 
                            : `PIX Parcelado (${pedido.parcelas_total}x)`
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Entrega</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {pedido.tipo_entrega === 'retirar_local' && 'Retirada no local'}
                          {pedido.tipo_entrega === 'receber_endereco' && 'Entrega no endereço'}
                          {pedido.tipo_entrega === 'agendar' && 'Entrega agendada'}
                        </p>
                      </div>
                    </div>

                    {/* Itens */}
                    {pedido.itens && pedido.itens.length > 0 && (
                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">Itens:</p>
                        <div className="space-y-1">
                          {pedido.itens.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                              <span>
                                {item.produto?.nome || 'Produto'} x{item.quantidade}
                              </span>
                              <span>{formatarPreco(item.subtotal || (item.preco_unitario || 0) * (item.quantidade || 0))}</span>
                            </div>
                          ))}
                          {pedido.itens.length > 3 && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              +{pedido.itens.length - 3} {pedido.itens.length - 3 === 1 ? 'item' : 'itens'} mais
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Parcelamento */}
                    {pedido.parcelamento && pedido.parcelamento.parcelas && pedido.parcelamento.parcelas.length > 0 && (
                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          <p className="text-xs font-medium text-neutral-900 dark:text-neutral-50">
                            Parcelamento ({pedido.parcelamento.parcelas.length}x)
                          </p>
                        </div>
                        <div className="space-y-1">
                          {pedido.parcelamento.parcelas.slice(0, 3).map((parcela) => (
                            <div key={parcela.id} className="flex justify-between text-sm">
                              <span className={`${
                                parcela.status === 'paga' 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-neutral-600 dark:text-neutral-400'
                              }`}>
                                {parcela.numero_parcela}ª parcela - Venc: {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                                {parcela.status === 'paga' && ' ✓'}
                              </span>
                              <span className={`font-medium ${
                                parcela.status === 'paga' 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-neutral-900 dark:text-neutral-50'
                              }`}>
                                {formatarPreco(parcela.valor)}
                              </span>
                            </div>
                          ))}
                          {pedido.parcelamento.parcelas.length > 3 && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              +{pedido.parcelamento.parcelas.length - 3} {pedido.parcelamento.parcelas.length - 3 === 1 ? 'parcela' : 'parcelas'} mais
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[pedido.status] || STATUS_COLORS.pendente}`}>
                      {STATUS_LABELS[pedido.status] || pedido.status}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Total</p>
                      <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                        {formatarPreco(pedido.valor_total)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/cliente/compras/${pedido.id}`)}
                      className="border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
