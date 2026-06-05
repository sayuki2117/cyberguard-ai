'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, MessageSquare, Mail, Lock,
  Brain, Lightbulb, BookOpen, Settings,
  Shield, ChevronLeft, BarChart3, LogOut, Menu
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

export default function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleCollapse } = useSidebarStore()
  const { user, logout } = useAuthStore()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  )

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0',
        'bg-[#060810] border-r border-[#1e2d4a] overflow-hidden flex-shrink-0'
      )}
    >
      <div className="flex items-center justify-between px-4 h-16 border-b border-[#1e2d4a] flex-shrink-0">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-white font-bold text-sm leading-none">CyberGuard</p>
                <p className="text-blue-400 text-xs">AI</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={toggleCollapse}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg',
            'text-gray-400 hover:text-white hover:bg-white/10',
            'transition-all duration-200 flex-shrink-0',
            isCollapsed && 'mx-auto'
          )}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 px-2">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                'relative overflow-hidden',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-400 rounded-r-full"
                />
              )}

              <Icon
                className={cn(
                  'flex-shrink-0 transition-transform duration-200',
                  isCollapsed ? 'w-5 h-5' : 'w-4 h-4',
                  isActive ? 'text-blue-400' : 'group-hover:scale-110'
                )}
              />

              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {item.adminOnly && !isCollapsed && (
                <Badge variant="outline" className="ml-auto text-xs border-blue-500/30 text-blue-400">
                  Admin
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[#1e2d4a] p-3 flex-shrink-0">
        <div className={cn('flex items-center gap-3 px-2 py-2 rounded-xl', isCollapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden"
              >
                <p className="text-white text-xs font-medium truncate">{user?.full_name || 'User'}</p>
                <p className="text-gray-500 text-xs truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!isCollapsed && (
            <button
              onClick={logout}
              className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
