import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { settingsApi } from './settingsApi'
import { getApiErrorMessage } from '@/types/api'

export const settingsKeys = {
  all: ['system', 'settings'] as const,
}

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: settingsApi.getSettings,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, string>) => settingsApi.updateSettings(values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: settingsKeys.all })
      toast.success('Ayarlar kaydedildi.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
