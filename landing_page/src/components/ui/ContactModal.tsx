import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { FiX, FiArrowRight } from 'react-icons/fi'
import emailjs from '@emailjs/browser'

type Props = {
  onClose: () => void
  onSuccess: () => void
}

type Form = {
  nome: string
  email: string
  organizacao: string
  cargo: string
  origem: string
  mensagem: string
}

const { VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY } = import.meta.env

const origensOptions = [
  'Redes sociais',
  'Indicação',
  'Busca no Google',
  'LinkedIn',
  'Evento / Apresentação',
  'Outro',
]

async function sendEmail(data: Form): Promise<void> {
  const configured = VITE_EMAILJS_SERVICE_ID && VITE_EMAILJS_TEMPLATE_ID && VITE_EMAILJS_PUBLIC_KEY

  if (!configured) {
    await new Promise(r => setTimeout(r, 1800))
    return
  }

  await emailjs.send(
    VITE_EMAILJS_SERVICE_ID,
    VITE_EMAILJS_TEMPLATE_ID,
    {
      nome: data.nome,
      email: data.email,
      organizacao: data.organizacao,
      cargo: data.cargo,
      origem: data.origem || 'Não informado',
      mensagem: data.mensagem || 'Nenhuma mensagem.',
    },
    { publicKey: VITE_EMAILJS_PUBLIC_KEY },
  )
}

const empty: Form = { nome: '', email: '', organizacao: '', cargo: '', origem: '', mensagem: '' }

export default function ContactModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState<Form>(empty)
  const [errors, setErrors] = useState<Partial<Form>>({})
  const [loading, setLoading] = useState(false)
  const [closing, setClosing] = useState(false)

  const close = useCallback(() => setClosing(true), [])

  useEffect(() => {
    document.body.classList.add('overflow-hidden')
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('overflow-hidden')
      window.removeEventListener('keydown', onKey)
    }
  }, [close])

  function set(field: keyof Form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const required: (keyof Form)[] = ['nome', 'email', 'organizacao', 'cargo']
    const next: Partial<Form> = {}
    for (const key of required) {
      if (!form[key].trim()) next[key] = 'Campo obrigatório'
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'E-mail inválido'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await sendEmail(form)
      onSuccess()
    } catch {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        animation: closing ? 'overlay-out 0.2s ease forwards' : 'overlay-in 0.25s ease',
      }}
      onClick={e => e.target === e.currentTarget && close()}
    >
      <div
        className="bg-white rounded-[20px] w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{
          animation: closing
            ? 'modal-out 0.2s ease forwards'
            : 'modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onAnimationEnd={() => closing && onClose()}
      >
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <span
                className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold tracking-[0.08em] uppercase px-3 py-1.5 rounded-full border mb-4"
                style={{
                  background: 'oklch(50% 0.14 168 / 0.1)',
                  color: 'var(--color-brand-teal)',
                  borderColor: 'oklch(50% 0.14 168 / 0.2)',
                }}
              >
                ✦ Solicitar Demonstração
              </span>
              <h2 className="text-[1.5rem] font-extrabold text-brand-dark tracking-[-0.02em] leading-[1.2]">
                Vamos conversar<br />sobre o projeto?
              </h2>
              <p className="text-[0.85rem] text-neutral-600 mt-2 leading-relaxed">
                Preencha os dados abaixo e entraremos em contato para apresentar o Conecta Paraná.
              </p>
            </div>
            <button
              onClick={close}
              className="text-neutral-400 hover:text-neutral-700 transition-colors ml-4 flex-shrink-0"
              aria-label="Fechar"
            >
              <FiX size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Nome completo"
                placeholder="Ex.: João Silva"
                value={form.nome}
                onChange={v => set('nome', v)}
                error={errors.nome}
                required
              />
              <Field
                label="E-mail"
                type="email"
                placeholder="seu@email.com.br"
                value={form.email}
                onChange={v => set('email', v)}
                error={errors.email}
                required
              />
              <Field
                label="Prefeitura / Organização"
                placeholder="Ex.: Prefeitura de Maringá"
                value={form.organizacao}
                onChange={v => set('organizacao', v)}
                error={errors.organizacao}
                required
              />
              <Field
                label="Cargo / Função"
                placeholder="Ex.: Secretário de TI"
                value={form.cargo}
                onChange={v => set('cargo', v)}
                error={errors.cargo}
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-[0.82rem] font-semibold text-neutral-700 mb-1.5">
                Como nos encontrou? 
                <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <select
                value={form.origem}
                onChange={e => set('origem', e.target.value)}
                className="w-full border border-neutral-200 rounded-[10px] px-3.5 py-2.5 text-[0.875rem] text-neutral-700 bg-white outline-none focus:border-brand-teal transition-colors"
              >
                <option value="">Selecione uma opção</option>
                {origensOptions.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="block text-[0.82rem] font-semibold text-neutral-700 mb-1.5">
                Mensagem / Interesse{' '}
                <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <textarea
                value={form.mensagem}
                onChange={e => set('mensagem', e.target.value)}
                placeholder="Conte um pouco sobre o contexto da sua cidade ou organização e o que espera do projeto..."
                rows={3}
                className="w-full border border-neutral-200 rounded-[10px] px-3.5 py-2.5 text-[0.875rem] text-neutral-700 outline-none focus:border-brand-teal transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 py-4 rounded-[10px] font-bold text-[0.95rem] text-white transition-all duration-200"
              style={{
                background: loading ? 'oklch(50% 0.14 168 / 0.6)' : 'var(--color-brand-teal)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Enviando...' : (<>Enviar solicitação <FiArrowRight size={16} /></>)}
            </button>

            <p className="text-center text-[0.75rem] text-neutral-400 mt-4 leading-relaxed">
              Seus dados são usados apenas para entrarmos em contato.<br />Sem spam, prometemos.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

type FieldProps = {
  label: string
  placeholder?: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  required?: boolean
}

function Field({ label, placeholder, type = 'text', value, onChange, error, required }: FieldProps) {
  return (
    <div>
      <label className="block text-[0.82rem] font-semibold text-neutral-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={e => onChange(e.target.value)}
        className="w-full border rounded-[10px] px-3.5 py-2.5 text-[0.875rem] text-neutral-700 outline-none focus:border-brand-teal transition-colors"
        style={{ borderColor: error ? '#e05c5c' : 'oklch(93% 0.008 168)' }}
      />
      {error && <p className="text-[0.75rem] mt-1" style={{ color: '#c53030' }}>{error}</p>}
    </div>
  )
}
