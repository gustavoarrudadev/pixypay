import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, Trash2, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  listarNotificacoes,
  contarNotificacoesNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  deletarNotificacao,
  buscarPreferenciasNotificacoes,
  tocarSomNotificacao,
  type Notificacao,
} from '@/lib/gerenciarNotificacoes'
import { supabase } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'
import { obterRoleUsuario } from '@/lib/roles'
import { cn } from '@/lib/utils'

export function BadgeNotificacoes() {
  const navigate = useNavigate()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [countNaoLidas, setCountNaoLidas] = useState<number>(0)
  const [carregando, setCarregando] = useState(true)
  const [aberto, setAberto] = useState(false)
  const [somHabilitado, setSomHabilitado] = useState(true)
  const channelRef = useRef<any>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const realtimeConectadoRef = useRef<boolean>(false)
  const ultimasNotificacoesIdsRef = useRef<Set<string>>(new Set()) // IDs das últimas notificações conhecidas

  useEffect(() => {
    carregarNotificacoes()
    carregarPreferenciasSom()
    configurarRealtime()

    return () => {
      // Limpa subscription ao desmontar
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      // Limpa polling se estiver ativo
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [])

  const carregarPreferenciasSom = async () => {
    try {
      const { preferencias } = await buscarPreferenciasNotificacoes()
      if (preferencias) {
        setSomHabilitado(preferencias.som_notificacoes)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar preferências de som:', error)
    }
  }

  const iniciarPollingFallback = () => {
    // Só inicia polling se Realtime não estiver conectado e polling não estiver ativo
    if (!realtimeConectadoRef.current && !pollingIntervalRef.current) {
      console.log('🔄 Iniciando polling como fallback (a cada 5 segundos)')
      pollingIntervalRef.current = setInterval(() => {
        carregarNotificacoes(true) // true = silencioso (não mostra loading)
      }, 5000)
    }
  }

  const carregarNotificacoes = async (silencioso = false) => {
    if (!silencioso) {
      setCarregando(true)
    }
    try {
      // Carrega contagem e últimas notificações
      const [countResult, notificacoesResult] = await Promise.all([
        contarNotificacoesNaoLidas(),
        listarNotificacoes(false), // Carrega últimas 5 para preview
      ])

      if (countResult.error) {
        console.error('❌ Erro ao contar notificações:', countResult.error)
      } else {
        const countAnterior = countNaoLidas
        setCountNaoLidas(countResult.count)
        
        // Log para debug
        if (silencioso) {
          console.log(`📊 Polling: Contagem anterior: ${countAnterior}, Contagem atual: ${countResult.count}`)
        }
      }

      if (notificacoesResult.error) {
        console.error('❌ Erro ao listar notificações:', notificacoesResult.error)
      } else {
        const novasNotificacoes = notificacoesResult.notificacoes.slice(0, 5)
        const idsAtuais = new Set(novasNotificacoes.map(n => n.id))
        
        // Detecta novas notificações comparando IDs (apenas em modo polling)
        if (silencioso && novasNotificacoes.length > 0) {
          const idsAnteriores = ultimasNotificacoesIdsRef.current
          
          // Encontra IDs que são novos (não estavam na lista anterior)
          const idsNovos = Array.from(idsAtuais).filter(id => !idsAnteriores.has(id))
          
          // Se há novas notificações e som está habilitado, toca som
          if (idsNovos.length > 0 && somHabilitado) {
            console.log(`🔊 ${idsNovos.length} nova(s) notificação(ões) detectada(s) via polling:`, idsNovos)
            tocarSomNotificacao()
          } else if (idsNovos.length === 0) {
            // Log apenas para debug - não há novas notificações
            console.log('✅ Polling: Nenhuma nova notificação detectada')
          }
        }
        
        // Sempre atualiza o conjunto de IDs conhecidos (tanto em modo silencioso quanto não silencioso)
        ultimasNotificacoesIdsRef.current = idsAtuais
        
        // SEMPRE atualiza o estado das notificações (tanto em modo silencioso quanto não silencioso)
        // Usa função de atualização para garantir que o estado seja atualizado mesmo em modo silencioso
        setNotificacoes((prev) => {
          // Compara para evitar atualizações desnecessárias
          const idsPrevios = new Set(prev.map(n => n.id))
          const idsNovos = novasNotificacoes.map(n => n.id)
          const mudou = idsNovos.some(id => !idsPrevios.has(id)) || prev.length !== novasNotificacoes.length
          
          if (silencioso && mudou) {
            console.log(`🔄 Polling: Estado mudou - ${prev.length} → ${novasNotificacoes.length} notificações`)
            console.log(`📋 IDs anteriores:`, Array.from(idsPrevios))
            console.log(`📋 IDs atuais:`, idsNovos)
          }
          
          return novasNotificacoes
        })
        
        if (silencioso) {
          console.log(`✅ Polling: Estado atualizado - ${novasNotificacoes.length} notificações exibidas`)
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error)
    } finally {
      if (!silencioso) {
        setCarregando(false)
      }
    }
  }

  const configurarRealtime = async () => {
    try {
      const session = await obterSessao()
      if (!session?.user) return

      // Remove canal anterior se existir
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
      }

      // Cria canal para notificações do usuário
      // Usa um nome simples e estável (sem timestamp para evitar múltiplos canais)
      const channelName = `notificacoes-${session.user.id}`
      console.log('📡 Criando canal Realtime:', channelName)
      console.log('👤 Usuário ID:', session.user.id)
      console.log('🔑 Access Token presente:', !!session.access_token)
      
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificacoes',
            filter: `usuario_id=eq.${session.user.id}`,
          },
          (payload) => {
            console.log('🔔 Nova notificação recebida via Realtime:', payload)

            // Se é uma nova notificação, toca som (se habilitado)
            if (payload.eventType === 'INSERT') {
              console.log('🔊 Tentando tocar som de notificação...')
              // Toca som diretamente usando preferência já carregada
              if (somHabilitado) {
                tocarSomNotificacao()
                console.log('✅ Som de notificação tocado')
              } else {
                console.log('⚠️ Som desabilitado nas preferências')
              }
            }

            // Atualiza estado imediatamente SEM recarregar
            console.log('📦 Payload completo:', JSON.stringify(payload, null, 2))
            
            if (payload.eventType === 'INSERT' && payload.new) {
              console.log('➕ Nova notificação recebida via Realtime:', payload.new)
              
              const novaNotificacao = payload.new as Notificacao
              
              // Adiciona nova notificação ao estado IMEDIATAMENTE
              setNotificacoes((prev) => {
                // Evita duplicatas
                if (prev.some((n) => n.id === novaNotificacao.id)) {
                  console.log('⚠️ Notificação duplicada, ignorando')
                  return prev
                }
                const novas = [novaNotificacao, ...prev].slice(0, 5)
                console.log('✅ Notificações atualizadas:', novas.length)
                
                // Adiciona o ID da nova notificação ao conjunto de IDs conhecidos
                // Isso evita que o polling detecte como nova depois
                ultimasNotificacoesIdsRef.current.add(novaNotificacao.id)
                
                return novas
              })
              
              // Atualiza contagem IMEDIATAMENTE
              setCountNaoLidas((prev) => {
                const nova = prev + 1
                console.log('🔢 Contagem atualizada:', nova)
                return nova
              })
            }
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Status do canal Realtime:', status, err)
          if (err) {
            console.error('❌ Erro no canal Realtime:', err)
            console.error('❌ Detalhes do erro:', JSON.stringify(err, null, 2))
          }
          if (status === 'SUBSCRIBED') {
            console.log('✅ Canal de notificações conectado e inscrito com sucesso!')
            console.log('👤 Usuário:', session.user.id)
            console.log('🔔 Escutando eventos INSERT na tabela notificacoes')
            console.log('📡 Nome do canal:', channelName)
            
            // Marca Realtime como conectado
            realtimeConectadoRef.current = true
            
            // Para o polling se estiver ativo (Realtime está funcionando)
            if (pollingIntervalRef.current) {
              console.log('🛑 Parando polling - Realtime conectado')
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Erro no canal de notificações')
            iniciarPollingFallback()
          } else if (status === 'TIMED_OUT') {
            console.warn('⚠️ Timeout ao conectar canal Realtime')
            console.warn('💡 Iniciando polling como fallback...')
            iniciarPollingFallback()
          } else if (status === 'CLOSED') {
            console.warn('⚠️ Canal Realtime fechado')
            iniciarPollingFallback()
          }
        })

      channelRef.current = channel
    } catch (error) {
      console.error('❌ Erro ao configurar Realtime:', error)
    }
  }

  const handleMarcarComoLida = async (notificacaoId: string) => {
    const { error } = await marcarComoLida(notificacaoId)
    if (error) {
      console.error('❌ Erro ao marcar como lida:', error)
      return
    }

    // Atualiza estado local
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === notificacaoId ? { ...n, lida: true, lida_em: new Date().toISOString() } : n))
    )
    setCountNaoLidas((prev) => Math.max(0, prev - 1))
  }

  const handleMarcarTodasComoLidas = async () => {
    const { error } = await marcarTodasComoLidas()
    if (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error)
      return
    }

    // Atualiza estado local
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true, lida_em: new Date().toISOString() })))
    setCountNaoLidas(0)
  }

  const handleDeletar = async (notificacaoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const { error } = await deletarNotificacao(notificacaoId)
    if (error) {
      console.error('❌ Erro ao deletar notificação:', error)
      return
    }

    // Atualiza estado local
    setNotificacoes((prev) => prev.filter((n) => n.id !== notificacaoId))
    const notificacao = notificacoes.find((n) => n.id === notificacaoId)
    if (notificacao && !notificacao.lida) {
      setCountNaoLidas((prev) => Math.max(0, prev - 1))
    }
  }

  const handleClickNotificacao = (notificacao: Notificacao) => {
    // Marca como lida se não estiver lida
    if (!notificacao.lida) {
      handleMarcarComoLida(notificacao.id)
    }

    // Navega para o link se existir
    if (notificacao.link) {
      navigate(notificacao.link)
      setAberto(false)
    }
  }

  const formatarTempo = (data: string) => {
    const agora = new Date()
    const criado = new Date(data)
    const diffMs = agora.getTime() - criado.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHora = Math.floor(diffMin / 60)
    const diffDia = Math.floor(diffHora / 24)

    if (diffMin < 1) return 'Agora'
    if (diffMin < 60) return `${diffMin} min atrás`
    if (diffHora < 24) return `${diffHora}h atrás`
    if (diffDia < 7) return `${diffDia}d atrás`
    return criado.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  // Removido getIconePorTipo - não usar mais ícones/emojis

  return (
    <DropdownMenu open={aberto} onOpenChange={setAberto}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-12 w-12 sm:h-10 sm:w-10 lg:h-10 lg:w-10"
          aria-label="Notificações"
        >
          <Bell className="h-9 w-9 sm:h-7 sm:w-7 lg:h-5 lg:w-5" />
          {countNaoLidas > 0 && (
            <span className="absolute top-0 right-0 flex h-5 w-5 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white border-2 border-white dark:border-neutral-900">
              {countNaoLidas > 9 ? '9+' : countNaoLidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="center" 
        side="bottom"
        sideOffset={8}
        className="w-80 sm:w-96"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-50">
            Notificações
          </h3>
          <div className="flex items-center gap-2">
            {countNaoLidas > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarcarTodasComoLidas}
                className="h-7 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const role = await obterRoleUsuario()
                const basePath = role === 'admin' ? '/admin' : role === 'revenda' ? '/revenda' : '/cliente'
                navigate(`${basePath}/notificacoes`)
                setAberto(false)
              }}
              className="h-7 text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              Configurar
            </Button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {carregando ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {notificacoes.map((notificacao) => (
                <div
                  key={notificacao.id}
                  className={cn(
                    'p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer relative group',
                    !notificacao.lida && 'bg-violet-50/50 dark:bg-violet-900/10'
                  )}
                  onClick={() => handleClickNotificacao(notificacao)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm text-neutral-900 dark:text-neutral-50">
                          {notificacao.titulo}
                        </h4>
                        {!notificacao.lida && (
                          <div className="w-2 h-2 rounded-full bg-violet-600 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
                        {notificacao.mensagem}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                        {formatarTempo(notificacao.criado_em)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notificacao.lida && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarcarComoLida(notificacao.id)
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600 dark:text-red-400"
                        onClick={(e) => handleDeletar(notificacao.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notificacoes.length > 0 && (
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={async () => {
                const role = await obterRoleUsuario()
                const basePath = role === 'admin' ? '/admin' : role === 'revenda' ? '/revenda' : '/cliente'
                navigate(`${basePath}/notificacoes`)
                setAberto(false)
              }}
            >
              Ver todas as notificações
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

