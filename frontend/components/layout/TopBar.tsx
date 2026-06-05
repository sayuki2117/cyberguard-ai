'use client'

import { usePathname } from 'next/navigation'
import { Menu, Bell, Search } from 'lucide-react'
import { useSidebarStore } from '@/store/sidebarStore'
import { useAuthStore } from '@/store/authStore'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/chat':      'AI Chatbot',
  '/phishing':  'Phishing Detector',
  '/password':  'Password Checker',
  '/quiz':      'Security Quiz',
  '/tips':      'Cyber Tips',
  '/knowledge': 'Knowledge Base',
  '/admin':     'Admin Dashboard',
  '/settings':  'Settings',
}

export default function TopBar() {
  const pathname = usePathname()
  const { toggleMobile } = useSidebarStore()
  const { user } = useAuthStore()

  const pageTitle = PAGE_TITLES[pathname] || 'CyberGuard AI'

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#060810]/95 backdrop-blur border-b border-[#1e2d4a] flex items-center px-4 sm:px-6 gap-4">
      <button
        onClick={toggleMobile}
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1">
        <h1 className="text-white font-semibold text-lg">{pageTitle}</h1>
        <p className="text-gray-500 text-xs hidden sm:block">CyberGuard AI</p>
      </div>

      <div className="flex items-center gap-2">
        <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
          <Search className="w-4 h-4" />
        </button>

        <button className="relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center cursor-pointer">
          <span className="text-white text-sm font-bold">
            {user?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
          </span>
        </div>
      </div>
    </header>
  )
}
