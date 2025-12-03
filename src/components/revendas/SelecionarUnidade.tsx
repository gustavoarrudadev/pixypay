import { useState, useEffect } from 'react'
import { Store, Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { listarUnidades, type UnidadeRevenda } from '@/lib/gerenciarUnidades'
import { obterRevendaId } from '@/lib/impersonation'

interface SelecionarUnidadeProps {
  value?: string | null
  onValueChange: (unidadeId: string | null) => void
  onCriarNova?: () => void
  placeholder?: string
  className?: string
}

/**
 * Componente para selecionar unidade de revenda
 * Mostra dropdown com unidades disponíveis e opção de criar nova
 */
export function SelecionarUnidade({
  value,
  onValueChange,
  onCriarNova,
  placeholder = 'Selecionar unidade',
  className,
}: SelecionarUnidadeProps) {
  const [unidades, setUnidades] = useState<UnidadeRevenda[]>([])
  const [carregando, setCarregando] = useState(true)
  const [revendaId, setRevendaId] = useState<string | null>(null)

  useEffect(() => {
    carregarUnidades()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const carregarUnidades = async () => {
    setCarregando(true)
    try {
      const revendaIdAtual = await obterRevendaId()
      if (!revendaIdAtual) {
        console.error('❌ Revenda ID não encontrado')
        return
      }

      setRevendaId(revendaIdAtual)
      const { unidades: unidadesData, error } = await listarUnidades(revendaIdAtual)

      if (error) {
        console.error('❌ Erro ao carregar unidades:', error)
        return
      }

      const unidadesCarregadas = unidadesData || []
      setUnidades(unidadesCarregadas)
      
      // Se não há unidade selecionada e há unidades disponíveis, seleciona a primeira
      if (!value && unidadesCarregadas.length > 0) {
        console.log('✅ Selecionando primeira unidade automaticamente:', unidadesCarregadas[0].id)
        onValueChange(unidadesCarregadas[0].id)
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar unidades:', error)
    } finally {
      setCarregando(false)
    }
  }

  const unidadeSelecionada = value
    ? unidades.find((u) => u.id === value)
    : null

  const textoExibido = carregando
    ? 'Carregando...'
    : unidadeSelecionada
    ? unidadeSelecionada.nome
    : unidades.length > 0
    ? 'Selecione uma unidade'
    : 'Nenhuma unidade cadastrada'

  return (
    <div className={`flex gap-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex-1 justify-between" disabled={carregando}>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-neutral-500" />
              <span>{textoExibido}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
          {unidades.length === 0 ? (
            <DropdownMenuItem disabled>
              Nenhuma unidade cadastrada
            </DropdownMenuItem>
          ) : (
            unidades.map((unidade) => (
              <DropdownMenuItem
                key={unidade.id}
                onClick={() => {
                  console.log('✅ Unidade selecionada:', unidade.id, unidade.nome)
                  onValueChange(unidade.id)
                }}
                className={value === unidade.id ? 'bg-violet-50 dark:bg-violet-900/20' : ''}
              >
                {unidade.nome} {!unidade.ativo && '(Inativa)'}
              </DropdownMenuItem>
            ))
          )}
          {onCriarNova && (
            <>
              <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
              <DropdownMenuItem
                onClick={onCriarNova}
                className="text-violet-600 dark:text-violet-400"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Unidade
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

