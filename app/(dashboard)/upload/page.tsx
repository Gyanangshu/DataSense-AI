import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FileUploader from '@/components/upload/FileUploader'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function UploadPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
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
                  Upload Dataset
                </h1>
                <p className="text-sm text-muted-foreground">
                  Import your CSV or Excel files for analysis
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FileUploader />
        
        {/* Tips Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-3">
              📁 Supported Formats
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• CSV (.csv) - Comma-separated values</li>
              <li>• Excel (.xlsx, .xls) - Microsoft Excel files</li>
              <li>• Maximum file size: 10MB</li>
              <li>• Up to 5,000 rows (demo limit)</li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-3">
              💡 Data Requirements
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• First row should contain column headers</li>
              <li>• Avoid merged cells in Excel files</li>
              <li>• Dates should be in standard formats</li>
              <li>• Remove empty rows and columns</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}