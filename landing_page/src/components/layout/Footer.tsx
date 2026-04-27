const links = [
  { label: 'Prefeituras', href: '#gov' },
  { label: 'Cidadãos', href: '#citizen' },
  { label: 'Tecnologia', href: '#stack' },
  { label: 'Contato', href: '#contact' },
]

export default function Footer() {
  return (
    <footer className="px-8 py-12" style={{ background: 'oklch(12% 0.03 168)' }}>
      <div className="max-w-[1200px] mx-auto flex flex-wrap justify-between items-center gap-6">
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/parana-logo.png"
            alt="Paraná"
            className="h-[22px] w-auto brightness-0 invert opacity-50"
          />
          <span className="text-[0.8rem] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Conecta Paraná
          </span>
        </div>

        <p className="text-[0.8rem]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © 2026 C&S Softwares · suporte@conectaparana.com.br
        </p>

        <nav className="flex gap-8">
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-[0.8rem] no-underline transition-colors duration-200 hover:text-white/70"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
