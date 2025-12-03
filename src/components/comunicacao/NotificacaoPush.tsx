import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { listarNotificacoesPushAtivas, type NotificacaoPush } from '@/lib/comunicacao'
import { cn } from '@/lib/utils'

export function NotificacaoPush() {
  const [notificacoes, setNotificacoes] = useState<NotificacaoPush[]>([])
  const [notificacoesExibidas, setNotificacoesExibidas] = useState<Set<string>>(new Set())

  useEffect(() => {
    carregarNotificacoes()
    // Verificar novas notificações a cada 30 segundos
    const interval = setInterval(carregarNotificacoes, 30000)
    return () => clearInterval(interval)
  }, [])

  const carregarNotificacoes = async () => {
    const { notificacoes: notifs } = await listarNotificacoesPushAtivas()
    setNotificacoes(notifs)
  }

  const handleFechar = (id: string) => {
    setNotificacoesExibidas((prev) => {
      const novo = new Set(prev)
      novo.add(id)
      return novo
    })
  }

  const notificacoesParaExibir = notificacoes.filter((n) => !notificacoesExibidas.has(n.id))

  if (notificacoesParaExibir.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-3 max-w-sm">
      {notificacoesParaExibir.map((notif) => (
        <div
          key={notif.id}
          className={cn(
            'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800',
            'rounded-lg shadow-lg p-4 animate-slide-up-in',
            'flex items-start gap-3'
          )}
        >
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
              {notif.titulo}
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{notif.descricao}</p>
          </div>
          <button
            onClick={() => handleFechar(notif.id)}
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}















