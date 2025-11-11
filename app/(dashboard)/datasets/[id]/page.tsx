import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, BarChart3, LineChart, PieChart as PieChartIcon } from 'lucide-react'
import DatasetViewer from '@/components/dataset/DatasetViewer'
import DeleteDatasetButton from '@/components/dataset/DeleteDatasetButton'

async function getDataset(id: string, userId: string) {
  return await prisma.dataset.findFirst({
    where: {
      id,
      userId
    },
    select: {
      id: true,
      name: true,
      description: true,
      rowCount: true,
      columnCount: true,
      columns: true,
      types: true,
      stats: true,
      sourceType: true,
      createdAt: true,
    }
  })
}

export default async function DatasetPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Await params first
  const resolvedParams = await params

  // Then parse the JSON string
  let datasetId = resolvedParams.id
  try {
    const parsed = JSON.parse(decodeURIComponent(resolvedParams.id))
    if (parsed.id) {
      datasetId = parsed.id
    }
  } catch (e) {
    // It's not JSON, so use it directly
    datasetId = decodeURIComponent(resolvedParams.id)
  }

  const dataset = await getDataset(datasetId, session.user.id)

  if (!dataset) {
    redirect('/dashboard')
  }

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
                <h1 className="text-xl font-bold text-foreground">
                  {dataset.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {dataset.rowCount?.toLocaleString()} rows • {dataset.columnCount} columns
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/datasets/${datasetId}/visualize`}>
                <Button>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Create Visualization
                </Button>
              </Link>
              <DeleteDatasetButton datasetId={dataset.id} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DatasetViewer dataset={dataset} />
      </main>
    </div>
  )
}