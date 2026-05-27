'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      router.push(`/shop?search=${encodeURIComponent(q)}`)
      setQuery('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <Input
        ref={inputRef}
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search products, brands..."
        className="pl-9 pr-4 bg-gray-50 border-gray-200 focus:bg-white"
      />
    </form>
  )
}
