import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ProductForm, type ProductFormValues } from '@/components/products/ProductForm'
import { ProductsGrid } from '@/components/products/ProductsGrid'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Modal } from '@/components/ui/Modal'
import { apiDelete, apiGet, apiPatch, apiPost, getFriendlyErrorMessage } from '@/lib/api'
import type { Paginated, Product } from '@/types'

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiGet<Paginated<Product> | Product[]>('/products'),
  })

  const products = Array.isArray(data) ? data : (data?.items ?? [])

  const saveMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = {
        ...values,
        imageUrl: values.imageUrl || null,
        sku: values.sku || null,
        description: values.description || null,
      }
      if (editing) {
        return apiPatch<Product>(`/products/${editing.id}`, payload)
      }
      return apiPost<Product>('/products', payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      setOpen(false)
      setEditing(null)
      setFormError(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/products/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  return (
    <AppShell title="Products">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Manage catalog items used for WhatsApp order matching.</p>
        <Button
          onClick={() => {
            setEditing(null)
            setFormError(null)
            setOpen(true)
          }}
        >
          Add product
        </Button>
      </div>

      {error ? (
        <ErrorState description={getFriendlyErrorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <ProductsGrid
          products={products}
          loading={isLoading}
          onEdit={(product) => {
            setEditing(product)
            setFormError(null)
            setOpen(true)
          }}
          onDelete={(product) => {
            if (window.confirm(`Delete “${product.name}”?`)) {
              deleteMutation.mutate(product.id)
            }
          }}
        />
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Edit product' : 'Add product'}
        description="Prices and stock are used when confirming WhatsApp orders."
      >
        <ProductForm
          initial={editing ?? undefined}
          submitting={saveMutation.isPending}
          onCancel={() => {
            setOpen(false)
            setEditing(null)
          }}
          onSubmit={async (values) => {
            try {
              await saveMutation.mutateAsync(values)
            } catch (err) {
              setFormError(getFriendlyErrorMessage(err, 'Unable to save product.'))
            }
          }}
        />
        {formError ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {formError}
          </p>
        ) : null}
      </Modal>
    </AppShell>
  )
}
