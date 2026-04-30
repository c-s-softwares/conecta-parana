import type { ReactNode } from 'react'

type Props = {
  icon: ReactNode
  title: string
  description: string
  variant?: 'light' | 'dark'
}

export default function FeatureCard({ icon, title, description, variant = 'light' }: Props) {
  if (variant === 'dark') {
    return (
      <div
        className="border rounded-[14px] p-6 transition-colors duration-200"
        style={{
          background: 'oklch(22% 0.05 168)',
          borderColor: 'oklch(30% 0.06 168)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'oklch(50% 0.14 168 / 0.5)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'oklch(30% 0.06 168)')}
      >
        <div
          className="w-11 h-11 rounded-[12px] flex items-center justify-center mb-4 text-brand-teal2"
          style={{ background: 'oklch(50% 0.14 168 / 0.15)' }}
        >
          {icon}
        </div>
        <h4 className="text-[0.95rem] font-bold text-white mb-1.5">{title}</h4>
        <p className="text-[0.82rem] text-white/45 leading-relaxed">{description}</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-[14px] p-6 flex gap-4 items-start hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      <div
        className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 text-brand-teal"
        style={{ background: 'oklch(93% 0.02 168)' }}
      >
        {icon}
      </div>
      <div>
        <h4 className="text-[0.95rem] font-bold text-neutral-800 mb-1">{title}</h4>
        <p className="text-[0.85rem] text-neutral-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
