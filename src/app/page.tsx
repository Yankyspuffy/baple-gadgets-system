import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, AlertTriangle, TrendingUp, Sparkles, BarChart3, LineChart, PieChart as PieChartIcon } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { InsightsClient } from "@/components/dashboard/InsightsClient"
import { StockChart } from "@/components/dashboard/StockChart"
import { SalesChart } from "@/components/dashboard/SalesChart"
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart"

export const revalidate = 60 // ISR: Revalidate every 60 seconds

async function getDashboardMetrics() {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('current_stock, cost_price, selling_price, reorder_level, category')

  if (productsError) {
    console.error(productsError)
    return { totalValue: 0, lowStock: 0, profit: 0, stockByCategory: [], salesByDate: [] }
  }

  const totalValue = products?.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0) || 0
  const lowStock = products?.filter(p => p.current_stock <= p.reorder_level).length || 0

  // Aggregate stock by category
  const categoryMap: Record<string, number> = {}
  products?.forEach(p => {
    const cat = p.category || 'Uncategorized'
    categoryMap[cat] = (categoryMap[cat] || 0) + p.current_stock
  })
  const stockByCategory = Object.entries(categoryMap).map(([category, value]) => ({ category, value }))

  // For "This Week's Profit", fetch transactions
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { data: transactions, error: txError } = await supabase
    .from('inventory_transactions')
    .select('quantity, transaction_type, date, products(selling_price, cost_price)')
    .gte('date', oneWeekAgo.toISOString())
    .eq('transaction_type', 'SALE')

  let profit = 0
  const salesMap: Record<string, number> = {}

  if (!txError && transactions) {
    transactions.forEach((tx) => {
      // @ts-ignore - Supabase join typing
      const product = tx.products
      if (product) {
        const saleProfit = (tx.quantity * (product.selling_price - product.cost_price))
        profit += saleProfit
        
        const dateStr = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        salesMap[dateStr] = (salesMap[dateStr] || 0) + saleProfit
      }
    })
  }

  // Generate last 7 days for X-axis even if 0 sales
  const salesByDate = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    salesByDate.push({ date: dateStr, sales: salesMap[dateStr] || 0 })
  }

  return { totalValue, lowStock, profit, stockByCategory, salesByDate }
}

async function DashboardMetrics() {
  const metrics = await getDashboardMetrics()

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-200">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${metrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500 mt-1">Based on current stock and cost price</p>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-500">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{metrics.lowStock} Items</div>
            <p className="text-xs text-zinc-500 mt-1">Below reorder levels</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-200">This Week's Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${metrics.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500 mt-1">From last 7 days of sales</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-6">
        <Card className="col-span-4 lg:col-span-7 bg-gradient-to-br from-indigo-950/40 to-zinc-950 border-indigo-900/50">
          <CardHeader>
            <CardTitle className="flex items-center text-indigo-400">
              <Sparkles className="mr-2 h-5 w-5" />
              AI CFO Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
             {/* We will add a new prop or update InsightsClient later to show the generate report button */}
            <InsightsClient />
          </CardContent>
        </Card>
        
        <Card className="col-span-4 lg:col-span-3 bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center text-zinc-100">
              <PieChartIcon className="mr-2 h-5 w-5 text-indigo-500" />
              Category Distribution
            </CardTitle>
            <CardDescription className="text-zinc-400">Inventory share by category</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={metrics.stockByCategory} />
          </CardContent>
        </Card>

        <Card className="col-span-4 lg:col-span-4 bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center text-zinc-100">
              <LineChart className="mr-2 h-5 w-5 text-emerald-500" />
              Sales Profit (Last 7 Days)
            </CardTitle>
            <CardDescription className="text-zinc-400">Daily profit trends over the last week</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart data={metrics.salesByDate} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// Skeletons for Suspense
function MetricsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-zinc-900 rounded-xl border border-zinc-800"></div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-6">
        <div className="col-span-4 lg:col-span-7 h-48 bg-zinc-900 rounded-xl border border-zinc-800"></div>
        <div className="col-span-4 lg:col-span-3 h-96 bg-zinc-900 rounded-xl border border-zinc-800"></div>
        <div className="col-span-4 lg:col-span-4 h-96 bg-zinc-900 rounded-xl border border-zinc-800"></div>
      </div>
    </div>
  )
}

export default function DashboardOverview() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight text-white">Overview</h2>
      </div>
      
      <Suspense fallback={<MetricsSkeleton />}>
        <DashboardMetrics />
      </Suspense>
    </div>
  )
}
