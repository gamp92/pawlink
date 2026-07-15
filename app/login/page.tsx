'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const supabase = createBrowserSupabaseClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsSubmitting(false)
      return
    }

    const searchParams = new URLSearchParams(window.location.search)
    router.push(searchParams.get('redirectedFrom') ?? '/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950">
      <div className="mx-auto max-w-[520px]">
        <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-violet-600">Pawlink</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Shelter login</h1>
          <p className="mt-3 text-sm leading-5 text-slate-500">
            Sign in with the shelter account created in Supabase Auth.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <label className="block">
              <span className="text-xs font-bold text-slate-700">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                className="mt-1 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950"
                placeholder="shelter@example.com"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-slate-700">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
                className="mt-1 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950"
                placeholder="Password"
              />
            </label>

            {error ? (
              <div className="rounded border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-600">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-violet-600 px-4 py-2 text-sm font-bold text-white"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <a href="/" className="mt-4 block text-xs font-bold text-violet-700">
            Back to public routes
          </a>
        </section>
      </div>
    </main>
  )
}
