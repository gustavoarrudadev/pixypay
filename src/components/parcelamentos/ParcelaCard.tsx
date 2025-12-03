import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Copy, MoreVertical, Eye, QrCode, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatarPreco } from '@/lib/utils'
import { QRCode } from '@/components/revendas/QRCode'

interface ParcelaCardProps {
  parcela: {
    id: string
    numero_parcela: number
    valor: number
    data_vencimento: string
    data_pagamento: string | null
    status: 'pendente' | 'paga' | 'atrasada'
    pix_copia_cola: string | null
  }
  onVerDetalhes?: () => void
  onCopiarPix?: () => void
  onVerPix?: () => void
  onDarBaixa?: () => void
  onMarcarVencida?: () => void
  onReverterParcela?: () => void
  isRevenda?: boolean
}

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

export function ParcelaCard({ parcela, onVerDetalhes, onCopiarPix, onVerPix, onDarBaixa, onMarcarVencida, onReverterParcela, isRevenda = false }: ParcelaCardProps) {
  const hoje = new Date()
  const vencimento = new Date(parcela.data_vencimento)
  const estaAtrasada = parcela.status === 'atrasada' || (vencimento < hoje && parcela.status === 'pendente')
  const [mostrarPix, setMostrarPix] = useState(false)

  // Verifica se o PIX deve estar visível ao montar o componente
  useEffect(() => {
    if (isRevenda) {
      setMostrarPix(isPixVisible(parcela.id))
    } else {
      // Cliente sempre vê o PIX se existir
      setMostrarPix(!!parcela.pix_copia_cola && parcela.status !== 'paga')
    }
  }, [parcela.id, parcela.pix_copia_cola, parcela.status, isRevenda])

  // Verifica periodicamente se o PIX ainda está visível (para revenda)
  useEffect(() => {
    if (!isRevenda || !mostrarPix) return

    const interval = setInterval(() => {
      if (!isPixVisible(parcela.id)) {
        setMostrarPix(false)
      }
    }, 60000) // Verifica a cada minuto

    return () => clearInterval(interval)
  }, [parcela.id, isRevenda, mostrarPix])

  const handleVerPix = () => {
    if (onVerPix) {
      onVerPix()
    }
    setPixVisible(parcela.id)
    setMostrarPix(true)
  }

  const formatarDataCurta = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <Card
      className={`transition-all ${
        parcela.status === 'paga'
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : estaAtrasada
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 border-2'
          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
      }`}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header com número da parcela e botão de ações */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                parcela.status === 'paga'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : estaAtrasada
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
              }`}>
                {parcela.numero_parcela}ª
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">
                  {parcela.numero_parcela}ª Parcela
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Vencimento: {formatarDataCurta(parcela.data_vencimento)}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-9 px-3 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:border-violet-400 dark:hover:border-violet-600 hover:text-violet-700 dark:hover:text-violet-300 shrink-0"
                >
                  <MoreVertical className="h-4 w-4 mr-2" />
                  Ações
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {onVerDetalhes && (
                  <DropdownMenuItem onClick={onVerDetalhes} className="cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalhes
                  </DropdownMenuItem>
                )}
                {isRevenda && parcela.status !== 'paga' && (
                  <DropdownMenuItem onClick={handleVerPix} className="cursor-pointer">
                    <QrCode className="mr-2 h-4 w-4" />
                    Ver PIX
                  </DropdownMenuItem>
                )}
                {!isRevenda && parcela.pix_copia_cola && onCopiarPix && (
                  <DropdownMenuItem onClick={onCopiarPix} className="cursor-pointer">
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar PIX
                  </DropdownMenuItem>
                )}
                {!isRevenda && !parcela.pix_copia_cola && parcela.status !== 'paga' && onCopiarPix && (
                  <DropdownMenuItem onClick={onCopiarPix} className="cursor-pointer">
                    <QrCode className="mr-2 h-4 w-4" />
                    Gerar PIX
                  </DropdownMenuItem>
                )}
                {/* Ações de baixa e vencimento são exclusivas de ADMIN */}
                {!isRevenda && parcela.status === 'paga' && onReverterParcela && (
                  <DropdownMenuItem 
                    onClick={onReverterParcela} 
                    className="cursor-pointer text-orange-700 dark:text-orange-300 focus:text-orange-700 dark:focus:text-orange-300 focus:bg-orange-50 dark:focus:bg-orange-900/30"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Reverter Parcela
                  </DropdownMenuItem>
                )}
                {!isRevenda && parcela.status !== 'paga' && onMarcarVencida && (
                  <DropdownMenuItem 
                    onClick={onMarcarVencida} 
                    className="cursor-pointer text-orange-700 dark:text-orange-300 focus:text-orange-700 dark:focus:text-orange-300 focus:bg-orange-50 dark:focus:bg-orange-900/30"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Marcar como Vencida
                  </DropdownMenuItem>
                )}
                {!isRevenda && parcela.status !== 'paga' && onDarBaixa && (
                  <DropdownMenuItem 
                    onClick={onDarBaixa} 
                    className="cursor-pointer text-green-700 dark:text-green-300 focus:text-green-700 dark:focus:text-green-300 focus:bg-green-50 dark:focus:bg-green-900/30"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Dar Baixa
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Conteúdo da parcela */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Valor</span>
              <span className={`text-xl font-bold ${
                parcela.status === 'paga'
                  ? 'text-green-600 dark:text-green-400'
                  : estaAtrasada
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-neutral-900 dark:text-neutral-50'
              }`}>
                {formatarPreco(parcela.valor)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Status</span>
              <div className="flex items-center gap-2">
                {parcela.status === 'paga' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Paga</span>
                  </>
                ) : estaAtrasada ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400 font-bold">Vencida</span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-500">Pendente</span>
                )}
              </div>
            </div>
            
            {estaAtrasada && (
              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">
                    Esta parcela está vencida!
                  </p>
                </div>
              </div>
            )}

            {parcela.data_pagamento && (
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Data Pagamento</span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  {formatarDataCurta(parcela.data_pagamento)}
                </span>
              </div>
            )}

            {/* QR Code e PIX - Cliente sempre vê, Revenda só se clicou em "Ver PIX" */}
            {parcela.pix_copia_cola && parcela.status !== 'paga' && mostrarPix && (
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">QR Code PIX</span>
                  {isRevenda && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-500 ml-auto">
                      Visível por 3 horas
                    </span>
                  )}
                </div>
                <div className="flex justify-center">
                  <QRCode url={parcela.pix_copia_cola} size={180} />
                </div>
                {onCopiarPix && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onCopiarPix}
                      className="w-full border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar PIX Copia e Cola
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

