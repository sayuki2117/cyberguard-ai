'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  LayoutDashboard, MessageSquare, Mail, Lock,
  Brain, Lightbulb, BookOpen, Settings,
  Shield, BarChart3, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/store/sidebarStore'
import { useAuthStore } from '@/store/authStore'
import { Badge } from '@/components/ui/badge'

const NAV_ITEMS = [
  { label: 'Dashboard',        href: '/dashboard',  icon: LayoutDashboard },
  { label: 'AI Chatbot',       href: '/chat',       icon: MessageSquare },
  { label: 'Phishing Detector', href: '/phishing',   icon: Mail },
  { label: 'Password Checker',  href: '/password',   icon: Lock },
  { label: 'Security Quiz',     href: '/quiz',       icon: Brain },
  { label: 'Cyber Tips',        href: '/tips',       icon: Lightbulb },
  { label: 'Knowledge Base',    href: '/knowledge',  icon: BookOpen },
  { label: 'Admin Dashboard',   href: '/admin',      icon: BarChart3, adminOnly: true },
  { label: 'Settings',          href: '/settings',   icon: Settings },
]

export default function MobileSidebar() {
  const pathname = usePathname()
  const { isMobileOpen, closeMobile } = useSidebarStore()
  const { user, logout } = useAuthStore()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  )

  const handleNavClick = () => {
    closeMobile()
  }

  return (
    <Sheet open={isMobileOpen} onOpenChange={closeMobile}>
      <SheetContent
        side="left"
        className="w-72 bg-[#060810] border-r border-[#1e2d4a] p-0 flex flex-col"
      >
        <SheetHeader className="px-5 py-4 border-b border-[#1e2d4a]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <SheetTitle className="text-white font-bold">
              CyberGuard <span className="text-blue-400">AI</span>
            </SheetTitle>
          </div>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-blue-400')} />
                <span className="font-medium text-sm">{item.label}</span>
                {item.adminOnly && (
                  <Badge variant="outline" className="ml-auto text-xs border-blue-500/30 text-blue-400">
                    Admin
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-[#1e2d4a] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">{user?.full_name?.charAt(0) || '?'}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              closeMobile()
            }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors w-full px-2 py-2 rounded-lg hover:bg-red-400/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
