'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { id: 'general', label: 'General', icon: '🌐' },
  { id: 'student', label: 'Students', icon: '🎓' },
  { id: 'business', label: 'Small Business', icon: '🏢' },
  { id: 'beginner', label: 'Beginners', icon: '🌱' },
  { id: 'remote', label: 'Remote Workers', icon: '🏠' },
] as const

const TIP_TYPES = [
  { id: 'daily', label: 'Daily Habits' },
  { id: 'weekly', label: 'Weekly Tasks' },
  { id: 'beginner', label: 'For Beginners' },
  { id: 'business', label: 'For Business' },
] as const

const DIFF_COLORS: Record<string, string> = {
  Easy:     'text-green-400 bg-green-400/10 border-green-400/30',
  Medium:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  Advanced: 'text-red-400 bg-red-400/10 border-red-400/30',
}

type TipItem = {
  title: string
  category: string
  difficulty: string
  tip: string
  why_it_matters?: string
  quick_win?: string
  icon?: string
}

export default function TipCard() {
  const [category, setCategory] = useState('general')
  const [tipType, setTipType] = useState('daily')
  const [numTips, setNumTips] = useState(5)
  const [tips, setTips] = useState<TipItem[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/tips', {
        category,
        tip_type: tipType,
        num_tips: numTips,
      })
      return data.tips as TipItem[]
    },
    onSuccess: (data) => {
      setTips(data)
      setExpanded(null)
      toast.success(`${data.length} tips loaded!`)
    },
    onError: () => toast.error('Failed to load tips.'),
  })

  return (
    <div className="space-y-6">
      <Card className="border-[#1e2d4a] bg-[#0f1729]">
        <CardHeader className="items-start gap-4 sm:flex sm:justify-between sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-yellow-500/10 text-yellow-300">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Cybersecurity Tips</CardTitle>
              <CardDescription>Personalised, actionable tips for your situation.</CardDescription>
            </div>
          </div>
          <Badge className="rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-300">
            {numTips} tips
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">Who are you?</p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all border',
                    category === c.id
                      ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                      : 'bg-[#0a0e1a] border-[#1e2d4a] text-gray-400 hover:text-white',
                  )}
                >
                  <span>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">Tip Focus</p>
            <div className="flex flex-wrap gap-2">
              {TIP_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTipType(t.id)}
                  className={cn(
                    'rounded-xl px-3 py-2 text-xs font-medium transition-all border',
                    tipType === t.id
                      ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                      : 'bg-[#0a0e1a] border-[#1e2d4a] text-gray-400 hover:text-white',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-300">Number of Tips: {numTips}</p>
              <Badge className="rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-300">
                {tipType}
              </Badge>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={numTips}
              onChange={(e) => setNumTips(Number(e.target.value))}
              className="w-full accent-yellow-500"
            />
          </div>

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-semibold disabled:opacity-40"
          >
            {mutation.isPending ? '💡 Loading...' : '💡 Get My Tips'}
          </Button>
        </CardContent>
      </Card>

      {tips.length > 0 && (
        <div className="space-y-4">
          {tips.map((tip, index) => (
            <Card key={`tip-${index}`} className="border-[#1e2d4a] bg-[#0f1729]">
              <button
                type="button"
                onClick={() => setExpanded(expanded === index ? null : index)}
                className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-white/2 transition-colors"
              >
                <div className="text-2xl">{tip.icon || '💡'}</div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{tip.title}</p>
                    <Badge className="rounded-full border border-white/10 bg-white/5 text-xs text-gray-300">
                      {tip.category}
                    </Badge>
                    <Badge className={cn('rounded-full border px-2 py-1 text-xs', DIFF_COLORS[tip.difficulty] ?? 'border-white/10 bg-white/5 text-gray-300')}>
                      {tip.difficulty}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-gray-400 line-clamp-2">{tip.tip}</p>
                </div>
                <span className="text-yellow-300">
                  {expanded === index ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>

              {expanded === index && (
                <CardContent className="space-y-4 border-t border-white/10 pt-4">
                  {tip.why_it_matters && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold text-white">⚠️ Why This Matters</p>
                      <p className="mt-2 text-sm text-gray-300">{tip.why_it_matters}</p>
                    </div>
                  )}
                  {tip.quick_win && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold text-white">⚡ Do This Today</p>
                      <p className="mt-2 text-sm text-gray-300">{tip.quick_win}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
