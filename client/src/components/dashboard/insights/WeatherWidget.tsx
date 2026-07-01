import { Droplets, MapPin, Wind } from 'lucide-react'
import { useWeather } from '@/features/insights/queries'
import Widget from './Widget'
import type { Coords } from '@/types/insights'

/** Sıcaklığa göre yumuşak bir arka plan gradyanı seçer. */
function tempGradient(temp: number): string {
  if (temp <= 0) return 'from-sky-500/15 to-indigo-500/10'
  if (temp < 12) return 'from-cyan-500/15 to-sky-500/10'
  if (temp < 24) return 'from-emerald-500/15 to-teal-500/10'
  if (temp < 32) return 'from-amber-500/15 to-orange-500/10'
  return 'from-orange-500/20 to-red-500/10'
}

export default function WeatherWidget({ coords }: { coords: Coords | null }) {
  const { data, isLoading, isError, refetch } = useWeather(coords)

  return (
    <Widget
      title="Hava Durumu"
      icon={MapPin}
      loading={isLoading}
      error={isError}
      onRetry={() => void refetch()}
      className="min-h-[180px]"
    >
      {data && (
        <div
          className={`-m-4 flex h-full flex-col justify-between bg-gradient-to-br p-4 ${tempGradient(
            data.temperature,
          )}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {data.location}
              </p>
              <p className="mt-1 text-4xl font-bold text-slate-900 dark:text-slate-50">
                {Math.round(data.temperature)}°
              </p>
              <p className="mt-0.5 text-sm capitalize text-slate-600 dark:text-slate-300">
                {data.description}
              </p>
            </div>
            <img
              src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
              alt={data.description}
              width={72}
              height={72}
              className="-mt-2 size-16 drop-shadow"
            />
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1">
              <Droplets className="size-3.5" /> %{data.humidity}
            </span>
            <span className="inline-flex items-center gap-1">
              <Wind className="size-3.5" /> {data.windSpeed} km/s
            </span>
            <span>
              Hissedilen {Math.round(data.feelsLike)}° · {Math.round(data.tempMin)}°/
              {Math.round(data.tempMax)}°
            </span>
          </div>
        </div>
      )}
    </Widget>
  )
}
