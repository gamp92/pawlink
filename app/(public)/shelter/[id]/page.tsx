import { ShelterAssistant } from '@/components/public/ShelterAssistant'
import { AppShell } from '@/components/shared/AppShell'

type ShelterPageProps = {
  params: {
    id: string
  }
}

export default function ShelterPage({ params }: ShelterPageProps) {
  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <AppShell title="Refugio Patitas" subtitle={`Public shelter assistant for ${params.id}`}>
          <ShelterAssistant />
        </AppShell>
      </div>
    </main>
  )
}
