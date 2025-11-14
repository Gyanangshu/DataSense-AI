'use client'

import { useTheme } from 'next-themes'
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
import { ChartAnnotations } from './ChartAnnotations'
import { useChartStore } from '@/lib/stores/chartStore'

interface ScatterChartProps {
  data: ChartData[]
  xKey: string
  yKey: string
  colors?: string[]
  height?: number
  showGrid?: boolean
  animated?: boolean
  visualizationId?: string
}

export function ScatterChart({
  data,
  xKey,
  yKey,
  colors = ['#3B82F6'],
  height = 400,
  showGrid = true,
  animated = true,
  visualizationId
}: ScatterChartProps) {
  const { theme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark' || theme === 'dark'
  const { setDrillDown } = useChartStore()

  console.log("Scatter Chart Data: ", data);

  // Handle scatter point click for drill-down
  const handleScatterClick = (dataPoint: unknown) => {
    if (visualizationId) {
      setDrillDown({
        visualizationId,
        dataPoint: dataPoint as Record<string, unknown>,
        timestamp: Date.now()
      })
    }
  }

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
              backgroundColor: '#ffffff',
              border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
              borderRadius: '6px',
              color: isDark ? '#f9fafb' : '#111827'
            }}
            labelStyle={{ color: isDark ? '#f9fafb' : '#111827' }}
            formatter={(value: number) => formatNumber(value)}
          />

          {/* Render annotations if visualizationId is provided */}
          {visualizationId && <ChartAnnotations visualizationId={visualizationId} />}

          <Scatter
            name="Data Points"
            data={data}
            fill={colors[0]}
            animationDuration={animated ? 1500 : 0}
            onClick={(data) => handleScatterClick(data)}
            cursor="pointer"
          />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  )
}