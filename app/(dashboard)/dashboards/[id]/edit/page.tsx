import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import DashboardBuilder from '@/components/dashboard/DashboardBuilder'

async function getUserVisualizations(userId: string) {
  return await prisma.visualization.findMany({
    where: {
      dataset: { userId }
    },
    include: {
      dataset: {
        select: {
          id: true,
          name: true,
          data: true,
          columns: true,
          types: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

async function getDashboard(id: string, userId: string) {
  return await prisma.dashboard.findFirst({
    where: {
      id,
      userId
    },
    include: {
      visualizations: {
        include: {
          dataset: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  })
}

export default async function EditDashboardPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await params
  const dashboard = await getDashboard(resolvedParams.id, session.user.id)

  if (!dashboard) {
    redirect('/dashboards')
  }

  const visualizations = await getUserVisualizations(session.user.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link
                href={`/dashboards/${dashboard.id}`}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Edit Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  {dashboard.name}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardBuilder
          userId={session.user.id}
          visualizations={visualizations}
          existingDashboard={{
            id: dashboard.id,
            name: dashboard.name,
            description: dashboard.description,
            config: dashboard.config as {
              layout?: Array<{
                id: string
                visualizationId: string
                x: number
                y: number
                w: number
                h: number
              }>
              preset?: string
            } | null,
            selectedVizIds: dashboard.visualizations.map(v => v.id)
          }}
        />
      </main>
    </div>
  )
}
