"use client"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartAreaGradientProps {
  data: Array<Record<string, any>>
  config: ChartConfig
  dataKey: string
  className?: string
  height?: string
  xAxisDataKey?: string
  xAxisFormatter?: (value: string) => string
  tooltipFormatter?: (value: number) => string
}

export function ChartAreaGradient({
  data,
  config,
  dataKey,
  className = "h-[250px] w-full",
  height = "250px",
  xAxisDataKey = "month",
  xAxisFormatter = (value) => value.slice(0, 3),
  tooltipFormatter,
}: ChartAreaGradientProps) {
  const gradientId = `area-chart-gradient-${dataKey}-${Math.random().toString(36).substr(2, 9)}`
  const configItem = config[dataKey as keyof typeof config]
  const colorVar = configItem?.color || `var(--color-${dataKey})`

  return (
    <div className={className}>
      <ChartContainer config={config} className="h-full w-full">
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{
            left: -20,
            right: 12,
            top: 12,
            bottom: 12,
          }}
        >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xAxisDataKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={xAxisFormatter}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickCount={4}
          className="text-xs"
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={tooltipFormatter ? (value: any) => [tooltipFormatter(value), ''] : undefined} />} />
        <defs>
          <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={colorVar}
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor={colorVar}
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey={dataKey}
          type="natural"
          fill={`url(#${gradientId}-fill)`}
          fillOpacity={0.4}
          stroke={colorVar}
          strokeWidth={2}
        />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}

