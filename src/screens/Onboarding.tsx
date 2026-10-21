import { useState } from 'react'
import { BottomBar } from '../components/Chrome'
import { photoUrl } from '../data/exercises'
import { PROGRAMS, TEMPLATES, type ProgramId, type TemplateId } from '../data/plan'
import { Toggle } from '../components/Toggle'
import { addDays, fmtLong, mondayOf, today } from '../lib/dates'
import { actions, type Baseline } from '../lib/store'

type Step = 'welcome' | 'start' | 'baseline'

const num = (v: string) => {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) ? n : undefined
}

export default function Onboarding() {
  const [step, setStep] = useState<Step>('welcome')
  const thisMonday = mondayOf(today())
  const nextMonday = addDays(thisMonday, 7)
  const [start, setStart] = useState(thisMonday)
  const [program, setProgram] = useState<ProgramId>(12)
  const [plan, setPlan] = useState<TemplateId>('original')
  const [extended, setExtended] = useState(false)
  const [b, setB] = useState({ weight: '76.7', waist: '', pushups: '', deadHang: '', pullAssist: '' })

  const finish = () => {
    const baseline: Baseline = {
      date: today(),
      weight: num(b.weight),
      waist: num(b.waist),
      pushups: num(b.pushups),
      deadHang: num(b.deadHang),
      pullAssist: num(b.pullAssist),
    }
    actions.finishSetup(start, baseline, program, plan, plan === 'athletic' && extended)
  }

  if (step === 'welcome') {
    return (
      <div style={{ animation: 'fade .5s ease both' }}>
        <div className="hero" style={{ borderRadius: 0, height: '100dvh' }}>
          <img src={photoUrl('dead-hang')} alt="Athlete hanging from a pull-up bar" style={{ objectPosition: '50% 30%' }} />
          <div className="content" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 28px)', gap: 18 }}>
            <span className="kicker">12-week athletic plan</span>
            <h1 className="disp" style={{ fontSize: 76 }}>Stronger.<br />Leaner.<br />Wider.</h1>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,.85)', lineHeight: 1.45 }}>
              Your gym and calisthenics plan, with form videos, muscle maps and a coach that tells you when to go heavier.
            </p>
            <button type="button" className="btn" style={{ background: '#fff', color: '#000' }} onClick={() => setStep('start')}>Get started</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen no-tabs">
      <div style={{ display: 'flex', gap: 6, padding: '4px 4px 0' }} aria-label={`Step ${step === 'start' ? 1 : 2} of 2`}>
        <span style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--accent)' }} />
        <span style={{ flex: 1, height: 4, borderRadius: 2, background: step === 'baseline' ? 'var(--accent)' : 'var(--fill)', transition: 'background-color .3s ease' }} />
      </div>

      {step === 'start' ? (
        <>
          <div style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 className="large-title">When do you start?</h1>
            <p className="muted">Weeks are counted from this day. Week 7 is the lighter deload week.</p>
          </div>
          <div className="group" role="radiogroup" aria-label="Start date">
            {[
              { value: thisMonday, label: 'This week', sub: fmtLong(thisMonday) },
              { value: nextMonday, label: 'Next week', sub: fmtLong(nextMonday) },
              { value: today(), label: 'Today', sub: fmtLong(today()) },
            ].map((o) => (
              <button key={o.label} type="button" role="radio" aria-checked={start === o.value} className="row" onClick={() => setStart(o.value)}>
                <span className="grow"><span>{o.label}</span><span className="sub">{o.sub}</span></span>
                <Radio on={start === o.value} />
              </button>
            ))}
            <label className="row">
              <span className="grow"><span>Pick a date</span></span>
              <input type="date" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} className="field" style={{ width: 150 }} />
            </label>
          </div>
          <div>
            <h2 className="sec">Which plan?</h2>
            <div className="seg" role="group" aria-label="Weekly plan">
              {(['original', 'athletic', 'mastery'] as TemplateId[]).map((t) => (
                <button key={t} type="button" aria-pressed={plan === t} onClick={() => setPlan(t)}>{TEMPLATES[t].name}</button>
              ))}
            </div>
            {plan === 'athletic' && (
              <div className="group" style={{ marginTop: 12 }}>
                <Toggle label="Extended" sub="Heavier version: more exercises and sets each day" on={extended} onChange={setExtended} />
              </div>
            )}
            <p className="sec-foot">{TEMPLATES[plan].summary}</p>
          </div>
          <div>
            <h2 className="sec">How long?</h2>
            <div className="seg" role="group" aria-label="Program length">
              {([12, 16, 24] as ProgramId[]).map((id) => (
                <button key={id} type="button" aria-pressed={program === id} onClick={() => setProgram(id)}>{PROGRAMS[id].name}</button>
              ))}
            </div>
            <p className="sec-foot">{PROGRAMS[program].summary} You can switch later in Plan.</p>
          </div>
          <BottomBar><button type="button" className="btn" onClick={() => setStep('baseline')}>Continue</button></BottomBar>
        </>
      ) : (
        <>
          <div style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 className="large-title">Your starting point</h1>
            <p className="muted">These are your week-1 numbers. Progress compares against them. Skip anything you don’t know yet.</p>
          </div>
          <div>
            <h2 className="sec">Body</h2>
            <div className="group">
              <Field id="w" label="Weight" unit="kg" value={b.weight} onChange={(v) => setB({ ...b, weight: v })} />
              <Field id="wa" label="Waist at navel" unit="cm" value={b.waist} onChange={(v) => setB({ ...b, waist: v })} />
            </div>
          </div>
          <div>
            <h2 className="sec">Quick tests</h2>
            <div className="group">
              <Field id="pu" label="Max clean push-ups" unit="reps" value={b.pushups} onChange={(v) => setB({ ...b, pushups: v })} numeric />
              <Field id="dh" label="Longest dead hang" unit="sec" value={b.deadHang} onChange={(v) => setB({ ...b, deadHang: v })} numeric />
              <Field id="pa" label="Pull-up assist for 5 clean reps" unit="kg" value={b.pullAssist} onChange={(v) => setB({ ...b, pullAssist: v })} />
            </div>
            <p className="sec-foot">Test when you’re fresh. Stop each test when your form breaks, not at total failure.</p>
          </div>
          <BottomBar>
            <button type="button" className="btn secondary" style={{ width: 'auto' }} onClick={() => setStep('start')}>Back</button>
            <button type="button" className="btn" onClick={finish}>Start my {PROGRAMS[program].name}</button>
          </BottomBar>
        </>
      )}
    </div>
  )
}

function Radio({ on }: { on: boolean }) {
  return (
    <span aria-hidden style={{ width: 22, height: 22, borderRadius: 11, border: on ? '7px solid var(--accent)' : '2px solid var(--chevron)', transition: 'border .2s ease' }} />
  )
}

export function Field({ id, label, unit, value, onChange, numeric, placeholder = '—' }: {
  id: string; label: string; unit?: string; value: string; onChange: (v: string) => void; numeric?: boolean; placeholder?: string
}) {
  return (
    <label className="row" htmlFor={id}>
      <span style={{ flex: 1 }}>{label}</span>
      <input id={id} className="field num" inputMode={numeric ? 'numeric' : 'decimal'} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {unit && <span className="muted" style={{ minWidth: 30 }}>{unit}</span>}
    </label>
  )
}
