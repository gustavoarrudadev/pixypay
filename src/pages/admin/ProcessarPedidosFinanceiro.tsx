import { useState } from 'react'
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { processarPedidosExistentes } from '@/lib/processarPedidosExistentes'
import { SeletorRevendaAdmin } from '@/components/admin/SeletorRevendaAdmin'
import { toast } from 'sonner'

export default function ProcessarPedidosFinanceiro() {
  const [revendaSelecionada, setRevendaSelecionada] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [resultado, setResultado] = useState<{
    processados: number
    erros: number
    detalhes: Array<{ pedidoId: string; sucesso: boolean; erro?: string }>
  } | null>(null)

  const handleProcessar = async () => {
    setProcessando(true)
    setResultado(null)

    try {
      const { processados, erros, detalhes, error } = await processarPedidosExistentes(
        revendaSelecionada || undefined
      )

      if (error) {
        toast.error('Erro ao processar pedidos')
        setProcessando(false)
        return
      }

      setResultado({
        processados,
        erros,
        detalhes,
      })

      if (erros === 0) {
        toast.success(`${processados} pedido(s) processado(s) com sucesso!`)
      } else {
        toast.warning(`${processados} sucesso(s), ${erros} erro(s)`)
      }
    } catch (error) {
      console.error('Erro ao processar:', error)
      toast.error('Erro inesperado ao processar pedidos')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <RefreshCw className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          Processar Pedidos Existentes
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Cria transações financeiras retroativas para pedidos que ainda não possuem
        </p>
      </div>

      {/* Seletor de Revenda */}
      <SeletorRevendaAdmin
        revendaSelecionada={revendaSelecionada}
        onRevendaSelecionada={setRevendaSelecionada}
        obrigatorio={false}
      />

      {/* Card de Processamento */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle>Processar Pedidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Este processo criará transações financeiras para pedidos que ainda não possuem.
              Apenas pedidos sem transação financeira serão processados.
              {revendaSelecionada
                ? ' Apenas pedidos da revenda selecionada serão processados.'
                : ' Todos os pedidos serão processados.'}
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleProcessar}
            disabled={processando}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          >
            {processando ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Processar Pedidos
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado */}
      {resultado && (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle>Resultado do Processamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    Processados com Sucesso
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {resultado.processados}
                </p>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="font-semibold text-red-700 dark:text-red-300">Erros</span>
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{resultado.erros}</p>
              </div>
            </div>

            {resultado.detalhes.length > 0 && (
              <div className="max-h-[400px] overflow-y-auto">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Detalhes:
                </p>
                <div className="space-y-2">
                  {resultado.detalhes.map((detalhe, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm flex items-center justify-between ${
                        detalhe.sucesso
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {detalhe.sucesso ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                        <span className="font-mono text-xs">
                          {detalhe.pedidoId.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      {detalhe.erro && (
                        <span className="text-xs text-red-600 dark:text-red-400">{detalhe.erro}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

