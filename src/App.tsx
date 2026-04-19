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
  return <RouterProvider router={router} />
}
