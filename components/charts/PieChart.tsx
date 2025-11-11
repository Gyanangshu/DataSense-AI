'use client'

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label
} from 'recharts'
import { CHART_COLORS } from './BaseChart'
import { formatNumber } from '@/lib/utils'
import { ChartData } from '@/types/dataset'

// Specific type for pie chart data
export interface PieChartData {
  name: string
  value: number
}

interface PieChartProps {
  data: PieChartData[] | ChartData[]
  colors?: string[]
  height?: number
  showLegend?: boolean
  showLabels?: boolean
  donut?: boolean
  animated?: boolean
}

export function PieChart({
  data,
  colors = CHART_COLORS.primary,
  height = 600,
  showLegend = true,
  showLabels = true,
  donut = false,
  animated = true
}: PieChartProps) {
  // Convert ChartData to PieChartData if needed
  const pieData: PieChartData[] = data.map(item => {
    if ('name' in item && 'value' in item) {
      return item as PieChartData
    }
    // Try to extract name and value from ChartData
    const entries = Object.entries(item)
    if (entries.length >= 2) {
      return {
        name: String(entries[0][1]),
        value: Number(entries[1][1]) || 0
      }
    }
    return { name: 'Unknown', value: 0 }
  })

  const total = pieData.reduce((sum, entry) => sum + entry.value, 0)
  
  const renderLabel = (entry: PieChartData) => {
    const percent = ((entry.value / total) * 100).toFixed(1)
    return `${percent}%`
  }
  
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <RechartsPieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showLabels ? renderLabel : undefined}
            outerRadius={height / 3}
            innerRadius={donut ? height / 5 : 0}
            fill="#8884d8"
            dataKey="value"
            animationDuration={animated ? 1500 : 0}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
            {donut && (
              <Label 
                value={`Total: ${formatNumber(total)}`} 
                position="center"
                className="fill-foreground text-lg font-semibold"
              />
            )}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
            formatter={(value: any) => formatNumber(Number(value))}
          />
          {showLegend && <Legend />}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}