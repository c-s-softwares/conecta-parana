import { FiRadio, FiMap, FiBell } from 'react-icons/fi'
import SectionTag from '../ui/SectionTag'
import FeatureCard from '../ui/FeatureCard'

const cards = [
  {
    icon: <FiRadio size={18} />,
    title: 'Canais fragmentados',
    description:
      'Cada prefeitura usa um canal diferente: WhatsApp, site próprio, Instagram — sem padronização ou integração.',
  },
  {
    icon: <FiMap size={18} />,
    title: 'Mapas e dados desatualizados',
    description:
      'Endereços de UBS, horários de parques, rotas de ônibus. Informações críticas sem manutenção centralizada.',
  },
  {
    icon: <FiBell size={18} />,
    title: 'Portais existem, mas separados',
    description:
      'Paraná Interativo, parana.pr.gov.br, Portal dos Municípios — cada um com seu escopo, sem integração e sem um app mobile real para o cidadão.',
  },
]

const stats = [
  { value: '~30%', label: 'adoção digital média em\ncidades pequenas do PR' },
  { value: '399', label: 'municípios paranaenses, cada um\ncom seu canal fragmentado' },
  { value: '4+', label: 'portais web estaduais existentes\n(Paraná Interativo, parana.pr.gov.br…)\nmas nenhum app unificado de verdade' },
]

export default function Problema() {
  return (
    <section id="problema" className="py-[100px] px-8 bg-neutral-100">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 mt-0 items-center">
          <div>
            <SectionTag>O Problema</SectionTag>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.03em] leading-[1.15] text-balance mt-4 mb-4 text-neutral-800">
              A informação existe.<br />O cidadão desiste.
            </h2>
            <p className="text-[1.05rem] text-neutral-600 max-w-[540px] leading-[1.7] mb-8">
              Portais lentos, Instagram perdido no feed, mapas desatualizados. A informação pública
              está espalhada — e cada município resolve sozinho.
            </p>
            <div className="flex flex-col gap-4">
              {cards.map(card => (
                <FeatureCard key={card.title} {...card} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8 justify-center lg:pt-16">
            {stats.map(stat => (
              <div key={stat.value} className="border-l-[3px] border-brand-teal pl-6">
                <div className="text-[3.5rem] font-extrabold text-brand-dark tracking-[-0.04em] leading-none">
                  {stat.value}
                </div>
                <div className="text-[0.85rem] text-neutral-600 mt-2 leading-[1.5] whitespace-pre-line">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
