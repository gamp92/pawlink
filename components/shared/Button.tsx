import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type SharedButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}

type ButtonProps = SharedButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined
  }

type LinkButtonProps = SharedButtonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
  }

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-violet-600 bg-violet-600 text-white',
  secondary: 'border-slate-200 bg-white text-slate-700',
  ghost: 'border-transparent bg-transparent text-slate-600',
  danger: 'border-rose-600 bg-rose-600 text-white',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

function getButtonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: Pick<SharedButtonProps, 'variant' | 'size' | 'fullWidth' | 'className'>) {
  return [
    'inline-flex items-center justify-center rounded-xl border font-bold shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

export function Button(props: ButtonProps | LinkButtonProps) {
  const { children, variant, size, fullWidth, className } = props
  const buttonClassName = getButtonClassName({ variant, size, fullWidth, className })

  if (props.href) {
    const linkButtonProps = props as LinkButtonProps
    const { children: linkChildren, variant: _variant, size: _size, fullWidth: _fullWidth, className: _className, ...linkProps } = linkButtonProps
    return (
      <a {...linkProps} className={buttonClassName}>
        {linkChildren}
      </a>
    )
  }

  const standardButtonProps = props as ButtonProps
  const { children: buttonChildren, variant: _variant, size: _size, fullWidth: _fullWidth, className: _className, ...buttonProps } = standardButtonProps
  return (
    <button {...buttonProps} className={buttonClassName}>
      {buttonChildren}
    </button>
  )
}
