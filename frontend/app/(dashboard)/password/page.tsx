'use client'

import PasswordForm from '@/components/password/PasswordForm'

export default function PasswordPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-[#1e2d4a] bg-[#0f1729] p-8">
        <div className="mb-4 flex items-center gap-3 text-2xl font-semibold text-white">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white">
            🔐
          </span>
          <span>Password Checker</span>
        </div>
        <div className="space-y-2 text-gray-300">
          <p className="text-3xl font-bold text-white">How Strong Is Your Password?</p>
          <p className="max-w-2xl text-sm leading-7">
            AI-powered analysis: crack time estimation, entropy calculation, and personalised improvement advice.
          </p>
        </div>
      </div>

      <PasswordForm />
    </div>
  )
}
