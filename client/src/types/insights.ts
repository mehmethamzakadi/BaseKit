/** Backend Insights modülü sözleşmeleri (dış entegrasyon verileri). */

export interface Weather {
  location: string
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  description: string
  icon: string
  tempMin: number
  tempMax: number
}

export interface MarketQuote {
  symbol: string
  label: string
  price: number
  changePercent24h: number | null
  sparkline: number[] | null
}

export interface Markets {
  quotes: MarketQuote[]
}

export interface NewsArticle {
  title: string
  description: string | null
  url: string
  imageUrl: string | null
  source: string | null
  publishedAt: string | null
}

export interface News {
  articles: NewsArticle[]
}

export interface Briefing {
  text: string
  generatedAtUtc: string
  /** "ai" = Gemini üretti, "fallback" = kota/hata nedeniyle veriden üretilen özet. */
  source: 'ai' | 'fallback'
}

export interface Coords {
  lat: number
  lon: number
}
