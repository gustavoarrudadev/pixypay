"use client"
import { PieChart, Pie, Cell } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartPieLabeledProps {
  data: Array<{ name: string; value: number }>
  config: ChartConfig
  className?: string
  height?: string
  tooltipFormatter?: (value: number) => string
}

export function ChartPieLabeled({
  data,
  config,
  className = "h-[300px] w-full",
  tooltipFormatter,
}: ChartPieLabeledProps) {
  return (
    <ChartContainer config={config} className={className}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => {
            if (percent < 0.05) return "" // Não mostra label para valores muito pequenos
            return `${name}: ${(percent * 100).toFixed(0)}%`
          }}
          outerRadius={90}
          innerRadius={50}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => {
            const configItem = config[entry.name as keyof typeof config]
            const color = configItem?.color || `hsl(${220 + index * 40}, 70%, 60%)`
            return (
              <Cell
                key={`cell-${index}`}
                fill={color}
                stroke="#fff"
                strokeWidth={2}
              />
            )
          })}
        </Pie>
        <ChartTooltip 
          cursor={false} 
          content={<ChartTooltipContent formatter={tooltipFormatter ? (value: any) => [tooltipFormatter(value), ''] : undefined} />} 
        />
      </PieChart>
    </ChartContainer>
  )
}

