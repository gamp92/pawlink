import { SmartAdoption } from '@/components/public/SmartAdoption'
import { AppShell } from '@/components/shared/AppShell'

export default function FindAPetPage() {
  return (
    <AppShell title="Smart Adoption" subtitle="AI-guided matching for families and shelter pets" activeHref="/find-a-pet">
      <SmartAdoption />
    </AppShell>
  )
}
