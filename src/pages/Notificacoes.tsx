import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, Trash2, Settings, CheckCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  listarNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
  deletarNotificacao,
  limparNotificacoesLidas,
  buscarPreferenciasNotificacoes,
  atualizarPreferenciasNotificacoes,
  tocarSomNotificacao,
  type Notificacao,
  type PreferenciasNotificacoes,
} from '@/lib/gerenciarNotificacoes'
import { supabase } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function Notificacoes() {
  const navigate = useNavigate()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas'>('todas')
  const [preferencias, setPreferencias] = useState<PreferenciasNotificacoes | null>(null)
  const [carregandoPreferencias, setCarregandoPreferencias] = useState(true)
  const [salvandoPreferencias, setSalvandoPreferencias] = useState(false)
  const channelRef = useRef<any>(null)
  const somHabilitadoRef = useRef<boolean>(true)
  const criandoPreferenciasRef = useRef<boolean>(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const realtimeConectadoRef = useRef<boolean>(false)

  useEffect(() => {
    carregarDados()
    configurarRealtime()

    return () => {
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

  useEffect(() => {
    carregarNotificacoes()
  }, [filtro])

  const carregarDados = async () => {
    await Promise.all([carregarNotificacoes(), carregarPreferencias()])
  }

  const carregarNotificacoes = async (silencioso = false) => {
    if (!silencioso) {
      setCarregando(true)
    }
    try {
      const { notificacoes: notificacoesData, error } = await listarNotificacoes(
        filtro === 'nao_lidas'
      )

      if (error) {
        console.error('❌ Erro ao listar notificações:', error)
        if (!silencioso) {
          toast.error('Erro ao carregar notificações')
        }
        return
      }

      setNotificacoes(notificacoesData)
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error)
      if (!silencioso) {
        toast.error('Erro ao carregar notificações')
      }
    } finally {
      if (!silencioso) {
        setCarregando(false)
      }
    }
  }

  const iniciarPollingFallback = () => {
    // Só inicia polling se Realtime não estiver conectado e polling não estiver ativo
    if (!realtimeConectadoRef.current && !pollingIntervalRef.current) {
      console.log('🔄 Iniciando polling como fallback (a cada 5 segundos) - página')
      pollingIntervalRef.current = setInterval(() => {
        carregarNotificacoes(true) // true = silencioso (não mostra loading)
      }, 5000)
    }
  }

  const carregarPreferencias = async () => {
    setCarregandoPreferencias(true)
    try {
      const { preferencias: pref, error } = await buscarPreferenciasNotificacoes()

      if (error && error.message !== 'Usuário não autenticado') {
        console.error('❌ Erro ao buscar preferências:', error)
        setCarregandoPreferencias(false)
        return
      }

      if (pref) {
        setPreferencias(pref)
        somHabilitadoRef.current = pref.som_notificacoes
        setCarregandoPreferencias(false)
      } else {
        // Se não tem preferências, cria com padrões (apenas uma vez)
        if (criandoPreferenciasRef.current) {
          setCarregandoPreferencias(false)
          return
        }

        criandoPreferenciasRef.current = true
        const session = await obterSessao()
        if (session?.user) {
          const preferenciasPadrao = {
            receber_notificacoes: true,
            receber_pedidos: true,
            receber_status_pedidos: true,
            receber_parcelamentos: true,
            receber_parcelas_abertas: true,
            receber_parcelas_atrasadas: true,
            receber_agendamentos: true,
            receber_repasses: true,
            som_notificacoes: true,
          }
          const { error: createError } = await atualizarPreferenciasNotificacoes(preferenciasPadrao)
          if (!createError) {
            // Busca novamente após criar
            const { preferencias: novasPref } = await buscarPreferenciasNotificacoes()
            if (novasPref) {
              setPreferencias(novasPref)
              somHabilitadoRef.current = novasPref.som_notificacoes
            }
          }
        }
        criandoPreferenciasRef.current = false
        setCarregandoPreferencias(false)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar preferências:', error)
      criandoPreferenciasRef.current = false
      setCarregandoPreferencias(false)
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

      // Usa um nome único para evitar conflitos
      const channelName = `notificacoes-${session.user.id}-${Date.now()}`
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
            if (payload.eventType === 'INSERT') {
              // Busca preferências atualizadas antes de tocar som
              buscarPreferenciasNotificacoes().then(({ preferencias: pref }) => {
                if (pref?.som_notificacoes !== false) {
                  tocarSomNotificacao()
                }
              }).catch(() => {
                // Se não conseguir buscar preferências, toca som por padrão
                tocarSomNotificacao()
              })
            }
            
            // Atualiza imediatamente SEM recarregar
            if (payload.eventType === 'INSERT' && payload.new) {
              console.log('➕ Nova notificação na página:', payload.new)
              const novaNotificacao = payload.new as Notificacao
              
              setNotificacoes((prev) => {
                if (prev.some((n) => n.id === novaNotificacao.id)) {
                  console.log('⚠️ Notificação duplicada, ignorando')
                  return prev
                }
                const novas = [novaNotificacao, ...prev]
                console.log('✅ Notificações atualizadas:', novas.length)
                return novas
              })
            }
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Status do canal Realtime (página):', status, err)
          if (err) {
            console.error('❌ Erro no canal Realtime (página):', err)
          }
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Canal de notificações conectado na página')
            console.log('📡 Nome do canal:', channelName)
            
            // Marca Realtime como conectado
            realtimeConectadoRef.current = true
            
            // Para o polling se estiver ativo (Realtime está funcionando)
            if (pollingIntervalRef.current) {
              console.log('🛑 Parando polling - Realtime conectado (página)')
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
          } else if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.warn(`⚠️ Realtime não conectado (página): ${status}`)
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
      toast.error('Erro ao marcar como lida')
      return
    }

    setNotificacoes((prev) =>
      prev.map((n) =>
        n.id === notificacaoId ? { ...n, lida: true, lida_em: new Date().toISOString() } : n
      )
    )
    toast.success('Notificação marcada como lida')
  }

  const handleMarcarTodasComoLidas = async () => {
    const { error } = await marcarTodasComoLidas()
    if (error) {
      toast.error('Erro ao marcar todas como lidas')
      return
    }

    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true, lida_em: new Date().toISOString() })))
    toast.success('Todas as notificações foram marcadas como lidas')
  }

  const handleDeletar = async (notificacaoId: string) => {
    const { error } = await deletarNotificacao(notificacaoId)
    if (error) {
      toast.error('Erro ao deletar notificação')
      return
    }

    setNotificacoes((prev) => prev.filter((n) => n.id !== notificacaoId))
    toast.success('Notificação deletada')
  }

  const handleLimparLidas = async () => {
    const { error } = await limparNotificacoesLidas()
    if (error) {
      toast.error('Erro ao limpar notificações lidas')
      return
    }

    setNotificacoes((prev) => prev.filter((n) => !n.lida))
    toast.success('Notificações lidas removidas')
  }

  const handleAtualizarPreferencias = async (campo: keyof PreferenciasNotificacoes, valor: boolean) => {
    setSalvandoPreferencias(true)
    try {
      // Se não tem preferências, cria com padrões primeiro
      let prefParaAtualizar = preferencias
      if (!prefParaAtualizar) {
        const preferenciasPadrao = {
          receber_notificacoes: true,
          receber_pedidos: true,
          receber_status_pedidos: true,
          receber_parcelamentos: true,
          receber_parcelas_abertas: true,
          receber_parcelas_atrasadas: true,
          receber_agendamentos: true,
          receber_repasses: true,
          som_notificacoes: true,
        }
        const { error: createError } = await atualizarPreferenciasNotificacoes(preferenciasPadrao)
        if (createError) {
          toast.error('Erro ao criar preferências')
          return
        }
        // Busca as preferências recém criadas
        const { preferencias: novasPref } = await buscarPreferenciasNotificacoes()
        if (!novasPref) {
          toast.error('Erro ao buscar preferências criadas')
          return
        }
        prefParaAtualizar = novasPref
      }

      const novasPreferencias = { ...prefParaAtualizar, [campo]: valor }
      const { error } = await atualizarPreferenciasNotificacoes(novasPreferencias)

      if (error) {
        toast.error('Erro ao atualizar preferências')
        return
      }

      setPreferencias(novasPreferencias)
      somHabilitadoRef.current = novasPreferencias.som_notificacoes
      toast.success('Preferências atualizadas')
    } catch (error) {
      console.error('❌ Erro ao atualizar preferências:', error)
      toast.error('Erro ao atualizar preferências')
    } finally {
      setSalvandoPreferencias(false)
    }
  }

  const handleClickNotificacao = (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      handleMarcarComoLida(notificacao.id)
    }

    if (notificacao.link) {
      navigate(notificacao.link)
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
    return criado.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Removido getIconePorTipo - não usar mais ícones/emojis

  const notificacoesLidas = notificacoes.filter((n) => n.lida).length
  const notificacoesNaoLidas = notificacoes.filter((n) => !n.lida).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-violet-600 dark:text-violet-400" />
          Notificações
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Gerencie suas notificações e preferências
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Notificações */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filtros e Ações */}
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={filtro === 'todas' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltro('todas')}
                  className="flex-shrink-0"
                >
                  Todas ({notificacoes.length})
                </Button>
                <Button
                  variant={filtro === 'nao_lidas' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltro('nao_lidas')}
                  className="flex-shrink-0"
                >
                  Não lidas ({notificacoesNaoLidas})
                </Button>
                {notificacoesLidas > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLimparLidas}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                )}
                {notificacoesNaoLidas > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarcarTodasComoLidas}
                    className="flex-shrink-0 ml-auto"
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Marcar todas
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista */}
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardContent className="p-0">
              {carregando ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notificacoes.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Bell className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mb-4" />
                  <p className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                    Nenhuma notificação
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {filtro === 'nao_lidas'
                      ? 'Você não tem notificações não lidas'
                      : 'Você não tem notificações'}
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
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-base text-neutral-900 dark:text-neutral-50">
                              {notificacao.titulo}
                            </h4>
                            {!notificacao.lida && (
                              <div className="w-2.5 h-2.5 rounded-full bg-violet-600 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            {notificacao.mensagem}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                            {formatarTempo(notificacao.criado_em)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notificacao.lida && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarcarComoLida(notificacao.id)
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 dark:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletar(notificacao.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preferências */}
        <div className="space-y-4">
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                Preferências
              </CardTitle>
              <CardDescription>
                Configure quais notificações você quer receber
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {carregandoPreferencias ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Carregando preferências...
                  </p>
                </div>
              ) : preferencias ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="receber_notificacoes" className="cursor-pointer">
                      Receber Notificações
                    </Label>
                    <Switch
                      id="receber_notificacoes"
                      checked={preferencias.receber_notificacoes}
                      onCheckedChange={(checked) =>
                        handleAtualizarPreferencias('receber_notificacoes', checked)
                      }
                      disabled={salvandoPreferencias}
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="receber_pedidos" className="cursor-pointer text-sm">
                        Novos Pedidos
                      </Label>
                      <Switch
                        id="receber_pedidos"
                        checked={preferencias.receber_pedidos}
                        onCheckedChange={(checked) =>
                          handleAtualizarPreferencias('receber_pedidos', checked)
                        }
                        disabled={salvandoPreferencias || !preferencias.receber_notificacoes}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="receber_status_pedidos" className="cursor-pointer text-sm">
                        Status de Pedidos
                      </Label>
                      <Switch
                        id="receber_status_pedidos"
                        checked={preferencias.receber_status_pedidos}
                        onCheckedChange={(checked) =>
                          handleAtualizarPreferencias('receber_status_pedidos', checked)
                        }
                        disabled={salvandoPreferencias || !preferencias.receber_notificacoes}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="receber_parcelamentos" className="cursor-pointer text-sm">
                        Parcelamentos
                      </Label>
                      <Switch
                        id="receber_parcelamentos"
                        checked={preferencias.receber_parcelamentos}
                        onCheckedChange={(checked) =>
                          handleAtualizarPreferencias('receber_parcelamentos', checked)
                        }
                        disabled={salvandoPreferencias || !preferencias.receber_notificacoes}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="receber_parcelas_abertas" className="cursor-pointer text-sm">
                        Parcelas Abertas
                      </Label>
                      <Switch
                        id="receber_parcelas_abertas"
                        checked={preferencias.receber_parcelas_abertas}
                        onCheckedChange={(checked) =>
                          handleAtualizarPreferencias('receber_parcelas_abertas', checked)
                        }
                        disabled={salvandoPreferencias || !preferencias.receber_notificacoes}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="receber_parcelas_atrasadas" className="cursor-pointer text-sm">
                        Parcelas Atrasadas
                      </Label>
                      <Switch
                        id="receber_parcelas_atrasadas"
                        checked={preferencias.receber_parcelas_atrasadas}
                        onCheckedChange={(checked) =>
                          handleAtualizarPreferencias('receber_parcelas_atrasadas', checked)
                        }
                        disabled={salvandoPreferencias || !preferencias.receber_notificacoes}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="receber_agendamentos" className="cursor-pointer text-sm">
                        Agendamentos
                      </Label>
                      <Switch
                        id="receber_agendamentos"
                        checked={preferencias.receber_agendamentos}
                        onCheckedChange={(checked) =>
                          handleAtualizarPreferencias('receber_agendamentos', checked)
                        }
                        disabled={salvandoPreferencias || !preferencias.receber_notificacoes}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="receber_repasses" className="cursor-pointer text-sm">
                        Repasses
                      </Label>
                      <Switch
                        id="receber_repasses"
                        checked={preferencias.receber_repasses}
                        onCheckedChange={(checked) =>
                          handleAtualizarPreferencias('receber_repasses', checked)
                        }
                        disabled={salvandoPreferencias || !preferencias.receber_notificacoes}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <Label htmlFor="som_notificacoes" className="cursor-pointer text-sm">
                        Som de Notificações
                      </Label>
                      <Switch
                        id="som_notificacoes"
                        checked={preferencias.som_notificacoes}
                        onCheckedChange={(checked) =>
                          handleAtualizarPreferencias('som_notificacoes', checked)
                        }
                        disabled={salvandoPreferencias}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Carregando preferências...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

