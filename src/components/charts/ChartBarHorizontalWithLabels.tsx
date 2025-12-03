"use client"
import { Bar, BarChart, XAxis, YAxis, Cell, LabelList } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartBarHorizontalWithLabelsProps {
  data: Array<Record<string, any>>
  config: ChartConfig
  dataKey: string
  categoryKey: string
  className?: string
  tooltipFormatter?: (value: number) => string
  showValueOnBar?: boolean
}

export function ChartBarHorizontalWithLabels({
  data,
  config,
  dataKey,
  categoryKey,
  className = "h-[300px] w-full",
  tooltipFormatter,
  showValueOnBar = true,
}: ChartBarHorizontalWithLabelsProps) {
  return (
    <ChartContainer config={config} className={className}>
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{
          left: 120,
          right: 60,
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
          width={110}
          tickFormatter={(value) => {
            const label = config[value as keyof typeof config]?.label || value
            // Truncar nomes muito longos
            return label.length > 15 ? label.substring(0, 15) + '...' : label
          }}
          className="text-xs text-neutral-600 dark:text-neutral-400"
        />
        <XAxis 
          dataKey={dataKey} 
          type="number" 
          hide 
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel formatter={tooltipFormatter ? (value: any) => [tooltipFormatter(value), ''] : undefined} />}
        />
        <Bar 
          dataKey={dataKey} 
          radius={[0, 8, 8, 0]}
          barSize={40}
        >
          {data.map((entry, index) => {
            const configItem = config[entry[categoryKey] as keyof typeof config]
            const fill = entry.fill || configItem?.color || `hsl(${220 + index * 30}, 70%, 60%)`
            return (
              <Cell
                key={`cell-${index}`}
                fill={fill}
              />
            )
          })}
          {showValueOnBar && (
            <LabelList
              dataKey={dataKey}
              position="right"
              className="text-xs font-medium fill-neutral-700 dark:fill-neutral-300"
              formatter={(value: number) => value}
            />
          )}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
















