import { FiMonitor, FiSmartphone, FiSettings, FiServer, FiGitBranch } from 'react-icons/fi'
import TechCard from '../ui/TechCard'

const cards = [
  {
    label: 'Frontend · Admin',
    icon: <FiMonitor size={16} />,
    accentColor: 'var(--color-brand-teal)',
    items: [
      { name: 'Angular 21', detail: 'Standalone Components' },
      { name: 'Tailwind CSS v4', detail: 'Design system' },
      { name: 'Vitest + Playwright', detail: 'Unit & E2E tests' },
    ],
  },
  {
    label: 'Mobile · Cidadão',
    icon: <FiSmartphone size={16} />,
    accentColor: 'var(--color-citizen-blue)',
    items: [
      { name: 'Flutter 3.11+', detail: 'iOS & Android' },
      { name: 'Dart', detail: 'Type-safe' },
      { name: 'Offline-first', detail: 'Sem internet parcial' },
    ],
  },
  {
    label: 'Backend · Core',
    icon: <FiSettings size={16} />,
    accentColor: 'var(--color-neutral-800)',
    items: [
      { name: 'NestJS 11', detail: 'TypeScript strict' },
      { name: 'Prisma 7 + PostgreSQL', detail: 'Geoespacial' },
      { name: 'Redis · Oracle Cloud', detail: 'Cache + Object Storage' },
    ],
  },
  {
    label: 'Infraestrutura',
    icon: <FiServer size={16} />,
    accentColor: 'var(--color-neutral-800)',
    items: [
      { name: 'JWT Stateless · CORS controlado' },
      { name: 'Caddy · ARM64 · QEMU' },
      { name: 'GlitchTip · error tracking self-hosted' },
    ],
  },
  {
    label: 'CI/CD · Entrega',
    icon: <FiGitBranch size={16} />,
    accentColor: 'var(--color-neutral-800)',
    items: [
      { name: 'Trunk-based branching' },
      { name: 'GitHub Actions · GHCR' },
      { name: 'Staging + Produção na mesma VM' },
    ],
  },
]

export default function Stack() {
  return (
    <section id="stack" className="py-[100px] px-8 bg-neutral-100">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-14">
          <span className="text-[0.75rem] font-bold tracking-[0.1em] uppercase text-brand-teal">
            Tecnologia
          </span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.03em] leading-[1.15] text-brand-dark mt-4 mb-4 text-balance text-center">
            Construído para escalar.
          </h2>
          <p className="text-[1.05rem] text-neutral-600 max-w-[540px] mx-auto leading-[1.7] text-center">
            Stack moderna, monorepo único, deploy automatizado. Preparado para crescer do município
            ao estado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.slice(0, 3).map(card => (
            <TechCard key={card.label} {...card} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {cards.slice(3).map(card => (
            <TechCard key={card.label} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}
