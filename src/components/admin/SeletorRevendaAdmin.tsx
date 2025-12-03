import { useState, useEffect } from 'react'
import { Store, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SelectMenu } from '@/components/ui/select-menu'
import { listarRevendas, type RevendaCompleta } from '@/lib/gerenciarRevenda'
import { supabase } from '@/lib/supabase'

interface SeletorRevendaAdminProps {
  revendaSelecionada: string | null
  onRevendaSelecionada: (revendaId: string | null) => void
  obrigatorio?: boolean
}

export function SeletorRevendaAdmin({ 
  revendaSelecionada, 
  onRevendaSelecionada,
  obrigatorio = true 
}: SeletorRevendaAdminProps) {
  const [revendas, setRevendas] = useState<RevendaCompleta[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    carregarRevendas()
  }, [])

  const carregarRevendas = async () => {
    try {
      setCarregando(true)
      setErro(null)
      const { revendas: revendasData, error } = await listarRevendas()
      
      if (error) {
        setErro('Erro ao carregar revendas')
        console.error('Erro ao carregar revendas:', error)
        setCarregando(false)
        return
      }

      // Filtrar apenas revendas que têm pedidos ou transações financeiras
      if (revendasData && revendasData.length > 0) {
        // Buscar revendas que têm pedidos
        const { data: pedidosData } = await supabase
          .from('pedidos')
          .select('revenda_id')
          .not('revenda_id', 'is', null)
        
        const revendasComPedidos = new Set(
          pedidosData?.map((p: any) => p.revenda_id).filter(Boolean) || []
        )
        
        // Buscar revendas que têm transações financeiras
        const { data: transacoesData } = await supabase
          .from('transacoes_financeiras')
          .select('revenda_id')
          .not('revenda_id', 'is', null)
        
        const revendasComTransacoes = new Set(
          transacoesData?.map((t: any) => t.revenda_id).filter(Boolean) || []
        )
        
        // Combinar: revendas com pedidos OU com transações
        const todasRevendasRelevantes = new Set([
          ...Array.from(revendasComPedidos),
          ...Array.from(revendasComTransacoes)
        ])
        
        const revendasFiltradas = revendasData.filter(revenda => 
          todasRevendasRelevantes.has(revenda.id)
        )
        
        console.log('✅ [SeletorRevendaAdmin] Revendas filtradas:', {
          total: revendasData.length,
          comPedidos: revendasComPedidos.size,
          comTransacoes: revendasComTransacoes.size,
          filtradas: revendasFiltradas.length
        })
        
        // Se não houver revendas filtradas, mostra todas (caso não tenha pedidos ainda)
        setRevendas(revendasFiltradas.length > 0 ? revendasFiltradas : revendasData)
      } else {
        setRevendas([])
      }
      
      setCarregando(false)
    } catch (error) {
      setErro('Erro inesperado ao carregar revendas')
      console.error('Erro inesperado:', error)
      setCarregando(false)
    }
  }

  const opcoesRevendas = [
    { value: '', label: 'Selecione uma revenda...' },
    ...revendas.map(revenda => ({
      value: revenda.id,
      label: revenda.nome_revenda || revenda.id.slice(0, 8)
    }))
  ]

  return (
    <Card className="border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <Store className="w-5 h-5" />
            <span className="font-semibold">Filtrar por Revenda</span>
          </div>
          
          <div className="flex-1 max-w-md">
            <SelectMenu
              value={revendaSelecionada || ''}
              onChange={(value) => {
                onRevendaSelecionada(value === '' ? null : value)
              }}
              options={opcoesRevendas}
              disabled={carregando}
            />
          </div>

          {obrigatorio && !revendaSelecionada && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Selecione uma revenda para visualizar os dados</span>
            </div>
          )}

          {revendaSelecionada && (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {revendas.find(r => r.id === revendaSelecionada)?.nome_revenda || 'Revenda selecionada'}
            </div>
          )}
        </div>

        {erro && (
          <div className="mt-3 p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

