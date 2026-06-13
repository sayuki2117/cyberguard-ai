'use client'

import ChatWindow from '@/components/chat/ChatWindow'

export default function ChatPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-[#1e2d4a] bg-[#0f1729] p-8">
        <div className="mb-4 flex items-center gap-3 text-2xl font-semibold text-white">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
            AI
          </span>
          <span>AI Chatbot</span>
        </div>
        <div className="space-y-2 text-gray-300">
          <p className="text-3xl font-bold text-white">CyberGuard AI Chat</p>
          <p className="max-w-2xl text-sm leading-7">
            Ask anything about cybersecurity — powered by GPT-4o + your knowledge base.
          </p>
        </div>
      </div>

      <ChatWindow />
    </div>
  )
}
