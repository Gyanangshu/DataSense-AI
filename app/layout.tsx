import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/providers/session-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from 'sonner'
import DrillDownPanel from '@/components/charts/DrillDownPanel'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DataSense AI - Mixed-Methods Data Analysis Platform',
  description: 'Analyze quantitative and qualitative data together with AI-powered insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <DrillDownPanel />
            <Toaster richColors position="bottom-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}