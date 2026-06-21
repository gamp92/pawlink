import { AnimalCard } from '@/components/shared/AnimalCard'
import { MetricCard } from '@/components/shared/MetricCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ShelterHubLayout } from '@/components/shelter/ShelterHubLayout'
import { adoptionRequests, animals, shelterActivities, shelterProfile } from '@/lib/mock-data'

export function ShelterDashboard() {
  const totalAnimals = animals.length
  const pendingRequests = adoptionRequests.filter((request) => request.status === 'pending').length
  const successfulAdoptions = shelterProfile.stats.total_adoptions
  const featuredAnimals = animals.filter((animal) => animal.status !== 'adopted').slice(0, 3)

  return (
    <ShelterHubLayout active="Dashboard">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">Today at a glance</h2>
            <p className="mt-1 text-xs text-slate-500">Operational snapshot for the shelter team.</p>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Total Animals" value={totalAnimals} detail="Across all statuses" />
          <MetricCard label="Pending Requests" value={pendingRequests} detail="Need shelter review" />
          <MetricCard label="Successful Adoptions" value={successfulAdoptions} detail="+3 vs last month" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_170px]">
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Recent activity</h3>
              <StatusBadge label="Live mock" tone="purple" />
            </div>
            <div className="mt-3 space-y-3">
              {shelterActivities.map((activity) => (
                <div key={activity.id} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-slate-950">{activity.title}</p>
                    <StatusBadge label={activity.time} tone={activity.tone} />
                  </div>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">{activity.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-violet-200 bg-violet-50 p-3 shadow-sm">
            <h3 className="text-sm font-bold text-violet-900">Quick actions</h3>
            <div className="mt-3 space-y-2">
              {[
                ['Add animal', '/dashboard/animals'],
                ['Review requests', '/dashboard/requests'],
                ['Upload document', '/dashboard/documents'],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="block rounded border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700"
                >
                  {label}
                </a>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Featured animals</h3>
            <a href="/dashboard/animals" className="text-xs font-bold text-violet-700">
              Manage inventory
            </a>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {featuredAnimals.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} compact />
            ))}
          </div>
        </section>
      </div>
    </ShelterHubLayout>
  )
}
