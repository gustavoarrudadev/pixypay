import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadImagemProduto, uploadLogoRevenda, deletarImagem, type UploadResult } from '@/lib/storage'

interface UploadImagemProps {
  revendaId: string
  produtoId?: string | null
  tipo: 'produto' | 'logo'
  valorInicial?: string | null
  onUploadComplete: (url: string) => void
  onError?: (mensagem: string) => void
  className?: string
}

export function UploadImagem({
  revendaId,
  produtoId = null,
  tipo,
  valorInicial = null,
  onUploadComplete,
  onError,
  className,
}: UploadImagemProps) {
  const [preview, setPreview] = useState<string | null>(valorInicial || null)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Valida tipo
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!tiposPermitidos.includes(file.type)) {
      const mensagem = 'Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.'
      setErro(mensagem)
      onError?.(mensagem)
      return
    }

    // Valida tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      const mensagem = 'Arquivo muito grande. Tamanho máximo: 5MB.'
      setErro(mensagem)
      onError?.(mensagem)
      return
    }

    // Cria preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Faz upload
    setUploading(true)
    setErro(null)

    let resultado: UploadResult

    if (tipo === 'produto') {
      resultado = await uploadImagemProduto(file, revendaId, produtoId)
    } else {
      resultado = await uploadLogoRevenda(file, revendaId)
    }

    setUploading(false)

    if (resultado.error || !resultado.url) {
      const mensagem = resultado.mensagem || 'Erro ao fazer upload da imagem.'
      setErro(mensagem)
      onError?.(mensagem)
      setPreview(valorInicial)
      return
    }

    // Se o upload foi bem-sucedido e havia uma imagem anterior, deleta a anterior
    const imagemAnterior = valorInicial
    if (imagemAnterior && imagemAnterior.trim().length > 0 && imagemAnterior !== resultado.url) {
      try {
        const { error: deleteError } = await deletarImagem(imagemAnterior)
        if (deleteError) {
          console.warn('⚠️ Aviso: Não foi possível deletar a imagem anterior:', deleteError)
          // Continua mesmo se não conseguir deletar a anterior
        } else {
          console.log('✅ Imagem anterior deletada com sucesso')
        }
      } catch (error) {
        console.warn('⚠️ Aviso: Erro ao tentar deletar imagem anterior:', error)
        // Continua mesmo se não conseguir deletar a anterior
      }
    }

    setErro(null)
    onUploadComplete(resultado.url)
  }

  const handleRemove = async () => {
    // Se havia uma imagem do storage (não da pasta public), deleta antes de remover
    if (valorInicial && valorInicial.trim().length > 0 && !valorInicial.startsWith('/produtos/')) {
      try {
        await deletarImagem(valorInicial)
        console.log('✅ Imagem removida do storage')
      } catch (error) {
        console.warn('⚠️ Aviso: Não foi possível deletar a imagem do storage:', error)
        // Continua removendo mesmo se não conseguir deletar
      }
    }

    setPreview(null)
    setErro(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onUploadComplete('')
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {tipo === 'produto' ? 'Imagem do Produto' : 'Logo da Revenda'}
        </label>

        {preview ? (
          <div className="relative group">
            <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleRemove}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={handleClick}
            className={`
              relative w-full h-48 rounded-lg border-2 border-dashed
              flex flex-col items-center justify-center gap-4
              cursor-pointer transition-colors
              ${erro
                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? (
              <>
                <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Fazendo upload...
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Clique para fazer upload
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    JPG, PNG ou WEBP (máx. 5MB)
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Informação de tamanho recomendado sempre abaixo da imagem */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
          {tipo === 'logo' 
            ? 'Tamanho recomendado: 512x512px (quadrado)'
            : 'Tamanho recomendado: 1200x1200px (quadrado)'
          }
        </p>

        {erro && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
          </div>
        )}
      </div>
    </div>
  )
}

