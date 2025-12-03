import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, ArrowRight, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { listarCarrinho, atualizarQuantidadeCarrinho, removerDoCarrinho, type ItemCarrinho } from '@/lib/gerenciarCarrinho'
import { formatarPreco } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { CabecalhoRodapeLoja } from '@/components/loja/CabecalhoRodapeLoja'
import { obterSessao } from '@/lib/auth'
import { DialogLoginNecessario } from '@/components/ui/dialog-login-necessario'

export default function Carrinho() {
  const navigate = useNavigate()
  const location = useLocation()
  const [carregando, setCarregando] = useState(true)
  const [itens, setItens] = useState<ItemCarrinho[]>([])
  const [atualizando, setAtualizando] = useState<string | null>(null)
  const [revendaId, setRevendaId] = useState<string | null>(null)
  const [unidadeId, setUnidadeId] = useState<string | null>(null)
  const [estaLogado, setEstaLogado] = useState(false)
  const [dialogLoginAberto, setDialogLoginAberto] = useState(false)
  const [acaoPendente, setAcaoPendente] = useState<(() => void) | null>(null)

  useEffect(() => {
    carregarCarrinho()
    verificarAutenticacao()
  }, [])

  const verificarAutenticacao = async () => {
    try {
      const session = await obterSessao()
      setEstaLogado(!!session && !!session.user)
    } catch (error) {
      setEstaLogado(false)
    }
  }

  const carregarCarrinho = async () => {
    setCarregando(true)
    try {
      const { itens: itensData, error } = await listarCarrinho()
      if (!error && itensData) {
        setItens(itensData)
        
        // Busca revenda_id e unidade_id dos produtos no carrinho
        if (itensData.length > 0 && itensData[0]?.produto_id) {
          // Busca informações de todos os produtos para identificar unidade
          const produtosIds = itensData.map(item => item.produto_id)
          const { data: produtosData } = await supabase
            .from('produtos')
            .select('id, revenda_id, unidade_id')
            .in('id', produtosIds)
          
          if (produtosData && produtosData.length > 0) {
            const primeiroProduto = produtosData[0]
            setRevendaId(primeiroProduto.revenda_id)
            
            // Verifica se há produtos de unidades diferentes
            const unidadesIds = produtosData
              .map(p => p.unidade_id)
              .filter((id): id is string => id !== null && id !== undefined)
            
            const unidadesUnicas = [...new Set(unidadesIds)]
            
            if (unidadesUnicas.length > 0) {
              // Usa a primeira unidade encontrada (se todos forem da mesma unidade, será a única)
              // Se forem de unidades diferentes, usa a primeira como padrão
              setUnidadeId(unidadesUnicas[0])
              console.log('✅ Carrinho identificou unidade_id:', unidadesUnicas[0])
            } else {
              // Produtos sem unidade (legado)
              setUnidadeId(null)
              console.log('⚠️ Produtos do carrinho não têm unidade_id (legado)')
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar carrinho:', error)
    } finally {
      setCarregando(false)
    }
  }

  const handleAtualizarQuantidade = async (itemId: string, novaQuantidade: number) => {
    // Verifica se está logado antes de atualizar
    if (!estaLogado) {
      setAcaoPendente(() => () => handleAtualizarQuantidade(itemId, novaQuantidade))
      setDialogLoginAberto(true)
      return
    }

    if (novaQuantidade <= 0) {
      await handleRemoverItem(itemId)
      return
    }

    setAtualizando(itemId)
    try {
      const { error } = await atualizarQuantidadeCarrinho(itemId, novaQuantidade)
      if (!error) {
        await carregarCarrinho()
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar quantidade:', error)
    } finally {
      setAtualizando(null)
    }
  }

  const handleRemoverItem = async (itemId: string) => {
    setAtualizando(itemId)
    try {
      const { error } = await removerDoCarrinho(itemId)
      if (!error) {
        await carregarCarrinho()
      }
    } catch (error) {
      console.error('❌ Erro ao remover item:', error)
    } finally {
      setAtualizando(null)
    }
  }

  const calcularTotal = () => {
    return itens.reduce((total, item) => {
      const preco = item.produto?.preco || 0
      return total + preco * item.quantidade
    }, 0)
  }

  const totalItens = itens.reduce((total, item) => total + item.quantidade, 0)

  const handleConfirmarLogin = () => {
    // Salva a URL atual para redirecionar após login
    localStorage.setItem('redirectAfterAuth', location.pathname + location.search)
    setDialogLoginAberto(false)
    navigate('/login')
  }

  return (
    <>
      <DialogLoginNecessario
        aberto={dialogLoginAberto}
        onClose={() => setDialogLoginAberto(false)}
        onConfirmar={handleConfirmarLogin}
        titulo="Login Necessário"
        descricao="É necessário ter uma conta para continuar. Deseja fazer login ou criar uma conta?"
      />
      <CabecalhoRodapeLoja revendaId={revendaId} unidadeId={unidadeId}>
      {carregando ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-6xl mx-auto carrinho-mobile">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-violet-600 dark:text-violet-400 flex-shrink-0" />
            <span className="truncate">Carrinho de Compras</span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-1">
            {totalItens > 0 
              ? `${totalItens} ${totalItens === 1 ? 'item' : 'itens'} no carrinho`
              : 'Seu carrinho está vazio'
            }
          </p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            // Prioriza unidade se houver, senão usa revenda
            if (unidadeId) {
              const { data: unidadeData } = await supabase
                .from('unidades_revenda')
                .select('link_publico')
                .eq('id', unidadeId)
                .single()
              
              if (unidadeData?.link_publico) {
                navigate(`/loja/${unidadeData.link_publico}`)
                return
              }
            }
            
            // Se não tem unidade ou não encontrou link, tenta revenda
            if (revendaId) {
              const { data: revendaData } = await supabase
                .from('revendas')
                .select('link_publico')
                .eq('id', revendaId)
                .single()
              
              if (revendaData?.link_publico) {
                navigate(`/loja/${revendaData.link_publico}`)
                return
              }
            }
            
            // Fallback: volta para página anterior
            navigate(-1)
          }}
          className="border-neutral-300 dark:border-neutral-700 w-full sm:w-auto min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continuar Comprando
        </Button>
      </div>

      {itens.length === 0 ? (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Seu carrinho está vazio
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-center">
              Adicione produtos ao carrinho para continuar
            </p>
            <Button
              onClick={async () => {
                // Prioriza unidade se houver, senão usa revenda
                if (unidadeId) {
                  const { data: unidadeData } = await supabase
                    .from('unidades_revenda')
                    .select('link_publico')
                    .eq('id', unidadeId)
                    .single()
                  
                  if (unidadeData?.link_publico) {
                    navigate(`/loja/${unidadeData.link_publico}`)
                    return
                  }
                }
                
                // Se não tem unidade ou não encontrou link, tenta revenda
                if (revendaId) {
                  const { data: revendaData } = await supabase
                    .from('revendas')
                    .select('link_publico')
                    .eq('id', revendaId)
                    .single()
                  
                  if (revendaData?.link_publico) {
                    navigate(`/loja/${revendaData.link_publico}`)
                    return
                  }
                }
                
                // Fallback: volta para página anterior
                navigate(-1)
              }}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continuar Comprando
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Lista de Itens */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {itens.map((item) => {
              const produto = item.produto
              if (!produto) return null

              const subtotal = produto.preco * item.quantidade

              return (
                <Card
                  key={item.id}
                  className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      {/* Imagem */}
                      <div className="w-full sm:w-32 h-48 sm:h-32 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                        {produto.imagem_url ? (
                          <img
                            src={produto.imagem_url}
                            alt={produto.nome}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-neutral-400" />
                          </div>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-1 line-clamp-2">
                          {produto.nome}
                        </h3>
                        {produto.descricao && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-2">
                            {produto.descricao}
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-3">
                          <span className="text-base sm:text-lg font-bold text-violet-600 dark:text-violet-400">
                            {formatarPreco(produto.preco)}
                          </span>
                          <span className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                            Subtotal: <span className="font-semibold">{formatarPreco(subtotal)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Controles */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center justify-between sm:justify-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 overflow-hidden flex-1 sm:flex-initial">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAtualizarQuantidade(item.id, item.quantidade - 1)}
                            disabled={atualizando === item.id}
                            className="h-10 w-12 sm:h-9 sm:w-9 rounded-none hover:bg-white dark:hover:bg-neutral-700 border-0 flex items-center justify-center flex-1 sm:flex-initial"
                          >
                            <Minus className="w-5 h-5 sm:w-4 sm:h-4" />
                          </Button>
                          <div className="min-w-[3rem] sm:min-w-[3rem] flex items-center justify-center px-2 border-x border-neutral-200 dark:border-neutral-700 flex-1 sm:flex-initial">
                            <span className="text-base sm:text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                              {item.quantidade}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAtualizarQuantidade(item.id, item.quantidade + 1)}
                            disabled={atualizando === item.id}
                            className="h-10 w-12 sm:h-9 sm:w-9 rounded-none hover:bg-white dark:hover:bg-neutral-700 border-0 flex items-center justify-center flex-1 sm:flex-initial"
                          >
                            <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoverItem(item.id)}
                        disabled={atualizando === item.id}
                        className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <Card className="border-neutral-200 dark:border-neutral-800 sticky top-4">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                    <span>Subtotal ({totalItens} {totalItens === 1 ? 'item' : 'itens'})</span>
                    <span>{formatarPreco(calcularTotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                    <span>Frete</span>
                    <span className="text-green-600 dark:text-green-400">Grátis</span>
                  </div>
                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-50">Total</span>
                      <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                        {formatarPreco(calcularTotal())}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    // Verifica se está logado antes de ir para checkout
                    if (!estaLogado) {
                      setAcaoPendente(() => () => navigate('/checkout'))
                      setDialogLoginAberto(true)
                      return
                    }
                    navigate('/checkout')
                  }}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Ir para Pagamento
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
        </div>
      )}
      </CabecalhoRodapeLoja>
    </>
  )
}

