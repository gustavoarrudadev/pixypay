"use client"
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartBarCustomLabelProps {
  data: Array<Record<string, any>>
  config: ChartConfig
  dataKey: string
  categoryKey: string
  className?: string
  height?: string
  labelFormatter?: (value: any) => string
  tooltipFormatter?: (value: number) => string
}

export function ChartBarCustomLabel({
  data,
  config,
  dataKey,
  categoryKey,
  className = "h-[300px] w-full",
  labelFormatter,
  tooltipFormatter,
}: ChartBarCustomLabelProps) {
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
          content={<ChartTooltipContent hideLabel formatter={tooltipFormatter ? (value: any) => [tooltipFormatter(value), ''] : undefined} />}
        />
        <Bar dataKey={dataKey} radius={5}>
          {data.map((entry, index) => {
            const configItem = config[entry[categoryKey] as keyof typeof config]
            // Usar a cor do fill se disponível, senão usar a cor do config, senão usar cores padrão do chart
            let fill = entry.fill || configItem?.color
            if (!fill) {
              // Usar cores padrão do chart
              const chartColors = [
                'hsl(262.1, 83.3%, 57.8%)', // chart-1 (violeta)
                'hsl(142.1, 76.2%, 36.3%)', // chart-2 (verde)
                'hsl(221.2, 83.2%, 53.3%)', // chart-3 (azul)
                'hsl(210, 70%, 50%)',       // chart-4 (azul escuro)
                'hsl(280, 100%, 70%)',     // chart-5 (roxo claro)
              ]
              fill = chartColors[index % 5]
            }
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

