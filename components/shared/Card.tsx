import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
  className?: string
  tone?: 'default' | 'muted' | 'accent'
}

const toneClasses: Record<NonNullable<CardProps['tone']>, string> = {
  default: '',
  muted: 'ds-card-muted',
  accent: 'ds-card-accent',
}

export function Card({ children, className = '', tone = 'default', ...props }: CardProps) {
  return (
    <section {...props} className={`ds-card ds-card-pad-md ${toneClasses[tone]} ${className}`}>
      {children}
    </section>
  )
}
