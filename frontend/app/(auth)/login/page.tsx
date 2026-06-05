'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Login failed'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      await login(email, password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] p-4">
      <Toaster position="top-right" />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-2xl shadow-blue-500/25">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            CyberGuard <span className="text-blue-400">AI</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Cybersecurity Awareness Trainer
          </p>
        </div>

        <Card className="border-[#1e2d4a] bg-[#0f1729]">
          <CardHeader>
            <CardTitle className="text-xl text-white">Welcome back</CardTitle>
            <CardDescription className="text-gray-400">
              Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="mt-1 border-[#1e2d4a] bg-[#0a0e1a] text-white placeholder:text-gray-600 focus-visible:border-blue-500"
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
                  placeholder="********"
                  required
                  className="mt-1 border-[#1e2d4a] bg-[#0a0e1a] text-white placeholder:text-gray-600 focus-visible:border-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-10 w-full bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-500"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-medium text-blue-400 transition-colors hover:text-blue-300"
              >
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
