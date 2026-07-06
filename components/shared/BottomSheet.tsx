import type { ReactNode } from 'react'

type BottomSheetProps = {
  children: ReactNode
  open: boolean
  onClose?: () => void
  title?: string
  className?: string
}

export function BottomSheet({ children, open, onClose, title, className = '' }: BottomSheetProps) {
  return (
    <div className={`${open ? 'block' : 'hidden'} md:block ${className}`}>
      <div className="fixed inset-0 z-40 bg-slate-950/40 md:hidden" onClick={onClose} />
      <aside className="fixed bottom-0 left-0 right-0 z-40 max-h-[82vh] overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-4 shadow-xl md:static md:max-h-none md:rounded-2xl md:shadow-sm">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" />
        {title ? (
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-lg font-black tracking-tight text-slate-950">{title}</h3>
            {onClose ? (
              <button
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-500"
                aria-label="Close panel"
              >
                x
              </button>
            ) : null}
          </div>
        ) : null}
        {children}
      </aside>
    </div>
  )
}
