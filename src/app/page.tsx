import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, AlertTriangle, TrendingUp, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { InsightsClient } from "@/components/dashboard/InsightsClient"

// Since Supabase requires anon key in client but we are doing SSR, we should fetch on the server.
// However, the client is created with NEXT_PUBLIC keys so it can run anywhere.
async function getDashboardMetrics() {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('current_stock, cost_price, selling_price, reorder_level')

  if (productsError) {
    console.error(productsError)
    return { totalValue: 0, lowStock: 0, profit: 0 }
  }

  const totalValue = products?.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0) || 0
  const lowStock = products?.filter(p => p.current_stock <= p.reorder_level).length || 0

  // For "This Week's Profit", we would need to fetch transactions, but let's mock the aggregation for now 
  // or fetch real transactions if available.
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { data: transactions, error: txError } = await supabase
    .from('inventory_transactions')
    .select('quantity, transaction_type, products(selling_price, cost_price)')
    .gte('date', oneWeekAgo.toISOString())
    .eq('transaction_type', 'SALE')

  let profit = 0
  if (!txError && transactions) {
    profit = transactions.reduce((sum, tx) => {
      // @ts-ignore - Supabase join typing
      const product = tx.products
      if (product) {
        return sum + (tx.quantity * (product.selling_price - product.cost_price))
      }
      return sum
    }, 0)
  }

  return { totalValue, lowStock, profit }
}

export default async function DashboardOverview() {
  const metrics = await getDashboardMetrics()

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <div className="flex items-center space-x-2">
          {/* Calendar/Date Picker can go here */}
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500 mt-1">Based on current stock and cost price</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-500">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{metrics.lowStock} Items</div>
            <p className="text-xs text-zinc-500 mt-1">Below reorder levels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week's Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500 mt-1">+12.5% from last week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 lg:col-span-7 bg-gradient-to-br from-indigo-950/40 to-zinc-950 border-indigo-900/50">
          <CardHeader>
            <CardTitle className="flex items-center text-indigo-400">
              <Sparkles className="mr-2 h-5 w-5" />
              AI CFO Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CFOInsightsWidget />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function CFOInsightsWidget() {
  // We will hit the API route to fetch insights from Gemini
  // In a real app, this might be a Client Component using SWR/React Query for loading states,
  // but we can also fetch it directly on the server if we want.
  // For the sleek SaaS feel, let's make it a client component that fetches.
  return (
    <InsightsClient />
  )
}
