import { FiFileText, FiMap, FiAlertTriangle, FiCalendar, FiHome, FiBell, FiSearch } from 'react-icons/fi'
import type { ReactNode } from 'react'
import SectionTag from '../ui/SectionTag'

type Feature = { icon: ReactNode; title: string; description: string }

const features: Feature[] = [
  {
    icon: <FiFileText size={18} />,
    title: 'Feed da cidade',
    description: 'Comunicados oficiais, notícias e eventos da prefeitura — direto para você, sem intermediários.',
  },
  {
    icon: <FiMap size={18} />,
    title: 'Mapa de serviços',
    description: 'UBS, escolas, parques, pontos de serviço — todos atualizados com localização, horários e contato.',
  },
  {
    icon: <FiAlertTriangle size={18} />,
    title: 'Alertas em tempo real',
    description: 'Notificações push imediatas para emergências, interdições e avisos críticos da sua cidade.',
  },
  {
    icon: <FiCalendar size={18} />,
    title: 'Agenda de eventos',
    description: 'Festivais, feiras e atividades municipais com datas, locais e inscrição direta pelo app.',
  },
]

function PhoneMockup() {
  return (
    <div className="flex justify-center">
      <div
        className="relative w-[300px] rounded-[48px] p-[14px]"
        style={{
          background: 'var(--color-brand-dark)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)',
        }}
      >
        <div
          className="absolute top-[14px] left-1/2 -translate-x-1/2 w-[110px] h-[30px] rounded-b-[20px] z-10"
          style={{ background: 'var(--color-brand-dark)' }}
        />
        <div className="bg-[#f8f8f8] rounded-[38px] overflow-hidden h-[580px] relative">
          <div
            className="h-11 flex items-end justify-between px-6 pb-2 text-[0.7rem] font-semibold"
            style={{ background: 'var(--color-brand-dark)', color: 'rgba(255,255,255,0.8)' }}
          >
            <span>9:41</span>
            <span className="flex items-center gap-1 text-[0.65rem]">●●● ▲ ▌</span>
          </div>

          <div className="px-5 pt-4 pb-5" style={{ background: 'var(--color-brand-dark)' }}>
            <div className="text-[0.7rem] font-medium mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Bom dia, Maria —
            </div>
            <div className="text-[1.1rem] font-extrabold tracking-[-0.02em] text-white">
              Paiçandu, PR
            </div>
          </div>

          <div className="mx-5 -mt-3.5 bg-white rounded-[12px] px-3.5 py-2.5 flex items-center gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.1)]">
            <FiSearch size={14} className="text-neutral-400 flex-shrink-0" />
            <span className="text-[0.75rem] text-neutral-400">Buscar serviços, eventos...</span>
          </div>

          <div className="text-[0.7rem] font-bold tracking-[0.06em] uppercase px-5 pt-4 pb-2" style={{ color: 'var(--color-neutral-600)' }}>
            Alertas recentes
          </div>

          <div className="px-5 flex flex-col gap-2.5">
            <div className="bg-white rounded-[12px] p-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border-l-[3px] border-[#e05c5c]">
              <span className="inline-block text-[0.62rem] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-full mb-1.5" style={{ background: '#fde8e8', color: '#c53030' }}>
                <FiAlertTriangle size={9} className="inline mr-1" />Alerta
              </span>
              <div className="text-[0.8rem] font-bold text-brand-dark mb-0.5">Interdição na Av. Paraná</div>
              <div className="text-[0.7rem] text-neutral-400">Trecho fechado até 18h · Há 12 min</div>
            </div>

            <div className="bg-white rounded-[12px] p-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <span className="inline-block text-[0.62rem] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-full mb-1.5 text-brand-teal" style={{ background: 'oklch(92% 0.03 168)' }}>
                <FiFileText size={9} className="inline mr-1" />Comunicado
              </span>
              <div className="text-[0.8rem] font-bold text-brand-dark mb-0.5">Vacinação contra gripe disponível</div>
              <div className="text-[0.7rem] text-neutral-400">UBS Central · Seg a Sex · 8h–17h</div>
            </div>

            <div className="bg-white rounded-[12px] p-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <span className="inline-block text-[0.62rem] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-full mb-1.5 text-citizen-blue" style={{ background: 'oklch(92% 0.03 215)' }}>
                <FiCalendar size={9} className="inline mr-1" />Evento
              </span>
              <div className="text-[0.8rem] font-bold text-brand-dark mb-0.5">Feira do Produtor Rural</div>
              <div className="text-[0.7rem] text-neutral-400">Praça Municipal · Sab 26/04 · 07h</div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex justify-around py-2.5 bg-white border-t border-neutral-200">
            {[
              { icon: <FiHome size={16} />, label: 'Início', active: true },
              { icon: <FiMap size={16} />, label: 'Mapa', active: false },
              { icon: <FiCalendar size={16} />, label: 'Agenda', active: false },
              { icon: <FiBell size={16} />, label: 'Alertas', active: false },
            ].map(tab => (
              <div key={tab.label} className="flex flex-col items-center gap-0.5" style={{ color: tab.active ? 'var(--color-citizen-blue)' : 'var(--color-neutral-400)' }}>
                {tab.icon}
                <span className="text-[0.6rem] font-semibold">{tab.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Citizen() {
  return (
    <section id="citizen" className="py-[100px] px-8 bg-citizen-bg">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div>
            <SectionTag variant="blue">Para Cidadãos · B2C</SectionTag>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.03em] leading-[1.15] text-brand-dark mt-4 mb-4 text-balance">
              A sua cidade<br />no seu bolso.
            </h2>
            <p className="text-[1.05rem] text-neutral-600 max-w-[540px] leading-[1.7] mb-10">
              Um app simples, rápido e acessível para acompanhar tudo que acontece na sua cidade —
              sem algoritmo, sem ruído, sem depender de redes sociais.
            </p>

            <div className="flex flex-col gap-5">
              {features.map(feat => (
                <div key={feat.title} className="flex gap-4 items-start">
                  <div
                    className="w-[42px] h-[42px] rounded-[12px] flex-shrink-0 flex items-center justify-center text-citizen-blue"
                    style={{ background: 'oklch(50% 0.13 215 / 0.1)' }}
                  >
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="text-[0.9rem] font-bold text-brand-dark mb-1">{feat.title}</h4>
                    <p className="text-[0.82rem] text-neutral-600 leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-8">
              <span
                className="text-[0.75rem] font-bold px-3 py-1.5 rounded-full border"
                style={{
                  background: 'oklch(50% 0.13 215 / 0.1)',
                  color: 'var(--color-citizen-blue)',
                  borderColor: 'oklch(50% 0.13 215 / 0.2)',
                }}
              >
                Flutter 3.11+ · iOS &amp; Android
              </span>
              <span
                className="text-[0.75rem] font-bold px-3 py-1.5 rounded-full border"
                style={{
                  background: 'oklch(50% 0.14 168 / 0.08)',
                  color: 'var(--color-brand-teal)',
                  borderColor: 'oklch(50% 0.14 168 / 0.15)',
                }}
              >
                Em desenvolvimento
              </span>
            </div>
          </div>

          <PhoneMockup />
        </div>
      </div>
    </section>
  )
}
