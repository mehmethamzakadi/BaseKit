import { useState } from 'react'
import { ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/dashboard/PageHeader'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { PermissionGate } from '@/features/auth/guards'
import { useProducts, useDeleteProduct } from '@/features/catalog/queries'
import { getApiErrorMessage } from '@/types/api'
import type { ProductDto } from '@/types/catalog'
import ProductFormModal from './ProductFormModal'

const currency = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })

export default function ProductsPage() {
  const { data: products, isLoading, isError, error, refetch } = useProducts()
  const del = useDeleteProduct()

  const [formOpen, setFormOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<ProductDto | null>(null)
  const [toDelete, setToDelete] = useState<ProductDto | null>(null)

  const openCreate = () => {
    setEditProduct(null)
    setFormOpen(true)
  }
  const openEdit = (product: ProductDto) => {
    setEditProduct(product)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await del.mutateAsync(toDelete.id)
      setToDelete(null)
    } catch {
      /* hata toast'lanır */
    }
  }

  return (
    <div>
      <PageHeader
        title="Katalog"
        description="Ürünleri yönetin."
        actions={
          <PermissionGate permission="catalog.products.create">
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Yeni Ürün
            </Button>
          </PermissionGate>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
      ) : products && products.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Ürün</th>
                <th className="px-4 py-3 font-semibold">Fiyat</th>
                <th className="px-4 py-3 font-semibold">Görsel</th>
                <th className="px-4 py-3 text-right font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{product.name}</p>
                    {product.description && (
                      <p className="max-w-md truncate text-xs text-slate-500">
                        {product.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{currency.format(product.price)}</td>
                  <td className="px-4 py-3">
                    {product.imageObjectKey ? (
                      <Badge color="green">Yüklü</Badge>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <ImageIcon className="size-4" /> yok
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <PermissionGate permission="catalog.products.update">
                        <Button variant="secondary" onClick={() => openEdit(product)} aria-label="Düzenle">
                          <Pencil className="size-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="catalog.products.delete">
                        <Button variant="danger" onClick={() => setToDelete(product)} aria-label="Sil">
                          <Trash2 className="size-4" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-500">Henüz ürün yok.</p>
      )}

      {formOpen && (
        <ProductFormModal product={editProduct} onClose={() => setFormOpen(false)} />
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Ürünü sil"
        message={`"${toDelete?.name}" ürününü silmek istediğinize emin misiniz?`}
        confirmText="Sil"
        danger
        loading={del.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
