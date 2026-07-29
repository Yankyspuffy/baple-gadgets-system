import { CRMClient } from "./CRMClient"
import { supabase } from "@/lib/supabase/client"

export const revalidate = 0

export default async function CRMPage() {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tasks:', error)
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">CRM & Tasks</h2>
      </div>
      <CRMClient initialTasks={tasks || []} />
    </div>
  )
}
