import React, { useMemo, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Dropdown } from './dropdown'

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
}

export function SelectMenu({ value, options, onChange, placeholder = 'Selecionar…', className, label }: SelectMenuProps) {
  const [aberto, setAberto] = useState(false)
  const atual = useMemo(() => options.find(o => o.value === value)?.label || '', [options, value])

  return (
    <div className={`w-full ${className || ''}`}>
      {label && (
        <span className="block mb-1 text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
      )}
      <Dropdown
        aberto={aberto}
        onToggle={setAberto}
        usarPortal
        alinhamento="inicio"
        trigger={
          <button
            type="button"
            className="inline-flex items-center justify-between gap-2 w-full h-10 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-900 dark:text-neutral-50 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-violet-600"
          >
            <span className="truncate">{atual || placeholder}</span>
            <ChevronDown className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          </button>
        }
      >
        <div className="py-1">
          {options.map(opt => {
            const ativo = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onChange(opt.value)
                  setTimeout(() => {
                    setAberto(false)
                  }, 0)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${ativo ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              >
                {ativo ? (
                  <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                ) : (
                  <span className="w-4 h-4" />
                )}
                <span className="truncate">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </Dropdown>
    </div>
  )
}