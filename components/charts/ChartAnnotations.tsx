'use client'

import React from 'react'
import { ReferenceLine, ReferenceDot } from 'recharts'
import { useChartStore } from '@/lib/stores/chartStore'

interface ChartAnnotationsProps {
  visualizationId: string
}

/**
 * Renders annotations on Recharts charts
 * Supports: text labels, point markers, and reference lines
 */
export function ChartAnnotations({ visualizationId }: ChartAnnotationsProps) {
  const { getAnnotations } = useChartStore()
  const annotations = getAnnotations(visualizationId)

  console.log('📍 ChartAnnotations rendering:', {
    visualizationId,
    annotationsCount: annotations.length,
    annotations
  })

  if (annotations.length === 0) {
    console.log('⚠️ No annotations to render')
    return null
  }

  return (
    <>
      {annotations.map((annotation) => {
        console.log('🎨 Rendering annotation:', annotation)

        // For point markers - use ReferenceDot
        if (annotation.type === 'point') {
          console.log(`📌 Rendering point at (${annotation.x}, ${annotation.y})`)
          return (
            <ReferenceDot
              key={annotation.id}
              x={annotation.x}
              y={Number(annotation.y)}
              r={8}
              fill={annotation.color || '#3b82f6'}
              stroke="#ffffff"
              strokeWidth={2}
              fillOpacity={0.8}
            />
          )
        }

        // For text labels - combine a dot marker with a horizontal line for visibility
        if (annotation.type === 'text') {
          console.log(`📌 Rendering text "${annotation.text}" at (${annotation.x}, ${annotation.y})`)
          // Use horizontal reference line at the Y position with the text as label
          return (
            <ReferenceLine
              key={annotation.id}
              y={Number(annotation.y)}
              stroke={annotation.color || '#3b82f6'}
              strokeWidth={1}
              strokeOpacity={0.3}
              strokeDasharray="3 3"
              label={{
                value: `${annotation.text}`,
                position: 'insideTopRight',
                fill: annotation.color || '#3b82f6',
                fontSize: 13,
                fontWeight: 'bold',
                offset: 5
              }}
            />
          )
        }

        // For reference lines
        if (annotation.type === 'line') {
          // Vertical line (x provided, no y)
          if (annotation.x !== undefined && !annotation.y) {
            console.log(`📏 Rendering vertical line at x=${annotation.x}`)
            return (
              <ReferenceLine
                key={annotation.id}
                x={annotation.x}
                stroke={annotation.color || '#3b82f6'}
                strokeWidth={annotation.strokeWidth || 2}
                strokeDasharray="5 5"
                label={{
                  value: annotation.text || '',
                  position: 'top',
                  fill: annotation.color || '#3b82f6',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}
              />
            )
          }

          // Horizontal line (y provided, no x)
          if (annotation.y !== undefined && !annotation.x) {
            console.log(`📏 Rendering horizontal line at y=${annotation.y}`)
            return (
              <ReferenceLine
                key={annotation.id}
                y={Number(annotation.y)}
                stroke={annotation.color || '#3b82f6'}
                strokeWidth={annotation.strokeWidth || 2}
                strokeDasharray="5 5"
                label={{
                  value: annotation.text || '',
                  position: 'right',
                  fill: annotation.color || '#3b82f6',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}
              />
            )
          }
        }

        return null
      })}
    </>
  )
}
