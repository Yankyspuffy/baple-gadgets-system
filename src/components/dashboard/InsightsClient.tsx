"use client"

import { useEffect, useState } from "react"
import { Sparkles, Loader2, RefreshCw } from "lucide-react"

export function InsightsClient() {
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/cfo-insights')
      if (!res.ok) throw new Error('Failed to fetch insights')
      const data = await res.json()
      setInsights(data.insights)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center space-x-2 text-indigo-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Generating financial insights...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-32 flex-col items-center justify-center text-red-400">
        <p className="text-sm mb-2">{error}</p>
        <button onClick={fetchInsights} className="flex items-center text-xs hover:text-red-300">
          <RefreshCw className="mr-1 h-3 w-3" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {insights.map((insight, idx) => (
          <li key={idx} className="flex items-start">
            <span className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
              {idx + 1}
            </span>
            <span className="text-sm leading-relaxed text-zinc-300">{insight}</span>
          </li>
        ))}
      </ul>
      <div className="pt-2 border-t border-indigo-900/50 flex justify-end">
        <button 
          onClick={fetchInsights}
          className="text-xs flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh Insights
        </button>
      </div>
    </div>
  )
}
