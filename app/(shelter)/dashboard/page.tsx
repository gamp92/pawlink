import { ShelterDashboard } from '@/components/shelter/ShelterDashboard'

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-4 pb-20 text-slate-950 md:p-6">
      <div className="mx-auto max-w-7xl">
        <ShelterDashboard />
      </div>
    </main>
  )
}
