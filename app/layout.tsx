import '@/app/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { SocketProvider } from '@/components/providers/socket-provider'
import { Toaster } from 'react-hot-toast'
import Header from '@/components/layout/header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WheelWise - Smart and Fair Decision Wheel',
  description: 'Interactive, fairness-driven spin-wheel platform with provably fair algorithms, multiplayer features, and custom designs.',
  keywords: ['wheel', 'spinner', 'decision', 'raffle', 'fair', 'random', 'multiplayer'],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/logo.svg',
  },
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
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SocketProvider>
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <Header />
                <main className="container mx-auto px-4 py-8">
                  {children}
                </main>
              </div>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1e293b',
                    color: '#fff',
                    border: '1px solid #334155',
                  },
                }}
              />
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
