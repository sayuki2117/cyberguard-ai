'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import type { PhishingResult, PhishingIndicator } from '@/types'

const RISK_CONFIG = {
  SAFE:     { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  bar: 'bg-green-500',  icon: '✅' },
  LOW:      { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   bar: 'bg-blue-500',   icon: '🔵' },
  MEDIUM:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', bar: 'bg-yellow-500', icon: '⚠️' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', bar: 'bg-orange-500', icon: '🔴' },
  CRITICAL: { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    bar: 'bg-red-500',    icon: '🚨' },
} as const

const SEVERITY_COLORS = {
  low:      'bg-blue-500/10  border-blue-500/30  text-blue-400',
  medium:   'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  high:     'bg-orange-500/10 border-orange-500/30 text-orange-400',
  critical: 'bg-red-500/10   border-red-500/30   text-red-400',
} as const

const SAMPLE_PHISHING = `From: security-alert@paypa1-verify.com
Subject: ⚠️ URGENT: Your PayPal Account Has Been Suspended

Dear Valued Customer,

We have detected unusual activity on your account. Your PayPal account has been temporarily suspended.

To restore your account access, you MUST verify your information within 24 hours or your account will be permanently closed.

Click here NOW to verify: http://paypa1-secure-verify.suspicious-link.com/login

You will need to provide:
- Your PayPal email and password
- Credit card details
- Social Security Number for identity verification

If you fail to verify within 24 hours, we will close your account and you will lose all your funds.

PayPal Security Department`

export default function PhishingForm() {
  const [emailContent, setEmailContent] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [result, setResult] = useState<PhishingResult | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/phishing/analyse', {
        email_content: emailContent,
        sender_email: senderEmail,
      })
      return data as PhishingResult
    },
    onSuccess: (data) => {
      setResult(data)
      toast.success('Analysis complete!')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || err?.message || 'Analysis failed.')
    },
  })

  const riskStyle = result
    ? RISK_CONFIG[result.risk_level as keyof typeof RISK_CONFIG] || RISK_CONFIG.MEDIUM
    : null

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card className="border-[#1e2d4a] bg-[#0f1729]">
          <CardHeader className="items-start gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Phishing Email Detector</CardTitle>
                <CardDescription>
                  Paste a suspicious email and get an instant risk analysis powered by AI.
                </CardDescription>
              </div>
            </div>
            <Badge className="rounded-full border border-red-600/30 bg-red-600/10 text-red-300">
              AI-Powered
            </Badge>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="sender_email">Sender Email (optional)</Label>
              <Input
                id="sender_email"
                value={senderEmail}
                onChange={(event) => setSenderEmail(event.target.value)}
                placeholder="e.g. noreply@suspicious-domain.com"
                className="bg-[#0a0e1a] border-[#1e2d4a] text-white placeholder-gray-600 focus:border-red-500/50"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="email_content">Email Content *</Label>
                <button
                  type="button"
                  onClick={() => setEmailContent(SAMPLE_PHISHING)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Load phishing example
                </button>
              </div>
              <Textarea
                id="email_content"
                value={emailContent}
                onChange={(event) => setEmailContent(event.target.value)}
                placeholder="Paste the full email content here (headers, subject line, body)..."
                rows={10}
                className="bg-[#0a0e1a] border-[#1e2d4a] text-white placeholder-gray-600 focus:border-red-500/50 font-mono text-sm resize-none"
              />
              <p className="text-right text-xs text-gray-500">
                {emailContent.length} / 10,000 characters
              </p>
            </div>

            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !emailContent.trim()}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-40"
            >
              {mutation.isPending ? '🔍 Analysing...' : '🔍 Analyse for Phishing'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#1e2d4a] bg-[#0f1729]">
          <CardHeader>
            <CardTitle>Why this helps</CardTitle>
            <CardDescription>
              Phishing analysis helps you spot suspicious red flags and separate malicious email behavior from legitimate signals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-[#1e2d4a] bg-white/5 p-4">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm font-semibold text-white">Watch for urgent requests</p>
                <p className="text-sm text-gray-400">
                  Phishing emails often pressure you into acting quickly or sharing sensitive data.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#1e2d4a] bg-white/5 p-4">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm font-semibold text-white">Learn from the verdict</p>
                <p className="text-sm text-gray-400">
                  The report also highlights legitimate signals so you can compare both sides of the email.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#1e2d4a] bg-white/5 p-4">
              <XCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-white">Stay secure</p>
                <p className="text-sm text-gray-400">
                  Use the recommended actions after analysis to avoid phishing, account takeover, and identity theft.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {result && riskStyle && (
        <div className="space-y-5">
          <Card className="border-[#1e2d4a] bg-[#0f1729]">
            <CardHeader className="items-start gap-4 lg:flex lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl text-xl', riskStyle.bg, riskStyle.color)}>
                  {riskStyle.icon}
                </span>
                <div>
                  <CardTitle>Risk Score</CardTitle>
                  <CardDescription>{result.verdict}</CardDescription>
                </div>
              </div>
              <Badge className={cn('rounded-full border px-3 py-1 text-sm', riskStyle.border, riskStyle.bg, riskStyle.color)}>
                {result.risk_level} RISK
              </Badge>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-[#1e2d4a] bg-white/5 p-5">
                  <p className="text-5xl font-bold text-white">{result.risk_score}</p>
                  <p className="mt-1 text-sm text-gray-400">out of 100</p>
                  <Progress value={result.risk_score} className="mt-4 h-3 rounded-full border border-white/10" />
                </div>
                <div className="space-y-4 rounded-3xl border border-[#1e2d4a] bg-white/5 p-5">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white">Phishing Indicator Count</p>
                    <p className="text-3xl font-bold text-white">{result.indicators.length}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white">Legitimate Signals</p>
                    <p className="text-3xl font-bold text-white">{result.legitimate_signals.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <Card className="border-[#1e2d4a] bg-[#0f1729]">
              <CardHeader>
                <CardTitle>Red Flags ({result.indicators.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.indicators.length === 0 ? (
                  <p className="text-sm text-gray-400">None detected.</p>
                ) : (
                  result.indicators.map((ind: PhishingIndicator, index) => (
                    <div key={`${ind.category}-${index}`} className={cn('rounded-2xl border p-4', SEVERITY_COLORS[ind.severity])}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">{ind.category}</p>
                        <Badge className="rounded-full border border-white/10 bg-white/5 text-xs text-white/80">
                          {ind.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-gray-300">{ind.description}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-[#1e2d4a] bg-[#0f1729]">
              <CardHeader>
                <CardTitle>Legitimate Signals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.legitimate_signals.length === 0 ? (
                  <p className="text-sm text-gray-400">None found.</p>
                ) : (
                  result.legitimate_signals.map((signal, index) => (
                    <div key={`${signal}-${index}`} className="rounded-2xl border border-[#1e2d4a] bg-white/5 p-4">
                      <p className="text-sm text-gray-100">✓ {signal}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#1e2d4a] bg-[#0f1729]">
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.recommended_actions.map((action, index) => (
                <div key={`action-${index}`} className="rounded-2xl border border-[#1e2d4a] bg-white/5 p-4">
                  <p className="text-sm text-gray-100">{index + 1}. {action}</p>
                </div>
              ))}
              {result.educational_tip && (
                <div className="mt-4 rounded-2xl border border-[#1e2d4a] bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span>💡</span>
                    <span>Did You Know?</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-300">{result.educational_tip}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
