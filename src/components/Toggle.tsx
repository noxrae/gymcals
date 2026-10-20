/** iOS-style on/off row. `sub` adds a second line under the label. */
export function Toggle({ label, sub, on, onChange }: { label: string; sub?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className="row" role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      {sub ? <span className="grow"><span>{label}</span><span className="sub">{sub}</span></span> : <span style={{ flex: 1 }}>{label}</span>}
      <span aria-hidden style={{ width: 51, height: 31, borderRadius: 16, background: on ? 'var(--good-fill)' : 'var(--fill)', position: 'relative', transition: 'background-color .25s ease' }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 27, height: 27, borderRadius: 14, background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,.2)', transition: 'left .25s var(--ease)' }} />
      </span>
    </button>
  )
}
