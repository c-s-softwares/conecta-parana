import { FiArrowRight } from 'react-icons/fi'
import Button from '../ui/Button'

type Props = { onOpenContact: () => void }

export default function CtaFinal({ onOpenContact }: Props) {
  return (
    <section id="contact" className="py-[120px] px-8 bg-brand-dark text-center">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-extrabold text-white tracking-[-0.03em] mb-4 text-balance">
          Leve o Conecta Paraná<br />para a sua cidade.
        </h2>
        <p className="text-[1.05rem] max-w-[500px] mx-auto mb-10 leading-[1.7]" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Seja uma prefeitura buscando modernizar a comunicação com cidadãos, ou um parceiro
          interessado em expandir o projeto.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" onClick={onOpenContact}>
            Solicitar demonstração <FiArrowRight size={16} />
          </Button>
          <Button as="a" href="#gov" variant="ghost" size="lg">
            Ver o painel administrativo
          </Button>
        </div>

        <p className="text-[0.78rem] mt-8" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Projeto independente em busca de parceria com o Governo do Estado do Paraná.
        </p>
      </div>
    </section>
  )
}
