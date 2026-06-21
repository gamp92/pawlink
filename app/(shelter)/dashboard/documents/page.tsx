import { DocumentsManager } from '@/components/shelter/DocumentsManager'
import { AppShell } from '@/components/shared/AppShell'

export default function DashboardDocumentsPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <AppShell title="Documents" subtitle="Uploaded shelter policies for the future RAG assistant">
          <DocumentsManager />
        </AppShell>
      </div>
    </main>
  )
}
