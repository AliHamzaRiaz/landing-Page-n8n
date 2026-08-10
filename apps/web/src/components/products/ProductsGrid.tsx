import { Package } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { Product } from '@/types'

export function ProductsGrid({
  products,
  loading,
  onEdit,
  onDelete,
}: {
  products: Product[]
  loading?: boolean
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-56" />
        ))}
      </div>
    )
  }

  if (!products.length) {
    return (
      <EmptyState
        icon={<Package className="h-8 w-8" />}
        title="No products yet"
        description="Add your first product to start fulfilling WhatsApp orders."
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <article key={product.id} className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="aspect-[16/10] bg-slate-100">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">
                <Package className="h-8 w-8" aria-hidden />
              </div>
            )}
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-ink">{product.name}</h3>
                <p className="text-xs text-muted">{product.sku || 'No SKU'}</p>
              </div>
              <Badge tone={product.isActive ? 'success' : 'muted'}>
                {product.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="line-clamp-2 text-sm text-muted">{product.description || 'No description'}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">{formatCurrency(product.price)}</span>
              <span className="text-muted">{formatNumber(product.stock)} in stock</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(product)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" className="flex-1" onClick={() => onDelete(product)}>
                Delete
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

/** Alias for structure requirement */
export const ProductsTable = ProductsGrid
