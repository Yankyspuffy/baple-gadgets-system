"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

type Transaction = {
  id: string
  product_id: string
  transaction_type: 'SALE' | 'RESTOCK'
  quantity: number
  date: string
  products: {
    name: string
    sku: string
  }
}

export function LogsClient() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*, products(name, sku)')
      .order('date', { ascending: false })
      .limit(50)
    
    if (error) {
      console.error(error)
    } else {
      setTransactions(data as any || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-zinc-800 bg-zinc-950/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                  No stock movements found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-zinc-400">
                    {format(new Date(tx.date), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{tx.products?.name}</span>
                      <span className="text-xs text-zinc-500">{tx.products?.sku}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tx.transaction_type === 'SALE' ? (
                      <Badge variant="outline" className="text-indigo-400 border-indigo-400/30 bg-indigo-400/10">Sale</Badge>
                    ) : (
                      <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10">Restock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {tx.transaction_type === 'SALE' ? (
                      <span className="text-red-400">-{tx.quantity}</span>
                    ) : (
                      <span className="text-emerald-400">+{tx.quantity}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
