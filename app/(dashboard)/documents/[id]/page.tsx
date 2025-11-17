import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, FileText, Calendar, Hash, Home } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import DocumentAnalysisView from '@/components/documents/DocumentAnalysisView'
import DeleteDocumentButton from '@/components/documents/DeleteDocumentButton'
import { Button } from '@/components/ui/button'

async function getDocument(id: string, userId: string) {
  return await prisma.textDocument.findFirst({
    where: { id, userId },
    select: {
      id: true,
      name: true,
      description: true,
      fileType: true,
      fileName: true,
      fileSize: true,
      wordCount: true,
      content: true,
      themes: true,
      sentiment: true,
      keywords: true,
      summary: true,
      createdAt: true
    }
  })
}

export default async function DocumentViewPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const resolvedParams = await params
  const document = await getDocument(resolvedParams.id, session.user.id)

  if (!document) redirect('/documents')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link
                href="/documents"
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {document.name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {document.fileType}
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    {document.wordCount?.toLocaleString()} words
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(document.createdAt).toLocaleDateString()}
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
              <DeleteDocumentButton documentId={document.id} documentName={document.name} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DocumentAnalysisView document={document} />
      </main>
    </div>
  )
}
