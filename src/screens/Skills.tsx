import { useState } from 'react'
import { Sheet } from '../components/Chrome'
import { Chevron } from '../components/Icons'
import { ExerciseThumb } from '../components/Media'
import { EXERCISES, photoUrl } from '../data/exercises'
import { fmtNum, history } from '../lib/coach'
import { fmtShort } from '../lib/dates'
import { actions, useStore, type SkillTestId, type State } from '../lib/store'
import { useToday } from '../lib/useToday'

const TRACKS = [
  {
    id: 'push', name: 'Push', ex: 'push-up', test: 'pushups' as SkillTestId, unit: 'reps', testName: 'Max clean push-ups',
    levels: ['6–12 clean push-ups', '15–20 push-ups', 'Decline, diamond + pike push-ups', 'Handstand push-up pathway'],
  },
  {
    id: 'pull', name: 'Pull', ex: 'dead-hang', test: 'deadHang' as SkillTestId, unit: 'sec', testName: 'Longest dead hang',
    levels: ['Dead hang + scapular pull-ups', 'Assisted + negative pull-ups', 'Band-assisted / first pull-up', '3–10 pull-ups'],
  },
  {
    id: 'core', name: 'Core', ex: 'hanging-knee-raise', test: 'lsit' as SkillTestId, unit: 'sec', testName: 'Tuck L-sit hold',
    levels: ['Plank + knee raises', 'Tuck hold + stronger knee raises', 'L-sit progression', 'Full L-sit + leg raises'],
  },
]

function pullAssistNow(state: State) {
  const h = history(state, 'assisted-pull-up')
  const last = h.at(-1)
  return last ? Math.min(...last.sets.map((s) => s.load ?? 0)) : null
}

function levelOf(state: State, id: string) {
  if (id === 'push') {
    const best = Math.max(0, ...state.tests.pushups.map((t) => t.value))
    return best >= 20 ? 3 : best >= 12 ? 2 : 1
  }
  if (id === 'pull') {
    const assist = pullAssistNow(state)
    if (assist == null) return 1
    return assist <= 0 ? 4 : assist <= 10 ? 3 : 2
  }
  const best = Math.max(0, ...state.tests.lsit.map((t) => t.value))
  return best >= 20 ? 3 : best >= 10 ? 2 : 1
}

export default function SkillsScreen() {
  const state = useStore((s) => s)
  const { date } = useToday()
  const [testing, setTesting] = useState<(typeof TRACKS)[number] | null>(null)

  const startAssist = state.baseline?.pullAssist ?? history(state, 'assisted-pull-up')[0]?.sets.reduce((m, s) => Math.max(m, s.load ?? 0), 0)
  const nowAssist = pullAssistNow(state)
  const pct = startAssist && nowAssist != null ? Math.min(100, Math.max(0, Math.round(((startAssist - nowAssist) / startAssist) * 100))) : 0

  return (
    <div className="screen">
      <h1 className="large-title" style={{ padding: '8px 4px 0' }}>Skills</h1>

      <div className="hero" style={{ height: 'min(90vw, 360px)' }}>
        <img src={photoUrl('negative-pull-up')} alt="Athlete pulling up to the bar" />
        <div className="content">
          <span className="kicker">Next milestone</span>
          <span className="disp" style={{ fontSize: 'clamp(46px, 14vw, 56px)' }}>First clean<br />pull-up</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.25)' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: 'var(--accent)', transition: 'width .6s var(--ease)' }} />
            </div>
            <span className="num" style={{ fontWeight: 700 }}>{pct}%</span>
          </div>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,.85)' }}>
            {nowAssist == null ? 'Log your first assisted pull-up session to start tracking.' : nowAssist <= 0 ? 'You’re doing pull-ups without assistance. Huge.' : `Assistance ${startAssist ? `down from ${fmtNum(startAssist)} kg ` : ''}to ${fmtNum(nowAssist)} kg`}
          </span>
        </div>
      </div>

      <div>
        <h2 className="sec">Foundations</h2>
        <div className="group">
          {TRACKS.map((t) => {
            const level = levelOf(state, t.id)
            const last = state.tests[t.test].at(-1)
            return (
              <button key={t.id} type="button" className="row" onClick={() => setTesting(t)} style={{ ['--inset' as string]: '90px', minHeight: 96, alignItems: 'center' }}>
                <ExerciseThumb ex={EXERCISES[t.ex]} size={60} />
                <span className="grow" style={{ gap: 5 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>{t.name}</span>
                    <span className="small muted">Level {level} of 4</span>
                  </span>
                  <span className="sub">{t.levels[level - 1]}</span>
                  <span style={{ display: 'flex', gap: 4 }} aria-hidden>
                    {[1, 2, 3, 4].map((n) => <span key={n} style={{ width: 24, height: 4, borderRadius: 2, background: n <= level ? 'var(--label)' : 'var(--fill)' }} />)}
                  </span>
                  <span className="small muted">{last ? `${t.testName}: ${last.value} ${t.unit} · ${fmtShort(last.date)}` : `Tap to log your ${t.testName.toLowerCase()}`}</span>
                </span>
                <Chevron />
              </button>
            )
          })}
        </div>
        <p className="sec-foot">Muscle-ups, levers and handstand push-ups stay locked until the foundations are solid. Re-test every 4 weeks.</p>
      </div>

      {testing && (
        <TestSheet
          track={testing}
          onClose={() => setTesting(null)}
          onSave={(v) => {
            actions.addTest(testing.test, date, v)
            setTesting(null)
          }}
        />
      )}
    </div>
  )
}

function TestSheet({ track, onClose, onSave }: { track: (typeof TRACKS)[number]; onClose: () => void; onSave: (v: number) => void }) {
  const [value, setValue] = useState('')
  const n = parseInt(value, 10)
  return (
    <Sheet onClose={onClose} label={track.testName}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 4px 0' }}>
        <span className="kicker" style={{ color: 'var(--accent-ink)' }}>{track.name} test</span>
        <h2 className="disp" style={{ fontSize: 46 }}>{track.testName}</h2>
        <p className="muted" style={{ fontSize: 15, lineHeight: 1.45 }}>Test when you’re fresh. Count only clean reps and stop when your form breaks.</p>
      </div>
      <div className="group">
        <label className="row">
          <span style={{ flex: 1 }}>Result</span>
          <input autoFocus className="field num" inputMode="numeric" placeholder="0" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} />
          <span className="muted">{track.unit}</span>
        </label>
      </div>
      <div>
        <h3 className="sec">Levels</h3>
        <div className="group">
          {track.levels.map((l, i) => (
            <div key={l} className="row"><span className="disp" style={{ fontSize: 24, width: 28, color: 'var(--accent)' }}>{i + 1}</span><span style={{ fontSize: 15 }}>{l}</span></div>
          ))}
        </div>
      </div>
      <button type="button" className="btn" disabled={!Number.isFinite(n)} onClick={() => onSave(n)}>Save Result</button>
    </Sheet>
  )
}
