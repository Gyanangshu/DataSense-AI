'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

export default function Step3Insights({ wizardData, onUpdate }: any) {
  const insightOptions = [
    { value: 'opportunities', label: 'Opportunities' },
    { value: 'risks', label: 'Risks & Concerns' },
    { value: 'patterns', label: 'Patterns & Trends' },
    { value: 'recommendations', label: 'Recommendations' }
  ]

  const toggleInsightType = (type: string) => {
    const current = wizardData.insightTypes
    const updated = current.includes(type)
      ? current.filter((t: string) => t !== type)
      : [...current, type]
    onUpdate({ insightTypes: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Customize AI Insights</h3>
        <p className="text-sm text-muted-foreground">
          Configure what insights AI should generate
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Insight Types</Label>
          <div className="mt-3 space-y-2">
            {insightOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={wizardData.insightTypes.includes(option.value)}
                  onCheckedChange={() => toggleInsightType(option.value)}
                />
                <label htmlFor={option.value} className="text-sm cursor-pointer">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Narrative Tone</Label>
          <Select
            value={wizardData.narrativeTone}
            onValueChange={(value) => onUpdate({ narrativeTone: value })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="business">Business (Professional, concise)</SelectItem>
              <SelectItem value="academic">Academic (Detailed, formal)</SelectItem>
              <SelectItem value="technical">Technical (Data-focused)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Custom Questions (Optional)</Label>
          <Textarea
            value={wizardData.customQuestions}
            onChange={(e) => onUpdate({ customQuestions: e.target.value })}
            placeholder="Any specific questions you want AI to answer?"
            className="mt-2"
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}
