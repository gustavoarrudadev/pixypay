import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface DropdownProps {
  aberto: boolean
  onToggle: (aberto: boolean) => void
  trigger: React.ReactNode
  children: React.ReactNode
  alinhamento?: 'inicio' | 'centro' | 'fim'
  className?: string
  usarPortal?: boolean
}

export function Dropdown({ aberto, onToggle, trigger, children, alinhamento = 'inicio', className, usarPortal = true }: DropdownProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)

  // Calcula posição absoluta do trigger para portal
  const calcPos = () => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dropdownWidth = 180 // minWidth do dropdown
    const padding = 8 // padding da tela
    
    // Calcular posição horizontal
    let left = rect.left
    
    // Se o dropdown sair da tela à direita, ajustar para a esquerda
    if (left + dropdownWidth > window.innerWidth - padding) {
      left = window.innerWidth - dropdownWidth - padding
    }
    
    // Se o dropdown sair da tela à esquerda, ajustar para a direita
    if (left < padding) {
      left = padding
    }
    
    // Calcular posição vertical
    let top = rect.bottom + 8
    const dropdownHeight = 200 // altura estimada do dropdown
    
    // Se o dropdown sair da tela abaixo, mostrar acima
    if (top + dropdownHeight > window.innerHeight - padding) {
      top = rect.top - dropdownHeight - 8
    }
    
    // Garantir que não saia da tela acima
    if (top < padding) {
      top = padding
    }
    
    setPos({ top, left, width: rect.width })
  }

  useEffect(() => {
    if (!aberto) return

    let clickHandled = false
    
    function handleClickOutside(e: MouseEvent) {
      // Se o clique já foi tratado dentro do dropdown, ignora
      if (clickHandled) {
        clickHandled = false
        return
      }
      
      const target = e.target as Node
      // Verifica se o clique foi fora do dropdown e não foi no trigger
      if (
        ref.current && 
        !ref.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onToggle(false)
      }
    }
    
    // Marca quando um clique acontece dentro do dropdown
    function handleClickInside() {
      clickHandled = true
    }
    
    calcPos()
    
    // Adiciona listener para cliques dentro do dropdown primeiro
    if (ref.current) {
      ref.current.addEventListener('mousedown', handleClickInside, true)
    }
    
    // Adiciona listener para cliques fora após um pequeno delay
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true)
    }, 10)
    
    window.addEventListener('scroll', calcPos, true)
    window.addEventListener('resize', calcPos, true)
    
    return () => {
      clearTimeout(timeoutId)
      if (ref.current) {
        ref.current.removeEventListener('mousedown', handleClickInside, true)
      }
      document.removeEventListener('mousedown', handleClickOutside, true)
      window.removeEventListener('scroll', calcPos, true)
      window.removeEventListener('resize', calcPos, true)
    }
  }, [aberto, onToggle])

  const alinhamentoClasse = alinhamento === 'inicio'
    ? 'left-0'
    : alinhamento === 'fim'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2'

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <div
        ref={triggerRef}
        onClick={() => {
          calcPos()
          onToggle(!aberto)
        }}
        className="cursor-pointer select-none"
      >
        {trigger}
      </div>
      {aberto && (
        usarPortal && pos
          ? createPortal(
              <div
                ref={ref}
                className={`fixed z-[9999] rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg shadow-neutral-200/40 dark:shadow-black/20 animate-fade-in`}
                style={{
                  top: pos.top,
                  left: pos.left,
                  minWidth: '180px',
                  transform: undefined,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </div>,
              document.body
            )
          : (
            <div 
              ref={ref}
              className={`absolute top-full ${alinhamentoClasse} mt-2 z-[9999] min-w-[180px] rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg shadow-neutral-200/40 dark:shadow-black/20 animate-fade-in`}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </div>
          )
      )}
    </div>
  )
}