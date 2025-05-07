import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function BlogLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-amber-500 py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white">Blog</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <ScrollArea className="h-full">{children}</ScrollArea>
      </main>
    </div>
  )
}
