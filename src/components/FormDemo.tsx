import { useEffect, useRef, useState } from 'react'
import { FAST, FIGURE_DEMO, HOLDS, photoUrl, type Exercise } from '../data/exercises'
import { IconPlay } from './Icons'

// Short looping form demo shown on every exercise page (works offline, no video needed):
//   photos  — start and finish photos blend at real rep tempo (move ~1 s, squeeze, return ~2 s)
//   hold    — a held position with a breathing pulse
//   figure  — an animated figure for exercises with no free photos

interface Phase { secs: number; caption: string; from: 0 | 1; to: 0 | 1 }

const REP: Phase[] = [
  { secs: 0.9, caption: 'Start position', from: 0, to: 0 },
  { secs: 1.1, caption: 'Move with control · ~1 s', from: 0, to: 1 },
  { secs: 0.7, caption: 'Squeeze', from: 1, to: 1 },
  { secs: 2.0, caption: 'Return slowly · ~2 s', from: 1, to: 0 },
]
const FAST_REP: Phase[] = [
  { secs: 0.35, caption: 'Drive one knee in', from: 0, to: 1 },
  { secs: 0.35, caption: 'Switch legs · steady rhythm', from: 1, to: 0 },
]
const HOLD: Phase[] = [
  { secs: 2.2, caption: 'Hold · breathe in', from: 0, to: 0 },
  { secs: 2.2, caption: 'Hold · breathe out, stay tight', from: 0, to: 0 },
]

// ---------- animated figure poses (side view, facing left; floor at y = 136) ----------
type P = [number, number]
interface Pose { head: P; shoulder: P; back: P; elbow: P; wrist: P; hip: P; knee: P; ankle: P; toe: P }
interface Figure { a: Pose; b: Pose; phases: Phase[]; accent: ('arms' | 'torso' | 'upper')[]; props?: 'parallettes' | 'box' }

const FIGURES: Record<string, Figure> = {
  'elevated-pike-push-up': {
    a: { head: [74, 100], shoulder: [86, 94], back: [104, 70], elbow: [78, 115], wrist: [70, 136], hip: [118, 48], knee: [146, 64], ankle: [172, 84], toe: [181, 88] },
    b: { head: [62, 124], shoulder: [80, 112], back: [100, 86], elbow: [98, 121], wrist: [70, 136], hip: [116, 62], knee: [146, 72], ankle: [172, 84], toe: [181, 88] },
    phases: [
      { secs: 0.8, caption: 'Feet on the box · hips stacked high', from: 0, to: 0 },
      { secs: 2.0, caption: 'Lower your head in front of your hands · ~2 s', from: 0, to: 1 },
      { secs: 0.5, caption: 'Elbows at ~45°', from: 1, to: 1 },
      { secs: 1.1, caption: 'Press back up', from: 1, to: 0 },
    ],
    accent: ['arms', 'upper'],
    props: 'box',
  },
  'advanced-tuck-l-sit': {
    a: { head: [100, 60], shoulder: [101, 76], back: [103, 98], elbow: [94, 95], wrist: [92, 114], hip: [106, 120], knee: [80, 104], ankle: [90, 122], toe: [82, 124] },
    b: { head: [101, 60], shoulder: [102, 76], back: [104, 98], elbow: [94, 95], wrist: [92, 114], hip: [108, 118], knee: [80, 112], ankle: [74, 130], toe: [66, 128] },
    phases: [
      { secs: 0.9, caption: 'Start in a tuck L-sit', from: 0, to: 0 },
      { secs: 1.0, caption: 'Open the tuck · thighs level, knees away', from: 0, to: 1 },
      { secs: 2.6, caption: 'Hold · shoulders down, hips lifted', from: 1, to: 1 },
      { secs: 1.0, caption: 'Back to the tuck', from: 1, to: 0 },
    ],
    accent: ['torso'],
    props: 'parallettes',
  },
  'pike-push-up': {
    a: { head: [74, 98], shoulder: [88, 92], back: [110, 70], elbow: [79, 114], wrist: [70, 136], hip: [132, 48], knee: [156, 90], ankle: [178, 132], toe: [189, 136] },
    b: { head: [62, 122], shoulder: [82, 110], back: [106, 84], elbow: [100, 120], wrist: [70, 136], hip: [128, 62], knee: [154, 98], ankle: [178, 132], toe: [189, 136] },
    phases: [
      { secs: 0.8, caption: 'Hips high · arms straight', from: 0, to: 0 },
      { secs: 2.0, caption: 'Lower head toward the floor · ~2 s', from: 0, to: 1 },
      { secs: 0.5, caption: 'Head near floor · elbows at ~45°', from: 1, to: 1 },
      { secs: 1.1, caption: 'Press back up', from: 1, to: 0 },
    ],
    accent: ['arms', 'upper'],
  },
  'scapular-push-up': {
    a: { head: [56, 98], shoulder: [70, 100], back: [108, 110], elbow: [70, 118], wrist: [70, 136], hip: [146, 110], knee: [180, 117], ankle: [212, 127], toe: [221, 136] },
    b: { head: [56, 92], shoulder: [70, 94], back: [108, 92], elbow: [70, 115], wrist: [70, 136], hip: [146, 108], knee: [180, 116], ankle: [212, 127], toe: [221, 136] },
    phases: [
      { secs: 0.8, caption: 'Arms locked · chest sinks, blades together', from: 0, to: 0 },
      { secs: 1.1, caption: 'Push the floor away', from: 0, to: 1 },
      { secs: 0.6, caption: 'Upper back rounds · elbows stay straight', from: 1, to: 1 },
      { secs: 1.6, caption: 'Sink slowly', from: 1, to: 0 },
    ],
    accent: ['upper'],
  },
  'tuck-l-sit': {
    a: { head: [101, 72], shoulder: [102, 88], back: [104, 110], elbow: [94, 101], wrist: [92, 114], hip: [108, 131], knee: [80, 127], ankle: [54, 131], toe: [46, 136] },
    b: { head: [100, 60], shoulder: [101, 76], back: [103, 98], elbow: [94, 95], wrist: [92, 114], hip: [106, 120], knee: [80, 104], ankle: [90, 122], toe: [82, 124] },
    phases: [
      { secs: 0.8, caption: 'Hands on parallettes · arms straight', from: 0, to: 0 },
      { secs: 0.9, caption: 'Press down · lift hips, tuck knees', from: 0, to: 1 },
      { secs: 2.6, caption: 'Hold · shoulders down, chest up', from: 1, to: 1 },
      { secs: 1.0, caption: 'Lower with control', from: 1, to: 0 },
    ],
    accent: ['torso'],
    props: 'parallettes',
  },
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/** Runs a phase timeline; returns the current phase and the 0→1 blend between start and finish. */
function useTimeline(phases: Phase[], playing: boolean) {
  const total = phases.reduce((n, p) => n + p.secs, 0)
  const [t, setT] = useState(0)
  const last = useRef<number | null>(null)
  useEffect(() => {
    if (!playing) {
      last.current = null
      return
    }
    let raf = 0
    const tick = (now: number) => {
      if (last.current != null) setT((x) => (x + (now - last.current!) / 1000) % total)
      last.current = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, total])
  let acc = 0
  for (const [i, p] of phases.entries()) {
    if (t < acc + p.secs || i === phases.length - 1) {
      const local = Math.min(1, (t - acc) / p.secs)
      return { index: i, phase: p, mix: p.from + (p.to - p.from) * ease(local), progress: t / total }
    }
    acc += p.secs
  }
  return { index: 0, phase: phases[0], mix: 0, progress: 0 }
}

export function hasDemo(ex: Exercise) {
  return FIGURE_DEMO.has(ex.key) || ex.photos > 0
}

export function FormDemo({ ex }: { ex: Exercise }) {
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [playing, setPlaying] = useState(!reduced)
  const figure = FIGURES[ex.key]
  const hold = !figure && (HOLDS.has(ex.key) || ex.photos < 2)
  const phases = figure ? figure.phases : hold ? HOLD : FAST.has(ex.key) ? FAST_REP : REP
  const { index, phase, mix, progress } = useTimeline(phases, playing)
  const breathe = hold ? 1 + 0.015 * Math.sin(progress * Math.PI * 2) : 1

  return (
    <figure aria-label={`${ex.name} form demo`} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ position: 'relative', aspectRatio: figure ? '16 / 10' : '4 / 3', borderRadius: 16, overflow: 'hidden', background: figure ? 'var(--surface-2)' : '#111' }}>
        {figure ? (
          <FigureSvg figure={figure} mix={mix} />
        ) : (
          <>
            <img src={photoUrl(ex.key, 0)} alt={`${ex.name}: start position`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 25%', transform: `scale(${breathe})`, transition: 'transform .2s linear' }} />
            {!hold && <img src={photoUrl(ex.key, 1)} alt={`${ex.name}: finish position`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 25%', opacity: mix }} />}
          </>
        )}
        {!figure && !hold && (
          <span style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 999, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '.04em' }}>
            {mix < 0.5 ? 'START' : 'FINISH'}
          </span>
        )}
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? 'Pause form demo' : 'Play form demo'}
          style={{ position: 'absolute', top: 8, right: 8, width: 40, height: 40, borderRadius: 20, border: 0, background: 'rgba(0,0,0,.5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><rect x="2" y="1" width="3.5" height="12" rx="1" fill="currentColor" /><rect x="8.5" y="1" width="3.5" height="12" rx="1" fill="currentColor" /></svg>
          ) : (
            <IconPlay size={14} />
          )}
        </button>
        {!figure && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '28px 12px 10px', background: 'linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,0))', color: '#fff' }}>
            <Caption index={index} text={phase.caption} progress={progress} dark />
          </div>
        )}
      </div>
      {figure && <Caption index={index} text={phase.caption} progress={progress} />}
      <figcaption className="small muted">
        {figure ? 'Animated demo of the correct positions.' : hold ? 'Hold this position with good form.' : 'Start ↔ finish at the right speed: lift with control, return slowly.'} Watch the full video above for coaching.
      </figcaption>
    </figure>
  )
}

function Caption({ index, text, progress, dark }: { index: number; text: string; progress: number; dark?: boolean }) {
  return (
    <div>
      <div key={index} style={{ fontSize: 15, fontWeight: 600, animation: 'fade .25s ease both' }}>{text}</div>
      <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: dark ? 'rgba(255,255,255,.25)' : 'var(--fill)' }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 2, background: 'var(--accent)' }} />
      </div>
    </div>
  )
}

function FigureSvg({ figure, mix }: { figure: Figure; mix: number }) {
  const lerp = (k: keyof Pose): P => [figure.a[k][0] + (figure.b[k][0] - figure.a[k][0]) * mix, figure.a[k][1] + (figure.b[k][1] - figure.a[k][1]) * mix]
  const j = Object.fromEntries((Object.keys(figure.a) as (keyof Pose)[]).map((k) => [k, lerp(k)])) as unknown as Pose
  const ink = 'var(--label)'
  const hot = 'var(--accent)'
  const arms = figure.accent.includes('arms') ? hot : ink
  const torso = figure.accent.includes('torso') ? hot : ink
  const line = (a: P, b: P, w: number, c: string) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />
  return (
    <svg viewBox="20 30 220 115" width="100%" height="100%" role="img" aria-label="Animated figure showing the movement" style={{ position: 'absolute', inset: 0 }}>
      <line x1="10" y1="137" x2="230" y2="137" stroke="var(--sep)" strokeWidth="2" />
      {figure.props === 'box' && <rect x="164" y="88" width="40" height="48" rx="4" fill="var(--fill)" stroke="var(--label-3)" strokeWidth="2" opacity="0.8" />}
      {figure.props === 'parallettes' && (
        <g stroke="var(--label-3)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.45">
          <line x1="76" y1="136" x2="82" y2="115" />
          <line x1="108" y1="136" x2="102" y2="115" />
          <line x1="80" y1="114" x2="104" y2="114" />
        </g>
      )}
      <g opacity="0.92">
        {line(j.hip, j.knee, 11, ink)}
        {line(j.knee, j.ankle, 9, ink)}
        {line(j.ankle, j.toe, 6, ink)}
        <path d={`M ${j.shoulder[0]} ${j.shoulder[1]} Q ${j.back[0]} ${j.back[1]} ${j.hip[0]} ${j.hip[1]}`} stroke={torso} strokeWidth="13" strokeLinecap="round" fill="none" />
        {figure.accent.includes('upper') && <path d={`M ${j.shoulder[0]} ${j.shoulder[1]} Q ${(j.shoulder[0] + j.back[0]) / 2} ${(j.shoulder[1] + j.back[1]) / 2 - 1} ${j.back[0]} ${j.back[1]}`} stroke={hot} strokeWidth="13" strokeLinecap="round" fill="none" />}
        {line(j.shoulder, j.elbow, 9, arms)}
        {line(j.elbow, j.wrist, 8, arms)}
        <circle cx={j.head[0]} cy={j.head[1]} r="9" fill={ink} />
      </g>
    </svg>
  )
}
