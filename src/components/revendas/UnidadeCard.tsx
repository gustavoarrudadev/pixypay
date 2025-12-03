import { Store, Edit, Copy, Trash2, Eye, QrCode, Package, Link as LinkIcon, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type UnidadeRevenda } from '@/lib/gerenciarUnidades'
import { formatarPreco } from '@/lib/utils'
import { QRCode } from './QRCode'

interface UnidadeCardProps {
  unidade: UnidadeRevenda
  totalProdutos?: number
  onEditar: (unidade: UnidadeRevenda) => void
  onExcluir: (unidade: UnidadeRevenda) => void
  onVerLoja?: (linkPublico: string) => void
  onCopiarLink?: (linkPublico: string) => void
}

/**
 * Card para exibir informações de uma unidade
 */
export function UnidadeCard({
  unidade,
  totalProdutos = 0,
  onEditar,
  onExcluir,
  onVerLoja,
  onCopiarLink,
}: UnidadeCardProps) {
  const urlCompleta = unidade.link_publico
    ? `${window.location.origin}/loja/${unidade.link_publico}`
    : null

  const handleCopiarLink = () => {
    if (urlCompleta && onCopiarLink) {
      navigator.clipboard.writeText(urlCompleta)
      onCopiarLink(unidade.link_publico!)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Store className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg flex items-center gap-2">
                {unidade.nome}
                {unidade.ativo ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ativa
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inativa
                  </Badge>
                )}
              </CardTitle>
              {unidade.nome_publico && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  {unidade.nome_publico}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEditar(unidade)}
              className="h-8 w-8"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onExcluir(unidade)}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações da unidade */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-neutral-500 dark:text-neutral-400">Produtos</p>
            <p className="font-medium flex items-center gap-1">
              <Package className="w-4 h-4" />
              {totalProdutos}
            </p>
          </div>
          <div>
            <p className="text-neutral-500 dark:text-neutral-400">Taxa de Entrega</p>
            <p className="font-medium">{formatarPreco(unidade.taxa_entrega)}</p>
          </div>
        </div>

        {/* Link público e QR Code */}
        {unidade.link_publico && urlCompleta ? (
          <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Link Público</p>
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <p className="text-sm font-mono truncate">{unidade.link_publico}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {onVerLoja && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onVerLoja(unidade.link_publico!)}
                    className="h-8 w-8"
                    title="Ver loja pública"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                {onCopiarLink && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopiarLink}
                    className="h-8 w-8"
                    title="Copiar link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            {unidade.link_publico_ativo ? (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">QR Code</p>
                  <div className="bg-white p-2 rounded border border-neutral-200 dark:border-neutral-800 inline-block">
                    <QRCode url={urlCompleta} size={80} />
                  </div>
                </div>
              </div>
            ) : (
              <Badge variant="secondary" className="w-fit">
                Link desativado
              </Badge>
            )}
          </div>
        ) : (
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Configure o link público para gerar QR Code
            </p>
          </div>
        )}

        {/* Opções de entrega */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Opções de Entrega</p>
          <div className="flex flex-wrap gap-2">
            {unidade.oferecer_entrega && (
              <Badge variant="outline" className="text-xs">Entrega</Badge>
            )}
            {unidade.oferecer_retirada_local && (
              <Badge variant="outline" className="text-xs">Retirada</Badge>
            )}
            {unidade.oferecer_agendamento && (
              <Badge variant="outline" className="text-xs">Agendamento</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}





















