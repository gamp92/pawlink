import type { ReactNode } from 'react'

type ActionBarProps = {
  children: ReactNode
  className?: string
}

export function ActionBar({ children, className = '' }: ActionBarProps) {
  return (
    <div className={`sticky bottom-0 z-30 border-t border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur ${className}`}>
      <div className="flex gap-2">{children}</div>
    </div>
  )
}
