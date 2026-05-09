import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'CareerOps AI — AI-Driven Job Search',
    template: '%s | CareerOps AI',
  },
  description:
    'Find the right job or LIA placement with AI-powered CV analysis, job matching, and tailored applications. Built for the Swedish job market.',
  keywords: ['job search', 'AI', 'CV', 'LIA', 'internship', 'Sweden', 'jobb', 'praktik'],
  openGraph: {
    type: 'website',
    locale: 'sv_SE',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'CareerOps AI',
    description: 'AI-Driven Job Search for the Swedish market',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
