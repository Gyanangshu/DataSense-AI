'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  TrendingUp,
  Sparkles,
  Lightbulb,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface ChartRecommendation {
  type: string
  title: string
  description?: string
  xAxis: string
  yAxis: string[]
  aggregation: string
  config: Record<string, unknown>
  priority: number
  reasoning: string
  confidence: number
}

interface ChartRecommendationsProps {
  datasetId: string
  onApplyRecommendation: (config: Record<string, unknown>) => void
}

const chartIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  bar: BarChart3,
  line: LineChartIcon,
  pie: PieChartIcon,
  scatter: TrendingUp
}

const confidenceColors: Record<string, string> = {
  high: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  medium: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  low: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
}

export default function ChartRecommendations({ datasetId, onApplyRecommendation }: ChartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [datasetId])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ai/suggest-chart?datasetId=${datasetId}`)
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      } else {
        throw new Error('Failed to fetch recommendations')
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      toast.error('Failed to load chart suggestions')
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceLabel = (confidence: number): { label: string; color: string } => {
    if (confidence >= 0.8) return { label: 'High Confidence', color: 'high' }
    if (confidence >= 0.6) return { label: 'Medium Confidence', color: 'medium' }
    return { label: 'Low Confidence', color: 'low' }
  }

  const getPriorityBadge = (priority: number) => {
    if (priority >= 5) return { label: 'Best Match', variant: 'default' as const }
    if (priority >= 4) return { label: 'Recommended', variant: 'secondary' as const }
    return { label: 'Alternative', variant: 'outline' as const }
  }

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Analyzing your data...</p>
              <p className="text-xs text-muted-foreground mt-1">Generating smart chart suggestions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!expanded) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <Button
            variant="ghost"
            onClick={() => setExpanded(true)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium">AI Chart Suggestions</span>
              <Badge variant="secondary" className="ml-2">
                {recommendations.length}
              </Badge>
            </div>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            No chart suggestions available for this dataset
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                AI Chart Suggestions
                <Badge variant="secondary">{recommendations.length}</Badge>
              </CardTitle>
              <CardDescription>
                Smart recommendations based on your data structure
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
          >
            Collapse
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {recommendations.map((rec, index) => {
          const Icon = chartIcons[rec.type] || BarChart3
          const confidenceInfo = getConfidenceLabel(rec.confidence)
          const priorityBadge = getPriorityBadge(rec.priority)

          return (
            <Card
              key={index}
              className="border-border hover:border-primary/40 transition-all hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm leading-tight mb-1">
                          {rec.title}
                        </h4>
                        {rec.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {rec.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={priorityBadge.variant} className="shrink-0 text-xs">
                        {priorityBadge.label}
                      </Badge>
                    </div>

                    {/* Configuration Preview */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded">
                        <span className="text-muted-foreground">X:</span>
                        <span className="font-medium">{rec.xAxis}</span>
                      </div>
                      {rec.yAxis && rec.yAxis.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded">
                          <span className="text-muted-foreground">Y:</span>
                          <span className="font-medium">
                            {rec.yAxis.slice(0, 2).join(', ')}
                            {rec.yAxis.length > 2 && ` +${rec.yAxis.length - 2}`}
                          </span>
                        </div>
                      )}
                      {rec.aggregation && rec.aggregation !== 'none' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded">
                          <span className="text-muted-foreground">Agg:</span>
                          <span className="font-medium capitalize">{rec.aggregation}</span>
                        </div>
                      )}
                    </div>

                    {/* Reasoning */}
                    <div className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs">
                      <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-muted-foreground leading-relaxed">{rec.reasoning}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          onApplyRecommendation(rec.config)
                          toast.success(`Applied: ${rec.title}`)
                          setExpanded(false)
                        }}
                        className="flex-1"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Use This Chart
                      </Button>
                      <Badge
                        variant="outline"
                        className={`text-xs ${confidenceColors[confidenceInfo.color]}`}
                      >
                        {confidenceInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRecommendations}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 mr-2" />
              Refresh Suggestions
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
