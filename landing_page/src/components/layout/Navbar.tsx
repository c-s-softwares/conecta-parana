import { useState, useEffect } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import Button from '../ui/Button'

type Props = { onOpenContact: () => void }

const links = [
  { label: 'Para Prefeituras', href: '#gov' },
  { label: 'Para Cidadãos', href: '#citizen' },
  { label: 'Expansão', href: '#scale' },
  { label: 'Tecnologia', href: '#stack' },
]

export default function Navbar({ onOpenContact }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-8 transition-all duration-300 ${
        scrolled ? 'bg-brand-dark/95 backdrop-blur-[12px] shadow-[0_1px_0_rgba(255,255,255,0.06)]' : ''
      }`}
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between h-[68px]">
        <a href="#" className="flex items-center gap-[10px] no-underline">
          <img
            src="/assets/parana-logo.png"
            alt="Paraná"
            className="h-7 w-auto brightness-0 invert opacity-90"
          />
          <span className="text-white font-bold text-base tracking-[-0.01em]">Conecta Paraná</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors duration-200 no-underline"
            >
              {link.label}
            </a>
          ))}
          <Button size="sm" onClick={onOpenContact}>
            Solicitar demo
          </Button>
        </div>

        <button
          className="md:hidden text-white/80 hover:text-white"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div
          className="md:hidden backdrop-blur-[16px] border-t border-b border-white/15 px-6 py-2 flex flex-col"
          style={{ background: 'oklch(17% 0.045 168 / 0.98)' }}
        >
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-white/75 hover:text-white text-[0.95rem] font-medium py-4 border-b border-white/[0.12] last:border-b-0 no-underline transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
          <div className="py-5">
            <Button size="sm" onClick={() => { setMenuOpen(false); onOpenContact() }}>
              Solicitar demo
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
