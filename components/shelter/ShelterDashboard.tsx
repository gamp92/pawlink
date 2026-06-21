import { AnimalCard } from '@/components/shared/AnimalCard'
import { MetricCard } from '@/components/shared/MetricCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { animals, dashboardMetrics } from '@/lib/mock-data'

export function ShelterDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-[150px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Refugio Patitas
        </p>
        {['Dashboard', 'Animals', 'Requests', 'Documents'].map((item, index) => (
          <div
            key={item}
            className={`mt-2 rounded px-2 py-1.5 text-xs font-medium ${
              index === 0 ? 'bg-violet-100 text-violet-700' : 'text-slate-500'
            }`}
          >
            {item}
          </div>
        ))}
      </aside>

      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">Today at a glance</h2>
            <p className="mt-1 text-xs text-slate-500">Mock shelter operations overview.</p>
          </div>
          <button className="rounded bg-violet-600 px-3 py-1.5 text-xs font-bold text-white">
            + Add animal
          </button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {dashboardMetrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-xs font-semibold text-violet-900">
              AI post for {animals[0].name}: {animals[0].social_post}
            </p>
            <StatusBadge label="Ready to post" tone="purple" />
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {animals.slice(0, 3).map((animal) => (
            <AnimalCard key={animal.id} animal={animal} compact />
          ))}
        </div>
      </div>
    </div>
  )
}
