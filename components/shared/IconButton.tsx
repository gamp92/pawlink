import type { ButtonHTMLAttributes, ReactNode } from 'react'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
}

export function IconButton({ label, children, className = '', ...props }: IconButtonProps) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={`ds-icon-button text-sm font-black ${className}`}
    >
      {children}
    </button>
  )
}
