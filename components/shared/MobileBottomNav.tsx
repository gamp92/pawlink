type NavItem = {
  label: string
  href: string
  shortLabel?: string
}

type MobileBottomNavProps = {
  items: NavItem[]
  activeHref?: string
}

export function MobileBottomNav({ items, activeHref }: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/90 px-3 py-2 shadow-lg backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-4 gap-1">
        {items.map((item) => {
          const isActive = activeHref === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              className={`rounded-xl px-2 py-2 text-center text-[11px] font-bold ${
                isActive ? 'bg-violet-100 text-violet-700' : 'text-slate-500'
              }`}
            >
              <span className="block text-base leading-none">{item.shortLabel ?? item.label.slice(0, 1)}</span>
              <span className="mt-1 block truncate">{item.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
