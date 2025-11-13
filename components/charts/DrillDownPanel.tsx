'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, ZoomIn, Table as TableIcon } from 'lucide-react'
import { useChartStore } from '@/lib/stores/chartStore'

export default function DrillDownPanel() {
  const { drillDown, clearDrillDown } = useChartStore()

  if (!drillDown) return null

  const entries = Object.entries(drillDown.dataPoint).filter(
    ([key]) => key !== 'timestamp' && key !== 'id'
  )

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 shadow-2xl animate-in slide-in-from-bottom-4">
      <Card className="border-primary/50 bg-card/95 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ZoomIn className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Data Point Details</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearDrillDown}
              className="h-7 w-7"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="max-h-80 overflow-y-auto space-y-2">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-start justify-between gap-3 p-2 bg-secondary/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase truncate">
                    {key}
                  </p>
                  <p className="text-sm font-semibold mt-0.5 break-words">
                    {typeof value === 'number'
                      ? value.toLocaleString()
                      : String(value)}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {typeof value === 'number' ? 'number' : 'text'}
                </Badge>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <TableIcon className="w-3 h-3" />
              <span>{entries.length} fields</span>
            </div>
            <span>
              {new Date(drillDown.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
