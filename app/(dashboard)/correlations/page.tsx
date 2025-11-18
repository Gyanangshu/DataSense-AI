import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Sparkles, Calendar, Database, FileText, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DeleteCorrelationButton from '@/components/correlations/DeleteCorrelationButton'

async function getCorrelations(userId: string) {
  return await prisma.correlationAnalysis.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      description: true,
      datasetId: true,
      documentId: true,
      correlations: true,
      insights: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function CorrelationsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const correlations = await getCorrelations(session.user.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Correlation Analyses</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Mixed-methods insights connecting your qualitative and quantitative data
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/correlations/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Analysis
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {correlations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-24">
              <div className="text-center">
                <div className="p-6 bg-secondary/30 rounded-full w-fit mx-auto mb-4">
                  <Sparkles className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No analyses yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create your first correlation analysis to discover insights in your data
                </p>
                <Link href="/correlations/create">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Analysis
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {correlations.map((analysis) => {
              const correlationsData = analysis.correlations as any[] || []
              const insightsData = analysis.insights as any[] || []

              return (
                <Card key={analysis.id} className="h-full hover:shadow-lg transition-shadow relative group">
                  <Link href={`/correlations/${analysis.id}`} className="cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-2">{analysis.name}</CardTitle>
                          {analysis.description && (
                            <CardDescription className="line-clamp-2 mt-2">
                              {analysis.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </div>

                      {/* Data sources */}
                      <div className="flex flex-wrap gap-2">
                        {analysis.datasetId && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            Dataset
                          </Badge>
                        )}
                        {analysis.documentId && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Document
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="pt-2 border-t space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">{correlationsData.length}</span>
                          <span className="text-muted-foreground"> correlations found</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{insightsData.length}</span>
                          <span className="text-muted-foreground"> insights generated</span>
                        </div>
                      </div>
                    </CardContent>
                  </Link>

                  {/* Delete button - positioned absolutely to avoid Link click */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeleteCorrelationButton
                      correlationId={analysis.id}
                      correlationName={analysis.name}
                      variant="ghost"
                      size="sm"
                    />
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
