'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const { register, isLoading } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (password !== password2) {
      toast.error('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }

    try {
      await register(email, password, fullName)
      toast.success('Account created successfully!')
      router.push('/dashboard')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed.'
      toast.error(message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] p-4">
      <Toaster position="top-right" />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-cyan-500 shadow-2xl shadow-blue-500/25">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            CyberGuard <span className="text-blue-400">AI</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400">Create your free account</p>
        </div>

        <Card className="border-[#1e2d4a] bg-[#0f1729]">
          <CardHeader>
            <CardTitle className="text-xl text-white">Create Account</CardTitle>
            <CardDescription className="text-gray-400">
              Start your cybersecurity training
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="full-name" className="text-sm text-gray-300">
                  Full Name
                </Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Jane Smith"
                  required
                  className="mt-1 bg-[#0a0e1a] border-[#1e2d4a] text-white placeholder-gray-600 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1 bg-[#0a0e1a] border-[#1e2d4a] text-white placeholder-gray-600 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm text-gray-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="mt-1 bg-[#0a0e1a] border-[#1e2d4a] text-white placeholder-gray-600 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="confirm-password" className="text-sm text-gray-300">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={password2}
                  onChange={(event) => setPassword2(event.target.value)}
                  placeholder="Repeat your password"
                  required
                  className="mt-1 bg-[#0a0e1a] border-[#1e2d4a] text-white placeholder-gray-600 focus:border-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-10 w-full bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-500"
              >
                {isLoading ? 'Creating account...' : 'Create Account →'}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-400 transition-colors hover:text-blue-300">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
