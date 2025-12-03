import React from 'react'

interface DialogProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  titulo?: string
  descricao?: string
  children?: React.ReactNode
  className?: string
}

export function Dialog({ aberto, onOpenChange, titulo, descricao, children, className }: DialogProps) {
  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Content */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-[9999] w-full max-w-md rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-6 animate-scale-in ${className || ''}`}
      >
        {titulo && (
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{titulo}</h3>
        )}
        {descricao && (
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{descricao}</p>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

interface DialogActionsProps {
  children?: React.ReactNode
}

export function DialogActions({ children }: DialogActionsProps) {
  return (
    <div className="mt-6 flex items-center justify-end gap-2">
      {children}
    </div>
  )
}