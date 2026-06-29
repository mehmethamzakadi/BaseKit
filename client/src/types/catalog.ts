export interface ProductDto {
  id: string
  name: string
  description: string | null
  price: number
  imageObjectKey: string | null
  createdAtUtc: string
  updatedAtUtc: string
}

export interface UploadImageResponse {
  objectKey: string
  /** Geçici (presigned) erişim URL'i. */
  url: string
}
