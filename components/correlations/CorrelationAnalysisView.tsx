'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, BarChart3, BookOpen } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { MarkdownRenderer } from '@/lib/utils/markdown-renderer'

interface Correlation {
  type: 'numeric' | 'thematic' | 'sentiment'
  column1?: string
  column2?: string
  theme?: string
  coefficient?: number
  strength: 'strong' | 'moderate' | 'weak'
  direction?: 'positive' | 'negative'
  description: string
}

interface Insight {
  type: 'opportunity' | 'risk' | 'trend' | 'pattern'
  title: string
  description: string
  confidence: number
  relatedCorrelations: number[]
}

interface CorrelationAnalysisViewProps {
  analysis: {
    id: string
    name: string
    description: string | null
    correlations: any
    insights: any
    narrative: string | null
    createdAt: Date
  }
}

export default function CorrelationAnalysisView({ analysis }: CorrelationAnalysisViewProps) {
  // Convert numeric fields to numbers (they come from DB as strings/Decimal)
  const correlations = ((analysis.correlations as any[]) || []).map(c => ({
    ...c,
    coefficient: c.coefficient !== undefined && c.coefficient !== null
      ? (typeof c.coefficient === 'number' ? c.coefficient : parseFloat(c.coefficient))
      : undefined
  })) as Correlation[]

  const insights = ((analysis.insights as any[]) || []).map(i => ({
    ...i,
    confidence: typeof i.confidence === 'number' ? i.confidence : parseFloat(i.confidence)
  })) as Insight[]

  // Group correlations by type
  const numericCorrelations = correlations.filter(c => c.type === 'numeric')
  const thematicCorrelations = correlations.filter(c => c.type === 'thematic')
  const sentimentCorrelations = correlations.filter(c => c.type === 'sentiment')

  // Group by strength
  const strongCorrelations = correlations.filter(c => c.strength === 'strong')
  const moderateCorrelations = correlations.filter(c => c.strength === 'moderate')
  const weakCorrelations = correlations.filter(c => c.strength === 'weak')

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-600 dark:text-green-400'
      case 'moderate': return 'text-yellow-600 dark:text-yellow-400'
      case 'weak': return 'text-gray-600 dark:text-gray-400'
      default: return 'text-muted-foreground'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Lightbulb className="w-5 h-5 text-green-600" />
      case 'risk': return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'trend': return <TrendingUp className="w-5 h-5 text-blue-600" />
      case 'pattern': return <BarChart3 className="w-5 h-5 text-purple-600" />
      default: return <Lightbulb className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Correlations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{correlations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Strong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{strongCorrelations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Moderate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{moderateCorrelations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{insights.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Narrative */}
      {analysis.narrative && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <CardTitle>AI-Generated Summary</CardTitle>
            </div>
            <CardDescription>
              Overview of key findings and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MarkdownRenderer content={analysis.narrative} />
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>
              AI-identified patterns and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge variant="outline" className="capitalize">
                        {insight.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Confidence:</span>
                      <Progress value={insight.confidence * 100} className="w-24 h-2" />
                      <span>{(insight.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Correlations Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Correlations</CardTitle>
          <CardDescription>
            Statistical and thematic relationships discovered in your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({correlations.length})
              </TabsTrigger>
              <TabsTrigger value="numeric">
                Numeric ({numericCorrelations.length})
              </TabsTrigger>
              <TabsTrigger value="thematic">
                Thematic ({thematicCorrelations.length})
              </TabsTrigger>
              <TabsTrigger value="sentiment">
                Sentiment ({sentimentCorrelations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-3">
              {correlations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No correlations found
                </p>
              ) : (
                correlations.map((corr, index) => (
                  <CorrelationCard key={index} correlation={corr} />
                ))
              )}
            </TabsContent>

            <TabsContent value="numeric" className="mt-4 space-y-3">
              {numericCorrelations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No numeric correlations found
                </p>
              ) : (
                numericCorrelations.map((corr, index) => (
                  <CorrelationCard key={index} correlation={corr} />
                ))
              )}
            </TabsContent>

            <TabsContent value="thematic" className="mt-4 space-y-3">
              {thematicCorrelations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No thematic correlations found
                </p>
              ) : (
                thematicCorrelations.map((corr, index) => (
                  <CorrelationCard key={index} correlation={corr} />
                ))
              )}
            </TabsContent>

            <TabsContent value="sentiment" className="mt-4 space-y-3">
              {sentimentCorrelations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No sentiment correlations found
                </p>
              ) : (
                sentimentCorrelations.map((corr, index) => (
                  <CorrelationCard key={index} correlation={corr} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function CorrelationCard({ correlation }: { correlation: Correlation }) {
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'weak': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return ''
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'numeric': return <BarChart3 className="w-4 h-4" />
      case 'thematic': return <BookOpen className="w-4 h-4" />
      case 'sentiment': return correlation.direction === 'positive' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
      default: return null
    }
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
      <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
        {getTypeIcon(correlation.type)}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{correlation.description}</p>
          <Badge className={`capitalize ${getStrengthColor(correlation.strength)}`}>
            {correlation.strength}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="capitalize">
            {correlation.type}
          </Badge>
          {correlation.direction && (
            <Badge variant="outline" className="capitalize flex items-center gap-1">
              {correlation.direction === 'positive' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {correlation.direction}
            </Badge>
          )}
          {correlation.coefficient !== undefined && (
            <Badge variant="outline">
              r = {correlation.coefficient.toFixed(2)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
