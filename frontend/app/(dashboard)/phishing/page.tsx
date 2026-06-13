'use client'

import PhishingForm from '@/components/phishing/PhishingForm'

export default function PhishingPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-[#1e2d4a] bg-[#0f1729] p-8">
        <div className="mb-4 flex items-center gap-3 text-2xl font-semibold text-white">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 text-white">
            🔎
          </span>
          <span>Phishing Detector</span>
        </div>
        <div className="space-y-2 text-gray-300">
          <p className="text-3xl font-bold text-white">Is This Email a Scam?</p>
          <p className="max-w-2xl text-sm leading-7">
            Paste any suspicious email. AI analyses it for phishing signals, gives you a risk score, and tells you what to do.
          </p>
        </div>
      </div>

      <PhishingForm />
    </div>
  )
}
