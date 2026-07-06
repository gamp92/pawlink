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
      className={`grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-600 shadow-sm transition ${className}`}
    >
      {children}
    </button>
  )
}
