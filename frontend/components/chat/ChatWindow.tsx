// ═══════════════════════════════════════════════════════════════
// FILE: components/chat/ChatWindow.tsx
// PURPOSE: Full chat interface with conversation history,
//          RAG source citations, session management.
// ═══════════════════════════════════════════════════════════════

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { Shield, Plus, Trash2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import type { ChatMessage, ChatSession, RAGSource } from '@/types'

const QUICK_PROMPTS = [
  'What is phishing and how do I spot it?',
  'How do I create a strong password?',
  'What is two-factor authentication?',
  'How can I secure my home WiFi?',
  'What is ransomware?',
  'Tips for safe online shopping',
]

export default function ChatWindow() {
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const qc = useQueryClient()

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const { data } = await api.get('/chat/sessions')
      return data
    },
  })

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const { data } = await api.post('/chat/message', {
        content: message,
        session_id: activeSession,
      })
      return data
    },
    onSuccess: (data) => {
      if (!activeSession) {
        setActiveSession(data.session_id)
        qc.invalidateQueries({ queryKey: ['chat-sessions'] })
      }
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.reply,
          sources: data.sources,
          created_at: new Date().toISOString(),
        },
      ])
      setIsTyping(false)
    },
    onError: () => {
      toast.error('Failed to get response. Please try again.')
      setIsTyping(false)
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = text?.trim() ?? input.trim()
      if (!messageText || isTyping) return

      setInput('')
      setIsTyping(true)

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])
      sendMutation.mutate(messageText)
    },
    [input, isTyping, sendMutation]
  )

  const startNewChat = () => {
    setActiveSession(null)
    setMessages([])
    setShowSessions(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const loadSession = async (sessionId: string) => {
    try {
      const { data } = await api.get(`/chat/sessions/${sessionId}/messages`)
      setMessages(data)
      setActiveSession(sessionId)
      setShowSessions(false)
    } catch {
      toast.error('Failed to load session.')
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
      <aside
        className={cn(
          'rounded-3xl border border-[#1e2d4a] bg-[#080b14] p-4 transition-all',
          showSessions ? 'block' : 'hidden xl:block'
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">History</p>
            <h2 className="text-lg font-semibold text-white">Chat sessions</h2>
          </div>
          <Button
            onClick={startNewChat}
            variant="secondary"
            size="sm"
            className="rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" /> New
          </Button>
        </div>

        {sessionsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#1e2d4a] p-6 text-sm text-gray-400">
            No history yet. Start a chat to save sessions.
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={cn(
                  'w-full rounded-2xl border px-4 py-3 text-left transition-all',
                  activeSession === session.id
                    ? 'border-blue-500/40 bg-blue-600/10 text-blue-100'
                    : 'border-transparent bg-white/5 text-gray-300 hover:border-blue-500/20 hover:bg-white/5'
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{session.title}</span>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-gray-500">
                    {new Date(session.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>

      <section className="flex min-h-[70vh] flex-col rounded-3xl border border-[#1e2d4a] bg-[#080b14] shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#1e2d4a] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <button
                onClick={() => setShowSessions(!showSessions)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#1e2d4a] text-gray-400 hover:text-white hover:border-blue-500/40"
                title="Toggle history"
              >
                <ChevronRight
                  className={cn('h-4 w-4 transition-transform', showSessions && 'rotate-90')}
                />
              </button>
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                Online • Powered by GPT-4o + RAG
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-white">CyberGuard AI</h1>
            <p className="text-sm text-gray-400">Your personal cybersecurity trainer.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={startNewChat}>
              <Trash2 className="mr-2 h-4 w-4" /> New Chat
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#1e2d4a] bg-[#0c1323] p-8 text-center text-gray-400">
              <p className="text-lg font-semibold text-white">CyberGuard AI</p>
              <p className="mt-3 max-w-xl mx-auto text-sm leading-6 text-gray-400">
                Your personal cybersecurity trainer. Ask me anything about staying safe online.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-2xl border border-[#1e2d4a] bg-[#0a0e1a] px-4 py-3 text-left text-sm text-gray-300 transition hover:border-blue-500/40 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          )}

          {isTyping && (
            <div className="rounded-3xl border border-dashed border-[#1e2d4a] bg-[#0c1323] p-6">
              <div className="text-sm text-gray-400">CyberGuard AI is typing...</div>
              <div className="mt-3 flex items-center gap-2">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500"
                    style={{ animationDelay: `${index * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            sendMessage()
          }}
          className="border-t border-[#1e2d4a] p-4 sm:p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Ask about cybersecurity..."
              disabled={isTyping}
              className="flex-1 min-h-20 resize-none rounded-2xl border border-[#1e2d4a] bg-[#0a0e1a] px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="whitespace-nowrap"
            >
              {isTyping ? '⏳ Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isBot = message.role === 'assistant'

  return (
    <div
      className={cn(
        'rounded-3xl border px-4 py-4 shadow-sm transition',
        isBot
          ? 'border-blue-500/20 bg-[#081222] text-gray-100'
          : 'border-[#1e2d4a] bg-[#0f1729] text-gray-200'
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-sm">
          {isBot ? '🤖' : '👤'}
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{isBot ? 'CyberGuard AI' : 'You'}</p>
          <p className="text-xs text-gray-500">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {isBot ? (
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="text-sm leading-7 text-gray-200">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
            ul: ({ children }) => <ul className="list-disc pl-5 text-sm text-gray-200">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 text-sm text-gray-200">{children}</ol>,
            code: ({ children }) => (
              <code className="rounded bg-[#11203b] px-1 py-0.5 text-[0.9rem] text-white">{children}</code>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      ) : (
        <p className="whitespace-pre-line text-sm leading-7 text-gray-100">{message.content}</p>
      )}

      {isBot && message.sources && message.sources.length > 0 && (
        <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-100">
          <p className="mb-2 font-medium text-white">Sources</p>
          <div className="space-y-2">
            {message.sources.map((source: RAGSource, index: number) => (
              <div key={`${source.title}-${index}`} className="rounded-2xl border border-blue-500/10 bg-[#081f3c] px-3 py-2">
                <p className="text-sm font-medium text-white">{source.title}</p>
                <p className="text-xs text-gray-400">{source.source_type} • {Math.round(source.similarity * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
