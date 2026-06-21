import { LostFoundBoard } from '@/components/public/LostFoundBoard'
import { AppShell } from '@/components/shared/AppShell'

export default function LostFoundPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <AppShell title="Lost & Found" subtitle="Public report map with mock vision matching">
          <LostFoundBoard />
        </AppShell>
      </div>
    </main>
  )
}
