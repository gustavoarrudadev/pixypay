import { useState, useEffect } from 'react'
import { Heart, Store, ExternalLink, Trash2, AlertCircle, Loader2, LayoutGrid, List } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DialogoConfirmacao } from '@/components/ui/DialogoConfirmacao'
import { listarLojasFavoritas, removerLojaFavorita, type LojaFavorita } from '@/lib/favoritosLojas'
import { gerarUrlLojaPublica } from '@/lib/lojaPublica'
import { obterSessao } from '@/lib/auth'
import { toast } from 'sonner'

/**
 * Página de Meus Favoritos - Cliente
 * 
 * Gerencia as lojas favoritas do cliente.
 */
export default function MeusFavoritos() {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [lojas, setLojas] = useState<LojaFavorita[]>([])
  const [removendoId, setRemovendoId] = useState<string | null>(null)
  const [confirmarRemocaoAberto, setConfirmarRemocaoAberto] = useState(false)
  const [lojaParaRemover, setLojaParaRemover] = useState<LojaFavorita | null>(null)
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid')

  useEffect(() => {
    carregarFavoritos()
  }, [])

  const carregarFavoritos = async () => {
    setCarregando(true)
    setErro(null)

    try {
      const session = await obterSessao()
      if (!session || !session.user) {
        setErro('Você precisa estar logado para ver seus favoritos.')
        setCarregando(false)
        return
      }

      // Obtém o clienteUserId considerando modo impersonation
      const { obterClienteUserId } = await import('@/lib/impersonation')
      const clienteUserId = await obterClienteUserId()
      const clienteIdParaBuscar = clienteUserId || session.user.id
      
      const { lojas: lojasData, error } = await listarLojasFavoritas(clienteIdParaBuscar)

      if (error) {
        console.error('❌ Erro ao carregar favoritos:', error)
        console.error('❌ Detalhes do erro:', {
          message: error.message,
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
        })
        
        // Mensagem específica se a tabela não existe
        if (error.message?.includes('relation "lojas_favoritas" does not exist') || 
            (error as any).code === '42P01') {
          setErro('Tabela de favoritos não encontrada. Execute a migration no Supabase Dashboard > SQL Editor. Veja o arquivo: supabase/migrations/017_create_lojas_favoritas_table.sql')
        } else {
          setErro(`Erro ao carregar favoritos: ${error.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`)
        }
        return
      }

      setLojas(lojasData || [])
    } catch (error) {
      console.error('Erro inesperado ao carregar favoritos:', error)
      setErro('Erro inesperado ao carregar favoritos.')
    } finally {
      setCarregando(false)
    }
  }

  const handleRemoverFavorito = (loja: LojaFavorita) => {
    setLojaParaRemover(loja)
    setConfirmarRemocaoAberto(true)
  }

  const confirmarRemocao = async () => {
    if (!lojaParaRemover) return

    setRemovendoId(lojaParaRemover.id)
    setConfirmarRemocaoAberto(false)

    try {
      const session = await obterSessao()
      if (!session || !session.user) {
        toast.error('Você precisa estar logado.')
        return
      }

      // Obtém o clienteUserId considerando modo impersonation
      const { obterClienteUserId } = await import('@/lib/impersonation')
      const clienteUserId = await obterClienteUserId()
      const clienteIdParaBuscar = clienteUserId || session.user.id
      
      // Prioriza unidade_id se disponível, senão usa revenda_id
      const unidadeIdParaRemover = lojaParaRemover.unidade_id || null
      const revendaIdParaRemover = lojaParaRemover.revenda_id || null
      
      const { error } = await removerLojaFavorita(
        clienteIdParaBuscar,
        unidadeIdParaRemover,
        revendaIdParaRemover
      )

      if (error) {
        toast.error('Erro ao remover dos favoritos.')
        return
      }

      toast.success('Loja removida dos favoritos.')
      await carregarFavoritos()
    } catch (error) {
      console.error('Erro ao remover favorito:', error)
      toast.error('Erro ao remover dos favoritos.')
    } finally {
      setRemovendoId(null)
      setLojaParaRemover(null)
    }
  }

  const handleVisitarLoja = (linkPublico: string | null) => {
    if (!linkPublico) {
      toast.error('Link da loja não disponível.')
      return
    }

    const url = gerarUrlLojaPublica(linkPublico)
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-violet-600 dark:text-violet-400" />
            Meus Favoritos
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Gerencie suas lojas favoritas
          </p>
        </div>
        {lojas.length > 0 && (
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
        )}
      </div>

      {carregando ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin" />
            </div>
          </CardContent>
        </Card>
      ) : erro ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-neutral-600 dark:text-neutral-400">{erro}</p>
            </div>
          </CardContent>
        </Card>
      ) : lojas.length === 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <CardTitle>Meus Favoritos</CardTitle>
            </div>
            <CardDescription>
              Você ainda não possui lojas favoritas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-muted-foreground">
                  Explore lojas e adicione suas favoritas para acesso rápido
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : visualizacao === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {lojas.map((loja) => {
            // Prioriza dados da unidade se disponível, senão usa dados da revenda
            const unidade = loja.unidade
            const revenda = loja.revenda
            
            if (!unidade && !revenda) return null

            const nomeExibicao = unidade?.nome_publico || unidade?.nome || revenda?.nome_publico || revenda?.nome_revenda || 'Loja'
            const descricaoExibicao = unidade?.descricao_loja || revenda?.descricao_loja || null
            const logoUrl = unidade?.logo_url || revenda?.logo_url || null
            const linkPublico = unidade?.link_publico || revenda?.link_publico || null
            const estaRemovendo = removendoId === loja.id

            return (
              <Card
                key={loja.id}
                className="group hover:shadow-xl transition-all duration-300 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {logoUrl ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                          <img
                            src={logoUrl}
                            alt={nomeExibicao}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                          <Store className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-2">
                          {nomeExibicao}
                        </CardTitle>
                        {descricaoExibicao && (
                          <CardDescription className="line-clamp-2 mt-1">
                            {descricaoExibicao}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleVisitarLoja(linkPublico)}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                      disabled={!linkPublico}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visitar Loja
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRemoverFavorito(loja)}
                      disabled={estaRemovendo}
                      className="w-full border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {estaRemovendo ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Remover dos Favoritos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {lojas.map((loja) => {
            // Prioriza dados da unidade se disponível, senão usa dados da revenda
            const unidade = loja.unidade
            const revenda = loja.revenda
            
            if (!unidade && !revenda) return null

            const nomeExibicao = unidade?.nome_publico || unidade?.nome || revenda?.nome_publico || revenda?.nome_revenda || 'Loja'
            const descricaoExibicao = unidade?.descricao_loja || revenda?.descricao_loja || null
            const logoUrl = unidade?.logo_url || revenda?.logo_url || null
            const linkPublico = unidade?.link_publico || revenda?.link_publico || null
            const estaRemovendo = removendoId === loja.id

            return (
              <Card
                key={loja.id}
                className="group hover:shadow-xl transition-all duration-300 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {logoUrl ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                        <img
                          src={logoUrl}
                          alt={nomeExibicao}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                        <Store className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl mb-1">
                        {nomeExibicao}
                      </CardTitle>
                      {descricaoExibicao && (
                        <CardDescription className="mb-4">
                          {descricaoExibicao}
                        </CardDescription>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleVisitarLoja(linkPublico)}
                          className="bg-violet-600 hover:bg-violet-700 text-white"
                          disabled={!linkPublico}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Visitar Loja
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRemoverFavorito(loja)}
                          disabled={estaRemovendo}
                          className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {estaRemovendo ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          Remover dos Favoritos
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de Confirmação */}
      <DialogoConfirmacao
        aberto={confirmarRemocaoAberto}
        onOpenChange={setConfirmarRemocaoAberto}
        titulo="Remover dos Favoritos"
        descricao={`Tem certeza que deseja remover "${lojaParaRemover?.unidade?.nome_publico || lojaParaRemover?.unidade?.nome || lojaParaRemover?.revenda?.nome_publico || lojaParaRemover?.revenda?.nome_revenda || 'esta loja'}" dos seus favoritos?`}
        textoConfirmar="Remover"
        textoCancelar="Cancelar"
        varianteConfirmar="destructive"
        onConfirmar={confirmarRemocao}
      />
    </div>
  )
}
