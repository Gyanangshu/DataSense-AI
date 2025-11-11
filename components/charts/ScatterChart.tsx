'use client'

import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatNumber } from '@/lib/utils'
import { ChartData } from '@/types/dataset'

interface ScatterChartProps {
  data: ChartData[]
  xKey: string
  yKey: string
  colors?: string[]
  height?: number
  showGrid?: boolean
  animated?: boolean
}

export function ScatterChart({
  data,
  xKey,
  yKey,
  colors = ['#3B82F6'],
  height = 400,
  showGrid = true,
  animated = true
}: ScatterChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RechartsScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-50" />
          )}
          <XAxis
            type="number"
            dataKey={xKey}
            name={xKey}
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            tickFormatter={(value: number) => formatNumber(value)}
          />
          <YAxis
            type="number"
            dataKey={yKey}
            name={yKey}
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            tickFormatter={(value: number) => formatNumber(value)}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
            formatter={(value: number) => formatNumber(value)}
          />
          <Scatter
            name="Data Points"
            data={data}
            fill={colors[0]}
            animationDuration={animated ? 1500 : 0}
          />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  )
}