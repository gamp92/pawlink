import type { ReactNode } from 'react'

type AppShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
      <div className="border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-violet-600">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-teal-50 text-[10px] text-teal-600">
              PL
            </span>
            Pawlink
          </div>
          <nav className="flex items-center gap-1 text-[11px]">
            <span className="rounded border border-slate-200 px-2 py-1 text-slate-500">Shelter Hub</span>
            <span className="rounded border border-violet-200 bg-violet-50 px-2 py-1 text-violet-700">Find a pet</span>
            <span className="rounded border border-slate-200 px-2 py-1 text-slate-500">Lost & Found</span>
          </nav>
        </div>
      </div>
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-black tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}
