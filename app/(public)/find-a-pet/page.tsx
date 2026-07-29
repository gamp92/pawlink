import { Suspense } from 'react'

import { SmartAdoption } from '@/components/public/SmartAdoption'
import { AppShell } from '@/components/shared/AppShell'
import { LoadingState } from '@/components/shared/LoadingState'

export default function FindAPetPage() {
  return (
    <AppShell title="Smart Adoption" subtitle="AI-guided matching for families and shelter pets" activeHref="/find-a-pet">
      <Suspense fallback={<LoadingState label="Finding available pets" />}>
        <SmartAdoption />
      </Suspense>
    </AppShell>
  )
}
