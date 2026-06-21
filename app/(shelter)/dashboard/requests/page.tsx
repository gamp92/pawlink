import { AdoptionRequestsPanel } from '@/components/shelter/AdoptionRequestsPanel'
import { AppShell } from '@/components/shared/AppShell'

export default function DashboardRequestsPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <AppShell title="Adoption Requests" subtitle="Review family matches and update mock request states">
          <AdoptionRequestsPanel />
        </AppShell>
      </div>
    </main>
  )
}
