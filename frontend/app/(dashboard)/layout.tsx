'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/layout/Sidebar'
import MobileSidebar from '@/components/layout/MobileSidebar'
import TopBar from '@/components/layout/TopBar'
import { Toaster } from 'react-hot-toast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()

  // Protect all dashboard routes
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading CyberGuard AI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0a0e1a] overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f1729',
            color: '#e2e8f0',
            border: '1px solid #1e2d4a'
          }
        }}
      />

      {/* Desktop Sidebar — fixed on left */}
      <Sidebar />

      {/* Mobile Sidebar — slide-in drawer */}
      <MobileSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar />

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
