import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { Resend } from 'resend'

// Resend initialization (requires RESEND_API_KEY in environment)
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key')

export async function GET(request: Request) {
  try {
    // 1. Fetch pending tasks that are due soon (e.g. today or overdue) and have a reminder_email
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'completed')
      .not('reminder_email', 'is', null)
      .lte('due_date', today.toISOString())

    if (error) {
      throw error
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ message: "No tasks require reminders today." })
    }

    // 2. Prepare and send emails
    let emailsSent = 0
    let emailsFailed = 0

    // Only attempt to send if a real API key is present
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not set. Mocking email sends.")
      return NextResponse.json({ 
        message: "Simulated emails sent (no API key provided).", 
        tasks_found: tasks.length 
      })
    }

    // You must verify your domain in Resend to send *from* it.
    // For now, if you are testing, use onboarding@resend.dev to send to your verified email.
    const sender = 'onboarding@resend.dev' // Replace with your verified domain e.g., 'updates@baplegadgets.com'

    for (const task of tasks) {
      if (!task.reminder_email) continue

      try {
        await resend.emails.send({
          from: `Baple CRM <${sender}>`,
          to: task.reminder_email,
          subject: `Reminder: ${task.title}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Task Reminder</h2>
              <p><strong>Title:</strong> ${task.title}</p>
              <p><strong>Priority:</strong> <span style="text-transform: uppercase;">${task.priority}</span></p>
              <p><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>
              <p><strong>Description:</strong></p>
              <p>${task.description || 'No description provided.'}</p>
              <br/>
              <a href="https://baple-gadgets-system.vercel.app/crm" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View CRM Board</a>
            </div>
          `
        })
        emailsSent++
      } catch (emailError) {
        console.error(`Failed to send email for task ${task.id}:`, emailError)
        emailsFailed++
      }
    }

    return NextResponse.json({ 
      success: true, 
      sent: emailsSent, 
      failed: emailsFailed,
      total_found: tasks.length
    })

  } catch (err: any) {
    console.error("Cron Error:", err)
    return NextResponse.json({ error: "Failed to process reminders.", details: err.message }, { status: 500 })
  }
}
