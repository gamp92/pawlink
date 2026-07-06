import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
  tone?: 'default' | 'muted' | 'accent'
}

const toneClasses: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'border-slate-200 bg-white',
  muted: 'border-slate-200 bg-slate-50',
  accent: 'border-violet-200 bg-violet-50',
}

export function Card({ children, className = '', tone = 'default' }: CardProps) {
  return (
    <section className={`rounded-2xl border p-4 shadow-sm ${toneClasses[tone]} ${className}`}>
      {children}
    </section>
  )
}
