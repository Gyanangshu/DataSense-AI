import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import VisualizationBuilder from '@/components/visualization/VisualizationBuilder'

async function getDataset(id: string, userId: string) {
  return await prisma.dataset.findFirst({
    where: {
      id,
      userId
    },
    select: {
      id: true,
      name: true,
      columns: true,
      types: true,
      stats: true,
      rowCount: true,
    }
  })
}

export default async function VisualizePage({ 
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
                href={`/datasets/${datasetId}`}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Create Visualization
                </h1>
                <p className="text-sm text-muted-foreground">
                  {dataset.name} • {dataset.rowCount?.toLocaleString()} rows
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VisualizationBuilder dataset={dataset} />
      </main>
    </div>
  )
}