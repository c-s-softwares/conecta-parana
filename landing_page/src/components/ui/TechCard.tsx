import type { ReactNode } from 'react'

type Item = { name: string; detail?: string }

type Props = {
  label: string
  icon: ReactNode
  items: Item[]
  accentColor?: string
}

export default function TechCard({ label, icon, items, accentColor = 'var(--color-brand-teal)' }: Props) {
  return (
    <div className="bg-white border border-neutral-200 rounded-[16px] p-8">
      <div className="flex items-center gap-2 mb-6">
        <span style={{ color: accentColor }}>{icon}</span>
        <span className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-neutral-400">
          {label}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {items.map(item => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accentColor }} />
            <span className="text-[0.9rem] font-bold text-brand-dark">{item.name}</span>
            {item.detail && (
              <span className="text-[0.78rem] text-neutral-400 ml-auto">{item.detail}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
