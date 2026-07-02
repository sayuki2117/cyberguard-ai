'use client'

import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import api, { getApiErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'
import type { PasswordResult } from '@/types'

const STRENGTH_CONFIG = {
  'Very Weak':  { color: 'text-red-400',    bar: 'bg-red-500',    pct: 10 },
  'Weak':       { color: 'text-orange-400', bar: 'bg-orange-500', pct: 25 },
  'Fair':       { color: 'text-yellow-400', bar: 'bg-yellow-500', pct: 50 },
  'Strong':     { color: 'text-blue-400',   bar: 'bg-blue-500',   pct: 75 },
  'Very Strong':{ color: 'text-green-400',  bar: 'bg-green-500',  pct: 100 },
} as const

type StrengthKey = keyof typeof STRENGTH_CONFIG

function getLiveStrength(pwd: string): StrengthKey {
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd)) score++

  const map: Record<number, StrengthKey> = {
    0: 'Very Weak',
    1: 'Very Weak',
    2: 'Weak',
    3: 'Fair',
    4: 'Fair',
    5: 'Strong',
    6: 'Very Strong',
  }

  return map[Math.min(score, 6)]
}

export default function PasswordForm() {
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [result, setResult] = useState<PasswordResult | null>(null)

  const toggleShowPwd = useCallback(() => {
    setShowPwd((current) => !current)
  }, [])

  const liveStrength = password ? getLiveStrength(password) : null
  const liveConfig = liveStrength ? STRENGTH_CONFIG[liveStrength] : null

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/password/check', { password })
      return data as PasswordResult
    },
    onSuccess: (data) => {
      setResult(data)
      toast.success('Analysis complete!')
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Check failed.'))
    },
  })

  const strengthConfig = result
    ? STRENGTH_CONFIG[result.strength as StrengthKey]
    : null

  const stats = result
    ? [
        { label: 'Length', value: result.length, good: result.length >= 12 },
        { label: 'Upper', value: result.has_uppercase ? '✓' : '✗', good: result.has_uppercase },
        { label: 'Lower', value: result.has_lowercase ? '✓' : '✗', good: result.has_lowercase },
        { label: 'Numbers', value: result.has_numbers ? '✓' : '✗', good: result.has_numbers },
        { label: 'Symbols', value: result.has_symbols ? '✓' : '✗', good: result.has_symbols },
      ]
    : []

  return (
    <div className="space-y-6">
      <Card className="border-[#1e2d4a] bg-[#0f1729]">
        <CardHeader className="items-start gap-4 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Password Strength Checker</CardTitle>
              <CardDescription>
                AI-powered analysis with crack time estimation.
              </CardDescription>
            </div>
          </div>
          <Badge className="rounded-full border border-blue-600/30 bg-blue-600/10 text-blue-300">
            Secure by design
          </Badge>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-3">
            <Label htmlFor="password_input">Enter Password to Check</Label>
            <div className="relative">
              <Input
                id="password_input"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && mutation.mutate()}
                placeholder="Type a password to analyse..."
                className="bg-[#0a0e1a] border-[#1e2d4a] text-white placeholder-gray-600 focus:border-blue-500 font-mono pr-12"
              />
              <button
                type="button"
                onClick={toggleShowPwd}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {password && liveConfig && (
            <div className="rounded-3xl border border-[#1e2d4a] bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-300">Live preview</p>
                  <p className={cn('text-lg font-semibold', liveConfig.color)}>{liveStrength}</p>
                </div>
                <Badge className={cn('rounded-full px-3 py-1 text-sm', liveConfig.color)}>
                  {liveConfig.pct}%
                </Badge>
              </div>
              <Progress value={liveConfig.pct} className={cn('h-3 rounded-full border border-white/10', liveConfig.bar)} />
            </div>
          )}

          <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200">
            <div className="font-semibold">⚠️ Privacy notice</div>
            <p className="mt-2 text-gray-300">
              Use similar test passwords, not your real ones. Passwords are sent only for analysis and never stored.
            </p>
          </div>

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !password.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 font-semibold disabled:opacity-40"
          >
            {mutation.isPending ? '🔍 Analysing...' : '🔍 Analyse Password'}
          </Button>
        </CardContent>
      </Card>

      {result && strengthConfig && (
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <Card className="border-[#1e2d4a] bg-[#0f1729]">
            <CardHeader className="items-end gap-4 sm:flex sm:justify-between sm:items-center">
              <div>
                <CardTitle>{result.strength}</CardTitle>
                <CardDescription>Score: {result.score}/100</CardDescription>
              </div>
              <Badge className={cn('rounded-full px-3 py-1 text-sm', strengthConfig.color)}>
                {result.strength}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-3xl border border-[#1e2d4a] bg-white/5 p-5">
                <p className="text-sm text-gray-400">Overall score</p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="text-3xl font-bold text-white">{result.score}</p>
                  <p className="text-sm text-gray-400">out of 100</p>
                </div>
                <Progress value={result.score} className={cn('mt-4 h-3 rounded-full border border-white/10', strengthConfig.bar)} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className={cn(
                      'rounded-3xl border p-4 text-sm',
                      stat.good ? 'border-green-500/20 bg-green-500/5 text-green-200' : 'border-rose-500/20 bg-rose-500/5 text-rose-200',
                    )}
                  >
                    <p className="text-2xl font-semibold">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#1e2d4a] bg-[#0f1729]">
            <CardHeader>
              <CardTitle>⏱️ Estimated Time to Crack</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-white">{result.crack_time_display}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {result && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border-[#1e2d4a] bg-[#0f1729]">
            <CardHeader>
              <CardTitle>✅ What&apos;s Good</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.what_is_good.length === 0 ? (
                <p className="text-sm text-gray-400">Nothing — needs a redesign.</p>
              ) : (
                result.what_is_good.map((item, index) => (
                  <div key={`good-${index}`} className="rounded-2xl border border-[#1e2d4a] bg-white/5 p-4 text-sm text-gray-100">
                    ✓ {item}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-[#1e2d4a] bg-[#0f1729]">
            <CardHeader>
              <CardTitle>⚠️ Needs Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.what_needs_work.length === 0 ? (
                <p className="text-sm text-gray-400">Nothing — this password is excellent!</p>
              ) : (
                result.what_needs_work.map((item, index) => (
                  <div key={`need-${index}`} className="rounded-2xl border border-[#1e2d4a] bg-white/5 p-4 text-sm text-gray-100">
                    ✗ {item}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {result?.security_tip && (
        <Card className="border-[#1e2d4a] bg-[#0f1729]">
          <CardHeader>
            <CardTitle>💡 Security Tip</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300">{result.security_tip}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
