import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  BarChart3,
  LineChart,
  PieChart as PieChartIcon,
  TrendingUp,
  ArrowLeft,
  Eye,
  Trash2,
  Calendar
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import DeleteVisualizationButton from '@/components/visualization/DeleteVisualizationButton'

async function getVisualizations(userId: string) {
  return await prisma.visualization.findMany({
    where: {
      dataset: {
        userId
      }
    },
    include: {
      dataset: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

const chartIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChartIcon,
  scatter: TrendingUp
}

export default async function VisualizationsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const visualizations = await getVisualizations(session.user.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  My Visualizations
                </h1>
                <p className="text-sm text-muted-foreground">
                  {visualizations.length} {visualizations.length === 1 ? 'chart' : 'charts'} created
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {visualizations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No visualizations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first chart to visualize your data
                </p>
                <Link href="/dashboard">
                  <Button>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visualizations.map((viz) => {
              const Icon = chartIcons[viz.type] || BarChart3
              const config = viz.config as Record<string, unknown>

              return (
                <Card key={viz.id} className="hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{viz.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {viz.type.charAt(0).toUpperCase() + viz.type.slice(1)} Chart
                          </CardDescription>
                        </div>
                      </div>
                      <DeleteVisualizationButton visualizationId={viz.id} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Chart Configuration Summary */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dataset:</span>
                        <Link
                          href={`/datasets/${viz.dataset.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {viz.dataset.name}
                        </Link>
                      </div>

                      {config.xAxis && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">X-Axis:</span>
                          <span className="font-medium">{String(config.xAxis)}</span>
                        </div>
                      )}

                      {config.yAxis && Array.isArray(config.yAxis) && config.yAxis.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Y-Axis:</span>
                          <span className="font-medium">
                            {config.yAxis.slice(0, 2).join(', ')}
                            {config.yAxis.length > 2 && ` +${config.yAxis.length - 2}`}
                          </span>
                        </div>
                      )}

                      {config.aggregation && config.aggregation !== 'none' && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Aggregation:</span>
                          <span className="font-medium capitalize">{String(config.aggregation)}</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(viz.createdAt)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/datasets/${viz.dataset.id}/visualize?load=${viz.id}`}
                        className="flex-1"
                      >
                        <Button variant="outline" className="w-full" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View & Edit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
