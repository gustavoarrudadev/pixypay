import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UploadImagem } from './UploadImagem'
import { SelecionarUnidade } from './SelecionarUnidade'
import { SelecionarTipoProduto } from './SelecionarTipoProduto'
import { FormBotijao } from './FormBotijao'
import { FormGalaoAgua } from './FormGalaoAgua'
import { FormEquipamento } from './FormEquipamento'
import type { Produto, DadosProduto } from '@/lib/gerenciarProduto'
import type { TipoProduto } from '@/lib/produtosPadrao'

const schemaProduto = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  descricao: z.string().max(1000, 'Descrição muito longa').optional().or(z.literal('')),
  preco: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  imagem_url: z.string().nullable().optional(),
  ativo: z.boolean().optional(),
})

type FormData = z.infer<typeof schemaProduto>

interface FormProdutoProps {
  produto?: Produto | null
  revendaId: string
  produtoId?: string | null
  unidadeIdPadrao?: string | null
  onSalvar: (dados: DadosProduto) => Promise<void>
  onCancelar: () => void
  salvando?: boolean
}

export function FormProduto({
  produto,
  revendaId,
  produtoId = null,
  unidadeIdPadrao = null,
  onSalvar,
  onCancelar,
  salvando = false,
}: FormProdutoProps) {
  // Estados para fluxo em etapas (apenas para criação)
  const [tipoProdutoSelecionado, setTipoProdutoSelecionado] = useState<TipoProduto | null>(
    produto ? null : null // Se for edição, não mostra seleção de tipo
  )
  const [produtoPreConfigurado, setProdutoPreConfigurado] = useState<{
    nome: string
    imagemUrl: string
  } | null>(null)

  const [imagemUrl, setImagemUrl] = useState<string | null>(produto?.imagem_url || null)
  const [unidadeId, setUnidadeId] = useState<string | null>(produto?.unidade_id || unidadeIdPadrao || null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schemaProduto),
    defaultValues: {
      nome: produto?.nome || '',
      descricao: produto?.descricao || '',
      preco: produto?.preco || 0,
      imagem_url: produto?.imagem_url || null,
      ativo: produto?.ativo !== undefined ? produto.ativo : true,
    },
  })

  const preco = watch('preco')

  useEffect(() => {
    setValue('imagem_url', imagemUrl)
  }, [imagemUrl, setValue])

  // Quando produto pré-configurado é selecionado, atualiza os campos
  useEffect(() => {
    if (produtoPreConfigurado) {
      setValue('nome', produtoPreConfigurado.nome)
      setImagemUrl(produtoPreConfigurado.imagemUrl)
      setValue('imagem_url', produtoPreConfigurado.imagemUrl)
    }
  }, [produtoPreConfigurado, setValue])

  // Quando tipo personalizado é selecionado, marca como pré-configurado vazio
  useEffect(() => {
    if (tipoProdutoSelecionado === 'personalizado' && !produtoPreConfigurado) {
      setProdutoPreConfigurado({
        nome: '',
        imagemUrl: '',
      })
    }
  }, [tipoProdutoSelecionado, produtoPreConfigurado])

  const onSubmit = async (data: FormData) => {
    await onSalvar({
      nome: data.nome,
      descricao: data.descricao || undefined,
      preco: data.preco,
      imagem_url: imagemUrl || null,
      ativo: data.ativo !== undefined ? data.ativo : true,
      unidade_id: unidadeId,
    })
  }

  // Se for criação e ainda não selecionou tipo, mostra seleção de tipo
  if (!produto && !tipoProdutoSelecionado) {
    return (
      <div className="space-y-6">
        <SelecionarTipoProduto
          onSelecionarTipo={(tipo) => {
            setTipoProdutoSelecionado(tipo)
          }}
        />
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancelar}
            className="flex-1 border-neutral-300 dark:border-neutral-700"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  // Se selecionou tipo mas ainda não configurou o produto específico
  if (!produto && tipoProdutoSelecionado && !produtoPreConfigurado) {
    if (tipoProdutoSelecionado === 'botijoes') {
      return (
        <FormBotijao
          onVoltar={() => setTipoProdutoSelecionado(null)}
          onSelecionar={(config) => {
            setProdutoPreConfigurado({
              nome: config.nome,
              imagemUrl: config.imagemUrl,
            })
          }}
        />
      )
    }

    if (tipoProdutoSelecionado === 'galaodeagua') {
      return (
        <FormGalaoAgua
          onVoltar={() => setTipoProdutoSelecionado(null)}
          onSelecionar={(config) => {
            setProdutoPreConfigurado({
              nome: config.nome,
              imagemUrl: config.imagemUrl,
            })
          }}
        />
      )
    }

    if (tipoProdutoSelecionado === 'equipamentos') {
      return (
        <FormEquipamento
          onVoltar={() => setTipoProdutoSelecionado(null)}
          onSelecionar={(config) => {
            setProdutoPreConfigurado({
              nome: config.nome,
              imagemUrl: config.imagemUrl,
            })
          }}
        />
      )
    }

    // Personalizado - vai direto para o formulário completo (não precisa pré-configuração)
    // O useEffect acima já marca como pré-configurado vazio, então só precisa aguardar
    if (tipoProdutoSelecionado === 'personalizado' && !produtoPreConfigurado) {
      return null // Aguarda o useEffect atualizar o estado
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Upload de Imagem - apenas para personalizado ou edição */}
      {(tipoProdutoSelecionado === 'personalizado' || produto) && (
        <UploadImagem
          revendaId={revendaId}
          produtoId={produtoId}
          tipo="produto"
          valorInicial={imagemUrl}
          onUploadComplete={(url) => {
            setImagemUrl(url || null)
            setValue('imagem_url', url || null)
          }}
          onError={(mensagem) => {
            console.error('Erro no upload:', mensagem)
          }}
        />
      )}

      {/* Preview da imagem para produtos pré-configurados */}
      {!produto && produtoPreConfigurado && produtoPreConfigurado.imagemUrl && tipoProdutoSelecionado !== 'personalizado' && (
        <div className="space-y-2">
          <Label className="text-neutral-700 dark:text-neutral-300">
            Imagem do Produto
          </Label>
          <div className="w-full h-48 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
            <img
              src={produtoPreConfigurado.imagemUrl}
              alt={produtoPreConfigurado.nome}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Imagem pré-configurada do produto
          </p>
        </div>
      )}

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="nome" className="text-neutral-700 dark:text-neutral-300">
          Nome do Produto *
        </Label>
        <Input
          id="nome"
          {...register('nome')}
          placeholder="Ex: Produto Exemplo"
          disabled={salvando || (!produto && produtoPreConfigurado && tipoProdutoSelecionado !== 'personalizado')}
          className={errors.nome ? 'border-red-300 dark:border-red-700' : ''}
        />
        {errors.nome && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.nome.message}</p>
        )}
        {!produto && produtoPreConfigurado && tipoProdutoSelecionado !== 'personalizado' && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Nome pré-configurado do produto padrão
          </p>
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao" className="text-neutral-700 dark:text-neutral-300">
          Descrição
        </Label>
        <textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Descreva o produto..."
          rows={4}
          disabled={salvando}
          className={`
            flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm
            ring-offset-background placeholder:text-muted-foreground
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50 transition-colors
            ${errors.descricao ? 'border-red-300 dark:border-red-700' : ''}
          `}
        />
        {errors.descricao && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.descricao.message}</p>
        )}
      </div>

      {/* Unidade */}
      <div className="space-y-2">
        <Label className="text-neutral-700 dark:text-neutral-300">
          Unidade *
        </Label>
        <SelecionarUnidade
          value={unidadeId}
          onValueChange={setUnidadeId}
          placeholder="Selecionar unidade"
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Selecione a unidade onde este produto estará disponível
        </p>
      </div>

      {/* Preço */}
      <div className="space-y-2">
        <Label htmlFor="preco" className="text-neutral-700 dark:text-neutral-300">
          Preço (R$) *
        </Label>
        <Input
          id="preco"
          type="number"
          step="0.01"
          min="0"
          {...register('preco', { valueAsNumber: true })}
          placeholder="0.00"
          disabled={salvando}
          className={errors.preco ? 'border-red-300 dark:border-red-700' : ''}
        />
        {errors.preco && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.preco.message}</p>
        )}
        {preco >= 0 && !errors.preco && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(preco || 0)}
          </p>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancelar}
          disabled={salvando}
          className="flex-1 border-neutral-300 dark:border-neutral-700"
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={salvando}
          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
        >
          {salvando ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {produto ? 'Salvar Alterações' : 'Criar Produto'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

