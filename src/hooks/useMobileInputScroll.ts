import { useEffect } from 'react'

/**
 * Hook para melhorar a experiência de inputs no mobile
 * - Previne zoom automático (via CSS: font-size: 16px)
 * - Faz scroll suave até o campo quando focado
 * - A página volta ao normal quando o teclado fecha (sem scroll forçado)
 */
export function useMobileInputScroll() {
  useEffect(() => {
    // Verifica se está em mobile
    const isMobile = window.innerWidth <= 768

    if (!isMobile) return

    let activeInput: HTMLElement | null = null
    let originalScrollY = 0

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      
      // Verifica se é um input, textarea ou select
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        activeInput = target
        originalScrollY = window.scrollY
        
        // Aguarda um pouco para o teclado aparecer
        setTimeout(() => {
          if (activeInput) {
            // Faz scroll suave até o campo, centralizando na tela
            activeInput.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest',
            })
          }
        }, 300)
      }
    }

    const handleBlur = () => {
      // Quando o campo perde o foco, apenas limpa a referência
      // O navegador já gerencia o scroll quando o teclado fecha
      activeInput = null
    }

    // Detecta quando o teclado fecha (visual viewport resize)
    const handleResize = () => {
      // A página já volta ao normal automaticamente quando o teclado fecha
      // Não precisamos fazer nada aqui
    }

    // Adiciona listeners
    document.addEventListener('focusin', handleFocus)
    document.addEventListener('focusout', handleBlur)
    
    // Usa visualViewport se disponível (melhor para detectar teclado)
    const visualViewport = (window as any).visualViewport
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize)
    } else {
      window.addEventListener('resize', handleResize)
    }

    // Cleanup
    return () => {
      document.removeEventListener('focusin', handleFocus)
      document.removeEventListener('focusout', handleBlur)
      if (visualViewport) {
        visualViewport.removeEventListener('resize', handleResize)
      } else {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])
}

