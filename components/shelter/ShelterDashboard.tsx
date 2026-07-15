'use client'

import { useMemo } from 'react'
import { AnimalCard } from '@/components/shared/AnimalCard'
import { Button } from '@/components/shared/Button'
import { DashboardCard } from '@/components/shared/DashboardCard'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { SectionTitle } from '@/components/shared/SectionTitle'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ShelterHubLayout } from '@/components/shelter/ShelterHubLayout'
import { useShelterDashboardData } from '@/components/shelter/hooks/useShelterDashboardData'

export function ShelterDashboard() {
  const { animals, requests, isLoading, error, isFallback } = useShelterDashboardData()

  const totalAnimals = animals.length
  const pendingRequests = requests.filter((request) => request.status === 'pending').length
  const successfulAdoptions = animals.filter((animal) => animal.status === 'adopted').length
  const featuredAnimals = animals.filter((animal) => animal.status !== 'adopted').slice(0, 3)
  const recentActivities = useMemo(
    () => [
      ...requests.slice(0, 3).map((request) => ({
        id: `request-${request.id}`,
        title: `${request.family.full_name ?? 'Applicant'} requested ${request.animal?.name ?? 'an animal'}`,
        description: `${Math.round(request.compatibility_score)}% match. Status: ${request.status}.`,
        time: request.created_at.slice(0, 10),
        tone: request.status === 'pending' ? 'amber' as const : 'purple' as const,
      })),
      ...animals.slice(0, 3).map((animal) => ({
        id: `animal-${animal.id}`,
        title: `${animal.name} is ${animal.status.replace('_', ' ')}`,
        description: `${animal.breed} profile is available in the shelter inventory.`,
        time: animal.created_at.slice(0, 10),
        tone: animal.status === 'available' ? 'green' as const : animal.status === 'in_process' ? 'amber' as const : 'slate' as const,
      })),
    ].slice(0, 4),
    [animals, requests],
  )

  return (
    <ShelterHubLayout
      active="Dashboard"
      title="Today at a glance"
      subtitle="A focused command center for animals, adoption requests, documents, and next actions."
      action={<Button href="/dashboard/animals" size="sm">Add animal</Button>}
    >
      <div className="space-y-5">
        {isLoading ? <LoadingState label="Loading dashboard data" /> : null}
        {error ? (
          <ErrorState
            title={isFallback ? 'Using fallback dashboard data' : 'Dashboard data issue'}
            description={error}
          />
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Total Animals" value={totalAnimals} detail="Across available, in process, and adopted pets" tone="teal" icon="A" />
          <StatCard label="Pending Requests" value={pendingRequests} detail="Families waiting on shelter review" tone="violet" icon="R" />
          <StatCard label="Successful Adoptions" value={successfulAdoptions} detail="+3 confirmed this month" tone="rose" icon="S" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <DashboardCard>
            <SectionTitle
              title="Recent activity"
              description="A chronological view of the most important workspace updates."
              action={<StatusBadge label="Live mock" tone="purple" />}
            />
            <div className="mt-5 space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={activity.id} className="relative flex gap-3 pb-3 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-50 text-xs font-black text-slate-700">
                      {index + 1}
                    </div>
                    {index < recentActivities.length - 1 ? <div className="mt-2 h-full w-px bg-slate-200" /> : null}
                  </div>
                  <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-slate-950">{activity.title}</p>
                      <StatusBadge label={activity.time} tone={activity.tone} />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard className="bg-gradient-to-br from-violet-50 to-white">
            <SectionTitle title="Quick actions" description="Common shelter tasks in one thumb-friendly place." />
            <div className="mt-5 grid gap-3">
              {[
                ['Add animal', 'Create a new inventory profile', '/dashboard/animals'],
                ['Review requests', `${pendingRequests} families need attention`, '/dashboard/requests'],
                ['Upload document', 'Prepare assistant sources', '/dashboard/documents'],
              ].map(([label, detail, href]) => (
                <a
                  key={href}
                  href={href}
                  className="block rounded-2xl border border-violet-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
                    </div>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-violet-600 text-sm font-black text-white">+</span>
                  </div>
                </a>
              ))}
            </div>
          </DashboardCard>
        </div>

        <DashboardCard>
          <SectionTitle
            title="Featured animals"
            description="Pets currently best positioned for adoption conversations."
            action={<Button href="/dashboard/animals" variant="secondary" size="sm">Manage</Button>}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {featuredAnimals.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} compact />
            ))}
          </div>
        </DashboardCard>
      </div>
    </ShelterHubLayout>
  )
}
