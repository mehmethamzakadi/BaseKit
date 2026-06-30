import { apiClient } from '@/lib/apiClient'
import type { PagedQuery, PagedResult } from '@/types/api'
import type { ProductDto, UploadImageResponse } from '@/types/catalog'

export interface ProductInput {
  name: string
  description: string | null
  price: number
}

export const catalogApi = {
  list: (params: PagedQuery = {}) =>
    apiClient
      .get<PagedResult<ProductDto>>('/catalog/products', { params })
      .then((r) => r.data),

  create: (body: ProductInput) =>
    apiClient.post<ProductDto>('/catalog/products', body).then((r) => r.data),

  update: (id: string, body: ProductInput) =>
    apiClient.put<ProductDto>(`/catalog/products/${id}`, body).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete<void>(`/catalog/products/${id}`).then((r) => r.data),

  uploadImage: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    // Content-Type'ı axios FormData için boundary ile otomatik ayarlar.
    return apiClient
      .post<UploadImageResponse>(`/catalog/products/${id}/image`, form)
      .then((r) => r.data)
  },
}
