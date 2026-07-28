import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function GET() {
  try {
    // 1. Fetch products and filter low stock items
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('name, sku, current_stock, reorder_level')

    if (productsError) throw productsError

    const lowStockItems = products?.filter(p => p.current_stock <= p.reorder_level) || []

    // 2. Fetch recent transactions (last 7 days) to find fast movers
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const { data: recentSales, error: salesError } = await supabase
      .from('inventory_transactions')
      .select('quantity, products(name, sku, current_stock)')
      .eq('transaction_type', 'SALE')
      .gte('date', oneWeekAgo.toISOString())

    if (salesError) throw salesError

    // Aggregate sales by product
    const salesVolume: Record<string, { name: string; sku: string; sold: number; current_stock: number }> = {}
    
    recentSales?.forEach(sale => {
      // @ts-ignore
      const product = sale.products
      if (product) {
        if (!salesVolume[product.sku]) {
          salesVolume[product.sku] = {
            name: product.name,
            sku: product.sku,
            sold: 0,
            current_stock: product.current_stock
          }
        }
        salesVolume[product.sku].sold += sale.quantity
      }
    })

    const fastMovers = Object.values(salesVolume).sort((a, b) => b.sold - a.sold).slice(0, 5)

    // 3. Prepare Prompt for Gemini
    const systemPrompt = `You are an elite retail inventory analyst and Virtual CFO for Baple Gadgets, a premium electronics retailer.
Your task is to review the current inventory alerts and recent sales velocity, and provide EXACTLY 3 concise, highly actionable bullet points. 
Focus on:
1. Capital allocation for restocking.
2. Which slow-moving or out-of-stock stock to discount or prioritize.
3. A strategic insight based on the data.

Keep the tone professional, sharp, and SaaS-like. 
DO NOT use markdown formatting like bolding or headers, just return exactly 3 plain text bullet points separated by newlines.
Do not include introductory or concluding text.`

    const dataContext = `
Data Context:
Low Stock Items (Need reorder): ${JSON.stringify(lowStockItems)}
Top Selling Items (Last 7 Days): ${JSON.stringify(fastMovers)}
    `

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(systemPrompt + dataContext)
    const responseText = result.response.text()

    // Parse into bullet points
    const insights = responseText
      .split('\n')
      .map(line => line.replace(/^[-*•\d.]\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 3)

    // Fallback if API returns weird formatting
    const finalInsights = insights.length === 3 ? insights : [
      "Analyze fast-moving SKUs to prevent stockouts and capitalize on high demand.",
      "Review low-stock alerts and allocate capital to reorder essential items immediately.",
      "Consider discounting slow-moving inventory to free up warehouse space and capital."
    ]

    return NextResponse.json({ insights: finalInsights })
  } catch (error: any) {
    console.error('CFO Insights Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights', details: error.message },
      { status: 500 }
    )
  }
}
