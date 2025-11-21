import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DINING SYS - IoT Tokenless Dining Management System',
  description: 'Secure, fraud-proof dining management system for CUET',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <div className="pt-16">{children}</div>
      </body>
    </html>
  )
}

