import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown, ImageIcon, Package, Pencil, Plus, Trash2, X } from 'lucide-react'
import PageHeader from '@/components/dashboard/PageHeader'
import Button from '@/components/ui/Button'
import TableSkeleton from '@/components/ui/TableSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SearchInput from '@/components/ui/SearchInput'
import Pagination from '@/components/ui/Pagination'
import { PermissionGate } from '@/features/auth/guards'
import { useAuth } from '@/features/auth/useAuth'
import { useProducts, useDeleteProduct, useBulkDeleteProducts } from '@/features/catalog/queries'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { usePublicSettings } from '@/features/settings/usePublicSettings'
import { buildPageSizeOptions } from '@/lib/pageSize'
import { getApiErrorMessage } from '@/types/api'
import type { ProductDto } from '@/types/catalog'
import ProductFormModal from './ProductFormModal'

const currency = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function ProductsPage() {
  const { hasPermission } = useAuth()
  const canDelete = hasPermission('catalog.products.delete')
  const { defaultPageSize } = usePublicSettings()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
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
  const bulkDelete = useBulkDeleteProducts()

  const [formOpen, setFormOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<ProductDto | null>(null)
  const [toDelete, setToDelete] = useState<ProductDto | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const products = data?.items ?? []
  const hasResults = products.length > 0

  // Sayfa/arama/boyut/sıralama değişince seçimi sıfırla.
  useEffect(() => {
    setSelected(new Set())
  }, [page, search, pageSize, sort, desc])

  const selectedIds = useMemo(() => [...selected], [selected])
  const allSelected = products.length > 0 && products.every((p) => selected.has(p.id))

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelected((prev) => (prev.size === products.length ? new Set() : new Set(products.map((p) => p.id))))

  const clearSelection = () => setSelected(new Set())

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

  const confirmBulkDelete = async () => {
    try {
      await bulkDelete.mutateAsync(selectedIds)
      clearSelection()
      setBulkDeleteOpen(false)
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

      <div className="mb-4 max-w-sm">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Ürün adı veya açıklamada ara..."
        />
      </div>

      {/* Toplu işlem çubuğu */}
      {canDelete && selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 dark:border-brand-500/30 dark:bg-brand-500/10">
          <span className="text-sm font-medium text-brand-800 dark:text-brand-200">
            {selected.size} ürün seçildi
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="danger" onClick={() => setBulkDeleteOpen(true)} disabled={bulkDelete.isPending}>
              <Trash2 className="size-4" />
              Sil
            </Button>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-md p-1.5 text-brand-700 transition hover:bg-brand-100 dark:text-brand-300 dark:hover:bg-brand-500/20"
              aria-label="Seçimi temizle"
              title="Seçimi temizle"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton columns={4} />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
      ) : hasResults ? (
        <div
          className={`overflow-hidden rounded-xl border border-slate-200 bg-white transition-opacity dark:border-slate-700 dark:bg-slate-900 ${
            isPlaceholderData ? 'opacity-60' : ''
          }`}
        >
          {/* Masaüstü: tablo */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  {canDelete && (
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200 dark:border-slate-600"
                        checked={allSelected}
                        onChange={toggleAll}
                        aria-label="Tümünü seç"
                      />
                    </th>
                  )}
                  <SortableTh label="Ürün" field="name" sort={sort} desc={desc} onSort={toggleSort} />
                  <SortableTh label="Fiyat" field="price" sort={sort} desc={desc} onSort={toggleSort} />
                  <th className="px-4 py-3 font-semibold">Görsel</th>
                  <th className="px-4 py-3 text-right font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    {canDelete && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200 dark:border-slate-600"
                          checked={selected.has(product.id)}
                          onChange={() => toggleOne(product.id)}
                          aria-label={`${product.name} seç`}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{product.name}</p>
                      {product.description && (
                        <p className="max-w-md truncate text-xs text-slate-500 dark:text-slate-400">
                          {product.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{currency.format(product.price)}</td>
                    <td className="px-4 py-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          className="size-12 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                        />
                      ) : (
                        <span className="flex size-12 items-center justify-center rounded-lg border border-dashed border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600">
                          <ImageIcon className="size-5" />
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

          {/* Mobil: kart listesi */}
          <ul className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
            {products.map((product) => (
              <li key={product.id} className="flex items-start gap-3 p-4">
                {canDelete && (
                  <input
                    type="checkbox"
                    className="mt-1 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200 dark:border-slate-600"
                    checked={selected.has(product.id)}
                    onChange={() => toggleOne(product.id)}
                    aria-label={`${product.name} seç`}
                  />
                )}
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    loading="lazy"
                    className="size-14 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                  />
                ) : (
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600">
                    <ImageIcon className="size-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800 dark:text-slate-100">{product.name}</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {currency.format(product.price)}
                  </p>
                  {product.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {product.description}
                    </p>
                  )}
                  <div className="mt-2 flex justify-end gap-2">
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
                </div>
              </li>
            ))}
          </ul>

          {data && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.totalCount}
              totalPages={data.totalPages}
              onPageChange={setPage}
              pageSizeOptions={buildPageSizeOptions(defaultPageSize, PAGE_SIZE_OPTIONS)}
              onPageSizeChange={changePageSize}
            />
          )}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={search ? 'Sonuç bulunamadı' : 'Henüz ürün yok'}
          description={
            search ? `"${search}" için eşleşen ürün yok.` : 'İlk ürünü ekleyerek başlayın.'
          }
          action={
            !search && (
              <PermissionGate permission="catalog.products.create">
                <Button onClick={openCreate}>
                  <Plus className="size-4" />
                  Yeni Ürün
                </Button>
              </PermissionGate>
            )
          }
        />
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
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Seçili ürünleri sil"
        message={`Seçili ${selectedIds.length} ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Hepsini sil"
        danger
        loading={bulkDelete.isPending}
        onConfirm={confirmBulkDelete}
        onClose={() => setBulkDeleteOpen(false)}
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
        className="inline-flex items-center gap-1 uppercase tracking-wider transition hover:text-slate-700 dark:hover:text-slate-200"
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
