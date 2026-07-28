import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80",
    secondary: "border-transparent bg-zinc-800 text-zinc-100 hover:bg-zinc-800/80",
    destructive: "border-transparent bg-red-900 text-red-100 hover:bg-red-900/80",
    outline: "text-zinc-100",
  }
  
  return (
    <div className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2", variants[variant], className)} {...props} />
  )
}

export { Badge }
