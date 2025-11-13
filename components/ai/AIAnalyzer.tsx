'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TextUploader from '@/components/upload/TextUploader'
import { Dataset } from '@/types/dataset'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, FileText, TrendingUp } from 'lucide-react'

interface AIAnalyzerProps {
  dataset: Dataset
}

export default function AIAnalyzer({ dataset }: AIAnalyzerProps) {
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  const handleAnalysisComplete = (results: any) => {
    setAnalysisResults(results)
  }

  return (
    <Tabs defaultValue="text" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="text">Text Analysis</TabsTrigger>
        <TabsTrigger value="correlation">Correlations</TabsTrigger>
        <TabsTrigger value="insights">AI Insights</TabsTrigger>
      </TabsList>

      <TabsContent value="text" className="space-y-6">
        <TextUploader 
          datasetId={dataset.id}
          onAnalysis={handleAnalysisComplete}
        />
      </TabsContent>

      <TabsContent value="correlation" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Mixed-Methods Correlation
            </CardTitle>
            <CardDescription>
              Find correlations between qualitative themes and quantitative metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Upload text data first to enable correlation analysis
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="insights" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI-Generated Insights
            </CardTitle>
            <CardDescription>
              Automatic insights from your data patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Complete text analysis to generate insights
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}