type Props = {
  children: React.ReactNode
  variant?: 'teal' | 'blue'
}

export default function SectionTag({ children, variant = 'teal' }: Props) {
  const style =
    variant === 'blue'
      ? 'bg-[oklch(50%_0.13_215_/_0.1)] text-[oklch(65%_0.12_215)] border-[oklch(50%_0.13_215_/_0.2)]'
      : 'bg-[oklch(50%_0.14_168_/_0.15)] text-brand-teal2 border-[oklch(50%_0.14_168_/_0.3)]'

  return (
    <span
      className={`inline-flex items-center gap-2 text-[0.75rem] font-bold tracking-[0.1em] uppercase px-[0.9rem] py-[0.35rem] ${style}`}
    >
      {children}
    </span>
  )
}
