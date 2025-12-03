import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { listarBannersAlertaAtivos, bannerFechado, fecharBanner, type BannerAlerta } from '@/lib/comunicacao'
import { cn } from '@/lib/utils'

export function BannerAlerta() {
  const [banners, setBanners] = useState<BannerAlerta[]>([])

  useEffect(() => {
    carregarBanners()
    // Verificar novos banners a cada 30 segundos
    const interval = setInterval(carregarBanners, 30000)
    return () => clearInterval(interval)
  }, [])

  const carregarBanners = async () => {
    const { banners: bannersData } = await listarBannersAlertaAtivos()
    // Filtrar banners que não foram fechados pelo usuário (ou já passou 1 hora)
    const bannersVisiveis = bannersData.filter((banner) => !bannerFechado(banner.id))
    setBanners(bannersVisiveis)
  }

  const handleFechar = (bannerId: string) => {
    fecharBanner(bannerId)
    setBanners((prev) => prev.filter((b) => b.id !== bannerId))
  }

  if (banners.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {banners.map((banner) => (
        <div
          key={banner.id}
          className={cn(
            'rounded-lg p-4 animate-slide-up-in',
            'flex items-start justify-between gap-4'
          )}
          style={{
            backgroundColor: banner.cor_bg,
            color: banner.cor_texto,
          }}
        >
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold mb-1">{banner.titulo}</h4>
            <p className="text-sm opacity-90">{banner.descricao}</p>
          </div>
          <button
            onClick={() => handleFechar(banner.id)}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            style={{ color: banner.cor_texto }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  )
}















