import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { catalogApi, type ProductInput } from './catalogApi'
import { getApiErrorMessage, type PagedQuery } from '@/types/api'

export const catalogKeys = {
  /** Tüm ürün sorgularının ortak kökü — mutasyonlardan toplu invalidate için. */
  all: ['catalog', 'products'] as const,
  list: (params: PagedQuery) => ['catalog', 'products', 'list', params] as const,
}

export function useProducts(params: PagedQuery) {
  return useQuery({
    queryKey: catalogKeys.list(params),
    queryFn: () => catalogApi.list(params),
    // Sayfa/arama değişiminde eski veriyi koruyarak yanıp sönmeyi önler.
    placeholderData: keepPreviousData,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProductInput) => catalogApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.all })
      toast.success('Ürün oluşturuldu.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: ProductInput & { id: string }) =>
      catalogApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.all })
      toast.success('Ürün güncellendi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => catalogApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.all })
      toast.success('Ürün silindi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

/** Birden çok ürünü topluca siler; tek özet bildirim gösterir. */
export function useBulkDeleteProducts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => catalogApi.remove(id)))
      const failed = results.filter((r) => r.status === 'rejected').length
      return { total: ids.length, failed }
    },
    onSuccess: ({ total, failed }) => {
      void qc.invalidateQueries({ queryKey: catalogKeys.all })
      const done = total - failed
      if (failed === 0) toast.success(`${done} ürün silindi.`)
      else toast.error(`${done} ürün silindi, ${failed} işlem başarısız.`)
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useUploadProductImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      catalogApi.uploadImage(id, file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.all })
      toast.success('Görsel yüklendi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
