'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database, FileText, Loader2, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Dataset {
  id: string
  name: string
  description: string | null
  rowCount: number | null
  columnCount: number | null
  createdAt: Date
}

interface Document {
  id: string
  name: string
  description: string | null
  wordCount: number | null
  themes: any
  createdAt: Date
}

interface CorrelationCreatorProps {
  userId: string
  datasets: Dataset[]
  documents: Document[]
}

export default function CorrelationCreator({ userId, datasets, documents }: CorrelationCreatorProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedDataset, setSelectedDataset] = useState<string>('')
  const [selectedDocument, setSelectedDocument] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter an analysis name')
      return
    }

    if (!selectedDataset) {
      toast.error('Please select a dataset')
      return
    }

    setIsAnalyzing(true)

    try {
      const response = await fetch('/api/correlations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          datasetId: selectedDataset,
          documentId: selectedDocument && selectedDocument !== 'none' ? selectedDocument : null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create correlation analysis')
      }

      const data = await response.json()
      toast.success('Correlation analysis completed!')
      router.push(`/correlations/${data.id}`)
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const selectedDatasetData = datasets.find(d => d.id === selectedDataset)
  const selectedDocumentData = documents.find(d => d.id === selectedDocument)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mixed-Methods Correlation Analysis</CardTitle>
        <CardDescription>
          Analyze correlations between your quantitative data and qualitative insights.
          AI will identify patterns and generate actionable insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Analysis Name */}
          <div>
            <Label htmlFor="name">Analysis Name *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q4 Customer Feedback Analysis"
              disabled={isAnalyzing}
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you trying to discover?"
              disabled={isAnalyzing}
              className="mt-2"
              rows={2}
            />
          </div>

          {/* Dataset Selection */}
          <div>
            <Label htmlFor="dataset">Quantitative Data (Dataset) *</Label>
            <Select value={selectedDataset} onValueChange={setSelectedDataset} disabled={isAnalyzing}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a dataset with numeric data" />
              </SelectTrigger>
              <SelectContent>
                {datasets.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No datasets available. Upload a CSV first.
                  </div>
                ) : (
                  datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{dataset.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {dataset.rowCount} rows, {dataset.columnCount} columns
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedDatasetData && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedDatasetData.description || 'No description'}
              </p>
            )}
          </div>

          {/* Document Selection */}
          <div>
            <Label htmlFor="document">Qualitative Data (Text Document) - Optional</Label>
            <Select value={selectedDocument} onValueChange={setSelectedDocument} disabled={isAnalyzing}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a document (optional - for mixed-methods)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Analyze dataset only)</SelectItem>
                {documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {doc.wordCount} words
                          {doc.themes && Array.isArray(doc.themes) && doc.themes.length > 0 &&
                            `, ${doc.themes.length} themes extracted`}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDocumentData && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedDocumentData.description || 'No description'}
              </p>
            )}
          </div>

          {/* Info Box */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-1">What will be analyzed:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Statistical correlations between numeric columns</li>
                    {selectedDocument && <li>Theme-to-metric correlations (qualitative + quantitative)</li>}
                    {selectedDocument && <li>Sentiment correlation with performance metrics</li>}
                    <li>AI-generated insights and recommendations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={!selectedDataset || !name.trim() || isAnalyzing}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze & Generate Insights
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              disabled={isAnalyzing}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
