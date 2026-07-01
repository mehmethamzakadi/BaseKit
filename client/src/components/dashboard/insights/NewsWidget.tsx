import { Newspaper } from 'lucide-react'
import { useNews } from '@/features/insights/queries'
import Widget from './Widget'
import type { NewsArticle } from '@/types/insights'

const relTime = new Intl.RelativeTimeFormat('tr-TR', { numeric: 'auto' })

function formatRelative(iso: string | null): string {
  if (!iso) return ''
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60_000)
  if (Math.abs(diffMin) < 60) return relTime.format(diffMin, 'minute')
  const diffHour = Math.round(diffMin / 60)
  if (Math.abs(diffHour) < 24) return relTime.format(diffHour, 'hour')
  return relTime.format(Math.round(diffHour / 24), 'day')
}

function ArticleRow({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-lg p-2 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
    >
      {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt=""
          loading="lazy"
          className="size-14 shrink-0 rounded-md object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
          <Newspaper className="size-5 text-slate-400" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-100">
          {article.title}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          {article.source && <span className="truncate">{article.source}</span>}
          {article.source && article.publishedAt && <span>·</span>}
          {article.publishedAt && <span>{formatRelative(article.publishedAt)}</span>}
        </p>
      </div>
    </a>
  )
}

export default function NewsWidget() {
  const { data, isLoading, isError, refetch } = useNews()

  return (
    <Widget
      title="Gündem — Türkiye"
      icon={Newspaper}
      loading={isLoading}
      error={isError}
      onRetry={() => void refetch()}
    >
      {data &&
        (data.articles.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Şu an gösterilecek haber yok.
          </p>
        ) : (
          <div className="-m-2 divide-y divide-slate-100 dark:divide-slate-800">
            {data.articles.map((a, i) => (
              <ArticleRow key={`${a.url}-${i}`} article={a} />
            ))}
          </div>
        ))}
    </Widget>
  )
}
