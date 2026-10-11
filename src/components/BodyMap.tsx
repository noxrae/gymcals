import { MUSCLES, muscleOverlay, type MuscleId, type View } from '../data/muscles'

export interface MapMuscle { id: MuscleId; primary: boolean; n: number }

/** Numbers each muscle in display order: primaries first, then secondaries. */
export function numberMuscles(primary: MuscleId[], secondary: MuscleId[]): MapMuscle[] {
  const seen = new Set<MuscleId>()
  const out: MapMuscle[] = []
  for (const [list, isPrimary] of [[primary, true], [secondary, false]] as const) {
    for (const id of list) {
      if (seen.has(id)) continue
      seen.add(id)
      out.push({ id, primary: isPrimary, n: out.length + 1 })
    }
  }
  return out
}

/** Anatomical front + back map (wger.de, CC BY-SA) with highlighted muscles and numbered markers. */
export function BodyMap({ muscles, focus, compact }: { muscles: MapMuscle[]; focus?: MuscleId | null; compact?: boolean }) {
  const views: View[] = ['front', 'back']
  // Nudge markers that would sit on top of each other (e.g. front and side delts).
  const placed: Record<string, { x: number; y: number }> = {}
  const spots: { view: View; x: number; y: number }[] = []
  for (const m of muscles) {
    const mk = MUSCLES[m.id].marker
    if (!mk) continue
    let { x, y } = mk
    while (spots.some((s) => s.view === mk.view && Math.abs(s.x - x) < 9 && Math.abs(s.y - y) < 8)) y += 9
    spots.push({ view: mk.view, x, y })
    placed[m.id] = { x, y }
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: compact ? 4 : 12 }}>
      {views.map((view) => (
        <figure key={view} style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div className="body-figure" role="img" aria-label={`${view} view: ${muscles.filter((m) => MUSCLES[m.id].views.includes(view)).map((m) => MUSCLES[m.id].name).join(', ') || 'no highlighted muscles'}`}>
            <img className="base" src={`muscles/body-${view}.svg`} alt="" />
            {muscles.flatMap((m) =>
              MUSCLES[m.id].views.includes(view)
                ? MUSCLES[m.id].wger.map((w) => (
                    <img key={`${m.id}-${w}`} src={muscleOverlay(w, m.primary)} alt="" style={{ opacity: !focus || focus === m.id ? 1 : 0.12 }} />
                  ))
                : [],
            )}
            {!compact &&
              muscles.map((m) => {
                const mk = MUSCLES[m.id].marker
                if (!mk || mk.view !== view) return null
                const active = focus === m.id
                const dim = focus && !active
                return (
                  <span
                    key={m.id}
                    className="marker"
                    style={{
                      left: `${placed[m.id].x}%`,
                      top: `${placed[m.id].y}%`,
                      background: active ? 'var(--label)' : dim ? 'var(--label-3)' : m.primary ? 'var(--muscle-1)' : 'var(--muscle-2)',
                      color: active ? 'var(--bg)' : '#fff',
                      transform: active ? 'scale(1.15)' : undefined,
                    }}
                  >
                    {m.n}
                  </span>
                )
              })}
          </div>
          {!compact && <figcaption style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-2)', letterSpacing: '.08em' }}>{view.toUpperCase()}</figcaption>}
        </figure>
      ))}
    </div>
  )
}

export function MapLegend() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 22, fontSize: 13, color: 'var(--label-2)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 12, height: 12, borderRadius: 6, background: 'var(--muscle-1)' }} />Primary</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 12, height: 12, borderRadius: 6, background: 'var(--muscle-2)' }} />Secondary</span>
    </div>
  )
}
