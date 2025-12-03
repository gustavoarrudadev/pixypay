import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Package, ShoppingCart, Store, AlertCircle, Loader2, Heart, LogOut, Settings, User, LayoutDashboard, UserPlus } from 'lucide-react'
import { PixIcon } from '@/components/icons/PixIcon'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buscarRevendaPorLink, buscarRevendaDesativada, listarProdutosPublicos, buscarUnidadePorLink } from '@/lib/lojaPublica'
import { verificarLojaFavorita, toggleLojaFavorita } from '@/lib/favoritosLojas'
import { obterSessao, fazerLogout } from '@/lib/auth'
import { obterRoleDeUsuario } from '@/lib/roles'
import { adicionarAoCarrinho, listarCarrinho, type ItemCarrinho } from '@/lib/gerenciarCarrinho'
import type { Produto } from '@/lib/gerenciarProduto'
import { formatarPreco, cn, calcularValorParcelado } from '@/lib/utils'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { DialogRestricaoCompra } from '@/components/ui/dialog-restricao-compra'

export default function LojaPublica() {
  const { linkPublico } = useParams<{ linkPublico: string }>()
  const navigate = useNavigate()
  
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [lojaIndisponivel, setLojaIndisponivel] = useState(false)
  const [revenda, setRevenda] = useState<{ id: string; nome: string; descricao: string; logo: string | null } | null>(null)
  const [revendaDesativada, setRevendaDesativada] = useState<{ nome: string; logo: string | null } | null>(null)
  const [unidade, setUnidade] = useState<{ id: string; nome: string; descricao: string; logo: string | null; revenda_id: string } | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  
  // Estados de autenticação
  const [usuario, setUsuario] = useState<SupabaseUser | null>(null)
  const [estaLogado, setEstaLogado] = useState(false)
  const [roleUsuario, setRoleUsuario] = useState<'admin' | 'revenda' | 'cliente' | null>(null)
  const [nomeExibicao, setNomeExibicao] = useState<string>('')
  const [carregandoAuth, setCarregandoAuth] = useState(true)
  
  // Estados de popup de restrição
  const [dialogRestricaoAberto, setDialogRestricaoAberto] = useState(false)
  const [tipoRestricao, setTipoRestricao] = useState<'revenda' | 'admin'>('revenda')
  
  // Estados de carrinho
  const [itensCarrinho, setItensCarrinho] = useState<ItemCarrinho[]>([])
  const [atualizandoProduto, setAtualizandoProduto] = useState<string | null>(null)
  
  // Estados de favorito
  const [lojaFavoritada, setLojaFavoritada] = useState(false)
  const [carregandoFavorito, setCarregandoFavorito] = useState(false)
  const [verificandoFavorito, setVerificandoFavorito] = useState(true)

  useEffect(() => {
    if (linkPublico) {
      carregarLoja()
      verificarAutenticacao()
      carregarCarrinho()
    }
  }, [linkPublico])


  useEffect(() => {
    if (estaLogado && usuario && (revenda || unidade)) {
      verificarFavorito()
    }
  }, [estaLogado, usuario, revenda, unidade])

  const verificarAutenticacao = async () => {
    try {
      const session = await obterSessao()
      
      if (session && session.user) {
        const role = obterRoleDeUsuario(session.user)
        setRoleUsuario(role)
        
        // Apenas clientes podem favoritar lojas
        if (role === 'cliente') {
          setUsuario(session.user)
          setEstaLogado(true)
          setNomeExibicao(
            session.user.user_metadata?.nome_completo || 
            session.user.email?.split('@')[0] || 
            'Cliente'
          )
        } else {
          setEstaLogado(false)
          // Armazena o usuário mesmo que não seja cliente para verificar restrições
          setUsuario(session.user)
        }
      } else {
        setEstaLogado(false)
        setRoleUsuario(null)
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      setEstaLogado(false)
      setRoleUsuario(null)
    } finally {
      setCarregandoAuth(false)
    }
  }

  const verificarFavorito = async () => {
    if (!usuario || (!revenda && !unidade)) return

    // Prioriza unidade_id se disponível, senão usa revenda_id
    const unidadeIdParaFavorito = unidade?.id || null
    const revendaIdParaFavorito = unidade?.revenda_id || revenda?.id || null

    setVerificandoFavorito(true)
    try {
      const { favoritada, error } = await verificarLojaFavorita(
        usuario.id,
        unidadeIdParaFavorito,
        revendaIdParaFavorito
      )
      
      if (error) {
        // Se a tabela não existe, apenas não mostra como favoritada
        if (error.message?.includes('relation "lojas_favoritas" does not exist')) {
          console.warn('⚠️ Tabela lojas_favoritas não existe. Execute a migration no Supabase.')
          setLojaFavoritada(false)
        } else {
          console.error('Erro ao verificar favorito:', error)
          setLojaFavoritada(false)
        }
      } else {
        setLojaFavoritada(favoritada)
      }
    } catch (error) {
      console.error('Erro inesperado ao verificar favorito:', error)
      setLojaFavoritada(false)
    } finally {
      setVerificandoFavorito(false)
    }
  }

  const handleToggleFavorito = async () => {
    if (!usuario || (!revenda && !unidade) || carregandoFavorito) {
      console.log('⚠️ Não é possível favoritar:', { usuario: !!usuario, revenda: !!revenda, unidade: !!unidade, carregandoFavorito })
      return
    }

    // Prioriza unidade_id se disponível, senão usa revenda_id
    const unidadeIdParaFavorito = unidade?.id || null
    const revendaIdParaFavorito = unidade?.revenda_id || revenda?.id || null

    setCarregandoFavorito(true)
    try {
      const { favoritada, error, mensagem } = await toggleLojaFavorita(
        usuario.id,
        unidadeIdParaFavorito,
        revendaIdParaFavorito
      )
      
      if (error) {
        console.error('❌ Erro ao alternar favorito:', error)
        
        // Mensagem específica se a tabela não existe
        if (error.message?.includes('relation "lojas_favoritas" does not exist')) {
          toast.error('Tabela de favoritos não encontrada. Execute a migration no Supabase Dashboard > SQL Editor.')
        } else {
          toast.error(mensagem || 'Erro ao atualizar favorito. Verifique o console para mais detalhes.')
        }
        return
      }

      setLojaFavoritada(favoritada)
      toast.success(mensagem || (favoritada ? 'Loja adicionada aos favoritos' : 'Loja removida dos favoritos'))
    } catch (error) {
      console.error('❌ Erro inesperado ao alternar favorito:', error)
      toast.error('Erro inesperado ao atualizar favorito. Verifique o console.')
    } finally {
      setCarregandoFavorito(false)
    }
  }

  const handleLogout = async () => {
    await fazerLogout()
    setUsuario(null)
    setEstaLogado(false)
    setLojaFavoritada(false)
    navigate('/login')
  }

  const obterIniciais = (nome: string | null | undefined, email: string | null | undefined) => {
    if (nome) {
      const partes = nome.split(' ')
      if (partes.length >= 2) {
        return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
      }
      return nome.substring(0, 2).toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return 'CL'
  }

  const carregarLoja = async () => {
    if (!linkPublico) {
      setErro('Link inválido')
      setCarregando(false)
      return
    }

    setCarregando(true)
    setErro(null)
    setUnidade(null)
    setRevenda(null)

    try {
      console.log('🔍 Carregando loja para link:', linkPublico)
      
      // Primeiro tenta buscar por unidade (sistema de multirevenda)
      const resultadoUnidade = await buscarUnidadePorLink(linkPublico)

      console.log('📊 Resultado busca unidade:', resultadoUnidade)

      // Verifica se encontrou unidade (mesmo que tenha erro, se tem dados, usa)
      if (resultadoUnidade.unidade) {
        const unidadeData = resultadoUnidade.unidade
        console.log('✅ Unidade encontrada:', unidadeData.id, unidadeData.nome)
        
        // Encontrou unidade - usa dados da unidade
        setUnidade({
          id: unidadeData.id,
          nome: unidadeData.nome_publico || unidadeData.nome,
          descricao: unidadeData.descricao_loja || '',
          logo: unidadeData.logo_url,
          revenda_id: unidadeData.revenda_id,
        })

        // Carrega produtos da unidade
        console.log('🔍 Carregando produtos para unidade:', unidadeData.id, 'revenda:', unidadeData.revenda_id)
        const { produtos: produtosData, error: produtosError } = await listarProdutosPublicos(
          unidadeData.revenda_id,
          unidadeData.id
        )

        console.log('📦 Produtos carregados:', { produtos: produtosData, error: produtosError, count: produtosData?.length })

        if (produtosError) {
          console.error('❌ Erro ao carregar produtos da unidade:', produtosError)
          setErro('Erro ao carregar produtos')
        } else {
          setProdutos(produtosData || [])
        }

        setCarregando(false)
        return
      }

      console.log('⚠️ Unidade não encontrada para link:', linkPublico)

      // Links públicos de revendas foram desativados - apenas unidades têm links públicos agora
      // Se não encontrou unidade, mostra erro informando que o link não existe mais
      console.warn('🚫 Link de revenda antigo detectado. Links de revendas foram desativados. Use o link da unidade específica.')
      
      setErro('Loja não encontrada')
      setCarregando(false)
      return
    } catch (error) {
      console.error('❌ Erro ao carregar loja:', error)
      setErro('Erro ao carregar loja')
    } finally {
      setCarregando(false)
    }
  }

  const carregarCarrinho = async () => {
    try {
      const { itens, error } = await listarCarrinho()
      if (!error && itens) {
        setItensCarrinho(itens)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar carrinho:', error)
    }
  }

  const handleComprar = async (produto: Produto, quantidade: number = 1) => {
    // Verifica se o usuário está logado como revenda ou admin
    if (roleUsuario === 'revenda') {
      setTipoRestricao('revenda')
      setDialogRestricaoAberto(true)
      return
    }

    if (roleUsuario === 'admin') {
      setTipoRestricao('admin')
      setDialogRestricaoAberto(true)
      return
    }

    // Se não está logado ou é cliente, pode comprar normalmente
    setAtualizandoProduto(produto.id)
    try {
      const { item, error } = await adicionarAoCarrinho({
        produto_id: produto.id,
        quantidade: quantidade,
      })

      if (error) {
        toast.error('Erro ao adicionar produto ao carrinho')
        return
      }

      // Atualiza o carrinho após adicionar
      await carregarCarrinho()
      toast.success('Produto adicionado ao carrinho!')
    } catch (error) {
      console.error('❌ Erro ao adicionar ao carrinho:', error)
      toast.error('Erro ao adicionar produto ao carrinho')
    } finally {
      setAtualizandoProduto(null)
    }
  }


  const handleDeslogarEIrParaRegistro = async () => {
    setDialogRestricaoAberto(false)
    // Salva a URL atual para redirecionar após registro/login
    localStorage.setItem('redirectAfterAuth', window.location.pathname + window.location.search)
    // Desloga o usuário
    await fazerLogout()
    setUsuario(null)
    setEstaLogado(false)
    setRoleUsuario(null)
    setLojaFavoritada(false)
    // Redireciona para registro/login
    navigate('/registro')
  }

  const handleVoltarDashboard = () => {
    setDialogRestricaoAberto(false)
    if (roleUsuario === 'admin') {
      navigate('/admin')
    } else if (roleUsuario === 'revenda') {
      navigate('/revenda')
    }
  }

  if (carregando || carregandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-600 dark:text-violet-400 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">Carregando loja...</p>
        </div>
      </div>
    )
  }

  // Página de loja indisponível
  if (lojaIndisponivel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 px-4">
        <Card className="max-w-md w-full border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-8 text-center space-y-6">
            {/* Logo da loja ou logo PixyPay */}
            <div className="flex justify-center">
              {revendaDesativada?.logo ? (
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 flex items-center justify-center">
                  <img
                    src={revendaDesativada.logo}
                    alt={revendaDesativada.nome}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <Logo variant="full" width={180} height={60} />
              )}
            </div>
            
            {/* Nome da loja */}
            {revendaDesativada?.nome && (
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                  {revendaDesativada.nome}
                </h1>
              </div>
            )}
            
            {/* Mensagem de indisponível */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Loja Indisponível no Momento
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Esta loja está temporariamente indisponível. Tente novamente mais tarde.
              </p>
            </div>
            
            <Button
              onClick={() => navigate('/')}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Verifica se há erro E não encontrou nem unidade nem revenda
  if (erro && !unidade && !revenda) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 px-4">
        <Card className="max-w-md w-full border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
              Loja não encontrada
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {erro || 'A loja que você está procurando não existe ou foi removida.'}
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <DialogRestricaoCompra
        aberto={dialogRestricaoAberto}
        onClose={() => setDialogRestricaoAberto(false)}
        tipo={tipoRestricao}
        onDeslogarEIrParaRegistro={handleDeslogarEIrParaRegistro}
        onVoltarDashboard={handleVoltarDashboard}
      />
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
        {/* Header Público */}
        <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm h-16 sm:h-20 lg:h-16">
          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="flex items-center justify-between gap-2 sm:gap-2.5 lg:gap-3 w-full">
            <div className="flex items-center gap-2 sm:gap-2 lg:gap-2.5 flex-1 min-w-0">
              {(unidade?.logo || revenda?.logo) && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-9 lg:h-9 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                  <img
                    src={unidade?.logo || revenda?.logo}
                    alt={unidade?.nome || revenda?.nome}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-sm sm:text-base lg:text-base font-bold text-neutral-900 dark:text-neutral-50 truncate">
                  {unidade?.nome || revenda?.nome}
                </h1>
              </div>
            </div>
            
            {/* Área de Autenticação e Favoritos */}
            <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
              {estaLogado && usuario ? (
                <>
                  {/* Botão Voltar para Painel */}
                  <Button
                    variant="outline"
                    onClick={() => navigate('/cliente')}
                    className="border-neutral-300 dark:border-neutral-700 hidden sm:flex h-10 text-sm px-3"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Voltar para Painel
                  </Button>

                  {/* Botão de Favoritar */}
                  <Button
                    variant={lojaFavoritada ? "default" : "outline"}
                    size="icon"
                    onClick={handleToggleFavorito}
                    disabled={carregandoFavorito || verificandoFavorito}
                    className={cn(
                      lojaFavoritada 
                        ? "bg-violet-600 hover:bg-violet-700 text-white" 
                        : "border-neutral-300 dark:border-neutral-700",
                      "h-12 w-12 sm:h-10 sm:w-10 lg:h-10 lg:w-10 flex-shrink-0"
                    )}
                    title={lojaFavoritada ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  >
                    {carregandoFavorito ? (
                      <Loader2 className="w-6 h-6 sm:w-5 sm:h-5 lg:w-5 lg:h-5 animate-spin" />
                    ) : (
                      <Heart className={`w-6 h-6 sm:w-5 sm:h-5 lg:w-5 lg:h-5 ${lojaFavoritada ? 'fill-current' : ''}`} />
                    )}
                  </Button>

                  {/* Botão de Carrinho com Badge - Sempre presente */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate('/carrinho')}
                    className="relative border-neutral-300 dark:border-neutral-700 h-12 w-12 sm:h-10 sm:w-10 lg:h-10 lg:w-10 flex-shrink-0"
                    title="Ver carrinho"
                  >
                    <ShoppingCart className="w-6 h-6 sm:w-5 sm:h-5 lg:w-5 lg:h-5" />
                    {itensCarrinho.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {itensCarrinho.reduce((total, item) => total + item.quantidade, 0)}
                      </span>
                    )}
                  </Button>

                  {/* Avatar com Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-violet-500/20">
                          {obterIniciais(nomeExibicao, usuario.email)}
                        </div>
                        <div className="text-left hidden xl:block">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {nomeExibicao}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[200px]">
                            {usuario.email}
                          </p>
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {nomeExibicao}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {usuario.email}
                        </p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => navigate('/cliente')} 
                        className="cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Voltar para Painel
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/cliente/conta')} 
                        className="cursor-pointer"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Minha Conta
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleLogout} 
                        className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button
                  variant="default"
                  onClick={() => {
                    // Salva a URL atual para redirecionar após registro/login
                    localStorage.setItem('redirectAfterAuth', window.location.pathname + window.location.search)
                    navigate('/registro')
                  }}
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10 flex-shrink-0"
                >
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Criar Conta</span>
                  <span className="sm:hidden">Conta</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 loja-mobile">
        {produtos.length === 0 ? (
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardContent className="p-8 sm:p-12 text-center">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                Nenhum produto disponível
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                Esta loja ainda não possui produtos cadastrados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                Nossos Produtos
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                Confira nossa seleção de produtos disponíveis
              </p>
            </div>

            {/* Grid de Produtos - 2 colunas mobile, 4 colunas desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {produtos.map((produto) => {
                const valorParcelado = calcularValorParcelado(produto.preco, produto.max_parcelas)
                return (
                  <Card
                    key={produto.id}
                    className="group hover:shadow-xl transition-all duration-300 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col overflow-hidden"
                  >
                    <div 
                      className="relative aspect-square w-full overflow-hidden bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer"
                      onClick={() => {
                        if (produto.link_publico && linkPublico) {
                          navigate(`/loja/${linkPublico}/produto/${produto.link_publico}`)
                        }
                      }}
                    >
                      {produto.imagem_url ? (
                        <img
                          src={produto.imagem_url}
                          alt={produto.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16 text-neutral-300 dark:text-neutral-600" />
                        </div>
                      )}
                      {/* Overlay sutil no hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                    </div>

                    <CardContent 
                      className="p-4 flex-1 flex flex-col cursor-pointer"
                      onClick={() => {
                        if (produto.link_publico && linkPublico) {
                          navigate(`/loja/${linkPublico}/produto/${produto.link_publico}`)
                        }
                      }}
                    >
                      <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-50 mb-1 line-clamp-2">
                        {produto.nome}
                      </h3>
                      {produto.descricao && (
                        <>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-1 flex-1 truncate">
                            {produto.descricao}
                          </p>
                          <div className="border-t border-dashed border-neutral-300 dark:border-neutral-700 mb-3"></div>
                        </>
                      )}
                      <div className="mt-auto pt-2 space-y-1">
                        {/* Formato parcelado melhorado */}
                        <div className="space-y-0.5">
                          <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-wide">
                            {valorParcelado.emAte}
                          </div>
                          <div className="text-lg font-bold text-violet-600 dark:text-violet-400 leading-tight">
                            {valorParcelado.parcelasTexto}
                          </div>
                          <div className="text-sm font-bold text-violet-600 dark:text-violet-400">
                            {valorParcelado.pixParcelado}
                          </div>
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-500 pt-1">
                          Total de {valorParcelado.textoVista}
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        onClick={async () => {
                          // Verifica restrições de compra
                          if (roleUsuario === 'revenda') {
                            setTipoRestricao('revenda')
                            setDialogRestricaoAberto(true)
                            return
                          }

                          if (roleUsuario === 'admin') {
                            setTipoRestricao('admin')
                            setDialogRestricaoAberto(true)
                            return
                          }

                          if (!estaLogado) {
                            localStorage.setItem('redirectAfterAuth', '/checkout')
                            navigate('/login')
                            return
                          }

                          if (atualizandoProduto === produto.id) return
                          setAtualizandoProduto(produto.id)
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
                            setAtualizandoProduto(null)
                          }
                        }}
                        disabled={atualizandoProduto === produto.id}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 h-10 text-sm font-medium"
                      >
                        {atualizandoProduto === produto.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <PixIcon size={16} className="text-white mr-2" />
                        )}
                        Parcelar no PIX
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            © 2026 - Pixy Pay | {unidade?.nome || revenda?.nome || 'Loja'}
          </p>
        </div>
      </footer>
    </div>
    </>
  )
}

