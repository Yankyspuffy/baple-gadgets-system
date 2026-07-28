import { LogsClient } from "./LogsClient"

export default function LogsPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Stock Movement</h2>
      </div>
      <LogsClient />
    </div>
  )
}
