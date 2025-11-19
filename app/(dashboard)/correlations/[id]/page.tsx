import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Home, Calendar, Database, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import CorrelationAnalysisView from '@/components/correlations/CorrelationAnalysisView'
import DeleteCorrelationButton from '@/components/correlations/DeleteCorrelationButton'
import ShareButton from '@/components/share/ShareButton'

async function getCorrelationAnalysis(id: string, userId: string) {
  const analysis = await prisma.correlationAnalysis.findFirst({
    where: { id, userId },
    select: {
      id: true,
      name: true,
      description: true,
      datasetId: true,
      documentId: true,
      correlations: true,
      insights: true,
      narrative: true,
      createdAt: true
    }
  })

  if (!analysis) return null

  // Fetch related dataset and document names
  const [dataset, document] = await Promise.all([
    analysis.datasetId
      ? prisma.dataset.findUnique({
          where: { id: analysis.datasetId },
          select: { name: true }
        })
      : null,
    analysis.documentId
      ? prisma.textDocument.findUnique({
          where: { id: analysis.documentId },
          select: { name: true }
        })
      : null
  ])

  return {
    ...analysis,
    datasetName: dataset?.name || null,
    documentName: document?.name || null
  }
}

export default async function CorrelationAnalysisPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const resolvedParams = await params
  const analysis = await getCorrelationAnalysis(resolvedParams.id, session.user.id)

  if (!analysis) redirect('/correlations')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link
                href="/correlations"
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {analysis.name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  {analysis.datasetName && (
                    <span className="flex items-center gap-1">
                      <Database className="w-4 h-4" />
                      {analysis.datasetName}
                    </span>
                  )}
                  {analysis.documentName && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {analysis.documentName}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(analysis.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <ShareButton
                shareType="correlation"
                resourceId={analysis.id}
                resourceName={analysis.name}
                variant="outline"
                size="sm"
              />
              <DeleteCorrelationButton
                correlationId={analysis.id}
                correlationName={analysis.name}
              />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CorrelationAnalysisView analysis={analysis} />
      </main>
    </div>
  )
}
