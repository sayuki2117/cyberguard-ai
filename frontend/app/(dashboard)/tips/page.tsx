'use client'

import TipCard from '@/components/tips/TipCard'

export default function TipsPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-[#1e2d4a] bg-[#0f1729] p-8">
        <div className="mb-4 flex items-center gap-3 text-2xl font-semibold text-white">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-500 text-white">
            💡
          </span>
          <span>Cyber Tips</span>
        </div>
        <div className="space-y-2 text-gray-300">
          <p className="text-3xl font-bold text-white">Your Security Tips</p>
          <p className="max-w-2xl text-sm leading-7">
            Personalised, actionable tips with specific steps you can take today.
          </p>
        </div>
      </div>

      <TipCard />
    </div>
  )
}
