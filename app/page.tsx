import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()
  
  if (session) {
    redirect('/dashboard')
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-foreground">DataSense AI</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex items-center justify-center px-4 py-24">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div>
            <h1 className="text-6xl font-bold text-foreground mb-4">
              DataSense AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
              Mixed-Methods Data Analysis Platform
            </p>
            <p className="text-lg text-muted-foreground/80">
              Analyze quantitative and qualitative data together with AI-powered insights
            </p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="mt-20 grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-foreground mb-2">Visualize Data</h3>
              <p className="text-sm text-muted-foreground">
                Create beautiful charts from CSV and Excel files
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-foreground mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-muted-foreground">
                Get automatic analysis and recommendations
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">🔗</div>
              <h3 className="font-semibold text-foreground mb-2">Mixed-Methods</h3>
              <p className="text-sm text-muted-foreground">
                Combine quantitative and qualitative data
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}