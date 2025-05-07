import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function BlogLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="container mx-auto px-4 py-8">
        <ScrollArea className="h-full">{children}</ScrollArea>
      </main>
    </div>
  )
}
