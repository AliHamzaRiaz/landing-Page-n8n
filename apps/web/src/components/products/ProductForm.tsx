import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import type { Product } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  stock: z.number().int('Stock must be a whole number').min(0, 'Stock must be 0 or greater'),
  imageUrl: z
    .string()
    .optional()
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), {
      message: 'Enter a valid image URL',
    }),
  isActive: z.boolean(),
})

export type ProductFormValues = z.infer<typeof schema>

export function ProductForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Product>
  submitting?: boolean
  onSubmit: (values: ProductFormValues) => Promise<void> | void
  onCancel?: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      sku: initial?.sku ?? '',
      price: Number(initial?.price ?? 0),
      stock: Number(initial?.stock ?? 0),
      imageUrl: initial?.imageUrl ?? '',
      isActive: initial?.isActive ?? true,
    },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <Label htmlFor="product-name">Name</Label>
        <Input id="product-name" error={Boolean(errors.name)} {...register('name')} />
        {errors.name ? <p className="mt-1 text-xs text-danger">{errors.name.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="product-description">Description</Label>
        <Textarea id="product-description" {...register('description')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="product-sku">SKU</Label>
          <Input id="product-sku" {...register('sku')} />
        </div>
        <div>
          <Label htmlFor="product-image">Image URL</Label>
          <Input id="product-image" error={Boolean(errors.imageUrl)} {...register('imageUrl')} />
          {errors.imageUrl ? <p className="mt-1 text-xs text-danger">{errors.imageUrl.message}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="product-price">Price</Label>
          <Input
            id="product-price"
            type="number"
            step="0.01"
            error={Boolean(errors.price)}
            {...register('price', { valueAsNumber: true })}
          />
          {errors.price ? <p className="mt-1 text-xs text-danger">{errors.price.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="product-stock">Stock</Label>
          <Input
            id="product-stock"
            type="number"
            step="1"
            error={Boolean(errors.stock)}
            {...register('stock', { valueAsNumber: true })}
          />
          {errors.stock ? <p className="mt-1 text-xs text-danger">{errors.stock.message}</p> : null}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" className="h-4 w-4 rounded border-border text-brand focus-ring" {...register('isActive')} />
        Active product
      </label>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={submitting}>
          Save product
        </Button>
      </div>
    </form>
  )
}
