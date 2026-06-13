'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Brain, Trophy, RotateCcw, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import type { QuizData, QuizQuestion } from '@/types'

type QuizPhase = 'config' | 'active' | 'results'

type AnswerMap = Record<string, string>

const TOPICS = [
  { id: 'general', label: 'General', icon: '🛡️' },
  { id: 'phishing', label: 'Phishing', icon: '🎣' },
  { id: 'passwords', label: 'Passwords', icon: '🔐' },
  { id: 'malware', label: 'Malware', icon: '🦠' },
  { id: 'network', label: 'Network', icon: '📶' },
  { id: 'privacy', label: 'Privacy', icon: '👁️' },
  { id: 'business', label: 'Business', icon: '🏢' },
  { id: 'social', label: 'Social Eng.', icon: '🎭' },
] as const

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const

export default function QuizCard() {
  const [phase, setPhase] = useState<QuizPhase>('config')
  const [topic, setTopic] = useState<string>('general')
  const [difficulty, setDifficulty] = useState<string>('beginner')
  const [numQ, setNumQ] = useState<number>(5)
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [results, setResults] = useState<any | null>(null)
  const [currentQ, setCurrentQ] = useState<number>(0)

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/quiz/generate', {
        topic,
        difficulty,
        num_questions: numQ,
      })
      return data as QuizData
    },
    onSuccess: (data) => {
      setQuiz(data)
      setAnswers({})
      setCurrentQ(0)
      setPhase('active')
      toast.success(`Quiz ready! ${data.total_questions} questions`)
    },
    onError: () => toast.error('Failed to generate quiz.'),
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!quiz) return null
      const { data } = await api.post('/quiz/submit', {
        topic,
        difficulty,
        answers,
        questions: quiz.questions,
      })
      return data
    },
    onSuccess: (data) => {
      setResults(data)
      setPhase('results')
    },
    onError: () => toast.error('Failed to submit quiz.'),
  })

  const selectAnswer = (questionId: number, option: string) => {
    if (phase !== 'active') return
    setAnswers((prev) => ({ ...prev, [String(questionId)]: option }))
  }

  const goNext = () => {
    if (!quiz) return
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ((prev) => prev + 1)
    }
  }

  const goPrev = () => {
    if (currentQ > 0) setCurrentQ((prev) => prev - 1)
  }

  const resetQuiz = () => {
    setPhase('config')
    setQuiz(null)
    setAnswers({})
    setResults(null)
    setCurrentQ(0)
  }

  const answeredCount = Object.keys(answers).length
  const totalQuestions = quiz?.questions.length || 0
  const scoreColor = results
    ? results.percentage >= 80
      ? 'text-green-400'
      : results.percentage >= 60
      ? 'text-yellow-400'
      : 'text-red-400'
    : ''

  if (phase === 'config') {
    return (
      <Card className="border-[#1e2d4a] bg-[#0f1729]">
        <CardHeader className="items-start gap-4 sm:flex sm:justify-between sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-300">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Security Quiz Generator</CardTitle>
                <CardDescription>AI generates unique questions every time.</CardDescription>
              </div>
            </div>
          </div>
          <Badge className="rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
            {DIFFICULTIES.includes(difficulty as any) ? difficulty : 'Beginner'}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">Select Topic</p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTopic(t.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all border',
                    topic === t.id
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                      : 'bg-[#0a0e1a] border-[#1e2d4a] text-gray-400 hover:text-white hover:border-purple-500/30',
                  )}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">Difficulty</p>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    'flex-1 min-w-[120px] py-2 rounded-xl text-xs font-medium capitalize transition-all border text-center',
                    difficulty === d
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                      : 'bg-[#0a0e1a] border-[#1e2d4a] text-gray-400 hover:text-white hover:border-purple-500/30',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-300">Questions: {numQ}</p>
              <Badge className="rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
                {totalQuestions} max
              </Badge>
            </div>
            <input
              type="range"
              min={3}
              max={10}
              value={numQ}
              onChange={(e) => setNumQ(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isLoading}
            className="w-full bg-purple-600 hover:bg-purple-500 font-semibold disabled:opacity-40"
          >
            {generateMutation.isLoading ? '🧠 Generating...' : '🧠 Generate Quiz'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (phase === 'active' && quiz) {
    const question = quiz.questions[currentQ]
    const answered = answers[String(question.id)]

    return (
      <div className="space-y-6">
        <Card className="border-[#1e2d4a] bg-[#0f1729]">
          <CardHeader className="items-center gap-4 sm:flex sm:justify-between">
            <div>
              <p className="text-sm text-gray-400">Question {currentQ + 1} of {totalQuestions}</p>
              <CardTitle>{question.question}</CardTitle>
            </div>
            <Badge className="rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
              {answeredCount}/{totalQuestions} answered
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {question.options.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => selectAnswer(question.id, opt.key)}
                  className={cn(
                    'w-full text-left flex gap-3 items-start px-4 py-3 rounded-xl border text-sm transition-all',
                    answered === opt.key
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-200'
                      : 'bg-[#0a0e1a] border-[#1e2d4a] text-gray-300 hover:border-purple-500/30 hover:bg-purple-500/5',
                  )}
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-purple-500/20 text-xs font-semibold">
                    {opt.key}
                  </span>
                  <span>{opt.value}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={goPrev}
                disabled={currentQ === 0}
                className="flex-1 bg-[#1f2937] hover:bg-[#374151] disabled:opacity-40"
              >
                ← Previous
              </Button>
              {currentQ < totalQuestions - 1 ? (
                <Button
                  onClick={goNext}
                  className="flex-1 bg-purple-600 hover:bg-purple-500"
                >
                  Next →
                </Button>
              ) : (
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={answeredCount < totalQuestions || submitMutation.isLoading}
                  className="flex-1 bg-green-600 hover:bg-emerald-500 disabled:opacity-40"
                >
                  {submitMutation.isLoading ? 'Submitting...' : `✅ Submit (${answeredCount}/${totalQuestions})`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (phase === 'results' && results && quiz) {
    return (
      <div className="space-y-6">
        <Card className="border-[#1e2d4a] bg-[#0f1729]">
          <CardHeader className="items-center gap-4 sm:flex sm:justify-between">
            <div>
              <CardTitle>Quiz Results</CardTitle>
              <CardDescription>
                {results.percentage >= 80
                  ? '🏆 Excellent! You really know your stuff!'
                  : results.percentage >= 60
                  ? '👍 Good work! Keep learning.'
                  : '📚 Keep studying — you\'ll get there!'}
              </CardDescription>
            </div>
            <Badge className={cn('rounded-full border px-3 py-1 text-sm', scoreColor)}>
              {results.percentage}%
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-[#1e2d4a] bg-white/5 p-5">
              <p className="text-sm text-gray-400">Correct</p>
              <p className="mt-3 text-3xl font-bold text-white">{results.score} / {results.total}</p>
            </div>
            <div className="rounded-3xl border border-[#1e2d4a] bg-white/5 p-5">
              <p className="text-sm text-gray-400">Performance</p>
              <Progress value={results.percentage} className="mt-4 h-3 rounded-full border border-white/10" />
            </div>
          </CardContent>
          <CardContent>
            <Button onClick={resetQuiz} className="w-full bg-purple-600 hover:bg-purple-500">
              <RotateCcw className="mr-2 h-4 w-4" /> Take Another Quiz
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {results.answers.map((a: any, index: number) => (
            <Card key={`review-${index}`} className="border-[#1e2d4a] bg-[#0f1729]">
              <CardHeader className="items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-300">
                  {a.is_correct ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <div>
                  <CardTitle>{a.question}</CardTitle>
                  <CardDescription>
                    Your answer: {a.user_answer || 'Not answered'}{!a.is_correct && a.correct ? ` — Correct: ${a.correct}` : ''}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {a.explanation && (
                  <p className="text-sm text-gray-300">💡 {a.explanation}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return null
}
