"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Package } from "lucide-react"

export default function LoginPage() {
  const [passphrase, setPassphrase] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase })
      })

      if (res.ok) {
        window.location.href = '/' // Force full reload to run middleware again
      } else {
        const data = await res.json()
        setError(data.error || "Login failed")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-indigo-500" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Baple Gadgets Admin</h1>
          <p className="text-zinc-500 text-sm mt-2">Enter the master passphrase to access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="password" 
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Master Passphrase"
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                required
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  )
}
