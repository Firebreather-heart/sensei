import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { SpaceProvider } from '@/contexts/SpaceContext'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

// Use system fonts instead of Google Fonts to avoid network issues
// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sensei ',
  description: 'Code sharing, live chat',
  generator: 'firebreather',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
        `}</style>
      </head>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SpaceProvider>
            {children}
            <Toaster />
          </SpaceProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
