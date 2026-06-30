/**
 * Sayfa boyutu seçeneklerini, sistem varsayılanını da içerecek şekilde birleştirir.
 * Böylece varsayılan (ör. 5) seçici listesinde her zaman görünür ve seçili kalır.
 */
export function buildPageSizeOptions(defaultSize: number, options: number[]): number[] {
  return [...new Set([defaultSize, ...options])].sort((a, b) => a - b)
}
