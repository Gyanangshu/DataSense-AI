'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Upload, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Brain,
  MessageSquare,
  Hash
} from 'lucide-react'
import { toast } from 'sonner'

interface TextUploaderProps {
  onAnalysis: (results: any) => void
  datasetId?: string
}

export default function TextUploader({ onAnalysis, datasetId }: TextUploaderProps) {
  const [texts, setTexts] = useState<string[]>([''])
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.csv')) {
      toast.error('Please upload a .txt or .csv file')
      return
    }

    setFile(file)
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const content = event.target?.result as string
      
      if (file.name.endsWith('.csv')) {
        // Parse CSV and extract text column
        const lines = content.split('\n')
        const headers = lines[0].split(',')
        const textColumnIndex = headers.findIndex(h => 
          h.toLowerCase().includes('text') || 
          h.toLowerCase().includes('comment') ||
          h.toLowerCase().includes('response')
        )
        
        if (textColumnIndex === -1) {
          toast.error('No text column found in CSV')
          return
        }
        
        const textData = lines.slice(1)
          .map(line => {
            const values = line.split(',')
            return values[textColumnIndex]?.trim()
          })
          .filter(Boolean)
        
        setTexts(textData)
        toast.success(`Loaded ${textData.length} text entries`)
      } else {
        // Split by double newlines for paragraphs
        const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0)
        setTexts(paragraphs)
        toast.success(`Loaded ${paragraphs.length} text segments`)
      }
    }
    
    reader.readAsText(file)
  }, [])

  const handleAnalyze = async (type: 'themes' | 'sentiment' | 'both') => {
    if (texts.length === 0 || texts[0] === '') {
      toast.error('Please add some text to analyze')
      return
    }

    setAnalyzing(true)
    try {
      const response = await fetch('/api/ai/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: texts.filter(t => t.trim()),
          datasetId,
          analysisType: type
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Analysis failed')
      }

      const result = await response.json()
      setAnalysisResults(result.analysis)
      onAnalysis(result.analysis)
      
      toast.success(`Analysis complete! Cost: ~$${result.estimatedCost.toFixed(4)}`)
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to analyze text')
    } finally {
      setAnalyzing(false)
    }
  }

  const addTextEntry = () => {
    setTexts([...texts, ''])
  }

  const updateTextEntry = (index: number, value: string) => {
    const updated = [...texts]
    updated[index] = value
    setTexts(updated)
  }

  const removeTextEntry = (index: number) => {
    setTexts(texts.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Text Data Input
          </CardTitle>
          <CardDescription>
            Upload interview transcripts, survey responses, or any text data for AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="file">File Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-3">
                {texts.map((text, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Text Entry {index + 1}</Label>
                      {texts.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTextEntry(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <Textarea
                      value={text}
                      onChange={(e) => updateTextEntry(index, e.target.value)}
                      placeholder="Enter interview transcript, survey response, or any text..."
                      className="min-h-[100px]"
                    />
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                onClick={addTextEntry}
                className="w-full"
              >
                Add Another Text Entry
              </Button>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="text-file-upload"
                />
                <label htmlFor="text-file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload .txt or .csv file
                  </p>
                  {file && (
                    <p className="mt-2 text-sm font-medium">
                      {file.name} ({texts.length} texts loaded)
                    </p>
                  )}
                </label>
              </div>
            </TabsContent>
          </Tabs>

          {/* Analysis Buttons */}
          <div className="flex gap-2 mt-6">
            <Button
              onClick={() => handleAnalyze('themes')}
              disabled={analyzing || texts.length === 0}
              className="flex-1"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Extract Themes
            </Button>
            
            <Button
              onClick={() => handleAnalyze('sentiment')}
              disabled={analyzing || texts.length === 0}
              variant="outline"
              className="flex-1"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4 mr-2" />
              )}
              Analyze Sentiment
            </Button>
            
            <Button
              onClick={() => handleAnalyze('both')}
              disabled={analyzing || texts.length === 0}
              variant="outline"
              className="flex-1"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Hash className="w-4 h-4 mr-2" />
              )}
              Both
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Themes */}
            {analysisResults.themes && (
              <div className="space-y-3">
                <h3 className="font-semibold">Extracted Themes</h3>
                {analysisResults.themes.themes.map((theme: any, index: number) => (
                  <div key={index} className="p-3 bg-secondary rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{theme.theme}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {theme.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {theme.keywords.map((keyword: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-background text-xs rounded">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-medium">
                          {(theme.relevance * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          relevance
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {analysisResults.themes.summary && (
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <p className="text-sm">{analysisResults.themes.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Sentiment */}
            {analysisResults.aggregate && (
              <div className="space-y-3">
                <h3 className="font-semibold">Sentiment Analysis</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(analysisResults.aggregate.sentiment_scores.positive * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Positive</div>
                  </div>
                  <div className="p-3 bg-gray-500/10 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {(analysisResults.aggregate.sentiment_scores.neutral * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Neutral</div>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {(analysisResults.aggregate.sentiment_scores.negative * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Negative</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Analyzed {analysisResults.aggregate.sample_size} of {analysisResults.aggregate.total_texts} texts
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}