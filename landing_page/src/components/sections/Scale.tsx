type Phase = {
  num: string
  badge: string
  badgeStyle: React.CSSProperties
  city: string
  pop: string
  users: string
  bgClass?: string
  cityClass: string
  popStyle: React.CSSProperties
  usersStyle: React.CSSProperties
  usersLabelStyle: React.CSSProperties
  numStyle: React.CSSProperties
}

const phases: Phase[] = [
  {
    num: 'Fase 1 · MVP',
    badge: 'Fase atual',
    badgeStyle: { background: 'oklch(50% 0.14 168 / 0.15)', color: 'var(--color-brand-teal)' },
    city: 'Paiçandu',
    pop: '48.000 habitantes',
    users: '1.096',
    cityClass: 'text-brand-dark',
    numStyle: { color: 'var(--color-neutral-400)' },
    popStyle: { color: 'var(--color-neutral-600)' },
    usersStyle: { color: 'var(--color-brand-dark)' },
    usersLabelStyle: { color: 'var(--color-neutral-400)' },
  },
  {
    num: 'Fase 2 · Regional',
    badge: 'Próxima fase',
    badgeStyle: { background: 'oklch(50% 0.13 215 / 0.12)', color: 'var(--color-citizen-blue)' },
    city: 'Maringá',
    pop: '430.000 habitantes',
    users: '9.667',
    cityClass: 'text-brand-dark',
    numStyle: { color: 'var(--color-brand-teal)' },
    popStyle: { color: 'oklch(38% 0.06 168)' },
    usersStyle: { color: 'var(--color-brand-teal)' },
    usersLabelStyle: { color: 'oklch(45% 0.08 168)' },
  },
  {
    num: 'Fase 3 · Estado',
    badge: 'Visão',
    badgeStyle: { background: 'oklch(60% 0.13 168 / 0.2)', color: 'var(--color-brand-teal2)' },
    city: 'Paraná inteiro',
    pop: '11,4M habitantes',
    users: '267.537',
    cityClass: 'text-white',
    numStyle: { color: 'rgba(255,255,255,0.4)' },
    popStyle: { color: 'rgba(255,255,255,0.5)' },
    usersStyle: { color: 'var(--color-brand-teal2)' },
    usersLabelStyle: { color: 'rgba(255,255,255,0.4)' },
  },
]

const stats = [
  { value: '399', label: 'municípios no Paraná' },
  { value: '11', accentValue: 'M+', label: 'paranaenses' },
  { value: '99,9', accentValue: '%', label: 'uptime meta' },
  { value: '1', label: 'monorepo · trunk-based' },
]

export default function Scale() {
  return (
    <section id="scale" className="py-[100px] px-8 bg-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <span className="text-[0.75rem] font-bold tracking-[0.1em] uppercase text-brand-teal">
            Expansão
          </span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.03em] leading-[1.15] text-brand-dark mt-4 mb-4 text-balance text-center">
            De uma cidade<br />ao estado inteiro.
          </h2>
          <p className="text-[1.05rem] text-neutral-600 max-w-[540px] mx-auto leading-[1.7] text-center">
            Começamos pequeno para validar, escalamos com responsabilidade. A arquitetura já está
            preparada para o pior cenário.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px] rounded-[20px] overflow-hidden mb-16">
          {phases.map((phase, i) => (
            <div
              key={phase.city}
              className={`relative p-10 ${phase.bgClass}`}
              style={i === 1 ? { background: 'oklch(0.94 0.0328 161.84)' } : i === 2 ? { background: 'oklch(22% 0.05 168)' } : { background: 'oklch(94% 0.015 168)'}}
            >
              <span
                className="absolute top-8 right-8 text-[0.65rem] font-bold px-2 py-0.5 rounded-full"
                style={phase.badgeStyle}
              >
                {phase.badge}
              </span>
              <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase mb-4" style={phase.numStyle}>
                {phase.num}
              </div>
              <div className={`text-[1.5rem] font-extrabold tracking-[-0.02em] mb-1 ${phase.cityClass}`}>
                {phase.city}
              </div>
              <div className="text-[0.8rem] mb-4" style={phase.popStyle}>{phase.pop}</div>
              <div className="text-[2rem] font-extrabold tracking-[-0.03em] leading-none" style={phase.usersStyle}>
                {phase.users}
              </div>
              <div className="text-[0.75rem] mt-1" style={phase.usersLabelStyle}>
                usuários simultâneos (pior cenário)
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(stat => (
            <div key={stat.label} className="text-center py-8 px-4 bg-neutral-100 rounded-[16px]">
              <div className="text-[2.5rem] font-extrabold tracking-[-0.04em] text-brand-dark leading-none">
                <span className="text-brand-teal">{stat.value}</span>
                {stat.accentValue && <span>{stat.accentValue}</span>}
              </div>
              <div className="text-[0.78rem] text-neutral-400 uppercase tracking-[0.06em] mt-2">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
