import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown, ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/dashboard/PageHeader'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SearchInput from '@/components/ui/SearchInput'
import Pagination from '@/components/ui/Pagination'
import { PermissionGate } from '@/features/auth/guards'
import { useProducts, useDeleteProduct } from '@/features/catalog/queries'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { getApiErrorMessage } from '@/types/api'
import type { ProductDto } from '@/types/catalog'
import ProductFormModal from './ProductFormModal'

const currency = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function ProductsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState('createdat')
  const [desc, setDesc] = useState(true)

  const search = useDebouncedValue(searchInput.trim(), 300)

  // Arama terimi değişince ilk sayfaya dön.
  useEffect(() => {
    setPage(1)
  }, [search])

  const changePageSize = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useProducts({
    page,
    pageSize,
    search: search || undefined,
    sort,
    desc,
  })
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

  const toggleSort = (field: string) => {
    if (sort === field) {
      setDesc((d) => !d)
    } else {
      setSort(field)
      setDesc(false)
    }
    setPage(1)
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

  const products = data?.items ?? []
  const hasResults = products.length > 0

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

      <div className="mb-4 max-w-sm">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Ürün adı veya açıklamada ara..."
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
      ) : hasResults ? (
        <div
          className={`overflow-hidden rounded-xl border border-slate-200 bg-white transition-opacity ${
            isPlaceholderData ? 'opacity-60' : ''
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <SortableTh
                    label="Ürün"
                    field="name"
                    sort={sort}
                    desc={desc}
                    onSort={toggleSort}
                  />
                  <SortableTh
                    label="Fiyat"
                    field="price"
                    sort={sort}
                    desc={desc}
                    onSort={toggleSort}
                  />
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
          {data && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.totalCount}
              totalPages={data.totalPages}
              onPageChange={setPage}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={changePageSize}
            />
          )}
        </div>
      ) : (
        <p className="text-slate-500">
          {search ? `"${search}" için sonuç bulunamadı.` : 'Henüz ürün yok.'}
        </p>
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

interface SortableThProps {
  label: string
  field: string
  sort: string
  desc: boolean
  onSort: (field: string) => void
}

/** Tıklanınca sıralamayı değiştiren tablo başlığı; aktif yönü ok ile gösterir. */
function SortableTh({ label, field, sort, desc, onSort }: SortableThProps) {
  const active = sort === field
  return (
    <th className="px-4 py-3 font-semibold">
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 uppercase tracking-wider transition hover:text-slate-700"
      >
        {label}
        {active ? (
          desc ? <ArrowDown className="size-3.5" /> : <ArrowUp className="size-3.5" />
        ) : (
          <ChevronsUpDown className="size-3.5 text-slate-300" />
        )}
      </button>
    </th>
  )
}
