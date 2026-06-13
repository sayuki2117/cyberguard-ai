'use client'

import QuizCard from '@/components/quiz/QuizCard'

export default function QuizPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-[#1e2d4a] bg-[#0f1729] p-8">
        <div className="mb-4 flex items-center gap-3 text-2xl font-semibold text-white">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
            🧠
          </span>
          <span>Security Quiz</span>
        </div>
        <div className="space-y-2 text-gray-300">
          <p className="text-3xl font-bold text-white">Test Your Knowledge</p>
          <p className="max-w-2xl text-sm leading-7">
            AI generates unique quiz questions across 8 topics and 3 difficulty levels. Results saved to your profile.
          </p>
        </div>
      </div>

      <QuizCard />
    </div>
  )
}
