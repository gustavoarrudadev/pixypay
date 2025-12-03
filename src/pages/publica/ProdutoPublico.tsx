import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Package, ArrowLeft, Loader2, AlertCircle, Copy, Check, Share2 } from 'lucide-react'
import { PixIcon } from '@/components/icons/PixIcon'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CabecalhoRodapeLoja } from '@/components/loja/CabecalhoRodapeLoja'
import { buscarProdutoPublico, gerarUrlProdutoPublico } from '@/lib/lojaPublica'
import { buscarRevendaPorLink } from '@/lib/lojaPublica'
import { adicionarAoCarrinho, listarCarrinho, type ItemCarrinho } from '@/lib/gerenciarCarrinho'
import type { Produto } from '@/lib/gerenciarProduto'
import { formatarPreco, calcularValorParcelado } from '@/lib/utils'
import { obterSessao } from '@/lib/auth'
import { obterRoleDeUsuario } from '@/lib/roles'
import { toast } from 'sonner'
import { DialogRestricaoCompra } from '@/components/ui/dialog-restricao-compra'

export default function ProdutoPublico() {
  const { linkPublico, linkProduto } = useParams<{ linkPublico: string; linkProduto: string }>()
  const navigate = useNavigate()
  
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [produto, setProduto] = useState<Produto | null>(null)
  const [revendaNome, setRevendaNome] = useState<string>('')
  const [revendaId, setRevendaId] = useState<string | null>(null)
  const [unidadeId, setUnidadeId] = useState<string | null>(null)
  const [atualizandoCarrinho, setAtualizandoCarrinho] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  
  // Estados de autenticação
  const [usuario, setUsuario] = useState<any>(null)
  const [estaLogado, setEstaLogado] = useState(false)
  const [roleUsuario, setRoleUsuario] = useState<'admin' | 'revenda' | 'cliente' | null>(null)
  const [dialogRestricaoAberto, setDialogRestricaoAberto] = useState(false)
  const [tipoRestricao, setTipoRestricao] = useState<'revenda' | 'admin'>('revenda')

  useEffect(() => {
    if (linkPublico && linkProduto) {
      carregarProduto()
      verificarAutenticacao()
      carregarCarrinho()
    }
  }, [linkPublico, linkProduto])


  const verificarAutenticacao = async () => {
    try {
      const session = await obterSessao()
      if (session?.user) {
        setUsuario(session.user)
        setEstaLogado(true)
        const role = obterRoleDeUsuario(session.user)
        setRoleUsuario(role)
      } else {
        setEstaLogado(false)
        setRoleUsuario(null)
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      setEstaLogado(false)
    }
  }

  const carregarCarrinho = async () => {
    try {
      const { itens, error } = await listarCarrinho()
      // Carrinho carregado, mas não precisamos mais atualizar quantidade
    } catch (error) {
      console.error('❌ Erro ao carregar carrinho:', error)
    }
  }

  const carregarProduto = async () => {
    if (!linkPublico || !linkProduto) {
      setErro('Link inválido')
      setCarregando(false)
      return
    }

    setCarregando(true)
    setErro(null)

    try {
      const { produto: produtoData, revenda, error } = await buscarProdutoPublico(linkPublico, linkProduto)

      if (error || !produtoData) {
        setErro('Produto não encontrado')
        setCarregando(false)
        return
      }

      setProduto(produtoData)
      setRevendaId(produtoData.revenda_id)
      setUnidadeId(produtoData.unidade_id || null)
      setRevendaNome(revenda?.nome_publico || revenda?.nome_revenda || 'Loja')

      // Busca dados completos da revenda para nome
      const { revenda: revendaCompleta } = await buscarRevendaPorLink(linkPublico)
      if (revendaCompleta) {
        setRevendaNome(revendaCompleta.nome_publico || revendaCompleta.nome_revenda)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar produto:', error)
      setErro('Erro ao carregar produto')
    } finally {
      setCarregando(false)
    }
  }


  const handleVoltarParaLoja = () => {
    navigate(`/loja/${linkPublico}`)
  }

  const handleCopiarECompartilhar = async () => {
    if (!linkPublico || !linkProduto) {
      toast.error('Link não disponível')
      return
    }

    const urlProduto = gerarUrlProdutoPublico(linkPublico, linkProduto)
    
    // Tenta usar Web Share API se disponível
    if (navigator.share) {
      try {
        await navigator.share({
          title: produto?.nome || 'Produto',
          text: `Confira este produto: ${produto?.nome}`,
          url: urlProduto,
        })
        return
      } catch (error: any) {
        // Se o usuário cancelar, não faz nada
        if (error.name === 'AbortError') {
          return
        }
        // Se der erro, continua para copiar
      }
    }
    
    // Fallback: copia para área de transferência
    try {
      await navigator.clipboard.writeText(urlProduto)
      setLinkCopiado(true)
      toast.success('Link copiado!')
      setTimeout(() => setLinkCopiado(false), 2000)
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 dark:text-violet-400 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">Carregando produto...</p>
        </div>
      </div>
    )
  }

  if (erro || !produto) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
              Produto não encontrado
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {erro || 'O produto que você está procurando não existe ou não está mais disponível.'}
            </p>
            {linkPublico && (
              <Button onClick={handleVoltarParaLoja} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para a loja
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <CabecalhoRodapeLoja revendaId={revendaId} unidadeId={unidadeId}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Botão Voltar */}
          <Button
            variant="ghost"
            onClick={handleVoltarParaLoja}
            className="mb-6 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para {revendaNome}
          </Button>

          {/* Card do Produto - Mesmo estilo da loja */}
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
            {/* Imagem do Produto */}
            <div className="aspect-square w-full overflow-hidden bg-neutral-50 dark:bg-neutral-800/50">
              {produto.imagem_url ? (
                <img
                  src={produto.imagem_url}
                  alt={produto.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-32 h-32 text-neutral-300 dark:text-neutral-600" />
                </div>
              )}
            </div>

            {/* Informações do Produto */}
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Título e Botão Copiar Link */}
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-semibold text-xl sm:text-2xl text-neutral-900 dark:text-neutral-50 flex-1">
                  {produto.nome}
                </h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopiarECompartilhar}
                  className="flex-shrink-0 border-neutral-300 dark:border-neutral-700"
                  title="Compartilhar produto"
                >
                  {linkCopiado ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </>
                  )}
                </Button>
              </div>

              {/* Descrição com Divisória */}
              {produto.descricao && (
                <>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {produto.descricao}
                  </p>
                  <div className="border-t border-dashed border-neutral-300 dark:border-neutral-700"></div>
                </>
              )}

              {/* Preço - Mesmo formato da loja */}
              <div className="space-y-1">
                {(() => {
                  const valorParcelado = calcularValorParcelado(produto.preco, produto.max_parcelas)
                  return (
                    <>
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-wide">
                          {valorParcelado.emAte}
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-violet-600 dark:text-violet-400 leading-tight">
                          {valorParcelado.parcelasTexto}
                        </div>
                        <div className="text-base sm:text-lg font-bold text-violet-600 dark:text-violet-400">
                          {valorParcelado.pixParcelado}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-500 pt-1">
                        Total de {valorParcelado.textoVista}
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Botão Parcelar no PIX */}
              <Button
                onClick={async () => {
                  // Verifica restrições de compra
                  if (roleUsuario === 'revenda') {
                    setDialogRestricaoAberto(true)
                    setTipoRestricao('revenda')
                    return
                  }

                  if (roleUsuario === 'admin') {
                    setDialogRestricaoAberto(true)
                    setTipoRestricao('admin')
                    return
                  }

                  if (!estaLogado) {
                    localStorage.setItem('redirectAfterAuth', '/checkout')
                    navigate('/login')
                    return
                  }

                  if (atualizandoCarrinho) return
                  setAtualizandoCarrinho(true)
                  try {
                    const { item, error } = await adicionarAoCarrinho({
                      produto_id: produto.id,
                      quantidade: 1,
                    })
                    if (error) {
                      toast.error('Erro ao adicionar produto ao carrinho')
                      return
                    }
                    await carregarCarrinho()
                    navigate('/checkout')
                  } catch (error) {
                    console.error('❌ Erro ao adicionar ao carrinho:', error)
                    toast.error('Erro ao adicionar produto ao carrinho')
                  } finally {
                    setAtualizandoCarrinho(false)
                  }
                }}
                disabled={atualizandoCarrinho}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 h-12 text-base font-medium"
              >
                {atualizandoCarrinho ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <PixIcon size={20} className="text-white mr-2" />
                    Parcelar no PIX
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Restrição */}
      <DialogRestricaoCompra
        aberto={dialogRestricaoAberto}
        onClose={() => setDialogRestricaoAberto(false)}
        tipo={tipoRestricao}
      />
    </CabecalhoRodapeLoja>
  )
}

