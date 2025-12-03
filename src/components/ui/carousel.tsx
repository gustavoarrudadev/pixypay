"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CarouselProps {
  children: React.ReactNode
  className?: string
  showArrows?: boolean
  showDots?: boolean
  autoPlay?: boolean
  interval?: number
  itemsPerView?: number // Número de itens visíveis por vez
}

export function Carousel({
  children,
  className,
  showArrows = true,
  showDots = true,
  autoPlay = false,
  interval = 5000,
  itemsPerView = 1,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const carouselRef = React.useRef<HTMLDivElement>(null)
  const childrenArray = React.Children.toArray(children)
  const totalSlides = Math.ceil(childrenArray.length / itemsPerView)

  const goToSlide = (index: number) => {
    if (index < 0) {
      setCurrentIndex(totalSlides - 1)
    } else if (index >= totalSlides) {
      setCurrentIndex(0)
    } else {
      setCurrentIndex(index)
    }
  }

  const goToPrevious = () => {
    goToSlide(currentIndex - 1)
  }

  const goToNext = () => {
    goToSlide(currentIndex + 1)
  }

  React.useEffect(() => {
    if (autoPlay && totalSlides > 1) {
      const timer = setInterval(() => {
        goToNext()
      }, interval)
      return () => clearInterval(timer)
    }
  }, [autoPlay, interval, currentIndex, totalSlides])

  if (childrenArray.length === 0) {
    return null
  }

  const itemWidth = 100 / itemsPerView

  return (
    <div className={cn("relative w-full", className)}>
      <div
        ref={carouselRef}
        className="overflow-hidden rounded-lg"
      >
        <div
          className="flex transition-transform duration-300 ease-in-out gap-3"
          style={{
            transform: `translateX(-${currentIndex * itemWidth}%)`,
          }}
        >
          {childrenArray.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{
                width: `calc(${itemWidth}% - ${(itemsPerView - 1) * 0.75}rem / ${itemsPerView})`,
                minWidth: '280px',
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {showArrows && totalSlides > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 dark:bg-neutral-900/90 border-neutral-300 dark:border-neutral-700 shadow-lg hover:bg-white dark:hover:bg-neutral-900 hover:scale-110 transition-transform"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <span className="sr-only">Slide anterior</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 dark:bg-neutral-900/90 border-neutral-300 dark:border-neutral-700 shadow-lg hover:bg-white dark:hover:bg-neutral-900 hover:scale-110 transition-transform"
            onClick={goToNext}
          >
            <ChevronRight className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <span className="sr-only">Próximo slide</span>
          </Button>
        </>
      )}

      {showDots && totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentIndex
                  ? "w-8 bg-violet-600 dark:bg-violet-400"
                  : "w-2 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600"
              )}
              onClick={() => goToSlide(index)}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

