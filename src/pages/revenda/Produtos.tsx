import { useState, useEffect } from 'react'
import { Package, Plus, Search, AlertCircle, CheckCircle2, LayoutGrid, List, Edit, Trash2, Store, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DialogoConfirmacao } from '@/components/ui/DialogoConfirmacao'
import { CardProduto } from '@/components/revendas/CardProduto'
import { FormProduto } from '@/components/revendas/FormProduto'
import { listarProdutos, criarProduto, atualizarProduto, deletarProduto, toggleAtivoProduto, type Produto, type DadosProduto } from '@/lib/gerenciarProduto'
import { supabase } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'
import { obterRevendaId, obterUnidadeIdColaborador } from '@/lib/impersonation'
import { formatarPreco } from '@/lib/utils'
import { FormularioUnidade } from '@/components/revendas/FormularioUnidade'
import { buscarUnidade, listarUnidades, contarProdutosUnidade, type UnidadeRevenda } from '@/lib/gerenciarUnidades'
import { Badge } from '@/components/ui/badge'

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  
  // Estado de unidade selecionada
  const [unidadeSelecionadaId, setUnidadeSelecionadaId] = useState<string | null>(null)
  const [sheetCriarUnidadeAberto, setSheetCriarUnidadeAberto] = useState(false)
  const [unidades, setUnidades] = useState<UnidadeRevenda[]>([])
  const [carregandoUnidades, setCarregandoUnidades] = useState(true)
  const [produtosPorUnidade, setProdutosPorUnidade] = useState<Record<string, number>>({})
  
  // Estados do Sheet de Produto
  const [sheetAberto, setSheetAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
  const [salvando, setSalvando] = useState(false)
  
  // Estados de confirmação
  const [confirmarExclusaoAberto, setConfirmarExclusaoAberto] = useState(false)
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  
  // Estado da revenda
  const [revendaId, setRevendaId] = useState<string | null>(null)
  const [linkPublicoUnidade, setLinkPublicoUnidade] = useState<string | null>(null)

  useEffect(() => {
    carregarRevendaId()
  }, [])

  useEffect(() => {
    if (revendaId) {
      carregarUnidades()
    }
  }, [revendaId])

  useEffect(() => {
    if (revendaId) {
      carregarProdutos()
    }
  }, [revendaId, unidadeSelecionadaId])

  const carregarRevendaId = async () => {
    try {
      // Usa função helper que considera modo impersonation
      const revendaIdAtual = await obterRevendaId()
      
      if (revendaIdAtual) {
        setRevendaId(revendaIdAtual)
      } else {
        setErro('Erro ao carregar dados da revenda.')
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error)
      setErro('Erro ao carregar dados.')
    }
  }

  const carregarUnidades = async (selecionarUltima?: boolean) => {
    if (!revendaId) return

    setCarregandoUnidades(true)
    try {
      const { unidades: unidadesData, error } = await listarUnidades(revendaId)
      if (error) {
        console.error('❌ Erro ao carregar unidades:', error)
        return
      }

      // Se for colaborador com unidade específica, filtrar apenas aquela unidade
      const unidadeIdColaborador = await obterUnidadeIdColaborador()
      let unidadesFiltradas = unidadesData || []
      
      if (unidadeIdColaborador !== undefined && unidadeIdColaborador !== null) {
        // Colaborador tem acesso apenas a uma unidade específica
        unidadesFiltradas = unidadesFiltradas.filter(u => u.id === unidadeIdColaborador)
        // Seleciona automaticamente a unidade do colaborador
        if (unidadesFiltradas.length > 0) {
          setUnidadeSelecionadaId(unidadesFiltradas[0].id)
        }
      }

      setUnidades(unidadesFiltradas)

      // Carrega contagem de produtos por unidade (apenas das unidades filtradas)
      const produtosCount: Record<string, number> = {}
      for (const unidade of unidadesFiltradas) {
        const { total } = await contarProdutosUnidade(unidade.id)
        produtosCount[unidade.id] = total
      }
      setProdutosPorUnidade(produtosCount)

      // Seleciona unidade (apenas das unidades filtradas)
      if (selecionarUltima && unidadesFiltradas.length > 0) {
        // Seleciona a última unidade (mais recente)
        setUnidadeSelecionadaId(unidadesFiltradas[unidadesFiltradas.length - 1].id)
      } else if (!unidadeSelecionadaId && unidadesFiltradas.length > 0) {
        // Se não houver unidade selecionada e há unidades disponíveis, seleciona a primeira
        setUnidadeSelecionadaId(unidadesFiltradas[0].id)
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar unidades:', error)
    } finally {
      setCarregandoUnidades(false)
    }
  }

  const handleCriarUnidade = async () => {
    await carregarUnidades(true) // Seleciona a última unidade (nova criada)
  }

  // Carrega link público da unidade selecionada
  useEffect(() => {
    const carregarLinkPublicoUnidade = async () => {
      if (!unidadeSelecionadaId) {
        setLinkPublicoUnidade(null)
        return
      }

      try {
        const { unidade, error } = await buscarUnidade(unidadeSelecionadaId)
        
        if (error || !unidade) {
          console.warn('⚠️ Link público da unidade não encontrado:', error)
          setLinkPublicoUnidade(null)
          return
        }

        if (unidade.link_publico && unidade.link_publico_ativo) {
          setLinkPublicoUnidade(unidade.link_publico)
          console.log('✅ Link público da unidade carregado:', unidade.link_publico)
        } else {
          setLinkPublicoUnidade(null)
          console.log('⚠️ Unidade não tem link público ou está inativa')
        }
      } catch (error) {
        console.error('❌ Erro ao carregar link público da unidade:', error)
        setLinkPublicoUnidade(null)
      }
    }

    carregarLinkPublicoUnidade()
  }, [unidadeSelecionadaId])

  const carregarProdutos = async () => {
    if (!revendaId) return

    // Se não houver unidade selecionada, não carrega produtos
    if (!unidadeSelecionadaId) {
      setProdutos([])
      setCarregando(false)
      return
    }

    setCarregando(true)
    setErro(null)

    try {
      console.log('🔍 Carregando produtos para unidade:', unidadeSelecionadaId)
      const { produtos: produtosData, error } = await listarProdutos(revendaId, unidadeSelecionadaId)

      if (error) {
        console.error('❌ Erro ao carregar produtos:', error)
        setErro('Erro ao carregar produtos.')
        return
      }

      console.log('📦 Produtos carregados:', produtosData?.length, 'produtos')
      console.log('📦 Detalhes:', produtosData?.map(p => ({ id: p.id, nome: p.nome, unidade_id: p.unidade_id })))
      setProdutos(produtosData || [])
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar produtos:', error)
      setErro('Erro inesperado ao carregar produtos.')
    } finally {
      setCarregando(false)
    }
  }

  const handleNovoProduto = () => {
    setProdutoEditando(null)
    setSheetAberto(true)
  }

  const handleEditarProduto = (produto: Produto) => {
    setProdutoEditando(produto)
    setSheetAberto(true)
  }

  const handleSalvarProduto = async (dados: DadosProduto) => {
    if (!revendaId) return

    setSalvando(true)
    setErro(null)
    setSucesso(null)

    try {
      // Se estiver criando e não tiver unidade_id, usa a unidade selecionada
      const dadosComUnidade = {
        ...dados,
        unidade_id: dados.unidade_id || (produtoEditando ? undefined : unidadeSelecionadaId || null),
      }

      if (produtoEditando) {
        // Atualizar
        const { error } = await atualizarProduto(produtoEditando.id, dadosComUnidade)
        if (error) {
          setErro('Erro ao atualizar produto.')
          return
        }
        setSucesso('Produto atualizado com sucesso!')
      } else {
        // Criar - valida se tem unidade selecionada
        if (!unidadeSelecionadaId) {
          setErro('Selecione uma unidade para criar o produto.')
          setSalvando(false)
          return
        }
        const { error } = await criarProduto(revendaId, dadosComUnidade)
        if (error) {
          setErro('Erro ao criar produto.')
          return
        }
        setSucesso('Produto criado com sucesso!')
      }

      setSheetAberto(false)
      setProdutoEditando(null)
      await carregarProdutos()

      setTimeout(() => setSucesso(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error)
      setErro('Erro inesperado ao salvar produto.')
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluirProduto = (produtoId: string) => {
    setProdutoParaExcluir(produtoId)
    setConfirmarExclusaoAberto(true)
  }

  const confirmarExclusao = async () => {
    if (!produtoParaExcluir) return

    setExcluindo(true)
    setErro(null)

    try {
      const { error } = await deletarProduto(produtoParaExcluir)
      if (error) {
        setErro('Erro ao excluir produto.')
        return
      }

      setSucesso('Produto excluído com sucesso!')
      setConfirmarExclusaoAberto(false)
      setProdutoParaExcluir(null)
      await carregarProdutos()

      setTimeout(() => setSucesso(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao excluir produto:', error)
      setErro('Erro inesperado ao excluir produto.')
    } finally {
      setExcluindo(false)
    }
  }

  const handleToggleAtivo = async (produtoId: string, ativo: boolean) => {
    try {
      const { error } = await toggleAtivoProduto(produtoId, ativo)
      if (error) {
        setErro(`Erro ao ${ativo ? 'ativar' : 'desativar'} produto.`)
        return
      }
      await carregarProdutos()
    } catch (error) {
      console.error('❌ Erro ao alternar status:', error)
      setErro('Erro inesperado ao alterar status do produto.')
    }
  }

  // Filtrar produtos
  const produtosFiltrados = produtos.filter((produto) => {
    // Filtro de busca
    const matchBusca = busca.trim() === '' || 
      produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
      produto.descricao?.toLowerCase().includes(busca.toLowerCase())

    // Filtro de status
    const matchStatus = filtroAtivo === 'todos' ||
      (filtroAtivo === 'ativo' && produto.ativo) ||
      (filtroAtivo === 'inativo' && !produto.ativo)

    return matchBusca && matchStatus
  })

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Package className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Produtos
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Gerencie seus produtos e configure sua loja {produtos.length > 0 && `(${produtos.length} ${produtos.length === 1 ? 'produto' : 'produtos'})`}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button
            onClick={handleNovoProduto}
            disabled={!unidadeSelecionadaId}
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!unidadeSelecionadaId ? 'Selecione uma unidade para criar um produto' : ''}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Seleção de Unidade - Cards */}
      {revendaId && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Selecione uma unidade para gerenciar produtos
          </h2>
          {carregandoUnidades ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : unidades.length === 0 ? (
            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardContent className="py-12 text-center">
                <Store className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                  Nenhuma unidade cadastrada
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Crie uma unidade em "Presença na Loja" para começar a gerenciar produtos
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unidades.map((unidade) => {
                const isSelecionada = unidadeSelecionadaId === unidade.id
                return (
                  <Card
                    key={unidade.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelecionada
                        ? 'border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-600 dark:ring-violet-400'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                    onClick={() => setUnidadeSelecionadaId(unidade.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            isSelecionada
                              ? 'bg-violet-600 dark:bg-violet-400'
                              : 'bg-violet-100 dark:bg-violet-900/30'
                          }`}>
                            <Store className={`w-5 h-5 ${
                              isSelecionada
                                ? 'text-white'
                                : 'text-violet-600 dark:text-violet-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                              {unidade.nome}
                              {unidade.ativo ? (
                                <Badge variant="default" className="bg-green-500 text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Inativa
                                </Badge>
                              )}
                            </h3>
                            {unidade.nome_publico && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                {unidade.nome_publico}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm">
                        <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-1">Produtos</p>
                        <p className="font-medium flex items-center gap-1 text-neutral-900 dark:text-neutral-50">
                          <Package className="w-4 h-4" />
                          {produtosPorUnidade[unidade.id] || 0}
                        </p>
                      </div>
                      {isSelecionada && (
                        <div className="mt-3 pt-3 border-t border-violet-300 dark:border-violet-700">
                          <p className="text-xs font-medium text-violet-700 dark:text-violet-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Unidade selecionada
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Mensagens */}
      {erro && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        </div>
      )}

      {sucesso && (
        <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-600 dark:text-green-400">{sucesso}</p>
        </div>
      )}

      {/* Filtros */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar produtos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 border-neutral-300 dark:border-neutral-700"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filtroAtivo === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroAtivo('todos')}
                className={filtroAtivo === 'todos' ? 'bg-violet-600 hover:bg-violet-700' : ''}
              >
                Todos
              </Button>
              <Button
                variant={filtroAtivo === 'ativo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroAtivo('ativo')}
                className={filtroAtivo === 'ativo' ? 'bg-violet-600 hover:bg-violet-700' : ''}
              >
                Ativos
              </Button>
              <Button
                variant={filtroAtivo === 'inativo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroAtivo('inativo')}
                className={filtroAtivo === 'inativo' ? 'bg-violet-600 hover:bg-violet-700' : ''}
              >
                Inativos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid/Lista de Produtos */}
      {!unidadeSelecionadaId ? (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Selecione uma unidade
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Escolha uma unidade acima para visualizar e gerenciar seus produtos
            </p>
          </CardContent>
        </Card>
      ) : produtosFiltrados.length === 0 ? (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              {produtos.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {produtos.length === 0
                ? 'Comece cadastrando seu primeiro produto'
                : 'Tente ajustar os filtros de busca'}
            </p>
            {produtos.length === 0 && (
              <Button
                onClick={handleNovoProduto}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Produto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : visualizacao === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {produtosFiltrados.map((produto) => (
            <CardProduto
              key={produto.id}
              produto={produto}
              linkPublicoRevenda={linkPublicoUnidade}
              onEditar={handleEditarProduto}
              onExcluir={handleExcluirProduto}
              onToggleAtivo={handleToggleAtivo}
              onProdutoAtualizado={(produtoAtualizado) => {
                setProdutos(produtos.map(p => p.id === produtoAtualizado.id ? produtoAtualizado : p))
              }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {produtosFiltrados.map((produto) => (
            <Card key={produto.id} className="border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                    {produto.imagem_url ? (
                      <img
                        src={produto.imagem_url}
                        alt={produto.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
                          {produto.nome}
                        </h3>
                        {produto.descricao && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-2">
                            {produto.descricao}
                          </p>
                        )}
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                            {formatarPreco(produto.preco)}
                          </span>
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`ativo-lista-${produto.id}`}
                              checked={produto.ativo}
                              onCheckedChange={(checked) => handleToggleAtivo(produto.id, checked)}
                            />
                            <Label
                              htmlFor={`ativo-lista-${produto.id}`}
                              className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer"
                            >
                              {produto.ativo ? 'Ativo' : 'Inativo'}
                            </Label>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditarProduto(produto)}
                          className="border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExcluirProduto(produto.id)}
                          className="border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sheet de Criar/Editar Produto */}
      <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{produtoEditando ? 'Editar Produto' : 'Novo Produto'}</SheetTitle>
            <SheetDescription>
              {produtoEditando ? 'Atualize as informações do produto' : 'Preencha os dados do novo produto'}
            </SheetDescription>
          </SheetHeader>
          {revendaId && (
            <div className="mt-6">
              <FormProduto
                produto={produtoEditando || undefined}
                revendaId={revendaId}
                produtoId={produtoEditando?.id || null}
                unidadeIdPadrao={unidadeSelecionadaId}
                onSalvar={handleSalvarProduto}
                onCancelar={() => {
                  setSheetAberto(false)
                  setProdutoEditando(null)
                }}
                salvando={salvando}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet de Criar Unidade */}
      {revendaId && (
        <Sheet open={sheetCriarUnidadeAberto} onOpenChange={setSheetCriarUnidadeAberto}>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Nova Unidade</SheetTitle>
              <SheetDescription>
                Configure uma nova unidade de loja com produtos e link público próprios
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FormularioUnidade
                unidade={null}
                revendaId={revendaId}
                onSalvar={async () => {
                  setSheetCriarUnidadeAberto(false)
                  await handleCriarUnidade() // Recarrega unidades e seleciona a nova
                }}
                onCancelar={() => setSheetCriarUnidadeAberto(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <DialogoConfirmacao
        aberto={confirmarExclusaoAberto}
        onOpenChange={setConfirmarExclusaoAberto}
        titulo="Excluir Produto"
        descricao="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
        confirmando={excluindo}
        onConfirmar={confirmarExclusao}
        onCancelar={() => {
          setConfirmarExclusaoAberto(false)
          setProdutoParaExcluir(null)
        }}
        textoConfirmar="Excluir"
        textoCancelar="Cancelar"
        varianteConfirmar="destructive"
      />
    </div>
  )
}
