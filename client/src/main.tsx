import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import AppToaster from '@/components/ui/AppToaster'
import { ThemeProvider } from '@/features/theme/ThemeProvider'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <AppToaster />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
