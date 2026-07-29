"use client"

import { useState } from "react"
import { Plus, Clock, Mail, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Task = {
  id: string
  title: string
  description: string
  due_date: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  reminder_email: string
  created_at: string
}

export function CRMClient({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isOpen, setIsOpen] = useState(false)
  
  // New task form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium')
  const [reminderEmail, setReminderEmail] = useState("")

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        title,
        description,
        due_date: dueDate || null,
        status: 'pending',
        priority,
        reminder_email: reminderEmail || null
      }])
      .select()

    if (error) {
      console.error(error)
      alert("Failed to create task: " + error.message)
      return
    }

    if (data) {
      setTasks([data[0], ...tasks])
      setIsOpen(false)
      // Reset form
      setTitle("")
      setDescription("")
      setDueDate("")
      setPriority("medium")
      setReminderEmail("")
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    }
  }

  const columns = [
    { id: 'pending', title: 'Pending' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'completed', title: 'Completed' }
  ] as const

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-zinc-400">Manage follow-ups, reorders, and customer requests.</p>
        
        <Button onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input required value={title} onChange={e => setTitle(e.target.value)} className="bg-zinc-900 border-zinc-800" placeholder="e.g. Call supplier for iPhones" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" 
                  placeholder="Details..." 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select 
                    value={priority} 
                    onChange={e => setPriority(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-zinc-900 border-zinc-800 [color-scheme:dark]" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Mail className="w-4 h-4 mr-2" /> Reminder Email
                </label>
                <Input type="email" value={reminderEmail} onChange={e => setReminderEmail(e.target.value)} className="bg-zinc-900 border-zinc-800" placeholder="Remind this email..." />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2">Save Task</Button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(col => (
          <div key={col.id} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <h3 className="font-semibold text-lg mb-4 flex items-center justify-between">
              {col.title}
              <span className="text-xs bg-zinc-800 px-2 py-1 rounded-full text-zinc-400">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </h3>
            
            <div className="space-y-3">
              {tasks.filter(t => t.status === col.id).map(task => (
                <Card key={task.id} className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm font-medium line-clamp-2 leading-snug">
                        {task.title}
                      </CardTitle>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 pb-3">
                    {task.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-3 text-xs text-zinc-400">
                      {task.due_date && (
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {task.reminder_email && (
                        <span className="flex items-center" title={task.reminder_email}>
                          <Mail className="w-3 h-3 mr-1" /> Yes
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-3 pt-0 flex justify-end">
                    <select 
                      value={task.status} 
                      onChange={e => handleStatusChange(task.id, e.target.value as any)}
                      className="h-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-2 w-[110px] focus:outline-none focus:border-indigo-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
