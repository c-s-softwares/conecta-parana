import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

type BaseProps = {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' }
type AnchorProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a' }

type Props = ButtonProps | AnchorProps

const base =
  'inline-flex items-center gap-2 font-sans font-semibold rounded-[10px] transition-all duration-200 cursor-pointer'

const variants = {
  primary: 'bg-brand-teal text-white hover:bg-brand-teal2 hover:-translate-y-px',
  outline: 'bg-transparent text-white border border-white/25 hover:border-white/50 hover:bg-white/5 hover:-translate-y-px',
  ghost: 'bg-transparent text-white/70 border border-white/20 hover:border-white/40 hover:text-white',
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-[1.75rem] py-[0.875rem] text-[0.95rem]',
  lg: 'px-8 py-4 text-base',
}

export default function Button({ variant = 'primary', size = 'md', ...props }: Props) {
  const className = `${base} ${variants[variant]} ${sizes[size]} ${(props as { className?: string }).className ?? ''}`

  if ((props as AnchorProps).as === 'a') {
    const { as: _as, variant: _v, size: _s, ...rest } = props as AnchorProps & { as: 'a'; variant?: string; size?: string }
    return <a {...rest} className={className} />
  }

  const { as: _as, variant: _v, size: _s, ...rest } = props as ButtonProps & { as?: string; variant?: string; size?: string }
  return <button {...rest} className={className} />
}
