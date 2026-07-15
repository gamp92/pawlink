'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { shelterProfile } from '@/lib/mock-data'

export const DEV_SHELTER_ID = '7a2f59a5-7d2f-477c-b11d-fe7c98d7aa30'

type ShelterWorkspace = {
  shelterId: string
  shelterName: string
  userEmail: string
  role?: string
}

const devWorkspace: ShelterWorkspace = {
  shelterId: DEV_SHELTER_ID,
  shelterName: shelterProfile.name,
  userEmail: 'dev@pawlink.local',
  role: 'admin',
}

const ShelterWorkspaceContext = createContext<ShelterWorkspace | null>(null)

type ShelterWorkspaceProviderProps = ShelterWorkspace & {
  children: ReactNode
}

export function ShelterWorkspaceProvider({
  shelterId,
  shelterName,
  userEmail,
  role,
  children,
}: ShelterWorkspaceProviderProps) {
  return (
    <ShelterWorkspaceContext.Provider value={{ shelterId, shelterName, userEmail, role }}>
      {children}
    </ShelterWorkspaceContext.Provider>
  )
}

export function useShelterWorkspace() {
  const workspace = useContext(ShelterWorkspaceContext)

  if (workspace) return workspace
  if (process.env.NODE_ENV !== 'production') return devWorkspace

  throw new Error('useShelterWorkspace must be used inside ShelterWorkspaceProvider')
}
