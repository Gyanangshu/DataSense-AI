import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  LayoutDashboard,
  Plus,
  LogOut,
  Calendar,
  Eye,
  Edit,
  Sparkles,
  PieChart
} from 'lucide-react'
import Link from 'next/link'
import DeleteDashboardButton from '@/components/dashboard/DeleteDashboardButton'

async function getUserDashboards(userId: string) {
  return await prisma.dashboard.findMany({
    where: { userId },
    include: {
      _count: {
        select: { visualizations: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function DashboardsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const dashboards = await getUserDashboards(session.user.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-primary" />
                Dashboards
              </h1>
              <p className="text-sm text-muted-foreground">
                Create custom dashboards with your visualizations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Home
                </Button>
              </Link>
              <ThemeToggle />
              <form action={async () => {
                'use server'
                await signOut({ redirectTo: '/' })
              }}>
                <Button variant="outline" type="submit" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Create New Button */}
        <div className="mb-8">
          <Link href="/dashboards/create">
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create New Dashboard
            </Button>
          </Link>
        </div>

        {/* Dashboards Grid */}
        {dashboards.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-24">
              <div className="text-center">
                <div className="p-6 bg-secondary/30 rounded-full w-fit mx-auto mb-4">
                  <LayoutDashboard className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No dashboards yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first dashboard to combine multiple visualizations in one view
                </p>
                <Link href="/dashboards/create">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <Card
                key={dashboard.id}
                className="group hover:shadow-lg hover:border-primary/40 transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {dashboard.name}
                      </CardTitle>
                      {dashboard.description && (
                        <CardDescription className="line-clamp-2 mt-1">
                          {dashboard.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <LayoutDashboard className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <PieChart className="w-4 h-4" />
                      <span>{dashboard._count.visualizations} charts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(dashboard.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {dashboard.isPublic && (
                    <Badge variant="secondary" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Public
                    </Badge>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Link href={`/dashboards/${dashboard.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/dashboards/${dashboard.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <DeleteDashboardButton dashboardId={dashboard.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Tip */}
        {dashboards.length > 0 && (
          <Card className="mt-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardContent className="py-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">Pro Tip</p>
                  <p className="text-sm text-muted-foreground">
                    Dashboards automatically update when you modify the underlying visualizations.
                    Create multiple dashboards to organize insights by theme or audience.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
