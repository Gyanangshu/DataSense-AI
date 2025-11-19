'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

export default function Step4Review({ wizardData, onUpdate, datasets, documents, template }: any) {
  const selectedDataset = datasets.find((d: any) => d.id === wizardData.selectedDataset)
  const selectedDocument = wizardData.selectedDocument && wizardData.selectedDocument !== 'none'
    ? documents.find((d: any) => d.id === wizardData.selectedDocument)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Review & Launch</h3>
        <p className="text-sm text-muted-foreground">
          Review your configuration and name your analysis
        </p>
      </div>

      {/* Summary */}
      <div className="p-4 bg-muted rounded-lg space-y-3">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Dataset</div>
          <div className="text-sm">{selectedDataset?.name}</div>
        </div>

        {selectedDocument && (
          <div>
            <div className="text-sm font-medium text-muted-foreground">Document</div>
            <div className="text-sm">{selectedDocument.name}</div>
          </div>
        )}

        <div>
          <div className="text-sm font-medium text-muted-foreground">Analysis Depth</div>
          <div className="text-sm capitalize">{wizardData.analysisDepth}</div>
        </div>

        <div>
          <div className="text-sm font-medium text-muted-foreground">Insight Types</div>
          <div className="flex gap-2 mt-1">
            {wizardData.insightTypes.map((type: string) => (
              <Badge key={type} variant="secondary" className="capitalize">
                {type}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-muted-foreground">Narrative Tone</div>
          <div className="text-sm capitalize">{wizardData.narrativeTone}</div>
        </div>
      </div>

      {/* Name and Description */}
      <div className="space-y-4">
        <div>
          <Label>Analysis Name *</Label>
          <Input
            value={wizardData.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g., Q4 Customer Feedback Analysis"
            className="mt-2"
          />
        </div>

        <div>
          <Label>Description (Optional)</Label>
          <Textarea
            value={wizardData.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Brief description of this analysis..."
            className="mt-2"
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}
