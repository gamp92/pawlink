import { AppShell } from '@/components/shared/AppShell'
import { ShelterDashboard } from '@/components/shelter/ShelterDashboard'

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <AppShell title="Shelter Hub" subtitle="Private dashboard">
          <ShelterDashboard />
        </AppShell>
      </div>
    </main>
  )
}
