import Button from '../ui/Button'
import StatCard from '../ui/StatCard'
import { FaArrowRightLong } from 'react-icons/fa6'

const stats = [
  { value: '399', label: 'municípios no Paraná' },
  { value: '11', label: 'paranaenses a alcançar', accentValue: 'M+' },
  { value: '1', label: 'plataforma integrada' },
  { value: '99,9', label: 'uptime garantido', accentValue: '%' },
]

export default function Hero() {
  return (
    <section
      className="min-h-screen flex flex-col justify-center px-8 pt-[120px] pb-20 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 60% 40%, oklch(26% 0.07 168) 0%, oklch(14% 0.03 168) 100%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 80%, oklch(50% 0.14 168 / 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, oklch(50% 0.13 215 / 0.06) 0%, transparent 50%)',
        }}
      />

      <div className="max-w-[1200px] mx-auto w-full relative">
        <div
          className="inline-flex items-center gap-2 border text-brand-teal2 text-[0.8rem] font-semibold px-[0.9rem] py-[0.35rem] rounded-full mb-7 tracking-[0.05em] uppercase"
          style={{ background: 'oklch(50% 0.14 168 / 0.15)', borderColor: 'oklch(50% 0.14 168 / 0.3)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-teal2 flex-shrink-0" />
          Plataforma de informação pública · Paraná
        </div>

        <h1 className="text-[clamp(2.8rem,6vw,5.2rem)] font-extrabold text-white leading-[1.1] tracking-[-0.03em] max-w-[820px] mb-6 text-balance">
          Informação pública,{' '}
          <br />
          <em className="not-italic text-brand-teal2">do jeito certo</em>,
          <br />
          em cada cidade.
        </h1>

        <p className="text-[clamp(1rem,2vw,1.2rem)] text-white/60 max-w-[650px] mb-10 leading-[1.7]">
          Uma plataforma unificada para que prefeituras gerenciem e cidadãos
          acessem comunicados, eventos, locais, alertas e muito mais. <br/> 
          — de Maringá ao estado inteiro.
        </p>

        <div className="flex gap-4 flex-wrap mb-20">
          <Button as="a" href="#gov">Para Prefeituras <FaArrowRightLong /></Button>
          <Button as="a" href="#citizen" variant="outline">Para Cidadãos <FaArrowRightLong /></Button>
        </div>

        <div className="flex gap-12 flex-wrap pt-8 border-t border-white/[0.08]">
          {stats.map(s => (
            <StatCard key={s.label} value={s.value} label={s.label} accentValue={s.accentValue} />
          ))}
        </div>
      </div>
    </section>
  )
}
