import { useEffect, useState } from 'react'
import { FiCheck } from 'react-icons/fi'

type Props = {
  visible: boolean
  onHide: () => void
  duration?: number
}

export default function Toast({ visible, onHide, duration = 5000 }: Props) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!visible) {
      setProgress(100)
      return
    }

    const start = performance.now()
    let raf: number

    function tick(now: number) {
      const elapsed = now - start
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining > 0) {
        raf = requestAnimationFrame(tick)
      } else {
        onHide()
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, duration, onHide])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 right-6 z-[300] w-[320px] bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-4">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'oklch(50% 0.14 168 / 0.12)' }}
        >
          <FiCheck size={16} className="text-brand-teal" />
        </div>
        <div>
          <p className="text-[0.875rem] font-bold text-brand-dark">Solicitação enviada!</p>
          <p className="text-[0.78rem] text-neutral-500 mt-0.5">
            Em breve entraremos em contato com você.
          </p>
        </div>
      </div>
      <div className="h-[3px] bg-neutral-100">
        <div
          className="h-full bg-brand-teal transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
