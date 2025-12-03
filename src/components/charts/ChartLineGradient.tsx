"use client"
import { Line, LineChart, Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartLineGradientProps {
  data: Array<Record<string, any>>
  config: ChartConfig
  dataKey: string
  className?: string
  xAxisDataKey?: string
  xAxisFormatter?: (value: string) => string
  tooltipFormatter?: (value: number) => string
  strokeColor?: string
}

export function ChartLineGradient({
  data,
  config,
  dataKey,
  className = "h-[300px] w-full",
  xAxisDataKey = "month",
  xAxisFormatter = (value) => value,
  tooltipFormatter,
  strokeColor,
}: ChartLineGradientProps) {
  const configItem = config[dataKey as keyof typeof config]
  const colorVar = strokeColor || configItem?.color || "#6366f1"
  const gradientId = `line-chart-gradient-${dataKey}-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={className}>
      <ChartContainer config={config} className="h-full w-full">
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{
            left: -20,
            right: 12,
            top: 20,
            bottom: 12,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
          <XAxis
            dataKey={xAxisDataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={xAxisFormatter}
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
            cursor={{ stroke: colorVar, strokeWidth: 1, strokeDasharray: "5 5" }}
            content={<ChartTooltipContent formatter={tooltipFormatter ? (value: any) => [tooltipFormatter(value), ''] : undefined} />} 
          />
          <defs>
            <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={colorVar}
                stopOpacity={0.4}
              />
              <stop
                offset="100%"
                stopColor={colorVar}
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={colorVar}
            strokeWidth={3}
            fill={`url(#${gradientId}-fill)`}
            fillOpacity={1}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}

