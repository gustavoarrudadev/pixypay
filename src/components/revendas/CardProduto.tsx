import { useState } from 'react'
import { Edit, Trash2, Package, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Produto } from '@/lib/gerenciarProduto'
import { gerarLinkProdutoExistente } from '@/lib/gerenciarProduto'
import { formatarPreco } from '@/lib/utils'
import { gerarUrlProdutoPublico } from '@/lib/lojaPublica'
import { toast } from 'sonner'
import { useEffect } from 'react'

interface CardProdutoProps {
  produto: Produto
  linkPublicoRevenda: string | null
  onEditar: (produto: Produto) => void
  onExcluir: (produtoId: string) => void
  onToggleAtivo: (produtoId: string, ativo: boolean) => Promise<void>
  onProdutoAtualizado?: (produto: Produto) => void
}

export function CardProduto({ produto, linkPublicoRevenda, onEditar, onExcluir, onToggleAtivo, onProdutoAtualizado }: CardProdutoProps) {
  const [alternando, setAlternando] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [gerandoLink, setGerandoLink] = useState(false)

  // Gera link automaticamente se não existir e revenda tem link público
  useEffect(() => {
    const gerarLinkAutomatico = async () => {
      if (linkPublicoRevenda && !produto.link_publico && !gerandoLink) {
        setGerandoLink(true)
        try {
          const { linkPublico, error } = await gerarLinkProdutoExistente(produto.id)
          if (error) {
            console.warn('⚠️ Não foi possível gerar link automaticamente:', error)
          } else if (linkPublico) {
            // Atualiza o produto localmente com o novo link
            if (onProdutoAtualizado) {
              onProdutoAtualizado({ ...produto, link_publico: linkPublico })
            } else {
              // Fallback: recarrega a página
              window.location.reload()
            }
          }
        } catch (error) {
          console.warn('⚠️ Erro ao gerar link automaticamente:', error)
        } finally {
          setGerandoLink(false)
        }
      }
    }

    gerarLinkAutomatico()
  }, [produto.id, produto.link_publico, linkPublicoRevenda])

  const handleToggleAtivo = async (checked: boolean) => {
    setAlternando(true)
    try {
      await onToggleAtivo(produto.id, checked)
    } finally {
      setAlternando(false)
    }
  }

  const handleCopiarLink = async () => {
    // Se não tem link, tenta gerar primeiro
    if (!produto.link_publico && linkPublicoRevenda && !gerandoLink) {
      setGerandoLink(true)
      try {
        const { linkPublico, error } = await gerarLinkProdutoExistente(produto.id)
        if (error || !linkPublico) {
          toast.error('Não foi possível gerar o link do produto')
          return
        }
        // Atualiza o produto localmente
        if (onProdutoAtualizado) {
          onProdutoAtualizado({ ...produto, link_publico: linkPublico })
        }
        // Usa o link gerado para copiar
        const urlProduto = gerarUrlProdutoPublico(linkPublicoRevenda, linkPublico)
        await navigator.clipboard.writeText(urlProduto)
        setLinkCopiado(true)
        toast.success('Link copiado!')
        setTimeout(() => setLinkCopiado(false), 2000)
        return
      } catch (error) {
        toast.error('Erro ao gerar link do produto')
        return
      } finally {
        setGerandoLink(false)
      }
    }

    if (!linkPublicoRevenda || !produto.link_publico) {
      toast.error('Link público não disponível')
      return
    }

    const urlProduto = gerarUrlProdutoPublico(linkPublicoRevenda, produto.link_publico)
    
    try {
      await navigator.clipboard.writeText(urlProduto)
      setLinkCopiado(true)
      toast.success('Link copiado!')
      setTimeout(() => setLinkCopiado(false), 2000)
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-neutral-100 dark:bg-neutral-800">
        {produto.imagem_url ? (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-neutral-400 dark:text-neutral-600" />
          </div>
        )}
        {!produto.ativo && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-medium">
              Inativo
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-1 line-clamp-2">
          {produto.nome}
        </h3>
        {produto.descricao && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
            {produto.descricao}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
            {formatarPreco(produto.preco)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Switch
              id={`ativo-${produto.id}`}
              checked={produto.ativo}
              onCheckedChange={handleToggleAtivo}
              disabled={alternando}
            />
            <Label
              htmlFor={`ativo-${produto.id}`}
              className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer"
            >
              {produto.ativo ? 'Ativo' : 'Inativo'}
            </Label>
          </div>
        </div>

        {/* Link Público */}
        {linkPublicoRevenda && produto.link_publico ? (
          <Button
            variant="outline"
            size="default"
            onClick={handleCopiarLink}
            disabled={gerandoLink}
            className="w-full h-10 border-neutral-300 dark:border-neutral-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-400 dark:hover:border-violet-600 hover:text-violet-700 dark:hover:text-violet-300 transition-all duration-200 hover:shadow-sm"
            title="Copiar link do produto"
          >
            {linkCopiado ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                <span className="font-medium">Link Copiado!</span>
              </>
            ) : gerandoLink ? (
              <>
                <Package className="w-5 h-5 mr-2 animate-spin" />
                <span className="font-medium">Gerando Link...</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 mr-2" />
                <span className="font-medium">Copiar Link do Produto</span>
              </>
            )}
          </Button>
        ) : linkPublicoRevenda && !produto.link_publico ? (
          <Button
            variant="outline"
            size="default"
            onClick={handleCopiarLink}
            disabled={gerandoLink}
            className="w-full h-10 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-400 dark:hover:border-amber-600 hover:text-amber-700 dark:hover:text-amber-300 transition-all duration-200 hover:shadow-sm"
            title="Gerar e copiar link do produto"
          >
            {linkCopiado ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                <span className="font-medium">Link Copiado!</span>
              </>
            ) : gerandoLink ? (
              <>
                <Package className="w-5 h-5 mr-2 animate-spin" />
                <span className="font-medium">Gerando Link...</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 mr-2" />
                <span className="font-medium">Gerar e Copiar Link</span>
              </>
            )}
          </Button>
        ) : null}

        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditar(produto)}
            className="flex-1 border-neutral-300 dark:border-neutral-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-800 hover:text-violet-700 dark:hover:text-violet-300"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExcluir(produto.id)}
            className="flex-1 border-neutral-300 dark:border-neutral-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

