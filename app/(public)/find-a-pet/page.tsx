import { SmartAdoption } from '@/components/public/SmartAdoption'
import { AppShell } from '@/components/shared/AppShell'

export default function FindAPetPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <AppShell title="Smart Adoption" subtitle="AI-guided matching with mock data">
          <SmartAdoption />
        </AppShell>
      </div>
    </main>
  )
}
