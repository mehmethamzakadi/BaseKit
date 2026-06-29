import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { catalogApi, type ProductInput } from './catalogApi'
import { getApiErrorMessage } from '@/types/api'

export const catalogKeys = {
  products: ['catalog', 'products'] as const,
}

export function useProducts() {
  return useQuery({ queryKey: catalogKeys.products, queryFn: catalogApi.list })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProductInput) => catalogApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.products })
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
      void qc.invalidateQueries({ queryKey: catalogKeys.products })
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
      void qc.invalidateQueries({ queryKey: catalogKeys.products })
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
      void qc.invalidateQueries({ queryKey: catalogKeys.products })
      toast.success('Görsel yüklendi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
