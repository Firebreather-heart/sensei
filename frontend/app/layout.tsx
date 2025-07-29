import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { SpaceProvider } from '@/contexts/SpaceContext'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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
  font-family: ${inter.style.fontFamily};
}
        `}</style>
      </head>
      <body className={inter.className}>
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
