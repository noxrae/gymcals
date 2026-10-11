import { useRef, useState } from 'react'
import { daysBetween, fmtShort, today } from '../lib/dates'
import { deletePhoto, POSES, savePhoto, usePhotos, type Pose } from '../lib/photos'
import { Sheet } from './Chrome'

const LABEL: Record<Pose, string> = { front: 'Front', side: 'Side', back: 'Back' }

export function ProgressPhotos() {
  const photos = usePhotos()
  const [pose, setPose] = useState<Pose>('front')
  const [viewing, setViewing] = useState<{ id: string; url: string; date: string; pose: Pose } | null>(null)
  const [busy, setBusy] = useState<Pose | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const target = useRef<Pose>('front')
  const date = today()

  if (!photos) return null
  const todays = Object.fromEntries(photos.filter((p) => p.date === date).map((p) => [p.pose, p]))
  const dates = [...new Set(photos.map((p) => p.date))]
  const lastDate = dates.at(-1)
  const due = !lastDate || daysBetween(lastDate, date) >= 28
  const ofPose = photos.filter((p) => p.pose === pose)
  const first = ofPose[0]
  const latest = ofPose.at(-1)

  const pick = (p: Pose) => {
    target.current = p
    input.current?.click()
  }

  return (
    <>
      <div>
        <h2 className="sec">{todays.front || todays.side || todays.back ? 'Today’s photos' : due ? 'Photos due' : `Next photos in ${28 - daysBetween(lastDate!, date)} days`}</h2>
        <div className="group" style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {POSES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => pick(p)}
              aria-label={`${todays[p] ? 'Retake' : 'Add'} ${LABEL[p].toLowerCase()} photo`}
              style={{ aspectRatio: '3 / 4', borderRadius: 12, border: todays[p] ? 0 : '1.5px dashed var(--chevron)', background: 'var(--surface-2)', padding: 0, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, color: 'var(--label-2)' }}
            >
              {todays[p] ? (
                <img src={todays[p].url} alt={`${LABEL[p]} today`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'fade .4s ease both' }} />
              ) : (
                <>
                  <span style={{ fontSize: 28, fontWeight: 300, lineHeight: 1 }}>{busy === p ? '…' : '+'}</span>
                  <span className="small" style={{ fontWeight: 600 }}>{LABEL[p]}</span>
                </>
              )}
            </button>
          ))}
        </div>
        <p className="sec-foot">Every 4 weeks. Same light, same distance, same pose, relaxed. Photos stay on this phone only.</p>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            setBusy(target.current)
            await savePhoto(date, target.current, f)
            setBusy(null)
          }}
        />
      </div>

      {first && latest && first.id !== latest.id && (
        <div>
          <h2 className="sec">Compare</h2>
          <div className="group" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="seg" role="tablist" aria-label="Pose">
              {POSES.map((p) => (
                <button key={p} type="button" role="tab" aria-selected={pose === p} onClick={() => setPose(p)}>{LABEL[p]}</button>
              ))}
            </div>
            <div key={pose} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, animation: 'fade .3s ease both' }}>
              {[first, latest].map((p, i) => (
                <figure key={p.id} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <img src={p.url} alt={`${LABEL[pose]} on ${fmtShort(p.date)}`} style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 12 }} />
                  <figcaption className="small" style={{ display: 'flex', justifyContent: 'space-between' }}><b>{i ? 'Latest' : 'Start'}</b><span className="muted">{fmtShort(p.date)}</span></figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      )}

      {dates.length > 0 && (
        <div>
          <h2 className="sec">All photos</h2>
          <div className="group">
            {[...dates].reverse().map((d) => (
              <div key={d} className="row" style={{ gap: 8 }}>
                <span style={{ width: 70, flex: 'none', fontWeight: 600 }}>{fmtShort(d)}</span>
                {POSES.map((p) => {
                  const ph = photos.find((x) => x.date === d && x.pose === p)
                  return ph ? (
                    <button key={p} type="button" onClick={() => setViewing(ph)} aria-label={`${LABEL[p]} photo from ${fmtShort(d)}`} style={{ padding: 0, border: 0, background: 'none' }}>
                      <img src={ph.url} alt="" style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                    </button>
                  ) : (
                    <span key={p} style={{ width: 48, height: 64, borderRadius: 8, background: 'var(--surface-2)' }} />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {viewing && (
        <Sheet onClose={() => setViewing(null)} label="Progress photo">
          <img src={viewing.url} alt={`${LABEL[viewing.pose]} on ${fmtShort(viewing.date)}`} style={{ width: '100%', borderRadius: 14, maxHeight: '60dvh', objectFit: 'contain', background: '#000' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><b>{LABEL[viewing.pose]}</b> <span className="muted">· {fmtShort(viewing.date)}</span></span>
            <button
              type="button"
              className="link-btn"
              style={{ color: 'var(--danger)' }}
              onClick={async () => {
                if (!window.confirm('Delete this photo?')) return
                await deletePhoto(viewing.id)
                setViewing(null)
              }}
            >
              Delete
            </button>
          </div>
        </Sheet>
      )}
    </>
  )
}
