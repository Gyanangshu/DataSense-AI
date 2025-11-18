import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import CorrelationCreator from '@/components/correlations/CorrelationCreator'

async function getUserData(userId: string) {
  const [datasets, documents] = await Promise.all([
    prisma.dataset.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        rowCount: true,
        columnCount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.textDocument.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        wordCount: true,
        themes: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
  ])

  return { datasets, documents }
}

export default async function CreateCorrelationPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const { datasets, documents } = await getUserData(session.user.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
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
                  Create Correlation Analysis
                </h1>
                <p className="text-sm text-muted-foreground">
                  Link qualitative and quantitative data to discover insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CorrelationCreator
          userId={session.user.id}
          datasets={datasets}
          documents={documents}
        />
      </main>
    </div>
  )
}
