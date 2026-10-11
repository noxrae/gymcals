import { useState } from 'react'
import { fmtNum } from '../lib/coach'

export interface Point { x: number; y: number }

/** Single-series line over plan weeks 0–12, with an optional target band and tap/hover tooltip. */
export function LineChart({ points, unit, band, xMax = 12, label }: {
  points: Point[]
  unit: string
  band?: { from: Point; to: [number, number] }
  xMax?: number
  label: string
}) {
  const [active, setActive] = useState<number | null>(null)
  const W = 340
  const H = 180
  const L = 30
  const R = 10
  const T = 14
  const B = 26

  const ys = [...points.map((p) => p.y), ...(band ? [band.from.y, ...band.to] : [])]
  let lo = Math.floor(Math.min(...ys) - 0.5)
  let hi = Math.ceil(Math.max(...ys) + 0.5)
  if (hi - lo < 2) { lo -= 1; hi += 1 }
  const sx = (x: number) => L + (x / xMax) * (W - L - R)
  const sy = (y: number) => T + ((hi - y) / (hi - lo)) * (H - T - B)
  const ticks = [lo, (lo + hi) / 2, hi].map((v) => Math.round(v * 2) / 2)
  const sel = active != null ? points[active] : points[points.length - 1]

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} onMouseLeave={() => setActive(null)} style={{ display: 'block', overflow: 'visible' }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke="var(--sep)" />
            <text x={L - 8} y={sy(t) + 4} textAnchor="end" fontSize="11" fill="var(--label-2)">{fmtNum(t)}</text>
          </g>
        ))}
        {[0, 6, 12].filter((w) => w <= xMax).map((w) => (
          <text key={w} x={sx(w)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--label-2)">W{w}</text>
        ))}
        {band && (
          <polygon
            points={`${sx(band.from.x)},${sy(band.from.y)} ${sx(xMax)},${sy(band.to[0])} ${sx(xMax)},${sy(band.to[1])}`}
            fill="var(--accent)"
            fillOpacity={0.1}
          />
        )}
        {points.length > 1 && (
          <polyline
            points={points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')}
            fill="none"
            stroke="var(--label)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {active != null && <line x1={sx(sel.x)} x2={sx(sel.x)} y1={T} y2={H - B} stroke="var(--label-3)" strokeDasharray="3 3" />}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r={i === points.length - 1 || i === active ? 5.5 : 3.5} fill={i === points.length - 1 ? 'var(--accent)' : 'var(--label)'} stroke="var(--surface)" strokeWidth={2} />
            <circle cx={sx(p.x)} cy={sy(p.y)} r={16} fill="transparent" onMouseEnter={() => setActive(i)} onClick={() => setActive(i)} style={{ cursor: 'pointer' }} />
          </g>
        ))}
      </svg>
      {sel && (
        <div className="small" style={{ position: 'absolute', top: 0, right: 10, padding: '4px 10px', borderRadius: 8, background: 'var(--surface-2)', fontWeight: 600 }}>
          Week {sel.x}: {fmtNum(Math.round(sel.y * 10) / 10)} {unit}
        </div>
      )}
    </div>
  )
}
