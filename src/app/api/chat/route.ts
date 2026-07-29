import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured")

    const { messages } = await request.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Fetch Products to provide context to the AI
    const { data: products } = await supabase.from('products').select('sku, name, category, current_stock, selling_price, reorder_level')

    const systemPrompt = `
      You are the Baple Gadgets AI Assistant. You are a smart, helpful business manager.
      You have access to the current live inventory data. Answer the user's questions based ONLY on this data.
      If the user asks something unrelated to the business or inventory, politely guide them back.

      Current Live Inventory:
      ${JSON.stringify(products)}
    `

    // Construct the chat history for Gemini. 
    // Gemini API expects an array of { role: "user" | "model", parts: [{ text: "..." }] }
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))

    // Start a chat session with the system prompt context as the first message if history is empty,
    // or just pass it in instructions (though gemini-1.5-flash supports system_instruction, we can also just prepend it)
    
    const chat = model.startChat({
      systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt }]
      },
      history: history
    })

    const userMessage = messages[messages.length - 1].content
    const result = await chat.sendMessage(userMessage)
    const responseText = result.response.text()

    return NextResponse.json({ role: 'assistant', content: responseText })
  } catch (error: any) {
    console.error("Chat Error:", error)
    return NextResponse.json(
      { error: "Failed to process chat. Please try again later." },
      { status: 500 }
    )
  }
}
