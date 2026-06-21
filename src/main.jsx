import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60, // 1 minute
    },
  },
})

// Dev diagnostics: surface useful runtime info in console
if (import.meta.env.DEV) {
  const style = 'background:#0f172a;color:#fbbf24;padding:2px 8px;border-radius:3px;font-weight:bold'
  console.log('%cSabiJuara Dev Mode', style)
  console.log('• Vite:', import.meta.env.VITE_SUPABASE_URL ? 'connected to Supabase' : 'MOCK MODE (no Supabase env)')
  console.log('• Storage: localStorage keys starting with "onechampion_"')
  console.log('• React Query DevTools: install separately if needed')
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.info('%cDemo Mode', style, '\nData persisted in localStorage. Use "Reset Data Demo" in the top-right of the yellow banner.')
  }

  // Quick query inspector
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'added' || event.type === 'updated') {
      const q = event.query
      const status = q.state.status
      if (status === 'error') {
        console.warn('[Query Error]', q.queryKey, q.state.error?.message)
      }
    }
  })

  // Storage usage
  let totalSize = 0
  for (const k in localStorage) {
    if (k.startsWith('onechampion_')) {
      totalSize += (localStorage.getItem(k) || '').length
    }
  }
  console.info(`[Storage] Demo data: ${(totalSize / 1024).toFixed(1)} KB`)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
