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
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; }
                .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 30px 40px; text-align: center; }
                .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
                .content { padding: 40px; }
                .task-title { font-size: 20px; font-weight: 600; color: #ffffff; margin-top: 0; margin-bottom: 24px; }
                .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
                .meta-box { background-color: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; }
                .meta-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #a1a1aa; margin-bottom: 4px; font-weight: 600; }
                .meta-value { font-size: 16px; color: #e4e4e7; font-weight: 500; margin: 0; }
                .priority-badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
                .priority-high { background-color: rgba(239, 68, 68, 0.2); color: #f87171; }
                .priority-medium { background-color: rgba(245, 158, 11, 0.2); color: #fbbf24; }
                .priority-low { background-color: rgba(113, 113, 122, 0.2); color: #a1a1aa; }
                .description { background-color: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 20px; color: #d4d4d8; line-height: 1.6; margin-bottom: 32px; font-size: 14px; }
                .footer { padding: 0 40px 40px; text-align: center; }
                .btn { display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; transition: background-color 0.2s; }
                .btn:hover { background-color: #4338ca; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Baple CRM Reminder</h1>
                </div>
                <div class="content">
                  <h2 class="task-title">${task.title}</h2>
                  
                  <div class="meta-grid">
                    <div class="meta-box">
                      <div class="meta-label">Due Date</div>
                      <div class="meta-value">${new Date(task.due_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div class="meta-box">
                      <div class="meta-label">Priority</div>
                      <div class="meta-value">
                        <span class="priority-badge priority-${task.priority}">
                          ${task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  ${task.description ? `
                  <div class="meta-label" style="margin-bottom: 8px;">Description</div>
                  <div class="description">
                    ${task.description}
                  </div>
                  ` : ''}
                </div>
                <div class="footer">
                  <a href="https://baplegadgetsnew.vercel.app/crm" class="btn">View on Dashboard</a>
                </div>
              </div>
            </body>
            </html>
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
