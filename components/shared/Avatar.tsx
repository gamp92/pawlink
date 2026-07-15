type AvatarProps = {
  name: string
  tone?: 'violet' | 'teal' | 'rose' | 'slate'
  size?: 'sm' | 'md' | 'lg'
}

const toneClasses: Record<NonNullable<AvatarProps['tone']>, string> = {
  violet: 'bg-violet-100 text-violet-700',
  teal: 'bg-teal-50 text-teal-700',
  rose: 'bg-rose-50 text-rose-700',
  slate: 'bg-slate-100 text-slate-700',
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-14 w-14 text-base',
}

export function Avatar({ name, tone = 'violet', size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={`grid shrink-0 place-items-center rounded-2xl font-black ${toneClasses[tone]} ${sizeClasses[size]}`}>
      {initials}
    </div>
  )
}
