import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, LogOut, Settings, User, Loader2, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { listarCarrinho, type ItemCarrinho } from '@/lib/gerenciarCarrinho'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buscarDetalhesRevenda } from '@/lib/gerenciarRevenda'
import { buscarUnidade } from '@/lib/gerenciarUnidades'
import { verificarLojaFavorita, toggleLojaFavorita } from '@/lib/favoritosLojas'
import { obterSessao, fazerLogout } from '@/lib/auth'
import { obterRoleDeUsuario } from '@/lib/roles'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CabecalhoRodapeLojaProps {
  revendaId: string | null
  unidadeId?: string | null
  children: React.ReactNode
}

interface DadosLoja {
  id: string
  nome: string
  logo: string | null
  unidadeId?: string | null
}

export function CabecalhoRodapeLoja({ revendaId, unidadeId, children }: CabecalhoRodapeLojaProps) {
  const navigate = useNavigate()
  
  const [carregando, setCarregando] = useState(true)
  const [revenda, setRevenda] = useState<DadosLoja | null>(null)
  
  // Estados de autenticação
  const [usuario, setUsuario] = useState<SupabaseUser | null>(null)
  const [estaLogado, setEstaLogado] = useState(false)
  const [nomeExibicao, setNomeExibicao] = useState<string>('')
  const [carregandoAuth, setCarregandoAuth] = useState(true)
  
  // Estados de favorito
  const [lojaFavoritada, setLojaFavoritada] = useState(false)
  const [carregandoFavorito, setCarregandoFavorito] = useState(false)
  const [verificandoFavorito, setVerificandoFavorito] = useState(true)
  
  // Estados de carrinho
  const [itensCarrinho, setItensCarrinho] = useState<ItemCarrinho[]>([])

  useEffect(() => {
    // Sempre tenta carregar dados se tiver pelo menos unidadeId ou revendaId
    if (unidadeId || (revendaId && revendaId !== '')) {
      carregarDados()
      verificarAutenticacao()
    } else {
      // Se não tem nenhum ID válido, ainda mostra o header mas sem dados específicos
      setCarregando(false)
      setCarregandoAuth(false)
    }
  }, [revendaId, unidadeId])

  useEffect(() => {
    // Carrega carrinho quando usuário está logado
    if (estaLogado) {
      carregarCarrinho()
    } else {
      setItensCarrinho([])
    }
  }, [estaLogado])

  useEffect(() => {
    // Só verifica favorito se tiver pelo menos revendaId ou unidadeId válidos
    // Verifica se revenda.id não está vazio (não é dados padrão)
    const temRevendaIdValido = revendaId && revendaId !== ''
    const temUnidadeIdValido = unidadeId && unidadeId !== ''
    const temRevendaUnidadeIdValido = revenda?.unidadeId && revenda.unidadeId !== ''
    const temRevendaIdValidoNoObjeto = revenda?.id && revenda.id !== ''
    
    if (estaLogado && usuario && revenda && 
        (temRevendaIdValido || temUnidadeIdValido || temRevendaUnidadeIdValido || temRevendaIdValidoNoObjeto)) {
      verificarFavorito()
    }
  }, [estaLogado, usuario, revenda, unidadeId, revendaId])

  const verificarAutenticacao = async () => {
    try {
      const session = await obterSessao()
      
      if (session && session.user) {
        const role = obterRoleDeUsuario(session.user)
        
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
        }
      } else {
        setEstaLogado(false)
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      setEstaLogado(false)
    } finally {
      setCarregandoAuth(false)
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

  const verificarFavorito = async () => {
    if (!usuario || !revenda) return

    // Prioriza unidadeId se disponível, senão usa revenda.id
    const unidadeIdParaFavorito = unidadeId || revenda.unidadeId || null
    const revendaIdParaFavorito = revenda.id || null

    // Só verifica se tiver pelo menos um dos IDs válidos (não vazio)
    if (!unidadeIdParaFavorito && (!revendaIdParaFavorito || revendaIdParaFavorito === '')) {
      console.warn('⚠️ Não é possível verificar favorito: nenhum ID válido disponível', {
        unidadeId: unidadeIdParaFavorito,
        revendaId: revendaIdParaFavorito,
        revendaUnidadeId: revenda.unidadeId
      })
      setLojaFavoritada(false)
      setVerificandoFavorito(false)
      return
    }

    setVerificandoFavorito(true)
    try {
      const { favoritada, error } = await verificarLojaFavorita(
        usuario.id,
        unidadeIdParaFavorito,
        revendaIdParaFavorito
      )
      
      if (error) {
        if (error.message?.includes('relation "lojas_favoritas" does not exist')) {
          console.warn('⚠️ Tabela lojas_favoritas não existe. Execute a migration no Supabase.')
          setLojaFavoritada(false)
        } else if (error.message?.includes('unidadeId ou revendaId deve ser fornecido')) {
          // Ignora esse erro específico, já que verificamos antes
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
    if (!usuario || carregandoFavorito) {
      return
    }

    // Se não tem revenda carregada ainda, não pode favoritar
    if (!revenda) {
      toast.error('Aguarde o carregamento da loja')
      return
    }

    setCarregandoFavorito(true)
    try {
      // SEMPRE prioriza unidadeId do prop ou do estado da revenda
      // Isso garante que sempre use a unidade atual, não uma anterior
      const unidadeIdParaFavorito = unidadeId || revenda.unidadeId || null
      const revendaIdParaFavorito = revenda.id || null
      
      console.log('🔍 [CabecalhoRodapeLoja] Toggle favorito:', {
        unidadeIdParaFavorito,
        revendaIdParaFavorito,
        nomeAtual: revenda.nome,
      })
      
      const { favoritada, error, mensagem } = await toggleLojaFavorita(
        usuario.id,
        unidadeIdParaFavorito,
        revendaIdParaFavorito
      )
      
      if (error) {
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

  const carregarDados = async () => {
    setCarregando(true)
    try {
      // SEMPRE prioriza unidadeId se fornecido
      if (unidadeId) {
        console.log('🔍 [CabecalhoRodapeLoja] Buscando dados da unidade:', unidadeId)
        const { unidade, error: unidadeError } = await buscarUnidade(unidadeId)
        
        if (!unidadeError && unidade) {
          // Usa dados da unidade
          const nomeExibicao = unidade.nome_publico || unidade.nome
          console.log('✅ [CabecalhoRodapeLoja] Dados da unidade carregados:', nomeExibicao)
          setRevenda({
            id: unidade.revenda_id, // Mantém revenda_id para compatibilidade
            nome: nomeExibicao,
            logo: unidade.logo_url,
            unidadeId: unidade.id, // Armazena unidade_id para favoritos
          })
          setCarregando(false)
          return
        } else {
          console.warn('⚠️ [CabecalhoRodapeLoja] Erro ao buscar unidade ou unidade não encontrada:', unidadeError)
          // Se não encontrou unidade mas tem revendaId, continua para buscar dados da revenda como fallback
          if (!revendaId) {
            setCarregando(false)
            return
          }
        }
      }

      // Se não tem unidadeId ou não encontrou unidade, busca dados da revenda
      if (!revendaId) {
        console.warn('⚠️ [CabecalhoRodapeLoja] revendaId não fornecido')
        setCarregando(false)
        return
      }

      console.log('🔍 [CabecalhoRodapeLoja] Buscando dados da revenda:', revendaId)
      const { revenda: revendaData, error: revendaError } = await buscarDetalhesRevenda(revendaId)

      if (revendaError || !revendaData) {
        console.error('❌ Erro ao carregar revenda:', revendaError)
        
        // Se for erro 406 ou similar, tenta buscar apenas dados básicos diretamente
        if ((revendaError as any)?.status === 406 || (revendaError as any)?.code === 'PGRST116') {
          console.warn('⚠️ Erro 406 ao buscar revenda, tentando busca mínima...')
          try {
            const { data: revendaMinima } = await supabase
              .from('revendas')
              .select('id, nome_revenda, nome_publico, descricao_loja, logo_url')
              .eq('id', revendaId)
              .maybeSingle()
            
            if (revendaMinima) {
              const nomeExibicao = revendaMinima.nome_publico || revendaMinima.nome_revenda
              setRevenda({
                id: revendaMinima.id,
                nome: nomeExibicao,
                logo: revendaMinima.logo_url,
              })
              setCarregando(false)
              return
            }
          } catch (erroMinimo) {
            console.error('❌ Erro na busca mínima:', erroMinimo)
          }
        }
        
        // Mesmo com erro, tenta definir dados mínimos para exibir o header
        setRevenda({
          id: revendaId,
          nome: 'Loja',
          logo: null,
        })
        setCarregando(false)
        return
      }

      const nomeExibicao = revendaData.nome_publico || revendaData.nome_revenda
      setRevenda({
        id: revendaData.id,
        nome: nomeExibicao,
        logo: revendaData.logo_url,
      })
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar dados:', error)
      // Em caso de erro, define dados mínimos para exibir o header
      if (revendaId) {
        setRevenda({
          id: revendaId,
          nome: 'Loja',
          logo: null,
        })
      }
    } finally {
      setCarregando(false)
    }
  }

  if (carregando || carregandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-600 dark:text-violet-400 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">Carregando...</p>
        </div>
      </div>
    )
  }

  // Garante que sempre há dados para exibir no header
  const dadosHeader = revenda || {
    id: '',
    nome: 'Loja',
    logo: null,
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      {/* Header Público */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm h-16 sm:h-20 lg:h-16">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="flex items-center justify-between gap-2 sm:gap-2.5 lg:gap-3 w-full">
              <div className="flex items-center gap-2 sm:gap-2 lg:gap-2.5 flex-1 min-w-0">
                {dadosHeader.logo && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-9 lg:h-9 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                    <img
                      src={dadosHeader.logo}
                      alt={dadosHeader.nome}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm sm:text-base lg:text-base font-bold text-neutral-900 dark:text-neutral-50 truncate">
                    {dadosHeader.nome}
                  </h1>
                </div>
              </div>
              
              {/* Área de Autenticação e Favoritos */}
              <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                {estaLogado && usuario ? (
                  <>
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
                          <User className="w-4 h-4 mr-2" />
                          Meu Perfil
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
                    variant="outline"
                    onClick={() => navigate('/login')}
                    className="border-neutral-300 dark:border-neutral-700"
                  >
                    Entrar
                  </Button>
                )}
              </div>
            </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            © 2026 - Pixy Pay {dadosHeader.nome && dadosHeader.nome !== 'Loja' && `| ${dadosHeader.nome}`}
          </p>
        </div>
      </footer>
    </div>
  )
}

