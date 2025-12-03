import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Package, ArrowRight, Calendar, MapPin, CreditCard, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { buscarPedido, type Pedido } from '@/lib/gerenciarPedidos'
import { formatarPreco, calcularValorParcelado } from '@/lib/utils'
import { CabecalhoRodapeLoja } from '@/components/loja/CabecalhoRodapeLoja'
import { supabase } from '@/lib/supabase'

export default function PedidoConfirmado() {
  const { pedidoId } = useParams<{ pedidoId: string }>()
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [revendaId, setRevendaId] = useState<string | null>(null)
  const [unidadeId, setUnidadeId] = useState<string | null>(null)
  const [mostrarTransicao, setMostrarTransicao] = useState(true)
  const [saindoTransicao, setSaindoTransicao] = useState(false)
  const [mostrarConteudo, setMostrarConteudo] = useState(false)

  useEffect(() => {
    if (pedidoId) {
      carregarPedido()
    }
  }, [pedidoId])

  useEffect(() => {
    if (!carregando && pedido && !erro && mostrarTransicao && !saindoTransicao && !mostrarConteudo) {
      // Mostra a tela de transição por 2.5 segundos, depois anima a saída
      const timerTransicao = setTimeout(() => {
        setSaindoTransicao(true)
        // Após a animação de saída completar, remove a tela e mostra o conteúdo
        setTimeout(() => {
          setMostrarTransicao(false)
          setMostrarConteudo(true)
        }, 800) // Tempo da animação de saída (deve corresponder à duração da animação)
      }, 2500)
      
      return () => {
        clearTimeout(timerTransicao)
      }
    }
  }, [carregando, pedido, erro, mostrarTransicao, saindoTransicao, mostrarConteudo])

  const carregarPedido = async () => {
    if (!pedidoId) return
    
    setCarregando(true)
    try {
      const { pedido: pedidoData, error } = await buscarPedido(pedidoId)
      if (error || !pedidoData) {
        setErro('Pedido não encontrado')
        return
      }
      setPedido(pedidoData)
      
      // Define revenda_id e unidade_id do pedido
      // Prioriza unidade_id se existir, senão tenta buscar dos produtos do pedido
      if (pedidoData.unidade_id) {
        console.log('✅ Pedido tem unidade_id:', pedidoData.unidade_id)
        setUnidadeId(pedidoData.unidade_id)
        // Ainda precisa do revenda_id para compatibilidade
        if (pedidoData.revenda_id) {
          setRevendaId(pedidoData.revenda_id)
        }
      } else if (pedidoData.revenda_id) {
        // Se o pedido não tem unidade_id, tenta buscar dos produtos (pedidos antigos)
        console.log('⚠️ Pedido não tem unidade_id, tentando buscar dos produtos...')
        setRevendaId(pedidoData.revenda_id)
        
        // Tenta buscar unidade_id dos produtos do pedido
        if (pedidoData.itens && pedidoData.itens.length > 0) {
          const primeiroItem = pedidoData.itens[0]
          // Verifica se o produto já tem unidade_id na resposta (se foi incluído na query)
          if (primeiroItem.produto?.unidade_id) {
            console.log('✅ Unidade_id encontrado nos produtos:', primeiroItem.produto.unidade_id)
            setUnidadeId(primeiroItem.produto.unidade_id)
          } else if (primeiroItem.produto_id) {
            // Se não veio na resposta, busca diretamente
            const { data: produtoData } = await supabase
              .from('produtos')
              .select('unidade_id')
              .eq('id', primeiroItem.produto_id)
              .maybeSingle()
            
            if (produtoData?.unidade_id) {
              console.log('✅ Unidade_id encontrado nos produtos (busca direta):', produtoData.unidade_id)
              setUnidadeId(produtoData.unidade_id)
            } else {
              console.log('⚠️ Produtos também não têm unidade_id (pedido legado)')
              setUnidadeId(null)
            }
          } else {
            setUnidadeId(null)
          }
        } else {
          setUnidadeId(null)
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar pedido:', error)
      setErro('Erro ao carregar pedido')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <CabecalhoRodapeLoja revendaId={revendaId} unidadeId={unidadeId}>
      {carregando ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : erro || !pedido ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="border-neutral-200 dark:border-neutral-800 max-w-md">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 dark:text-red-400">{erro || 'Pedido não encontrado'}</p>
              <Button
                onClick={() => navigate('/cliente/parcelamentos')}
                className="mt-4 w-full bg-violet-600 hover:bg-violet-700 text-white"
              >
                Ir para Parcelamentos
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Tela de Transição Roxa Animada */}
          {mostrarTransicao && (
            <div 
              className={`fixed inset-0 z-50 bg-gradient-to-br from-violet-600 via-violet-700 to-violet-800 flex items-center justify-center ${
                saindoTransicao ? 'animate-slide-circular-out' : 'animate-slide-circular-in'
              }`}
            >
              <div className="text-center space-y-4 animate-fade-in px-4 -mt-20">
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Animação Lottie via iframe - roda uma única vez */}
                    <div className="relative w-64 h-64 sm:w-80 sm:h-80 mb-[-3rem]">
                      <iframe
                        src="https://lottie.host/embed/ecdb22b3-a733-400b-b668-ee3e22251145/a3V1DGcVz5.lottie?autoplay=true&loop=false"
                        className="w-full h-full border-0"
                        title="Pixy Realizado"
                        allow="autoplay"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-4xl font-bold text-white animate-fade-in-up">
                    Pixy Realizado!
                  </h2>
                  <p className="text-violet-100 text-base sm:text-lg animate-fade-in-up-delay">
                    Redirecionando...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Conteúdo Principal */}
          {mostrarConteudo && (
            <div className={`space-y-4 sm:space-y-6 max-w-4xl mx-auto transition-all duration-500 ${
              mostrarConteudo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
      {/* Header de Sucesso */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            {/* Círculo de fundo animado */}
            <div className="absolute inset-0 rounded-full bg-green-400/20 animate-pulse"></div>
            {/* Ícone de check */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Pedido Confirmado!
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Seu pedido foi recebido e está sendo processado
          </p>
        </div>
      </div>

      {/* Resumo do Pedido */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-400" />
            Resumo do Pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Informações do Pedido */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Número do Pedido</p>
              <p className="font-semibold text-neutral-900 dark:text-neutral-50">
                #{pedido.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Data</p>
              <p className="font-semibold text-neutral-900 dark:text-neutral-50">
                {new Date(pedido.criado_em).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Status</p>
              <p className="font-semibold text-neutral-900 dark:text-neutral-50 capitalize">
                {pedido.status}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Forma de Pagamento</p>
              <p className="font-semibold text-neutral-900 dark:text-neutral-50">
                {pedido.forma_pagamento === 'pix_vista' ? 'PIX à Vista' : `PIX Parcelado (${pedido.parcelas_total}x)`}
              </p>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Itens do Pedido</h3>
            <div className="space-y-3">
              {pedido.itens?.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex gap-3 flex-1">
                    {item.produto?.imagem_url && (
                      <img
                        src={item.produto.imagem_url}
                        alt={item.produto.nome}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900 dark:text-neutral-50">
                        {item.produto?.nome || 'Produto'}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Quantidade: {item.quantidade}
                      </p>
                      {/* Sempre mostra formato parcelado para clientes */}
                      {item.produto && (
                        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">
                          {calcularValorParcelado(item.produto.preco, item.produto.max_parcelas).textoParcelado}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-50">
                      {formatarPreco(item.subtotal || (item.preco_unitario || 0) * (item.quantidade || 0))}
                    </p>
                    {item.produto && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 line-through mt-0.5">
                        {calcularValorParcelado(item.produto.preco, item.produto.max_parcelas).textoVista}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Entrega */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Entrega
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              {pedido.tipo_entrega === 'retirar_local' && 'Retirada no local'}
              {pedido.tipo_entrega === 'receber_endereco' && 'Entrega no endereço cadastrado'}
              {pedido.tipo_entrega === 'agendar' && 'Entrega agendada'}
            </p>
          </div>

          {/* Parcelamento */}
          {pedido.parcelamento && (
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                Parcelamento
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {pedido.parcelamento.total_parcelas}x de {formatarPreco(pedido.parcelamento.valor_parcela)}
                </p>
                {pedido.parcelamento.parcelas && (
                  <div className="space-y-1">
                    {pedido.parcelamento.parcelas.map((parcela) => (
                      <div key={parcela.id} className="flex justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {parcela.numero_parcela}ª parcela - Vencimento: {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                        </span>
                        <span className={`font-medium ${
                          parcela.status === 'paga' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-neutral-900 dark:text-neutral-50'
                        }`}>
                          {formatarPreco(parcela.valor)} {parcela.status === 'paga' && '(Paga)'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Total</span>
              <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                {formatarPreco(pedido.valor_total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Ação */}
      <div className="w-full">
        <Button
          onClick={() => navigate('/cliente/parcelamentos')}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          size="lg"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Ir para Parcelamentos
        </Button>
      </div>
        </div>
          )}
        </>
      )}
    </CabecalhoRodapeLoja>
  )
}

