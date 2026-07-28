"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, PackagePlus } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"

type Product = {
  id: string
  sku: string
  name: string
  category: string
  cost_price: number
  selling_price: number
  current_stock: number
  reorder_level: number
}

export function InventoryClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isReceiveOpen, setIsReceiveOpen] = useState(false)

  // Form states
  const [newProduct, setNewProduct] = useState({ sku: '', name: '', category: '', cost_price: 0, selling_price: 0, current_stock: 0, reorder_level: 5 })
  const [receiveStock, setReceiveStock] = useState({ product_id: '', quantity: 0 })

  const fetchProducts = async () => {
    setLoading(true)
    let query = supabase.from('products').select('*').order('created_at', { ascending: false })
    
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query
    
    if (error) {
      console.error(error)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('products').insert([newProduct])
    if (!error) {
      setIsAddOpen(false)
      fetchProducts()
    } else {
      alert("Failed to add product: " + error.message)
    }
  }

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Get current stock
    const product = products.find(p => p.id === receiveStock.product_id)
    if (!product) return

    // Update stock in products table
    const { error: updateError } = await supabase
      .from('products')
      .update({ current_stock: product.current_stock + Number(receiveStock.quantity) })
      .eq('id', receiveStock.product_id)

    if (updateError) {
      alert("Error updating stock: " + updateError.message)
      return
    }

    // Log transaction
    await supabase.from('inventory_transactions').insert([{
      product_id: receiveStock.product_id,
      transaction_type: 'RESTOCK',
      quantity: Number(receiveStock.quantity)
    }])

    setIsReceiveOpen(false)
    fetchProducts()
  }

  const getStatusBadge = (stock: number, reorder: number) => {
    if (stock <= 0) return <Badge variant="destructive">Out of Stock</Badge>
    if (stock <= reorder) return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">Low Stock</Badge>
    return <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30">In Stock</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            type="text"
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
          <Button onClick={() => setIsReceiveOpen(true)}>
            <PackagePlus className="mr-2 h-4 w-4" />
            Receive Stock
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-950/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Buy Price</TableHead>
              <TableHead className="text-right">Sell Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-zinc-500">
                  Loading inventory...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-zinc-500">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">${product.cost_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${product.selling_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{product.current_stock}</TableCell>
                  <TableCell>
                    {getStatusBadge(product.current_stock, product.reorder_level)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Product Modal */}
      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Product">
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">SKU</label>
              <Input required value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} placeholder="SKU-123" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Name</label>
              <Input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Product Name" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Category</label>
              <Input required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} placeholder="Category" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Current Stock</label>
              <Input type="number" required value={newProduct.current_stock} onChange={e => setNewProduct({...newProduct, current_stock: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Cost Price ($)</label>
              <Input type="number" step="0.01" required value={newProduct.cost_price} onChange={e => setNewProduct({...newProduct, cost_price: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Selling Price ($)</label>
              <Input type="number" step="0.01" required value={newProduct.selling_price} onChange={e => setNewProduct({...newProduct, selling_price: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Reorder Level</label>
              <Input type="number" required value={newProduct.reorder_level} onChange={e => setNewProduct({...newProduct, reorder_level: Number(e.target.value)})} />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit">Save Product</Button>
          </div>
        </form>
      </Dialog>

      {/* Receive Stock Modal */}
      <Dialog open={isReceiveOpen} onClose={() => setIsReceiveOpen(false)} title="Receive Stock">
        <form onSubmit={handleReceiveStock} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Select Product</label>
            <select 
              required 
              className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 text-zinc-100"
              value={receiveStock.product_id} 
              onChange={e => setReceiveStock({...receiveStock, product_id: e.target.value})}
            >
              <option value="" disabled>Select a product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Quantity Received</label>
            <Input type="number" required min="1" value={receiveStock.quantity || ''} onChange={e => setReceiveStock({...receiveStock, quantity: Number(e.target.value)})} placeholder="10" />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsReceiveOpen(false)}>Cancel</Button>
            <Button type="submit">Log Restock</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
