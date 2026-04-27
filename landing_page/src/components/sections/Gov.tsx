import { FiFileText, FiCalendar, FiMapPin, FiBell, FiBarChart2, FiUsers } from 'react-icons/fi'
import type { ReactNode } from 'react'
import SectionTag from '../ui/SectionTag'

type Feature = { icon: ReactNode; title: string; description: string }

const features: Feature[] = [
  {
    icon: <FiFileText size={18} />,
    title: 'Comunicados e notícias',
    description: 'Publique avisos oficiais, notícias e comunicados com controle de rascunhos e publicação agendada.',
  },
  {
    icon: <FiCalendar size={18} />,
    title: 'Eventos municipais',
    description: 'Cadastre festivais, corridas, feiras e atividades com data, local, e contagem de inscritos em tempo real.',
  },
  {
    icon: <FiMapPin size={18} />,
    title: 'Locais e serviços',
    description: 'Mantenha atualizado o mapa de UBS, parques, escolas e pontos de serviço com geolocalização.',
  },
  {
    icon: <FiBell size={18} />,
    title: 'Alertas em massa',
    description: 'Envie notificações push para todos os cidadãos da cidade em situações de emergência ou avisos críticos.',
  },
  {
    icon: <FiBarChart2 size={18} />,
    title: 'Dashboard consolidado',
    description: 'Visualize alcance semanal, publicações no período, atividade recente e métricas de todas as cidades.',
  },
  {
    icon: <FiUsers size={18} />,
    title: 'Gestão de administradores',
    description: 'Controle de acesso por secretaria, com log de atividade e permissões granulares por cidade.',
  },
]

export default function Gov() {
  return (
    <section id="gov" className="px-8 pb-[100px] bg-brand-dark">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center pb-16 pt-[100px]">
          <SectionTag>Para Prefeituras · B2G</SectionTag>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.03em] leading-[1.15] text-white mt-4 mb-4 text-balance">
            Um painel para gerenciar<br />toda a comunicação municipal.
          </h2>
          <p className="text-[1.05rem] max-w-[540px] mx-auto leading-[1.7]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Do comunicado ao alerta em massa. Do evento ao cadastro de locais. Tudo em um único
            painel web, com visibilidade consolidada de todas as cidades conectadas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {features.map(feat => (
            <div
              key={feat.title}
              className="border rounded-[14px] p-6 transition-colors duration-200 group"
              style={{ background: 'oklch(22% 0.05 168)', borderColor: 'oklch(30% 0.06 168)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'oklch(50% 0.14 168 / 0.5)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'oklch(30% 0.06 168)')}
            >
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center mb-4 text-brand-teal2"
                style={{ background: 'oklch(50% 0.14 168 / 0.15)' }}
              >
                {feat.icon}
              </div>
              <h4 className="text-[0.95rem] font-bold text-white mb-1.5">{feat.title}</h4>
              <p className="text-[0.82rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {feat.description}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[0.75rem] font-semibold tracking-[0.08em] uppercase text-center mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Painel administrativo real — Angular 21 · Tailwind CSS v4
        </p>

        <div className="rounded-[16px] overflow-hidden border shadow-[0_24px_80px_rgba(0,0,0,0.4)]" style={{ borderColor: 'oklch(30% 0.06 168)' }}>
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-b" style={{ background: 'oklch(24% 0.05 168)', borderColor: 'oklch(30% 0.06 168)' }}>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 rounded-md px-3 py-1 text-[0.72rem] font-mono" style={{ background: 'oklch(20% 0.04 168)', color: 'rgba(255,255,255,0.3)' }}>
              admin.conectaparana.com.br · dashboard
            </div>
          </div>
          <img
            src="/assets/dashboard-main.png"
            alt="Dashboard do Painel Administrativo Conecta Paraná"
            className="w-full block"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="rounded-[12px] overflow-hidden border shadow-[0_8px_30px_rgba(0,0,0,0.3)]" style={{ borderColor: 'oklch(30% 0.06 168)' }}>
            <img
              src="/assets/dashboard-login.png"
              alt="Tela de login do Painel Administrativo"
              className="w-full block object-cover object-center max-h-60"
            />
          </div>
          <div className="rounded-[12px] overflow-hidden border shadow-[0_8px_30px_rgba(0,0,0,0.3)]" style={{ borderColor: 'oklch(30% 0.06 168)' }}>
            <img
              src="/assets/dashboard-events.png"
              alt="Gestão de Eventos no Painel Administrativo"
              className="w-full block object-cover object-top max-h-60"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
