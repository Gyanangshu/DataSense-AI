'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'
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
  relatedCorrelations?: number[]
}

interface PublicCorrelationViewProps {
  data: {
    id: string
    name: string
    description: string | null
    correlations: Correlation[]
    insights: Insight[]
    narrative: string | null
    createdAt: Date
  }
  brandingConfig?: {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
    companyName?: string
  }
}

export default function PublicCorrelationView({
  data,
  brandingConfig
}: PublicCorrelationViewProps) {
  // Convert coefficient to number if needed (comes from DB as Decimal)
  const correlations = ((data.correlations as any[]) || []).map(c => ({
    ...c,
    coefficient: c.coefficient !== undefined && c.coefficient !== null
      ? (typeof c.coefficient === 'number' ? c.coefficient : parseFloat(c.coefficient))
      : undefined
  })) as Correlation[]

  const insights = (data.insights as Insight[]) || []

  // Count correlations by type
  const numericCorrelations = correlations.filter(c => c.type === 'numeric')
  const thematicCorrelations = correlations.filter(c => c.type === 'thematic')
  const sentimentCorrelations = correlations.filter(c => c.type === 'sentiment')

  // Group insights by type
  const opportunities = insights.filter(i => i.type === 'opportunity')
  const risks = insights.filter(i => i.type === 'risk')
  const patterns = insights.filter(i => i.type === 'pattern')

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'risk': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'pattern': return <Lightbulb className="w-5 h-5 text-blue-600" />
      default: return <Brain className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with branding */}
      <div className="space-y-4">
        {/* Company Branding Bar */}
        {(brandingConfig?.logo || brandingConfig?.companyName) && (
          <div
            className="flex items-center gap-3 pb-4 border-b"
            style={{
              borderColor: brandingConfig?.primaryColor || undefined
            }}
          >
            {brandingConfig?.logo && (
              <img
                src={brandingConfig.logo}
                alt={brandingConfig.companyName || 'Company Logo'}
                className="h-10 object-contain"
                loading="lazy"
              />
            )}
            {brandingConfig?.companyName && (
              <div>
                <p
                  className="font-semibold text-lg"
                  style={{ color: brandingConfig?.primaryColor || undefined }}
                >
                  {brandingConfig.companyName}
                </p>
                <p className="text-xs text-muted-foreground">Analysis Report</p>
              </div>
            )}
          </div>
        )}

        {/* Analysis Title */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{data.name}</h1>
          {data.description && (
            <p className="text-muted-foreground mt-2">{data.description}</p>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{correlations.length}</div>
            <div className="text-sm text-muted-foreground">Total Correlations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{insights.length}</div>
            <div className="text-sm text-muted-foreground">Key Insights</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {correlations.filter(c => c.strength === 'strong').length}
            </div>
            <div className="text-sm text-muted-foreground">Strong Correlations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {correlations.filter(c => c.strength === 'moderate').length}
            </div>
            <div className="text-sm text-muted-foreground">Moderate Correlations</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Narrative */}
      {data.narrative && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain
                className="w-5 h-5"
                style={{ color: brandingConfig?.secondaryColor || undefined }}
              />
              AI-Generated Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownRenderer content={data.narrative} className="leading-relaxed" />
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>
              AI-identified patterns, opportunities, and risks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {opportunities.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-green-600 dark:text-green-400">
                  Opportunities
                </h4>
                <div className="space-y-2">
                  {opportunities.map((insight, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="font-medium">{insight.title}</div>
                        <div className="text-sm text-muted-foreground">{insight.description}</div>
                      </div>
                      <Badge variant="secondary">{Math.round(insight.confidence * 100)}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {risks.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-red-600 dark:text-red-400">
                  Risks & Concerns
                </h4>
                <div className="space-y-2">
                  {risks.map((insight, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="font-medium">{insight.title}</div>
                        <div className="text-sm text-muted-foreground">{insight.description}</div>
                      </div>
                      <Badge variant="secondary">{Math.round(insight.confidence * 100)}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {patterns.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-blue-600 dark:text-blue-400">
                  Patterns & Trends
                </h4>
                <div className="space-y-2">
                  {patterns.map((insight, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="font-medium">{insight.title}</div>
                        <div className="text-sm text-muted-foreground">{insight.description}</div>
                      </div>
                      <Badge variant="secondary">{Math.round(insight.confidence * 100)}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Correlations */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Correlations</CardTitle>
          <CardDescription>
            Statistical and thematic relationships discovered in the data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({correlations.length})</TabsTrigger>
              <TabsTrigger value="numeric">Numeric ({numericCorrelations.length})</TabsTrigger>
              <TabsTrigger value="thematic">Thematic ({thematicCorrelations.length})</TabsTrigger>
              <TabsTrigger value="sentiment">Sentiment ({sentimentCorrelations.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {correlations.map((corr, idx) => (
                <CorrelationCard key={idx} correlation={corr} />
              ))}
            </TabsContent>

            <TabsContent value="numeric" className="space-y-3 mt-4">
              {numericCorrelations.map((corr, idx) => (
                <CorrelationCard key={idx} correlation={corr} />
              ))}
            </TabsContent>

            <TabsContent value="thematic" className="space-y-3 mt-4">
              {thematicCorrelations.map((corr, idx) => (
                <CorrelationCard key={idx} correlation={corr} />
              ))}
            </TabsContent>

            <TabsContent value="sentiment" className="space-y-3 mt-4">
              {sentimentCorrelations.map((corr, idx) => (
                <CorrelationCard key={idx} correlation={corr} />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm border-t pt-6 mt-8">
        <p className="text-muted-foreground">
          Analysis created on {new Date(data.createdAt).toLocaleDateString()}
        </p>
        {brandingConfig?.companyName && (
          <p
            className="mt-2 font-medium"
            style={{ color: brandingConfig?.primaryColor || undefined }}
          >
            © {new Date().getFullYear()} {brandingConfig.companyName}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Powered by <span className="font-semibold">DataSense AI</span>
        </p>
      </div>
    </div>
  )
}

function CorrelationCard({ correlation }: { correlation: Correlation }) {
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'weak': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getDirectionIcon = (direction?: string) => {
    if (direction === 'positive') return '↗'
    if (direction === 'negative') return '↘'
    return '↔'
  }

  // Get column names
  const col1 = correlation.column1 || correlation.theme || 'Variable 1'
  const col2 = correlation.column2 || 'Variable 2'

  return (
    <div className="p-4 border border-border rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="font-medium">
            {correlation.description}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {col1} {getDirectionIcon(correlation.direction)} {col2}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge className={getStrengthColor(correlation.strength)}>
            {correlation.strength}
          </Badge>
          {correlation.direction && (
            <Badge variant={correlation.direction === 'positive' ? 'default' : 'destructive'}>
              {getDirectionIcon(correlation.direction)} {correlation.direction}
            </Badge>
          )}
          {correlation.coefficient !== undefined && (
            <Badge variant="outline">
              r = {correlation.coefficient.toFixed(2)}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Type: <span className="font-medium capitalize">{correlation.type}</span></span>
      </div>
    </div>
  )
}
