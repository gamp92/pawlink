import { AppShell } from '@/components/shared/AppShell'
import { AnimalInventory } from '@/components/shelter/AnimalInventory'

export default function DashboardAnimalsPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <AppShell title="Animals" subtitle="Shelter inventory and adoption status management">
          <AnimalInventory />
        </AppShell>
      </div>
    </main>
  )
}
