'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

const EMBED_SNIPPET = `<script src="https://your-app.vercel.app/embed.js" async></script>`

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const [name, setName] = useState(user?.full_name || '')

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(EMBED_SNIPPET)
      toast.success('Copied!')
    } catch {
      toast.error('Unable to copy embed code.')
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-[#1e2d4a] bg-[#0f1729] p-8">
        <div className="mb-4 text-2xl font-semibold text-white">Settings</div>
        <p className="max-w-2xl text-sm leading-7 text-gray-300">
          Manage your account and preferences.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="rounded-3xl border border-[#1e2d4a] bg-[#0a0e1a]">
          <CardHeader className="px-8 pt-8">
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="flex items-center gap-4 rounded-3xl border border-[#1e2d4a] bg-[#07101e] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900 text-lg text-white">
                {user?.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{user?.full_name}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
                <Badge className="mt-3 rounded-full bg-[#111827] px-3 py-1 text-xs uppercase tracking-[0.16em] text-gray-300">
                  {user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                </Badge>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 bg-[#0a0e1a] border-[#1e2d4a] text-white"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="mt-1 bg-[#0a0e1a] border-[#1e2d4a] text-white"
                />
              </div>
            </div>

            <Button type="button" onClick={() => toast.success('Profile updated!')}>
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border border-[#1e2d4a] bg-[#0a0e1a]">
            <CardHeader className="px-8 pt-8">
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-8">
              <div className="rounded-3xl border border-[#1e2d4a] bg-[#07101e] p-6 text-sm text-gray-300">
                <p className="font-semibold text-white">🔐 Change Password</p>
                <p className="mt-2 text-sm text-gray-400">
                  Use the password reset flow on the login page to change your password securely.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 justify-start"
                onClick={() => {
                  logout()
                  window.location.href = '/login'
                }}
              >
                🚪 Sign Out
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-[#1e2d4a] bg-[#0a0e1a]">
            <CardHeader className="px-8 pt-8">
              <CardTitle>Embed Widget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-8">
              <p className="text-sm text-gray-400">
                Add CyberGuard AI to any website by pasting this script tag into your HTML:
              </p>
              <div className="rounded-3xl border border-[#1e2d4a] bg-[#07101e] p-4 font-mono text-sm text-cyan-300">
                <code>{EMBED_SNIPPET}</code>
              </div>
              <Button type="button" onClick={copyEmbedCode} className="w-full bg-cyan-600 hover:bg-cyan-500 text-sm">
                📋 Copy Embed Code
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
