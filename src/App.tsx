import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { FiltersProvider } from '@/contexts/FiltersContext'
import { Layout } from '@/components/layout/Layout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { PlatformView } from '@/pages/PlatformView'
import { CampaignDrillDown } from '@/pages/CampaignDrillDown'
import { Funnel } from '@/pages/Funnel'
import { Settings } from '@/pages/Settings'
import { supabaseMisconfigured } from '@/lib/supabase'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-gray-950" />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FiltersProvider>{children}</FiltersProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Providers>
        <Login />
      </Providers>
    ),
  },
  {
    element: (
      <Providers>
        <ProtectedRoute />
      </Providers>
    ),
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'dashboard/platform/:platform', element: <PlatformView /> },
          { path: 'dashboard/campaign/:campaignId', element: <CampaignDrillDown /> },
          { path: 'dashboard/funnel', element: <Funnel /> },
          { path: 'settings', element: <Settings /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])

export default function App() {
  if (supabaseMisconfigured) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-zinc-900 border border-red-500/40 rounded-xl p-8 text-center">
          <div className="text-red-400 text-4xl mb-4">⚠</div>
          <h1 className="text-white text-xl font-semibold mb-2">Missing Environment Variables</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Add the following environment variables to your Vercel project and redeploy:
          </p>
          <ul className="text-left text-sm font-mono bg-zinc-800 rounded-lg p-4 space-y-2 text-zinc-300">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
        </div>
      </div>
    )
  }
  return <RouterProvider router={router} />
}
