import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import DashboardViewer from '@/components/dashboard/DashboardViewer'
import ExportDashboardButton from '@/components/dashboard/ExportDashboardButton'
import ShareButton from '@/components/share/ShareButton'

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
              name: true,
              columns: true,
              types: true,
              data: true
            }
          }
        }
      }
    }
  })
}

export default async function DashboardViewPage({
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboards"
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {dashboard.name}
                </h1>
                {dashboard.description && (
                  <p className="text-sm text-muted-foreground">
                    {dashboard.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShareButton
                shareType="dashboard"
                resourceId={dashboard.id}
                resourceName={dashboard.name}
                variant="outline"
                size="sm"
              />
              <ExportDashboardButton
                dashboardId={dashboard.id}
                dashboardName={dashboard.name}
                description={dashboard.description}
              />
              <Link href={`/dashboards/${dashboard.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardViewer dashboard={dashboard} />
      </main>
    </div>
  )
}
