import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react'

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
  primary: 'ds-button-primary',
  secondary: 'ds-button-secondary',
  ghost: 'ds-button-ghost',
  danger: 'ds-button-danger',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'ds-button-sm',
  md: 'ds-button-md',
  lg: 'ds-button-lg',
}

function getButtonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: Pick<SharedButtonProps, 'variant' | 'size' | 'fullWidth' | 'className'>) {
  return [
    'ds-button',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps | LinkButtonProps>(function Button(
  props,
  ref,
) {
  const { children, variant, size, fullWidth, className } = props
  const buttonClassName = getButtonClassName({ variant, size, fullWidth, className })

  if (props.href) {
    const linkButtonProps = props as LinkButtonProps
    const { children: linkChildren, variant: _variant, size: _size, fullWidth: _fullWidth, className: _className, ...linkProps } = linkButtonProps
    return (
      <a {...linkProps} ref={ref as Ref<HTMLAnchorElement>} className={buttonClassName}>
        {linkChildren}
      </a>
    )
  }

  const standardButtonProps = props as ButtonProps
  const { children: buttonChildren, variant: _variant, size: _size, fullWidth: _fullWidth, className: _className, ...buttonProps } = standardButtonProps
  return (
    <button {...buttonProps} ref={ref as Ref<HTMLButtonElement>} className={buttonClassName}>
      {buttonChildren}
    </button>
  )
})
