import React, { useMemo } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'

interface Option {
  value: string
  label: string
}

interface SelectMenuProps {
  value: string
  options: Option[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
  disabled?: boolean
}

export function SelectMenu({ value, options, onChange, placeholder = 'Selecionar…', className, label, disabled = false }: SelectMenuProps) {
  const atual = useMemo(() => options.find(o => o.value === value)?.label || '', [options, value])

  return (
    <div className={`w-full ${className || ''} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {label && (
        <span className="block mb-1 text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="inline-flex items-center justify-between gap-2 w-full h-10 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-900 dark:text-neutral-50 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="truncate">{atual || placeholder}</span>
            <ChevronDown className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
          {options.map(opt => {
            const ativo = opt.value === value
            return (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                }}
                className={`flex items-center gap-2 ${ativo ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300' : ''}`}
              >
                {ativo ? (
                  <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                ) : (
                  <span className="w-4 h-4" />
                )}
                <span className="truncate">{opt.label}</span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}