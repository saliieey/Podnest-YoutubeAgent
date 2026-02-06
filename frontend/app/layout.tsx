import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React, { Suspense } from 'react'
import { ProcessingProvider } from './components/ProcessingContext';
import ProcessingToast from './components/ProcessingToast';
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'YouTube Agent',
  description: 'AI-powered YouTube script generator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="min-h-screen overflow-auto">
      <body className={`${inter.className} bg-gray-900 text-gray-100 min-h-screen overflow-auto`}>
        <ProcessingProvider>
          <header className="bg-gray-800 shadow-md p-2 flex items-center justify-center fixed top-0 left-0 w-full z-50" style={{height: '90px'}}>
            <Image
              src="/Podnest_logo.svg"
              alt="Podnest Logo"
              width={130}
              height={70}
              style={{ display: 'block', objectFit: 'contain' }}
              priority
            />
          </header>
          <div style={{paddingTop: '72px'}}>{children}</div>
          <Suspense fallback={null}>
            <ProcessingToast />
          </Suspense>
        </ProcessingProvider>
      </body>
    </html>
  )
} 