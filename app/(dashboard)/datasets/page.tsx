import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Database,
  Upload,
  FileText,
  Calendar,
  BarChart3,
  MoreVertical,
  ArrowLeft,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatBytes, formatNumber, formatDate } from '@/lib/utils'

async function getDatasets(userId: string) {
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
  })
}

export default async function DatasetsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const datasets = await getDatasets(session.user.id)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
      <div className='mb-8'>
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to dashboard
        </Link>
      </div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Datasets</h1>
            <p className="text-muted-foreground mt-1">
              Manage, explore, and visualize your uploaded data
            </p>
          </div>
          <Link href="/upload">
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload New Dataset
            </Button>
          </Link>
        </div>

        {datasets.length === 0 ? (
          <div className="bg-card rounded-lg border p-12 text-center">
            <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No datasets yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload your first CSV or Excel file to get started
            </p>
            <Link href="/upload">
              <Button>Upload Dataset</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-lg border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Stats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {datasets.map((dataset) => (
                    <tr key={dataset.id} className="hover:bg-accent transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <Link
                            href={{
                              pathname: `/datasets/${dataset.id}`,
                            }}
                          >
                            <span className="font-medium text-foreground hover:text-primary transition-colors">
                              {dataset.name}
                            </span>
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatNumber(dataset.rowCount || 0)} rows × {dataset.columnCount} columns
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                          {dataset.sourceType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(dataset.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/datasets/${dataset.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>

  )
}