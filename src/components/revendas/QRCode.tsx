import { useEffect, useRef } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QRCodeProps {
  url: string
  size?: number
  className?: string
}

/**
 * Componente QR Code que gera um código QR para uma URL
 * Usa API externa para gerar o QR Code
 */
export function QRCode({ url, size = 200, className }: QRCodeProps) {
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!url) return

    // Usa API do QR Server para gerar QR Code
    // Formato: https://api.qrserver.com/v1/create-qr-code/?size={size}x{size}&data={url}
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=1`
    
    if (imgRef.current) {
      imgRef.current.src = qrUrl
    }
  }, [url, size])

  const handleDownload = () => {
    if (!imgRef.current || !url) return

    // Extrai o link público da URL para nomear o arquivo
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(p => p)
    const linkPublico = pathParts[pathParts.length - 1] || 'loja-publica'

    // Cria um link temporário para download
    const link = document.createElement('a')
    link.href = imgRef.current.src
    link.download = `qr-code-${linkPublico}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!url) {
    return (
      <div 
        className={`flex items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 ${className}`}
        style={{ width: size, height: size }}
      >
        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center px-2">
          Configure o link público para gerar o QR Code
        </p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative border-2 border-neutral-200 dark:border-neutral-800 rounded-lg p-2 bg-white dark:bg-neutral-900">
        <img
          ref={imgRef}
          alt="QR Code"
          className="block"
          style={{ width: size, height: size }}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="border-neutral-300 dark:border-neutral-700"
      >
        <Download className="w-4 h-4 mr-2" />
        Baixar QR Code
      </Button>
    </div>
  )
}

