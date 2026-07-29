import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 60 // Allow 60s for Gemini API to generate the full report

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured")

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Fetch Products
    const { data: products } = await supabase.from('products').select('*')
    // Fetch recent sales (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: sales } = await supabase
      .from('inventory_transactions')
      .select('*, products(name, category, cost_price, selling_price)')
      .eq('transaction_type', 'SALE')
      .gte('date', thirtyDaysAgo.toISOString())

    const prompt = `
      You are an expert Chief Financial Officer (CFO) for an electronics retail business called Baple Gadgets.
      Generate a comprehensive, highly professional Financial & Inventory Markdown Report based on this live data.

      Use beautiful Markdown formatting. Include headings, bullet points, bold text for emphasis, and tables if applicable.

      Current Inventory Data:
      ${JSON.stringify(products?.slice(0, 50))} // truncated to avoid token limits if too large

      Last 30 Days Sales Data:
      ${JSON.stringify(sales)}

      The report must include:
      1. Executive Summary
      2. Profitability Analysis (Calculate estimated profit margins based on cost vs selling price of recent sales)
      3. Inventory Health (Identify dead stock, low stock, or overstocked items)
      4. Strategic Recommendations (3 actionable steps for the business owner)
    `

    const result = await model.generateContent(prompt)
    const report = result.response.text()

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error("CFO Report Error:", error)
    return NextResponse.json(
      { error: "Failed to generate report. Please try again later." },
      { status: 500 }
    )
  }
}
