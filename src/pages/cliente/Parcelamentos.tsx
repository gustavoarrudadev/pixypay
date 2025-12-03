import { useState, useEffect, useMemo } from 'react'
import { CreditCard, CheckCircle2, AlertCircle, Copy, FileText, TrendingUp, MoreVertical, QrCode, ChevronDown, ChevronUp, Eye, Search, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ParcelaCard } from '@/components/parcelamentos/ParcelaCard'
import { listarParcelamentos, gerarPixParaParcela, type Parcelamento, type Parcela } from '@/lib/gerenciarParcelamentos'
import { formatarPreco } from '@/lib/utils'
import { toast } from 'sonner'
import { QRCode } from '@/components/revendas/QRCode'

export default function Parcelamentos() {
  const [carregando, setCarregando] = useState(true)
  const [parcelamentos, setParcelamentos] = useState<Parcelamento[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [parcelaSelecionada, setParcelaSelecionada] = useState<Parcela | null>(null)
  const [sheetAberto, setSheetAberto] = useState(false)
  const [parcelamentosExpandidos, setParcelamentosExpandidos] = useState<Set<string>>(new Set())
  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregarParcelamentos()
  }, [])

  const carregarParcelamentos = async () => {
    setCarregando(true)
    setErro(null)
    try {
      console.log('🔍 Carregando parcelamentos do cliente...')
      const { parcelamentos: parcelamentosData, error } = await listarParcelamentos()
      
      console.log('📦 Resultado:', { parcelamentosData, error })

      if (error) {
        console.error('❌ Erro ao carregar parcelamentos:', error)
        setErro(`Erro ao carregar parcelamentos: ${error.message || 'Erro desconhecido'}`)
        setCarregando(false)
        return
      }

      setParcelamentos(parcelamentosData || [])
      
      // Gera PIX automaticamente para parcelas pendentes que não têm
      if (parcelamentosData && parcelamentosData.length > 0) {
        for (const parcelamento of parcelamentosData) {
          if (parcelamento.parcelas) {
            for (const parcela of parcelamento.parcelas) {
              if (parcela.status === 'pendente' && !parcela.pix_copia_cola) {
                await gerarPixParaParcela(
                  parcela.id,
                  parcela.valor,
                  `Parcela ${parcela.numero_parcela} - Pedido ${parcelamento.pedido_id.slice(0, 8)}`
                )
              }
            }
          }
        }
        // Recarrega após gerar PIX
        const { parcelamentos: parcelamentosAtualizados } = await listarParcelamentos()
        setParcelamentos(parcelamentosAtualizados || [])
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar parcelamentos:', error)
      setErro(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro ao carregar parcelamentos'}`)
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

  const abrirDetalhesParcela = (parcela: Parcela) => {
    setParcelaSelecionada(parcela)
    setSheetAberto(true)
  }

  const estaConcluido = (parcelamento: Parcelamento) => {
    return parcelamento.status === 'quitado' || 
           (parcelamento.parcelas?.every(p => p.status === 'paga') ?? false)
  }

  // Calcula estatísticas
  const calcularEstatisticas = () => {
    let totalPago = 0
    let totalPendente = 0
    let totalAtrasado = 0
    let proximaParcela: Parcela | null = null

    parcelamentos.forEach((parcelamento) => {
      if (parcelamento.parcelas) {
        parcelamento.parcelas.forEach((parcela) => {
          if (parcela.status === 'paga') {
            totalPago += parcela.valor
          } else if (parcela.status === 'atrasada') {
            totalAtrasado += parcela.valor
          } else {
            totalPendente += parcela.valor
            if (!proximaParcela || new Date(parcela.data_vencimento) < new Date(proximaParcela.data_vencimento)) {
              proximaParcela = parcela
            }
          }
        })
      }
    })

    return { totalPago, totalPendente, totalAtrasado, proximaParcela }
  }

  const estatisticas = calcularEstatisticas()

  // Filtragem simples dos parcelamentos (apenas busca)
  const parcelamentosFiltrados = useMemo(() => {
    if (!busca.trim()) return parcelamentos
    
    const termo = busca.trim().toLowerCase()
    return parcelamentos.filter(parcelamento => 
      parcelamento.pedido_id.toLowerCase().includes(termo) ||
      (parcelamento.pedido?.revenda?.nome_revenda || '').toLowerCase().includes(termo) ||
      (parcelamento.pedido?.revenda?.nome_publico || '').toLowerCase().includes(termo)
    )
  }, [parcelamentos, busca])

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
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-violet-600 dark:text-violet-400" />
          Crediário Digital
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Acompanhe seus parcelamentos e pague suas parcelas via PIX
        </p>
      </div>

      {erro && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
        </div>
      )}

      {/* Busca Simples */}
      {parcelamentos.length > 0 && (
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

      {/* Estatísticas */}
      {parcelamentos.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Total Pago</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                    {formatarPreco(estatisticas.totalPago)}
                  </p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Pendente</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {formatarPreco(estatisticas.totalPendente)}
                  </p>
                </div>
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Atrasado</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
                    {formatarPreco(estatisticas.totalAtrasado)}
                  </p>
                </div>
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Próxima Parcela</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                      {estatisticas.proximaParcela
                        ? formatarPreco(estatisticas.proximaParcela.valor)
                        : '—'}
                    </p>
                    {estatisticas.proximaParcela && (
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-500">
                        {formatarDataCurta(estatisticas.proximaParcela.data_vencimento)}
                      </p>
                    )}
                  </div>
                </div>
                <TrendingUp className="w-6 h-6 text-violet-600 dark:text-violet-400 opacity-50" />
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
              Você ainda não possui parcelamentos pendentes
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
              Nenhum parcelamento corresponde à busca
            </p>
            <Button
              variant="outline"
              onClick={() => setBusca('')}
            >
              Limpar Busca
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

            return (
              <Card 
                key={parcelamento.id} 
                className={`border-neutral-200 dark:border-neutral-800 transition-all ${
                  concluido ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-400" />
                        Crediário Digital #{parcelamento.pedido_id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      {parcelamento.pedido && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Pedido de {formatarPreco(parcelamento.pedido.valor_total)}
                          </p>
                          {parcelamento.pedido.revenda && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              {parcelamento.pedido.revenda.nome_publico || parcelamento.pedido.revenda.nome_revenda}
                              {parcelamento.pedido.unidade && ` - ${parcelamento.pedido.unidade.nome_publico || parcelamento.pedido.unidade.nome}`}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        concluido
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : parcelamento.status === 'cancelado'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {concluido ? 'Concluído' : parcelamento.status === 'cancelado' ? 'Cancelado' : 'Ativo'}
                      </span>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                        {parcelasPagas}/{parcelamento.total_parcelas} parcelas pagas
                      </p>
                    </div>
                  </div>
                </CardHeader>
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
                      <div className="mt-4 space-y-3">
                        {parcelamento.parcelas.map((parcela) => {
                          const isAtrasada = parcela.status === 'atrasada'
                          const isPaga = parcela.status === 'paga'
                          
                          return (
                            <div
                              key={parcela.id}
                              className={`p-4 rounded-lg border transition-colors ${
                                isPaga
                                  ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                  : isAtrasada
                                  ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                  : 'bg-neutral-50/50 dark:bg-neutral-900/30 border-neutral-200 dark:border-neutral-800'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold flex-shrink-0 ${
                                    isPaga
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                      : isAtrasada
                                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  }`}>
                                    {parcela.numero_parcela}
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                      {parcela.numero_parcela}ª Parcela
                                    </p>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                      isPaga
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                        : isAtrasada
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                    }`}>
                                      {isPaga ? 'Paga' : isAtrasada ? 'Atrasada' : 'Pendente'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-base font-bold ${
                                    isPaga
                                      ? 'text-green-600 dark:text-green-400'
                                      : isAtrasada
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-neutral-900 dark:text-neutral-50'
                                  }`}>
                                    {formatarPreco(parcela.valor)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                <div>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Vencimento</p>
                                  <p className={`text-sm font-medium ${
                                    isAtrasada 
                                      ? 'text-red-600 dark:text-red-400' 
                                      : 'text-neutral-700 dark:text-neutral-300'
                                  }`}>
                                    {formatarDataCurta(parcela.data_vencimento)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Data Pagamento</p>
                                  <p className={`text-sm font-medium ${
                                    parcela.data_pagamento
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-neutral-400 dark:text-neutral-600'
                                  }`}>
                                    {parcela.data_pagamento ? formatarDataCurta(parcela.data_pagamento) : '—'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
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
                            onVerDetalhes={() => abrirDetalhesParcela(parcela)}
                            onCopiarPix={() => {
                              if (parcela.pix_copia_cola) {
                                copiarPix(parcela.pix_copia_cola)
                              } else {
                                // Gera PIX se não tiver
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

      {/* Sheet com detalhes da parcela */}
      <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
        <SheetContent className="sm:max-w-md">
          {parcelaSelecionada && (
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

                  {/* PIX Copia e Cola */}
                  {parcelaSelecionada.status !== 'paga' && (
                    <div className="space-y-3">
                      {parcelaSelecionada.pix_copia_cola ? (
                        <>
                          <div>
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              PIX Copia e Cola
                            </p>
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
                          </div>

                          {/* QR Code */}
                          <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center">
                            <QRCode url={parcelaSelecionada.pix_copia_cola} size={180} />
                          </div>
                        </>
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
    </div>
  )
}
