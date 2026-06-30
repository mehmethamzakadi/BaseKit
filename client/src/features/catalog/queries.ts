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
