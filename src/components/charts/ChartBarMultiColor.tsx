"use client"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartBarMultiColorProps {
  data: Array<Record<string, any>>
  config: ChartConfig
  dataKey: string
  categoryKey: string
  className?: string
  height?: string
  showTrend?: boolean
  trendText?: string
  description?: string
}

export function ChartBarMultiColor({
  data,
  config,
  dataKey,
  categoryKey,
  className = "h-[250px] w-full",
  showTrend = false,
  trendText,
  description,
}: ChartBarMultiColorProps) {
  return (
    <ChartContainer config={config} className={className}>
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{
          left: 140,
          right: 12,
          top: 12,
          bottom: 12,
        }}
      >
        <YAxis
          dataKey={categoryKey}
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          width={130}
          tickFormatter={(value) =>
            config[value as keyof typeof config]?.label || value
          }
        />
        <XAxis dataKey={dataKey} type="number" hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey={dataKey} radius={5}>
          {data.map((entry, index) => {
            const configItem = config[entry[categoryKey] as keyof typeof config]
            const fill = entry.fill || configItem?.color || `var(--chart-${(index % 5) + 1})`
            return (
              <Cell
                key={`cell-${index}`}
                fill={fill}
              />
            )
          })}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

