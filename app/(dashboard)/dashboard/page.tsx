import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Database, Upload, LogOut, FileText, Calendar, BarChart3, PieChart, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

async function getUserDatasets(userId: string) {
  return await prisma.dataset.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      rowCount: true,
      columnCount: true,
      createdAt: true,
      sourceType: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5, // Show only recent 5 on dashboard
  })
}

async function getStats(userId: string) {
  const [datasetsCount, totalRows, visualizationsCount, dashboardsCount] = await Promise.all([
    prisma.dataset.count({ where: { userId } }),
    prisma.dataset.aggregate({
      where: { userId },
      _sum: { rowCount: true },
    }),
    prisma.visualization.count({
      where: {
        dataset: { userId }
      }
    }),
    prisma.dashboard.count({ where: { userId } })
  ])

  return {
    datasetsCount,
    totalRows: totalRows._sum.rowCount || 0,
    visualizationsCount,
    dashboardsCount,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const [datasets, stats] = await Promise.all([
    getUserDatasets(session.user.id),
    getStats(session.user.id),
  ])
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">DataSense AI</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {session.user.name}</p>
            </div>
            <div className="flex items-center gap-2">
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
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Datasets</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.datasetsCount}</p>
              </div>
              <Database className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <Link href="/visualizations">
              <div className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Charts</p>
                  <p className="text-3xl font-bold text-foreground mt-1 group-hover:text-primary transition-colors">
                    {stats.visualizationsCount}
                  </p>
                </div>
                <PieChart className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <Link href="/dashboards">
              <div className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dashboards</p>
                  <p className="text-3xl font-bold text-foreground mt-1 group-hover:text-primary transition-colors">
                    {stats.dashboardsCount}
                  </p>
                </div>
                <LayoutDashboard className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <Link href="/upload">
              <div className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upload New</p>
                  <p className="text-lg font-semibold text-primary mt-1 group-hover:underline">
                    Add Dataset
                  </p>
                </div>
                <Upload className="w-10 h-10 text-primary" />
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Datasets */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Recent Datasets</h2>
            {datasets.length > 0 && (
              <Link href="/datasets">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            )}
          </div>

          {datasets.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No datasets yet</h3>
              <p className="text-muted-foreground mb-6">
                Upload your first CSV or Excel file to get started
              </p>
              <Link href="/upload">
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Dataset
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {datasets.map((dataset) => (
                <Link
                  key={dataset.id}
                  href={`/datasets/${dataset.id}`}
                  className="block p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-secondary rounded-lg">
                        <FileText className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{dataset.name}</h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <span>{dataset.rowCount?.toLocaleString()} rows</span>
                          <span>•</span>
                          <span>{dataset.columnCount} columns</span>
                          <span>•</span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(dataset.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded">
                      {dataset.sourceType}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-secondary border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-3">🎯 Quick Actions</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/upload" className="text-primary hover:underline">
                  → Upload a new dataset
                </Link>
              </li>
              <li>
                <Link href="/visualizations" className="text-primary hover:underline">
                  → View your charts
                </Link>
              </li>
              <li>
                <Link href="/dashboards" className="text-primary hover:underline">
                  → Create custom dashboards
                </Link>
              </li>
              <li className="text-muted-foreground">
                → Get data insights with AI
              </li>
            </ul>
          </div>

          <div className="bg-secondary border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-3">📊 Supported Files</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• CSV files (.csv)</li>
              <li>• Excel files (.xlsx, .xls)</li>
              <li>• Maximum size: 10MB</li>
              <li>• Up to 5,000 rows</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}