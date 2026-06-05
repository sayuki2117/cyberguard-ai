'use client'

import Link from 'next/link'
import {
  BookOpen,
  Brain,
  Lightbulb,
  Lock,
  Mail,
  MessageSquare,
  Shield,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const QUICK_ACTIONS = [
  {
    label: 'AI Chatbot',
    href: '/chat',
    icon: MessageSquare,
    color: 'from-blue-600 to-cyan-600',
    desc: 'Ask any cybersecurity question',
  },
  {
    label: 'Check Email',
    href: '/phishing',
    icon: Mail,
    color: 'from-red-600 to-orange-600',
    desc: 'Detect phishing attempts',
  },
  {
    label: 'Check Password',
    href: '/password',
    icon: Lock,
    color: 'from-purple-600 to-pink-600',
    desc: 'Test your password strength',
  },
  {
    label: 'Take a Quiz',
    href: '/quiz',
    icon: Brain,
    color: 'from-green-600 to-emerald-600',
    desc: 'Test your knowledge',
  },
  {
    label: 'Security Tips',
    href: '/tips',
    icon: Lightbulb,
    color: 'from-yellow-600 to-amber-600',
    desc: 'Get daily security tips',
  },
  {
    label: 'Knowledge Base',
    href: '/knowledge',
    icon: BookOpen,
    color: 'from-indigo-600 to-blue-600',
    desc: 'Browse security resources',
  },
]

const STATS = [
  { label: 'Quizzes Taken', value: '0', icon: Brain, color: 'text-purple-400' },
  { label: 'Emails Analysed', value: '0', icon: Mail, color: 'text-red-400' },
  { label: 'Passwords Checked', value: '0', icon: Lock, color: 'text-blue-400' },
  { label: 'Tips Read', value: '0', icon: Lightbulb, color: 'text-yellow-400' },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {greeting}, {user?.full_name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-sm text-gray-400">Your cybersecurity training hub</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-[#1e2d4a] bg-[#0f1729] p-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-blue-500">
            <span className="text-lg font-bold text-blue-400">-</span>
          </div>
          <div>
            <p className="font-semibold text-white">Security Score</p>
            <p className="text-sm text-gray-400">
              Complete quizzes and use tools to build your score
            </p>
          </div>
          <Badge className="ml-auto border border-blue-600/30 bg-blue-600/20 text-blue-400">
            New
          </Badge>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon

            return (
              <Link key={action.href} href={action.href}>
                <Card className="cursor-pointer border-[#1e2d4a] bg-[#0f1729] transition-all duration-200 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5">
                  <CardContent className="p-5">
                    <div
                      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} transition-transform group-hover:scale-110`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-white">{action.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{action.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.label} className="border-[#1e2d4a] bg-[#0f1729]">
              <CardContent className="p-4">
                <Icon className={`mb-2 h-5 w-5 ${stat.color}`} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
