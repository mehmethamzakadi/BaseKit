import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Newspaper } from 'lucide-react'
import { useNews } from '@/features/insights/queries'
import Widget from './Widget'
import type { NewsArticle } from '@/types/insights'

const PAGE_SIZE = 4

const relTime = new Intl.RelativeTimeFormat('tr-TR', { numeric: 'auto' })

function formatRelative(iso: string | null): string {
  if (!iso) return ''
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60_000)
  if (diffMin >= 0) return 'az önce' // gelecekteki/çok yeni tarihler
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
      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
    >
      {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt=""
          loading="lazy"
          className="size-10 shrink-0 rounded object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded bg-slate-100 dark:bg-slate-800">
          <Newspaper className="size-4 text-slate-400" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-slate-800 dark:text-slate-100">
          {article.title}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          {article.source && <span className="truncate">{article.source}</span>}
          {article.source && article.publishedAt && <span>·</span>}
          {article.publishedAt && <span className="shrink-0">{formatRelative(article.publishedAt)}</span>}
        </p>
      </div>
    </a>
  )
}

export default function NewsWidget() {
  const { data, isLoading, isError, refetch } = useNews()
  const [page, setPage] = useState(1)

  const articles = useMemo(() => data?.articles ?? [], [data])
  const totalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const pageItems = useMemo(
    () => articles.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [articles, current],
  )

  return (
    <Widget
      title="Son Dakika — Gündem"
      icon={Newspaper}
      loading={isLoading}
      error={isError}
      onRetry={() => void refetch()}
    >
      {data &&
        (articles.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Şu an gösterilecek haber yok.
          </p>
        ) : (
          <div className="-m-2 flex flex-col">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pageItems.map((a, i) => (
                <ArticleRow key={`${a.url}-${i}`} article={a} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-1 flex items-center justify-between border-t border-slate-100 px-2 pt-2 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {current} / {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(current - 1)}
                    disabled={current <= 1}
                    className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                    aria-label="Önceki haberler"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(current + 1)}
                    disabled={current >= totalPages}
                    className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                    aria-label="Sonraki haberler"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
    </Widget>
  )
}
