'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function Step2Configuration({ selectedDataset, wizardData, onUpdate }: any) {
  const columns = selectedDataset?.columns || []

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Configure Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Set analysis parameters and column mappings
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Analysis Depth</Label>
          <Select
            value={wizardData.analysisDepth}
            onValueChange={(value) => onUpdate({ analysisDepth: value })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quick">Quick (Faster, basic correlations)</SelectItem>
              <SelectItem value="standard">Standard (Recommended)</SelectItem>
              <SelectItem value="comprehensive">Comprehensive (Detailed analysis)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {columns.length > 0 && (
          <div>
            <Label>Primary Column (Optional)</Label>
            <Select
              value={wizardData.primaryColumn || "auto"}
              onValueChange={(value) => onUpdate({ primaryColumn: value === "auto" ? null : value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Auto-detect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                {columns.map((col: string) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
