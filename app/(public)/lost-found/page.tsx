import { LostFoundBoard } from '@/components/public/LostFoundBoard'
import { AppShell } from '@/components/shared/AppShell'

export default function LostFoundPage() {
  return (
    <AppShell title="Lost & Found" subtitle="Community map for lost, found, and possible pet matches" activeHref="/lost-found">
      <LostFoundBoard />
    </AppShell>
  )
}
