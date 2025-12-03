import { useTheme } from '@/contexts/ThemeContext'
import { useState } from 'react'

interface LogoProps {
  className?: string
  width?: number
  height?: number
  showText?: boolean
  textClassName?: string
  variant?: 'icon' | 'full'
}

export function Logo({ 
  className = '', 
  width, 
  height, 
  showText = false, 
  textClassName = '',
  variant = 'icon'
}: LogoProps) {
  const [erroImagem, setErroImagem] = useState(false)
  
  // Obtém o tema (deve estar dentro do ThemeProvider)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Tamanhos padrão baseados no variant
  const defaultWidth = variant === 'full' ? 180 : (width || 40)
  const defaultHeight = variant === 'full' ? 60 : (height || 40)

  // URLs das logos com encoding correto para espaços
  const logoUrl = isDark 
    ? encodeURI('/Logo Branca.png')
    : encodeURI('/Logo Normal.png')

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!erroImagem && (
        <img
          src={logoUrl}
          alt="Pixy Pay"
          width={defaultWidth}
          height={defaultHeight}
          className="object-contain"
          onError={() => {
            setErroImagem(true)
            console.warn('Erro ao carregar logo:', logoUrl)
          }}
        />
      )}
      {erroImagem && !showText && (
        <div 
          className="rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center"
          style={{ width: defaultWidth, height: defaultHeight }}
        >
          <span className="text-white font-bold text-sm">PP</span>
        </div>
      )}
      {showText && (
        <h1 className={`text-xl font-bold text-neutral-900 dark:text-neutral-50 ${textClassName}`}>
          Pixy Pay
        </h1>
      )}
    </div>
  )
}

