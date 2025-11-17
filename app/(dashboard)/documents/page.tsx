import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, FileText, Calendar, Hash, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DeleteDocumentButton from '@/components/documents/DeleteDocumentButton'

async function getDocuments(userId: string) {
  return await prisma.textDocument.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      description: true,
      fileType: true,
      wordCount: true,
      themes: true,
      sentiment: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function DocumentsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const documents = await getDocuments(session.user.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Text Documents</h1>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered qualitative analysis of your documents
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/documents/upload">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {documents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-24">
              <div className="text-center">
                <div className="p-6 bg-secondary/30 rounded-full w-fit mx-auto mb-4">
                  <FileText className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No documents yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Upload your first text document to get AI-powered insights
                </p>
                <Link href="/documents/upload">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => {
              const sentiment = doc.sentiment as { overall: string } | null
              const themes = doc.themes as Array<{ name: string }> | null

              return (
                <Card key={doc.id} className="h-full hover:shadow-lg transition-shadow relative group">
                  <Link href={`/documents/${doc.id}`} className="cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-2">{doc.name}</CardTitle>
                          {doc.description && (
                            <CardDescription className="line-clamp-2 mt-2">
                              {doc.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {doc.fileType}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Hash className="w-4 h-4" />
                          {doc.wordCount?.toLocaleString()} words
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Sentiment */}
                      {sentiment && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
                          <Badge
                            variant={
                              sentiment.overall === 'positive'
                                ? 'default'
                                : sentiment.overall === 'negative'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="capitalize"
                          >
                            {sentiment.overall}
                          </Badge>
                        </div>
                      )}

                      {/* Themes */}
                      {themes && themes.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Top Themes</p>
                          <div className="flex flex-wrap gap-1">
                            {themes.slice(0, 3).map((theme, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {theme.name}
                              </Badge>
                            ))}
                            {themes.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{themes.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Link>

                  {/* Delete button - positioned absolutely to avoid Link click */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeleteDocumentButton
                      documentId={doc.id}
                      documentName={doc.name}
                      variant="ghost"
                      size="sm"
                    />
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
