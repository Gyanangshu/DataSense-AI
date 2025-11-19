'use client'

import { Database, FileText } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function Step1DataSources({ datasets, documents, wizardData, onUpdate, template }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Select Your Data Sources</h3>
        <p className="text-sm text-muted-foreground">
          Choose the dataset and optional document for your analysis
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Dataset (Required)</Label>
          <Select
            value={wizardData.selectedDataset}
            onValueChange={(value) => onUpdate({ selectedDataset: value })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select a dataset" />
            </SelectTrigger>
            <SelectContent>
              {datasets.map((dataset: any) => (
                <SelectItem key={dataset.id} value={dataset.id}>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <div>
                      <div>{dataset.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {dataset.rowCount} rows
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Text Document (Optional)</Label>
          <Select
            value={wizardData.selectedDocument}
            onValueChange={(value) => onUpdate({ selectedDocument: value })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select a document (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {documents.map((doc: any) => (
                <SelectItem key={doc.id} value={doc.id}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <div>
                      <div>{doc.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {doc.wordCount} words
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
