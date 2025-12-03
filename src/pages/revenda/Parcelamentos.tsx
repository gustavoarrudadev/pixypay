import { useState, useEffect, useMemo } from 'react'
import { CreditCard, Calendar, CheckCircle2, AlertCircle, Copy, FileText, TrendingUp, User, Package, MoreVertical, ChevronDown, ChevronUp, QrCode, DollarSign, Mail, Phone, MapPin, CheckCircle, XCircle, Clock, Search, Store } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectMenu } from '@/components/ui/select-menu'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Dropdown } from '@/components/ui/dropdown'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { listarParcelamentosRevenda, marcarParcelaComoPaga, marcarParcelaComoVencida, reverterParcela, darBaixaCompletaParcelamento, gerarPixParaParcela, type Parcelamento, type Parcela } from '@/lib/gerenciarParcelamentos'
import { ParcelaCard } from '@/components/parcelamentos/ParcelaCard'
import { QRCode } from '@/components/revendas/QRCode'
import { formatarPreco } from '@/lib/utils'
import { obterRevendaId, obterUnidadeIdColaborador } from '@/lib/impersonation'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { listarUnidades, type UnidadeRevenda } from '@/lib/gerenciarUnidades'
import { Badge } from '@/components/ui/badge'

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  pronto: 'Pronto',
  em_transito: 'Em Trânsito',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export default function Parcelamentos() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [parcelamentos, setParcelamentos] = useState<Parcelamento[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [revendaId, setRevendaId] = useState<string | null>(null)
  
  // Estado de unidades
  const [unidades, setUnidades] = useState<UnidadeRevenda[]>([])
  const [carregandoUnidades, setCarregandoUnidades] = useState(true)
  const [unidadeSelecionadaId, setUnidadeSelecionadaId] = useState<string | null>(null)
  const [parcelamentosPorUnidade, setParcelamentosPorUnidade] = useState<Record<string, number>>({})
  const [parcelaSelecionada, setParcelaSelecionada] = useState<Parcela | null>(null)
  const [parcelamentoSelecionado, setParcelamentoSelecionado] = useState<Parcelamento | null>(null)
  const [sheetAberto, setSheetAberto] = useState(false)
  const [parcelamentosExpandidos, setParcelamentosExpandidos] = useState<Set<string>>(new Set())
  const [processandoBaixa, setProcessandoBaixa] = useState<string | null>(null)
  const [parcelaParaBaixa, setParcelaParaBaixa] = useState<Parcela | null>(null)
  const [dialogBaixaAberto, setDialogBaixaAberto] = useState(false)
  const [parcelaParaReverter, setParcelaParaReverter] = useState<Parcela | null>(null)
  const [dialogReverterAberto, setDialogReverterAberto] = useState(false)
  const [novoStatusReverter, setNovoStatusReverter] = useState<'pendente' | 'atrasada'>('pendente')
  const [parcelaParaVencida, setParcelaParaVencida] = useState<Parcela | null>(null)
  const [dialogVencidaAberto, setDialogVencidaAberto] = useState(false)
  const [mostrarPixNoSheet, setMostrarPixNoSheet] = useState(false)
  
  // Filtros avançados
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'quitado' | 'cancelado'>('todos')
  const [statusParcelaFiltro, setStatusParcelaFiltro] = useState<'todos' | 'pendente' | 'paga' | 'atrasada'>('todos')
  const [dataFiltro, setDataFiltro] = useState<'tudo' | 'hoje' | '7' | '15' | '30' | 'personalizado'>('tudo')
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('')
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('')
  const [dropdownCalendarioAberto, setDropdownCalendarioAberto] = useState(false)

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
    const loadRevendaId = async () => {
      try {
        setErro(null) // Limpa erro anterior
        const idRevenda = await obterRevendaId()
        if (!idRevenda) {
          // Verifica se o usuário está autenticado
          const { obterSessao } = await import('@/lib/auth')
          const session = await obterSessao()
          if (!session) {
            setErro('É necessário estar autenticado. Por favor, faça login novamente.')
          } else {
            // Verifica se o usuário é realmente uma revenda
            const { isRevenda } = await import('@/lib/roles')
            const ehRevenda = await isRevenda()
            if (!ehRevenda) {
              setErro('Você não tem permissão para acessar esta página. Esta área é exclusiva para revendas.')
            } else {
              setErro('Erro ao carregar dados da revenda. Verifique se sua conta está configurada corretamente.')
            }
          }
          setCarregando(false)
          setRevendaId(null)
          return
        }
        // Se encontrou revendaId, limpa qualquer erro anterior e define o ID
        setErro(null)
        setRevendaId(idRevenda)
      } catch (error) {
        console.error('❌ Erro ao carregar revendaId:', error)
        setErro('Erro ao carregar dados da revenda. Por favor, tente novamente.')
        setCarregando(false)
        setRevendaId(null)
      }
    }
    loadRevendaId()
  }, [])

  useEffect(() => {
    if (revendaId) {
      // Se encontrou revendaId, limpa erro e carrega unidades
      setErro(null)
      carregarUnidades()
    }
    // Não define erro aqui se revendaId for null, pois o erro já foi definido no useEffect anterior
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revendaId])

  useEffect(() => {
    if (revendaId) {
      carregarParcelamentos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revendaId, unidadeSelecionadaId])

  const carregarUnidades = async () => {
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

      // Carrega contagem de parcelamentos por unidade (apenas das unidades filtradas)
      const parcelamentosCount: Record<string, number> = {}
      for (const unidade of unidadesFiltradas) {
        try {
          const { parcelamentos: parcelamentosData } = await listarParcelamentosRevenda(revendaId, unidade.id)
          parcelamentosCount[unidade.id] = parcelamentosData?.length || 0
        } catch (error) {
          console.error(`❌ Erro ao contar parcelamentos da unidade ${unidade.id}:`, error)
          parcelamentosCount[unidade.id] = 0
        }
      }
      setParcelamentosPorUnidade(parcelamentosCount)

      // Seleciona primeira unidade se não houver selecionada (apenas das unidades filtradas)
      if (!unidadeSelecionadaId && unidadesFiltradas.length > 0) {
        setUnidadeSelecionadaId(unidadesFiltradas[0].id)
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar unidades:', error)
    } finally {
      setCarregandoUnidades(false)
    }
  }

  const carregarParcelamentos = async () => {
    if (!revendaId) {
      setCarregando(false)
      return
    }

    // Se não houver unidade selecionada, não carrega parcelamentos
    if (!unidadeSelecionadaId) {
      setParcelamentos([])
      setCarregando(false)
      // Não define erro aqui, pois é esperado que não haja unidade selecionada inicialmente
      return
    }

    setCarregando(true)
    try {
      const { parcelamentos: parcelamentosData, error } = await listarParcelamentosRevenda(revendaId, unidadeSelecionadaId)

      if (error) {
        // Só mostra erro se for um erro crítico (não é "não encontrado")
        // E só se não houver erro de carregamento de revendaId já definido
        if (error.message && !error.message.includes('não encontrado')) {
          // Só adiciona erro de parcelamentos se não houver erro de revendaId
          if (!erro || !erro.includes('dados da revenda')) {
            setErro(`Erro ao carregar parcelamentos: ${error.message}`)
          }
        }
        setCarregando(false)
        return
      }

      setParcelamentos(parcelamentosData || [])
      
      // Gera PIX automaticamente para parcelas pendentes que não têm
      if (parcelamentosData && parcelamentosData.length > 0) {
        const geracoesPix = []
        for (const parcelamento of parcelamentosData) {
          if (parcelamento.parcelas) {
            for (const parcela of parcelamento.parcelas) {
              if (parcela.status === 'pendente' && !parcela.pix_copia_cola) {
                const pedidoId = parcelamento.pedido_id || parcelamento.id || 'N/A'
                const pedidoIdShort = typeof pedidoId === 'string' ? pedidoId.slice(0, 8) : 'N/A'
                geracoesPix.push(
                  gerarPixParaParcela(
                    parcela.id,
                    parcela.valor,
                    `Parcela ${parcela.numero_parcela} - Pedido ${pedidoIdShort}`
                  ).catch(() => {
                    // Ignora erros silenciosamente ao gerar PIX
                  })
                )
              }
            }
          }
        }
        
        // Aguarda todas as gerações de PIX em paralelo
        await Promise.allSettled(geracoesPix)
        
        // Recarrega após gerar PIX apenas se houver gerações
        if (geracoesPix.length > 0) {
          try {
            const { parcelamentos: parcelamentosAtualizados } = await listarParcelamentosRevenda(revendaId, unidadeSelecionadaId)
            if (parcelamentosAtualizados) {
              setParcelamentos(parcelamentosAtualizados)
            }
          } catch {
            // Ignora erro ao recarregar, mantém dados já carregados
          }
        }
      }
    } catch (error) {
      // Só mostra erro se for crítico
      if (error instanceof Error && error.message) {
        setErro(`Erro ao carregar parcelamentos: ${error.message}`)
      }
    } finally {
      setCarregando(false)
    }
  }

  const copiarPix = (pixCopiaCola: string) => {
    navigator.clipboard.writeText(pixCopiaCola)
    toast.success('PIX copiado para a área de transferência!')
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatarDataCurta = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const toggleExpandir = (parcelamentoId: string) => {
    const novosExpandidos = new Set(parcelamentosExpandidos)
    if (novosExpandidos.has(parcelamentoId)) {
      novosExpandidos.delete(parcelamentoId)
    } else {
      novosExpandidos.add(parcelamentoId)
    }
    setParcelamentosExpandidos(novosExpandidos)
  }

  const abrirDetalhesParcela = (parcela: Parcela, parcelamento: Parcelamento) => {
    setParcelaSelecionada(parcela)
    setParcelamentoSelecionado(parcelamento)
    // Verifica se o PIX já está visível antes de abrir o sheet
    setMostrarPixNoSheet(isPixVisible(parcela.id))
    setSheetAberto(true)
  }

  const handleVerPixNoSheet = () => {
    if (parcelaSelecionada) {
      setPixVisible(parcelaSelecionada.id)
      setMostrarPixNoSheet(true)
    }
  }

  const estaConcluido = (parcelamento: Parcelamento) => {
    return parcelamento.status === 'quitado' || 
           (parcelamento.parcelas?.every(p => p.status === 'paga') ?? false)
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
      await carregarParcelamentos()
      setSheetAberto(false)
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
      await carregarParcelamentos()
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
      await carregarParcelamentos()
      setDialogReverterAberto(false)
      setParcelaParaReverter(null)
    } catch (error) {
      toast.error('Erro inesperado ao reverter parcela')
    } finally {
      setProcessandoBaixa(null)
    }
  }

  const handleDarBaixaCompleta = async (parcelamentoId: string) => {
    setProcessandoBaixa(parcelamentoId)
    try {
      const { error, mensagem } = await darBaixaCompletaParcelamento(parcelamentoId)
      
      if (error) {
        toast.error(mensagem || 'Erro ao dar baixa completa')
        return
      }

      toast.success('Baixa completa registrada com sucesso!')
      await carregarParcelamentos()
    } catch (error) {
      toast.error('Erro inesperado ao dar baixa completa')
    } finally {
      setProcessandoBaixa(null)
    }
  }

  // Calcula estatísticas
  const calcularEstatisticas = () => {
    if (!parcelamentos || parcelamentos.length === 0) {
      return { totalPago: 0, totalPendente: 0, totalAtrasado: 0, totalParcelamentos: 0 }
    }

    let totalPago = 0
    let totalPendente = 0
    let totalAtrasado = 0
    let totalParcelamentos = parcelamentos.length

    parcelamentos.forEach((parcelamento) => {
      if (parcelamento.parcelas) {
        parcelamento.parcelas.forEach((parcela) => {
          if (parcela.status === 'paga') {
            totalPago += parcela.valor
          } else if (parcela.status === 'atrasada') {
            totalAtrasado += parcela.valor
          } else {
            totalPendente += parcela.valor
          }
        })
      }
    })

    return { totalPago, totalPendente, totalAtrasado, totalParcelamentos }
  }

  // Filtragem dos parcelamentos - DEVE estar antes de qualquer return condicional
  const parcelamentosFiltrados = useMemo(() => {
    return parcelamentos.filter(parcelamento => {
      // Filtro por busca de texto
      const termo = busca.trim().toLowerCase()
      const correspondeBusca =
        termo.length === 0 ||
        parcelamento.pedido_id.toLowerCase().includes(termo) ||
        (parcelamento.pedido?.dados_cliente?.nome || '').toLowerCase().includes(termo) ||
        (parcelamento.pedido?.dados_cliente?.email || '').toLowerCase().includes(termo) ||
        (parcelamento.pedido?.dados_cliente?.telefone || '').includes(busca) ||
        (parcelamento.pedido?.revenda?.nome_revenda || '').toLowerCase().includes(termo) ||
        (parcelamento.pedido?.revenda?.nome_publico || '').toLowerCase().includes(termo) ||
        (parcelamento.pedido?.unidade?.nome || '').toLowerCase().includes(termo) ||
        (parcelamento.pedido?.unidade?.nome_publico || '').toLowerCase().includes(termo)

      // Filtro por status do parcelamento
      const correspondeStatus = statusFiltro === 'todos' || parcelamento.status === statusFiltro

      // Filtro por status das parcelas (se tem alguma parcela com o status)
      const correspondeStatusParcela = (() => {
        if (statusParcelaFiltro === 'todos') return true
        if (!parcelamento.parcelas || parcelamento.parcelas.length === 0) return false
        return parcelamento.parcelas.some(p => p.status === statusParcelaFiltro)
      })()

      // Filtro por data de criação do parcelamento
      const correspondeData = (() => {
        const createdAt = new Date(parcelamento.criado_em)
        const agora = new Date()
        const inicioHoje = new Date()
        inicioHoje.setHours(0, 0, 0, 0)

        if (dataFiltro === 'tudo') return true
        if (dataFiltro === 'hoje') return createdAt >= inicioHoje

        const diasNum = dataFiltro === '7' || dataFiltro === '15' || dataFiltro === '30' ? parseInt(dataFiltro, 10) : null
        if (diasNum) {
          const limite = new Date(agora)
          limite.setDate(limite.getDate() - diasNum)
          return createdAt >= limite
        }

        // Personalizado
        if (dataFiltro === 'personalizado') {
          if (!dataInicioPersonalizada && !dataFimPersonalizada) return true

          const inicio = dataInicioPersonalizada ? new Date(dataInicioPersonalizada) : null
          const fim = dataFimPersonalizada ? new Date(dataFimPersonalizada) : null
          if (inicio) inicio.setHours(0, 0, 0, 0)
          if (fim) fim.setHours(23, 59, 59, 999)

          if (inicio && fim) return createdAt >= inicio && createdAt <= fim
          if (inicio && !fim) return createdAt >= inicio
          if (!inicio && fim) return createdAt <= fim
          return true
        }

        return true
      })()

      return correspondeBusca && correspondeStatus && correspondeStatusParcela && correspondeData
    })
  }, [parcelamentos, busca, statusFiltro, statusParcelaFiltro, dataFiltro, dataInicioPersonalizada, dataFimPersonalizada])

  const estatisticas = calcularEstatisticas()

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <FileText className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          Crediário Digital
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Gerencie os parcelamentos de todos os pedidos da sua revenda
        </p>
      </div>

      {erro && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        </div>
      )}

      {/* Seleção de Unidade */}
      {revendaId && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Selecione uma unidade para visualizar parcelamentos
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
                  Crie uma unidade em "Presença na Loja" para começar a receber pedidos
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
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                          <p className="text-neutral-500 dark:text-neutral-400 text-xs">Parcelamentos</p>
                          <p className="font-medium flex items-center gap-1 text-neutral-900 dark:text-neutral-50">
                            <CreditCard className="w-4 h-4" />
                            {parcelamentosPorUnidade[unidade.id] || 0}
                          </p>
                        </div>
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

      {/* Filtros Avançados */}
      {unidadeSelecionadaId && (
        <Card className="relative z-10 border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Busca */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              <Input
                placeholder="Buscar por número do pedido, cliente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 border-neutral-300 dark:border-neutral-700"
              />
            </div>

            {/* Status do Parcelamento */}
            <div className="w-[200px]">
              <SelectMenu
                value={statusFiltro}
                onChange={(v) => setStatusFiltro(v as any)}
                options={[
                  { value: 'todos', label: 'Status: Todos' },
                  { value: 'ativo', label: 'Status: Ativo' },
                  { value: 'quitado', label: 'Status: Quitado' },
                  { value: 'cancelado', label: 'Status: Cancelado' },
                ]}
              />
            </div>

            {/* Status da Parcela */}
            <div className="w-[200px]">
              <SelectMenu
                value={statusParcelaFiltro}
                onChange={(v) => setStatusParcelaFiltro(v as any)}
                options={[
                  { value: 'todos', label: 'Parcela: Todas' },
                  { value: 'pendente', label: 'Parcela: Pendente' },
                  { value: 'paga', label: 'Parcela: Paga' },
                  { value: 'atrasada', label: 'Parcela: Atrasada' },
                ]}
              />
            </div>

            {/* Data */}
            <div className="w-[200px]">
              <SelectMenu
                value={dataFiltro}
                onChange={(v) => setDataFiltro(v as any)}
                options={[
                  { value: 'tudo', label: 'Data: Tudo' },
                  { value: 'hoje', label: 'Data: Hoje' },
                  { value: '7', label: 'Data: 7 dias' },
                  { value: '15', label: 'Data: 15 dias' },
                  { value: '30', label: 'Data: 30 dias' },
                  { value: 'personalizado', label: 'Data: Personalizada' },
                ]}
              />
            </div>

            {/* Calendário dropdown */}
            {dataFiltro === 'personalizado' && (
              <Dropdown
                aberto={dropdownCalendarioAberto}
                onToggle={setDropdownCalendarioAberto}
                alinhamento="inicio"
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center justify-between gap-2 h-10 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 min-w-[240px]"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-500" />
                      <span>
                        {dataInicioPersonalizada && dataFimPersonalizada
                          ? `${new Date(dataInicioPersonalizada).toLocaleDateString('pt-BR')} — ${new Date(dataFimPersonalizada).toLocaleDateString('pt-BR')}`
                          : dataInicioPersonalizada
                            ? `${new Date(dataInicioPersonalizada).toLocaleDateString('pt-BR')} — …`
                            : 'Selecionar período'}
                      </span>
                    </div>
                  </button>
                }
              >
                <DateRangePicker
                  variant="compact"
                  dataInicio={dataInicioPersonalizada}
                  dataFim={dataFimPersonalizada}
                  onChange={(inicio, fim) => {
                    setDataInicioPersonalizada(inicio)
                    setDataFimPersonalizada(fim)
                  }}
                />
                <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
                  <Button
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={() => setDropdownCalendarioAberto(false)}
                  >
                    Aplicar
                  </Button>
                </div>
              </Dropdown>
            )}

            {/* Limpar filtros */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBusca('')
                setStatusFiltro('todos')
                setStatusParcelaFiltro('todos')
                setDataFiltro('tudo')
                setDataInicioPersonalizada('')
                setDataFimPersonalizada('')
                setDropdownCalendarioAberto(false)
              }}
              className="text-neutral-700 dark:text-neutral-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-700 dark:hover:text-violet-300"
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Estatísticas e Lista de Parcelamentos */}
      {unidadeSelecionadaId && (
        <>
          {/* Estatísticas */}
          {parcelamentos.length > 0 && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-neutral-200 dark:border-neutral-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Pago</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {formatarPreco(estatisticas.totalPago)}
                      </p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-neutral-200 dark:border-neutral-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Pendente</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {formatarPreco(estatisticas.totalPendente)}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-neutral-200 dark:border-neutral-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Atrasado</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                        {formatarPreco(estatisticas.totalAtrasado)}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-neutral-200 dark:border-neutral-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Parcelamentos</p>
                      <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                        {estatisticas.totalParcelamentos}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-violet-600 dark:text-violet-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {parcelamentos.length === 0 ? (
            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CreditCard className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-4" />
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                  Nenhum parcelamento encontrado
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-center">
                  Ainda não há parcelamentos nos pedidos da sua revenda
                </p>
              </CardContent>
            </Card>
          ) : parcelamentosFiltrados.length === 0 ? (
            <Card className="border-neutral-200 dark:border-neutral-800">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CreditCard className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-4" />
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                  Nenhum parcelamento encontrado
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-center mb-6">
                  Nenhum parcelamento corresponde aos filtros aplicados
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBusca('')
                    setStatusFiltro('todos')
                    setStatusParcelaFiltro('todos')
                    setDataFiltro('tudo')
                    setDataInicioPersonalizada('')
                    setDataFimPersonalizada('')
                  }}
                >
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
          {parcelamentosFiltrados.map((parcelamento) => {
            const parcelasPendentes = parcelamento.parcelas?.filter(p => p.status !== 'paga').length || 0
            const parcelasPagas = parcelamento.parcelas?.filter(p => p.status === 'paga').length || 0
            const concluido = estaConcluido(parcelamento)
            const expandido = parcelamentosExpandidos.has(parcelamento.id)
            const dadosCliente = parcelamento.pedido?.dados_cliente as any

            return (
              <Card 
                key={parcelamento.id} 
                className={`border-neutral-200 dark:border-neutral-800 transition-all ${
                  concluido ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                          Crediário Digital do Pedido #{parcelamento.pedido_id.slice(0, 8).toUpperCase()}
                        </CardTitle>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            concluido
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : parcelamento.status === 'cancelado'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}>
                            {concluido ? 'Concluído' : parcelamento.status === 'cancelado' ? 'Cancelado' : 'Ativo'}
                          </span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-500">
                            {parcelasPagas}/{parcelamento.total_parcelas} parcelas pagas
                          </span>
                        </div>
                      </div>

                      {/* Informações do Pedido */}
                      {parcelamento.pedido && (
                        <div className="grid md:grid-cols-2 gap-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                              <Package className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                              Informações do Pedido
                            </h4>
                            <div className="space-y-1 text-sm">
                              {/* Loja (Revenda e Unidade) */}
                              {(parcelamento.pedido.revenda || parcelamento.pedido.unidade) && (
                                <div className="flex items-center justify-between">
                                  <span className="text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                                    <Store className="w-3 h-3" />
                                    Loja:
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                    {parcelamento.pedido.revenda && (
                                      <span className="text-neutral-900 dark:text-neutral-50">
                                        {parcelamento.pedido.revenda.nome_publico || parcelamento.pedido.revenda.nome_revenda}
                                      </span>
                                    )}
                                    {parcelamento.pedido.unidade && (
                                      <>
                                        {parcelamento.pedido.revenda && (
                                          <span className="text-neutral-400 dark:text-neutral-600">•</span>
                                        )}
                                        <span className="font-medium text-violet-600 dark:text-violet-400">
                                          {parcelamento.pedido.unidade.nome_publico || parcelamento.pedido.unidade.nome}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-neutral-600 dark:text-neutral-400">Valor Total:</span>
                                <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                                  {formatarPreco(parcelamento.pedido.valor_total)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-neutral-600 dark:text-neutral-400">Status:</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  parcelamento.pedido.status === 'entregue'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : parcelamento.pedido.status === 'cancelado'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                }`}>
                                  {STATUS_LABELS[parcelamento.pedido.status] || parcelamento.pedido.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-neutral-600 dark:text-neutral-400">Data do Pedido:</span>
                                <span className="text-neutral-900 dark:text-neutral-50">
                                  {formatarDataCurta(parcelamento.pedido.criado_em)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Informações do Cliente */}
                          {dadosCliente && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                                <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                Informações do Cliente
                              </h4>
                              <div className="space-y-1 text-sm">
                                {dadosCliente.nome && (
                                  <div className="flex items-center gap-2">
                                    <User className="w-3 h-3 text-neutral-500" />
                                    <span className="text-neutral-900 dark:text-neutral-50">{dadosCliente.nome}</span>
                                  </div>
                                )}
                                {dadosCliente.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3 text-neutral-500" />
                                    <span className="text-neutral-600 dark:text-neutral-400">{dadosCliente.email}</span>
                                  </div>
                                )}
                                {dadosCliente.telefone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3 text-neutral-500" />
                                    <span className="text-neutral-600 dark:text-neutral-400">{dadosCliente.telefone}</span>
                                  </div>
                                )}
                                {dadosCliente.cpf && (
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-3 h-3 text-neutral-500" />
                                    <span className="text-neutral-600 dark:text-neutral-400">CPF: {dadosCliente.cpf}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Resumo do Parcelamento */}
                      <div className="flex items-center gap-4 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                        <div className="flex-1">
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Valor Total do Parcelamento</p>
                          <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                            {formatarPreco(parcelamento.valor_total)}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Valor por Parcela</p>
                          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                            {formatarPreco(parcelamento.valor_parcela)}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Total de Parcelas</p>
                          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                            {parcelamento.total_parcelas}x
                          </p>
                        </div>
                      </div>

                      {/* Informações Financeiras */}
                      {parcelamento.pedido?.transacao_financeira && (
                        <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2 mb-3">
                            <DollarSign className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                            Informações Financeiras
                          </h4>
                          <div className="space-y-2">
                            {(() => {
                              const valorBruto = typeof parcelamento.pedido.transacao_financeira.valor_bruto === 'string' 
                                ? parseFloat(parcelamento.pedido.transacao_financeira.valor_bruto) 
                                : (parcelamento.pedido.transacao_financeira.valor_bruto || 0)
                              const valorLiquido = typeof parcelamento.pedido.transacao_financeira.valor_liquido === 'string' 
                                ? parseFloat(parcelamento.pedido.transacao_financeira.valor_liquido) 
                                : (parcelamento.pedido.transacao_financeira.valor_liquido || 0)
                              const taxaPercentual = typeof parcelamento.pedido.transacao_financeira.taxa_percentual === 'string' 
                                ? parseFloat(parcelamento.pedido.transacao_financeira.taxa_percentual) 
                                : (parcelamento.pedido.transacao_financeira.taxa_percentual || 0)
                              const taxaFixa = typeof parcelamento.pedido.transacao_financeira.taxa_fixa === 'string' 
                                ? parseFloat(parcelamento.pedido.transacao_financeira.taxa_fixa) 
                                : (parcelamento.pedido.transacao_financeira.taxa_fixa || 0)
                              
                              return (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Valor Total (Cliente):</span>
                                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                      {formatarPreco(valorBruto || parcelamento.pedido.valor_total || 0)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Valor a Receber:</span>
                                    <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                                      {formatarPreco(valorLiquido)}
                                    </span>
                                  </div>
                                </>
                              )
                            })()}
                            {parcelamento.pedido.transacao_financeira.modalidade && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-neutral-600 dark:text-neutral-400">Modalidade de Repasse:</span>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                                  {parcelamento.pedido.transacao_financeira.modalidade}
                                </span>
                              </div>
                            )}
                            {(() => {
                              const taxaPercentual = typeof parcelamento.pedido.transacao_financeira.taxa_percentual === 'string' 
                                ? parseFloat(parcelamento.pedido.transacao_financeira.taxa_percentual) 
                                : (parcelamento.pedido.transacao_financeira.taxa_percentual || 0)
                              const taxaFixa = typeof parcelamento.pedido.transacao_financeira.taxa_fixa === 'string' 
                                ? parseFloat(parcelamento.pedido.transacao_financeira.taxa_fixa) 
                                : (parcelamento.pedido.transacao_financeira.taxa_fixa || 0)
                              
                              return (taxaPercentual !== null && taxaPercentual !== undefined && !isNaN(taxaPercentual)) ||
                                     (taxaFixa !== null && taxaFixa !== undefined && !isNaN(taxaFixa)) ? (
                                <div className="pt-2 mt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
                                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Taxas Descontadas:</p>
                                  {taxaPercentual !== null && taxaPercentual !== undefined && !isNaN(taxaPercentual) && (
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-neutral-500 dark:text-neutral-500">Taxa Percentual:</span>
                                      <span className="text-neutral-700 dark:text-neutral-300">
                                        {taxaPercentual.toFixed(2)}%
                                      </span>
                                    </div>
                                  )}
                                  {taxaFixa !== null && taxaFixa !== undefined && !isNaN(taxaFixa) && (
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-neutral-500 dark:text-neutral-500">Taxa Fixa:</span>
                                      <span className="text-neutral-700 dark:text-neutral-300">
                                        {formatarPreco(taxaFixa)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : null
                            })()}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </CardHeader>
                
                {/* Botões de ação - Fora do CardHeader para melhor layout */}
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/revenda/pedidos/${parcelamento.pedido_id}`)}
                      className="flex-1 border-neutral-300 dark:border-neutral-700"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Ver Pedido Completo
                    </Button>
                    {/* Ação de baixa completa é exclusiva de ADMIN - removida para revendas */}
                  </div>
                </div>
                {concluido ? (
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-50">
                            Parcelamento Concluído
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Todas as {parcelamento.total_parcelas} parcelas foram pagas
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpandir(parcelamento.id)}
                        className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                      >
                        {expandido ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Ocultar Detalhes
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </>
                        )}
                      </Button>
                    </div>
                    {expandido && parcelamento.parcelas && parcelamento.parcelas.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="grid grid-cols-5 gap-2 p-3 bg-neutral-100 dark:bg-neutral-900/50 rounded-md text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          <div>Parcela</div>
                          <div>Vencimento</div>
                          <div className="text-right">Valor</div>
                          <div className="text-center">Data Pagamento</div>
                          <div className="text-center">Ações</div>
                        </div>
                        {parcelamento.parcelas.map((parcela) => (
                          <div
                            key={parcela.id}
                            className="grid grid-cols-5 gap-2 p-3 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <span className="font-medium text-neutral-900 dark:text-neutral-50">
                                {parcela.numero_parcela}ª
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                {formatarDataCurta(parcela.data_vencimento)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {formatarPreco(parcela.valor)}
                              </span>
                            </div>
                            <div className="text-center">
                              {parcela.data_pagamento ? (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  {formatarDataCurta(parcela.data_pagamento)}
                                </span>
                              ) : (
                                <span className="text-xs text-neutral-400">—</span>
                              )}
                            </div>
                            <div className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => abrirDetalhesParcela(parcela, parcelamento)}
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                ) : (
                  <CardContent>
                    {parcelamento.parcelas && parcelamento.parcelas.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {parcelamento.parcelas.map((parcela) => (
                          <ParcelaCard
                            key={parcela.id}
                            parcela={parcela}
                            isRevenda={true}
                            onVerDetalhes={() => abrirDetalhesParcela(parcela, parcelamento)}
                            onVerPix={() => {
                              // Gera PIX se não tiver
                              if (!parcela.pix_copia_cola) {
                                gerarPixParaParcela(
                                  parcela.id,
                                  parcela.valor,
                                  `Parcela ${parcela.numero_parcela} - Pedido ${parcelamento.pedido_id.slice(0, 8)}`
                                ).then(() => {
                                  carregarParcelamentos()
                                  toast.success('PIX gerado com sucesso!')
                                })
                              }
                            }}
                            onCopiarPix={() => {
                              if (parcela.pix_copia_cola) {
                                copiarPix(parcela.pix_copia_cola)
                              }
                            }}
                            />
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-600 dark:text-neutral-400">Nenhuma parcela encontrada</p>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
            </div>
          )}
        </>
      )}

      {/* Sheet com detalhes da parcela */}
      <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
        <SheetContent className="sm:max-w-md">
          {parcelaSelecionada && parcelamentoSelecionado && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  {parcelaSelecionada.numero_parcela}ª Parcela
                </SheetTitle>
                <SheetDescription>
                  Detalhes da parcela e informações para pagamento via PIX
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Informações da Parcela */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Valor</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                          {formatarPreco(parcelaSelecionada.valor)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Vencimento</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {formatarData(parcelaSelecionada.data_vencimento)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center gap-2">
                        {parcelaSelecionada.status === 'paga' ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              Parcela Paga
                            </span>
                            {parcelaSelecionada.data_pagamento && (
                              <span className="text-xs text-neutral-500 dark:text-neutral-500 ml-auto">
                                Paga em {formatarDataCurta(parcelaSelecionada.data_pagamento)}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                              Parcela Pendente
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informações do Cliente */}
                  {parcelamentoSelecionado.pedido?.dados_cliente && (
                    <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        Cliente
                      </h4>
                      <div className="space-y-2 text-sm">
                        {(parcelamentoSelecionado.pedido.dados_cliente as any).nome && (
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-neutral-500" />
                            <span className="text-neutral-900 dark:text-neutral-50">
                              {(parcelamentoSelecionado.pedido.dados_cliente as any).nome}
                            </span>
                          </div>
                        )}
                        {(parcelamentoSelecionado.pedido.dados_cliente as any).email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-neutral-500" />
                            <span className="text-neutral-600 dark:text-neutral-400">
                              {(parcelamentoSelecionado.pedido.dados_cliente as any).email}
                            </span>
                          </div>
                        )}
                        {(parcelamentoSelecionado.pedido.dados_cliente as any).telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-neutral-500" />
                            <span className="text-neutral-600 dark:text-neutral-400">
                              {(parcelamentoSelecionado.pedido.dados_cliente as any).telefone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PIX Copia e Cola - Revenda só vê se clicou em "Ver PIX" */}
                  {parcelaSelecionada.status !== 'paga' && (
                    <div className="space-y-3">
                      {mostrarPixNoSheet && parcelaSelecionada.pix_copia_cola ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              PIX Copia e Cola
                            </p>
                            <span className="text-xs text-neutral-500 dark:text-neutral-500">
                              Visível por 3 horas
                            </span>
                          </div>
                          <div className="relative">
                            <code className="block w-full p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs break-all text-neutral-900 dark:text-neutral-50 border border-neutral-200 dark:border-neutral-700">
                              {parcelaSelecionada.pix_copia_cola}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copiarPix(parcelaSelecionada.pix_copia_cola!)}
                              className="absolute top-2 right-2 border-neutral-300 dark:border-neutral-700"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* QR Code */}
                          <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center">
                            <QRCode url={parcelaSelecionada.pix_copia_cola} size={180} />
                          </div>
                        </>
                      ) : parcelaSelecionada.pix_copia_cola ? (
                        <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col items-center">
                          <QrCode className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-3" />
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 text-center">
                            Clique em "Ver PIX" para visualizar o código PIX e QR Code
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
                                `Parcela ${parcelaSelecionada.numero_parcela}`
                              )
                              if (!error) {
                                await carregarParcelamentos()
                                toast.success('PIX gerado com sucesso!')
                                // Recarrega a parcela selecionada
                                const parcelamento = parcelamentos.find(p => 
                                  p.parcelas?.some(parc => parc.id === parcelaSelecionada.id)
                                )
                                if (parcelamento) {
                                  const parcelaAtualizada = parcelamento.parcelas?.find(p => p.id === parcelaSelecionada.id)
                                  if (parcelaAtualizada) {
                                    setParcelaSelecionada(parcelaAtualizada)
                                    setPixVisible(parcelaAtualizada.id)
                                    setMostrarPixNoSheet(true)
                                  }
                                }
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

                  {/* Ações de baixa são exclusivas de ADMIN - removidas para revendas */}

                  {parcelaSelecionada.status === 'paga' && (
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-50">
                            Parcela já foi paga
                          </p>
                          {parcelaSelecionada.data_pagamento && (
                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                              Paga em {formatarData(parcelaSelecionada.data_pagamento)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Diálogos de baixa, vencimento e reversão removidos - ações exclusivas de ADMIN */}
    </div>
  )
}
