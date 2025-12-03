import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  useAbsolutePosition?: boolean
}

export function ThemeToggle({ className, useAbsolutePosition = true }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  const defaultClassName = useAbsolutePosition ? "absolute top-4 right-4" : ""

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(className || defaultClassName)}
      aria-label="Alternar tema"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  )
}

