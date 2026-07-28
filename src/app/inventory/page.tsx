import { InventoryClient } from "./InventoryClient"

export default function InventoryPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Master</h2>
      </div>
      <InventoryClient />
    </div>
  )
}
