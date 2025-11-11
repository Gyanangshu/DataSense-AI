'use client'

import { useTheme } from 'next-themes'
import { ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import React from 'react'

interface BaseChartProps {
  children: React.ReactNode
  className?: string
  height?: number | `${number}%`
  width?: number | `${number}%`
}

export interface ChartTheme {
  grid: string
  text: string
  tooltip: string
  tooltipBorder: string
}

export function BaseChart({ 
  children, 
  className,
  height ='100%' as `${number}%`,
  width = '100%' as `${number}%`
}: BaseChartProps) {
  const { theme } = useTheme()

  // Chart colors that work in both light and dark mode
  const chartTheme: ChartTheme = {
    grid: theme === 'dark' ? '#374151' : '#E5E7EB',
    text: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    tooltip: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    tooltipBorder: theme === 'dark' ? '#374151' : '#E5E7EB'
  }

  // Clone children and pass chartTheme as prop
  const childrenWithTheme = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, { chartTheme })
    }
    return child
  })

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width={width} height={height}>
        {childrenWithTheme}
      </ResponsiveContainer>
    </div>
  )
}

// Professional color palette for charts
export const CHART_COLORS = {
  primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'],
  categorical: [
    'hsl(217, 91%, 60%)',  // Blue
    'hsl(142, 76%, 36%)',  // Green
    'hsl(38, 92%, 50%)',   // Orange
    'hsl(271, 91%, 65%)',  // Purple
    'hsl(0, 72%, 51%)',    // Red
    'hsl(180, 77%, 34%)',  // Teal
  ],
  sequential: [
    'hsl(217, 91%, 95%)',
    'hsl(217, 91%, 75%)',
    'hsl(217, 91%, 60%)',
    'hsl(217, 91%, 45%)',
    'hsl(217, 91%, 30%)',
  ],
  diverging: [
    '#2563eb', '#60a5fa', '#93c5fd', '#dbeafe',
    '#fee2e2', '#fca5a5', '#f87171', '#dc2626'
  ]
}