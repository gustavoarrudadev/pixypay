import { useState, useEffect } from 'react'
import { X, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { obterSessao } from '@/lib/auth'
import { obterRoleDeUsuario } from '@/lib/roles'

interface VisualizarComoClienteProps {
  clienteId: string
  clienteUserId: string
  clienteNome: string
  onClose: () => void
}

/**
 * Componente de popup que permite ao admin visualizar a aplicação como cliente
 * Abre um iframe com a aplicação logada como cliente
 */
export function VisualizarComoCliente({
  clienteId,
  clienteUserId,
  clienteNome,
  onClose,
}: VisualizarComoClienteProps) {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)

  useEffect(() => {
    inicializarVisualizacao()
  }, [clienteUserId])

  const inicializarVisualizacao = async () => {
    try {
      // Verifica se o usuário atual é admin
      const session = await obterSessao()
      if (!session?.user) {
        setErro('Sessão não encontrada.')
        return
      }

      const role = obterRoleDeUsuario(session.user)
      if (role !== 'admin') {
        setErro('Apenas administradores podem visualizar como cliente.')
        return
      }

      // Gera URL com token temporário para impersonation
      const baseUrl = window.location.origin
      const token = btoa(JSON.stringify({
        clienteUserId,
        clienteId,
        adminUserId: session.user.id,
        timestamp: Date.now(),
      }))
      
      const url = `${baseUrl}/visualizar-cliente?token=${encodeURIComponent(token)}`
      setIframeUrl(url)
      setCarregando(false)
    } catch (error) {
      console.error('❌ Erro ao inicializar visualização:', error)
      setErro('Erro ao inicializar visualização como cliente.')
      setCarregando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] m-4 bg-white dark:bg-neutral-900 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Visualizando como Cliente
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {clienteNome}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-neutral-200 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          {carregando ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin mx-auto mb-4" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Carregando visualização...
                </p>
              </div>
            </div>
          ) : erro ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-6">
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">{erro}</p>
                <Button onClick={onClose} variant="outline">
                  Fechar
                </Button>
              </div>
            </div>
          ) : iframeUrl ? (
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0"
              title={`Visualização como ${clienteNome}`}
              allow="clipboard-read; clipboard-write"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

