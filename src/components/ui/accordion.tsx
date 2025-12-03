import { useState, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from './button'

interface AccordionItemProps {
  titulo: string
  conteudo: ReactNode
  aberto?: boolean
  onToggle?: () => void
  className?: string
}

export function AccordionItem({ titulo, conteudo, aberto = false, onToggle, className = '' }: AccordionItemProps) {
  return (
    <div className={`border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden ${className}`}>
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full justify-between p-4 h-auto hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-none"
      >
        <span className="font-medium text-left text-neutral-900 dark:text-neutral-50">{titulo}</span>
        <ChevronDown
          className={`w-5 h-5 text-neutral-500 transition-transform duration-200 ${
            aberto ? 'transform rotate-180' : ''
          }`}
        />
      </Button>
      {aberto && (
        <div className="px-4 pb-4 pt-0 text-sm text-neutral-600 dark:text-neutral-400">
          {conteudo}
        </div>
      )}
    </div>
  )
}

interface AccordionProps {
  items: Array<{ titulo: string; conteudo: ReactNode }>
  className?: string
}

export function Accordion({ items, className = '' }: AccordionProps) {
  const [abertos, setAbertos] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const novosAbertos = new Set(abertos)
    if (novosAbertos.has(index)) {
      novosAbertos.delete(index)
    } else {
      novosAbertos.add(index)
    }
    setAbertos(novosAbertos)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          titulo={item.titulo}
          conteudo={item.conteudo}
          aberto={abertos.has(index)}
          onToggle={() => toggleItem(index)}
        />
      ))}
    </div>
  )
}

