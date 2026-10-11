import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

const base = (size = 24, p: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
})

export const IconHome = ({ size, filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size, p)} fill={filled ? 'currentColor' : 'none'}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>
)
export const IconCalendar = ({ size, filled, ...p }: P & { filled?: boolean }) =>
  filled ? (
    <svg {...base(size, p)} stroke="none" fill="currentColor"><path d="M6 3a1 1 0 0 1 2 0v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1zM4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9z" /></svg>
  ) : (
    <svg {...base(size, p)}><rect x="3" y="5" width="18" height="16" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /></svg>
  )
export const IconTrend = ({ size, filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size, p)} strokeWidth={filled ? 2.6 : 1.8}><polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" /></svg>
)
export const IconBolt = ({ size, filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size, p)} fill={filled ? 'currentColor' : 'none'}><polygon points="13 2 4 14 12 14 11 22 20 10 12 10 13 2" /></svg>
)
export const IconPlusCircle = ({ size, filled, ...p }: P & { filled?: boolean }) =>
  filled ? (
    <svg {...base(size, p)} stroke="none" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v4h4v2h-4v4h-2v-4H7v-2h4V7z" /></svg>
  ) : (
    <svg {...base(size, p)}><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
  )
export const IconChevronLeft = ({ size = 20, ...p }: P) => (
  <svg width={size * 0.6} height={size} viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}><polyline points="10 2 2 10 10 18" /></svg>
)
export const Chevron = () => (
  <svg className="chev" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="1 1 7 7 1 13" /></svg>
)
export const IconPlay = ({ size = 18, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
)
export const IconInfo = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="12" cy="12" r="9.5" /><line x1="12" y1="11" x2="12" y2="16.5" /><circle cx="12" cy="7.8" r=".7" fill="currentColor" /></svg>
)
export const IconCheck = ({ size = 16, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}><polyline points="5 12 10 17 19 7" /></svg>
)
export const IconCheckCircle = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="11" fill="var(--good-fill)" /><polyline points="7 12 10.5 15.5 17 9" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const IconMoon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>
)
export const IconGear = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
)
export const IconSpark = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}><polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" /></svg>
)
export const IconAlert = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
)
export const IconTimer = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="12" cy="13" r="8" /><polyline points="12 9 12 13 15 15" /><line x1="9" y1="2" x2="15" y2="2" /></svg>
)
export const IconExternal = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}><path d="M14 3h7v7" /><path d="M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></svg>
)
