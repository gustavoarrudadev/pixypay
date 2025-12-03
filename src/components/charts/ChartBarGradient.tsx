"use client"
import { Bar, BarChart, XAxis, YAxis, Cell, CartesianGrid } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartBarGradientProps {
  data: Array<Record<string, any>>
  config: ChartConfig
  dataKey: string
  categoryKey: string
  className?: string
  tooltipFormatter?: (value: number) => string
}

export function ChartBarGradient({
  data,
  config,
  dataKey,
  categoryKey,
  className = "h-[300px] w-full",
  tooltipFormatter,
}: ChartBarGradientProps) {
  const gradientId = `bar-chart-gradient-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={className}>
      <ChartContainer config={config} className="h-full w-full">
        <BarChart
          accessibilityLayer
          data={data}
          margin={{
            left: -20,
            right: 12,
            top: 12,
            bottom: 12,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
          <XAxis
            dataKey={categoryKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs text-neutral-600 dark:text-neutral-400"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickCount={5}
            className="text-xs text-neutral-600 dark:text-neutral-400"
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent formatter={tooltipFormatter ? (value: any) => [tooltipFormatter(value), ''] : undefined} />}
          />
          <defs>
            {data.map((entry, index) => {
              const configItem = config[entry[categoryKey] as keyof typeof config]
              const colorVar = entry.fill || configItem?.color || `hsl(${220 + index * 30}, 70%, 60%)`
              return (
                <linearGradient key={`gradient-${index}`} id={`${gradientId}-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colorVar} stopOpacity={1} />
                  <stop offset="100%" stopColor={colorVar} stopOpacity={0.6} />
                </linearGradient>
              )
            })}
          </defs>
          <Bar dataKey={dataKey} radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => {
              const configItem = config[entry[categoryKey] as keyof typeof config]
              const colorVar = entry.fill || configItem?.color || `hsl(${220 + index * 30}, 70%, 60%)`
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#${gradientId}-${index})`}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
















