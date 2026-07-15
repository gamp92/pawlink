import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { ShelterWorkspaceProvider } from '@/components/shelter/ShelterWorkspaceContext'
import { createServerClient, createSupabaseServerClient } from '@/lib/supabase/server'

type ShelterLayoutProps = {
  children: ReactNode
}

export default async function ShelterLayout({ children }: ShelterLayoutProps) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createServerClient()
  const { data: shelterUser, error } = await adminSupabase
    .from('shelter_users')
    .select('id, shelter_id, role, shelters ( name )')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !shelterUser) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-950">
        <div className="mx-auto max-w-[520px]">
          <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-violet-600">Pawlink</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Unauthorized</h1>
            <p className="mt-3 text-sm leading-5 text-slate-500">
              This account is signed in, but it is not linked to a shelter workspace yet.
            </p>
            <form action={logout} className="mt-6">
              <button className="rounded bg-violet-600 px-4 py-2 text-sm font-bold text-white">
                Sign out
              </button>
            </form>
          </section>
        </div>
      </main>
    )
  }

  const linkedShelter = shelterUser.shelters as { name?: string } | { name?: string }[] | null
  const shelterName =
    Array.isArray(linkedShelter)
      ? linkedShelter[0]?.name
      : linkedShelter?.name

  return (
    <ShelterWorkspaceProvider
      shelterId={shelterUser.shelter_id}
      shelterName={shelterName ?? 'Shelter workspace'}
      userEmail={user.email ?? 'Signed in shelter user'}
    >
      <header className="border-b border-slate-200 bg-white px-4 py-2 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600">Shelter workspace</p>
            <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
          </div>
          <form action={logout}>
            <button className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
              Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
    </ShelterWorkspaceProvider>
  )
}

async function logout() {
  'use server'

  const supabase = createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
