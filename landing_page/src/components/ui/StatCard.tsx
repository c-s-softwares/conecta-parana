type Props = {
  value: string
  label: string
  accentValue?: string
}

export default function StatCard({ value, label, accentValue }: Props) {
  return (
    <div>
      <div className={'text-[2.2rem] font-extrabold tracking-[-0.03em] leading-none text-brand-teal2'}>
        {value}{accentValue && <span className="text-white">{accentValue}</span>}
      </div>
      <div className="text-[0.78rem] text-white/45 uppercase tracking-[0.06em] mt-1">{label}</div>
    </div>
  )
}
