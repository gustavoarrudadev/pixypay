import { useState } from 'react'
import { Edit, Trash2, Power, PowerOff, MoreVertical, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dropdown } from '@/components/ui/dropdown'
import { Badge } from '@/components/ui/badge'
import { Colaborador } from '@/lib/colaboradores'
import { formatarData } from '@/lib/utils'

interface TabelaColaboradoresProps {
  colaboradores: Colaborador[]
  carregando: boolean
  onAtivarDesativar: (colaborador: Colaborador) => void
  onRemover: (colaborador: Colaborador) => void
  onEditar: (colaborador: Colaborador) => void
  onResetarSenha: (colaborador: Colaborador) => void
}

export function TabelaColaboradores({
  colaboradores,
  carregando,
  onAtivarDesativar,
  onRemover,
  onEditar,
  onResetarSenha,
}: TabelaColaboradoresProps) {
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null)
  if (carregando) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-500 dark:text-neutral-400">Carregando colaboradores...</p>
      </div>
    )
  }

  if (colaboradores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-neutral-500 dark:text-neutral-400 mb-2">
          Nenhum colaborador encontrado
        </p>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          Convide um colaborador para começar
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800">
            <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Nome
            </th>
            <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Email
            </th>
            <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Acesso
            </th>
            <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Status
            </th>
            <th className="text-left p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Criado em
            </th>
            <th className="text-right p-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {colaboradores.map((colaborador) => (
            <tr
              key={colaborador.id}
              className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
            >
              <td className="p-4">
                <div className="font-medium text-neutral-900 dark:text-neutral-50">
                  {colaborador.nome_completo}
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    {colaborador.email}
                  </div>
                </div>
              </td>
              <td className="p-4">
                {colaborador.unidade_id ? (
                  <Badge variant="outline" className="text-xs">
                    {colaborador.nome_unidade || 'Unidade específica'}
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-violet-600 hover:bg-violet-700 text-xs">
                    Todas as unidades
                  </Badge>
                )}
              </td>
              <td className="p-4">
                {colaborador.ativo ? (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inativo</Badge>
                )}
              </td>
              <td className="p-4">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {formatarData(colaborador.criado_em)}
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  <Dropdown
                    aberto={dropdownAberto === colaborador.id}
                    onToggle={(aberto) => setDropdownAberto(aberto ? colaborador.id : null)}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    }
                    alinhamento="inicio"
                  >
                    <div className="py-1 min-w-[180px]">
                      <button
                        type="button"
                        onClick={() => {
                          onEditar(colaborador)
                          setDropdownAberto(null)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors rounded-sm"
                      >
                        <Edit className="h-4 w-4 flex-shrink-0" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onResetarSenha(colaborador)
                          setDropdownAberto(null)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors rounded-sm"
                      >
                        <KeyRound className="h-4 w-4 flex-shrink-0" />
                        Resetar Senha
                      </button>
                      <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          onAtivarDesativar(colaborador)
                          setDropdownAberto(null)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors rounded-sm"
                      >
                        {colaborador.ativo ? (
                          <>
                            <PowerOff className="h-4 w-4 flex-shrink-0" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 flex-shrink-0" />
                            Ativar
                          </>
                        )}
                      </button>
                      <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          onRemover(colaborador)
                          setDropdownAberto(null)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-destructive hover:bg-destructive/10 transition-colors rounded-sm"
                      >
                        <Trash2 className="h-4 w-4 flex-shrink-0" />
                        Remover
                      </button>
                    </div>
                  </Dropdown>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

