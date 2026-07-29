"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

export default function CFOReportPage() {
  const [report, setReport] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function generateReport() {
      try {
        const res = await fetch('/api/cfo-report')
        const data = await res.json()
        if (res.ok) {
          setReport(data.report)
        } else {
          setError(data.error || "Failed to generate report")
        }
      } catch (err) {
        setError("An unexpected error occurred.")
      } finally {
        setLoading(false)
      }
    }
    
    generateReport()
  }, [])

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <h2 className="text-2xl font-bold tracking-tight flex items-center">
            <FileText className="w-6 h-6 mr-2 text-indigo-500" />
            Financial Report
          </h2>
        </div>
        {!loading && !error && (
          <button 
            onClick={() => window.print()}
            className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        )}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl min-h-[500px] p-8 lg:p-12">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-indigo-400 space-y-4 pt-32">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-lg font-medium animate-pulse">Generating your strategic report...</p>
            <p className="text-sm text-zinc-500">The AI is analyzing your sales, inventory, and profit margins.</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 pt-32">
            <p className="text-lg font-medium">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 bg-zinc-800 px-4 py-2 rounded text-zinc-100">
              Try Again
            </button>
          </div>
        ) : (
          <article className="prose prose-invert prose-indigo max-w-none">
            <ReactMarkdown>{report}</ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  )
}
