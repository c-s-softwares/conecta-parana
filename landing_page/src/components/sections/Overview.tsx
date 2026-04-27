import { FiSettings, FiBell, FiBarChart2, FiSmartphone, FiMapPin, FiCheckCircle } from 'react-icons/fi'
import SectionTag from '../ui/SectionTag'

const adminFeatures = [
  'Dashboard unificado por cidade ou estado',
  'Publicação de comunicados e notícias',
  'Gestão de eventos e locais municipais',
  'Envio de alertas e notificações em massa',
  'Controle de múltiplos administradores',
]

const citizenFeatures = [
  'Feed personalizado com notícias da cidade',
  'Mapa de serviços públicos atualizado',
  'Alertas e notificações push em tempo real',
  'Agenda de eventos locais',
  'Funciona offline, acessível em todos os dispositivos',
]

export default function Overview() {
  return (
    <section id="plataforma" className="py-[100px] px-8 bg-brand-dark">
      <div className="max-w-[1200px] mx-auto">
        <SectionTag>A Solução</SectionTag>
        <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.03em] leading-[1.15] text-white mt-4 mb-10 text-balance">
          Dois produtos. Uma plataforma.
        </h2>

        <div className="grid lg:grid-cols-2 gap-[2px] rounded-[20px] overflow-hidden">
          <div className="p-12" style={{ background: 'oklch(22% 0.06 168)' }}>
            <div
              className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full mb-6 border"
              style={{
                background: 'oklch(50% 0.14 168 / 0.2)',
                color: 'var(--color-brand-teal2)',
                borderColor: 'oklch(50% 0.14 168 / 0.3)',
              }}
            >
              <FiSettings size={11} />
              Gestão Pública
            </div>
            <h3 className="text-[1.6rem] font-extrabold text-white tracking-[-0.02em] mb-3">
              Painel Administrativo
            </h3>
            <p className="text-[0.9rem] text-white/55 leading-[1.7] mb-8">
              Para secretarias e prefeituras. Um painel web completo para publicar, gerenciar e
              alcançar cidadãos — com dados consolidados de todas as cidades conectadas.
            </p>
            <ul className="flex flex-col gap-2.5">
              {adminFeatures.map(feat => (
                <li key={feat} className="flex items-center gap-2.5 text-[0.875rem] text-white/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal2 flex-shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <a
              href="#gov"
              className="mt-10 inline-flex items-center gap-1.5 text-[0.875rem] font-bold text-brand-teal2 no-underline border-b border-transparent hover:border-brand-teal2 hover:gap-3 transition-all duration-200"
            >
              <FiBarChart2 size={14} />
              Ver painel administrativo →
            </a>
          </div>

          <div className="p-12" style={{ background: 'oklch(20% 0.04 215)' }}>
            <div
              className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full mb-6 border"
              style={{
                background: 'oklch(50% 0.13 215 / 0.2)',
                color: 'oklch(65% 0.12 215)',
                borderColor: 'oklch(50% 0.13 215 / 0.3)',
              }}
            >
              <FiSmartphone size={11} />
              Experiência do Cidadão
            </div>
            <h3 className="text-[1.6rem] font-extrabold text-white tracking-[-0.02em] mb-3">
              App do Cidadão
            </h3>
            <p className="text-[0.9rem] text-white/55 leading-[1.7] mb-8">
              Para os paranaenses. Um aplicativo mobile simples, acessível e rápido para acompanhar
              a cidade em tempo real — sem depender de redes sociais ou portais lentos.
            </p>
            <ul className="flex flex-col gap-2.5">
              {citizenFeatures.map(feat => (
                <li
                  key={feat}
                  className="flex items-center gap-2.5 text-[0.875rem] text-white/70"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'oklch(65% 0.12 215)' }}
                  />
                  {feat}
                </li>
              ))}
            </ul>
            <a
              href="#citizen"
              className="mt-10 inline-flex items-center gap-1.5 text-[0.875rem] font-bold no-underline border-b border-transparent hover:gap-3 transition-all duration-200"
              style={{ color: 'oklch(65% 0.12 215)', borderColor: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'oklch(65% 0.12 215)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
            >
              <FiMapPin size={14} />
              Ver app do cidadão →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
