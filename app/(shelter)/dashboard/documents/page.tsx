import { DocumentsManager } from '@/components/shelter/DocumentsManager'

export default function DashboardDocumentsPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-4 pb-20 text-slate-950 md:p-6">
      <div className="mx-auto max-w-7xl">
        <DocumentsManager />
      </div>
    </main>
  )
}
