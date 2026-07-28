import Link from 'next/link'
import { LayoutDashboard, Package, History } from 'lucide-react'

export function Sidebar() {
  return (
    <div className="flex h-screen w-64 flex-col bg-zinc-950 border-r border-zinc-800 text-zinc-100">
      <div className="flex h-16 items-center px-6 border-b border-zinc-800">
        <Package className="h-6 w-6 mr-2 text-indigo-500" />
        <span className="text-lg font-bold tracking-tight">Baple Gadgets</span>
      </div>
      <div className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          <Link href="/" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors">
            <LayoutDashboard className="mr-3 h-5 w-5 text-zinc-400" />
            Overview
          </Link>
          <Link href="/inventory" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors">
            <Package className="mr-3 h-5 w-5 text-zinc-400" />
            Inventory
          </Link>
          <Link href="/logs" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors">
            <History className="mr-3 h-5 w-5 text-zinc-400" />
            Stock Movement
          </Link>
        </nav>
      </div>
    </div>
  )
}
