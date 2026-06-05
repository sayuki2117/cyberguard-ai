import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import QueryProvider from '@/components/QueryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CyberGuard AI — Cybersecurity Awareness Trainer',
  description: 'AI-powered cybersecurity training for students, small businesses, and beginners.',
  keywords: 'cybersecurity, phishing, password security, AI chatbot, security training',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0a0e1a] text-gray-100 antialiased`}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
