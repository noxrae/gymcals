import { fmtNum } from '../lib/coach'
import type { WeekReview } from '../lib/review'

export function WeekReviewCard({ week, review }: { week: number; review: WeekReview }) {
  const w = review.weightChange
  const stats = [
    { label: 'Sessions', value: `${review.sessions}/${review.planned}` },
    { label: 'Sets done', value: `${review.sets}` },
    { label: 'Weight', value: w == null ? '—' : `${w > 0 ? '+' : w < 0 ? '−' : ''}${fmtNum(Math.abs(Math.round(w * 10) / 10))} kg` },
    { label: 'Avg protein', value: review.protein == null ? '—' : `${Math.round(review.protein)} g` },
  ]
  return (
    <section aria-label={`Week ${week} in review`} style={{ borderRadius: 20, background: '#000', color: '#fff', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 18, animation: 'enter .45s var(--ease) both' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="kicker">Sunday recap</span>
        <h2 className="disp" style={{ fontSize: 54 }}>Week {String(week).padStart(2, '0')}<br />in review</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#2c2c2e', borderRadius: 14, overflow: 'hidden' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: '#111', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="num" style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</span>
            <span style={{ fontSize: 13, color: '#a1a1a6' }}>{s.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15, lineHeight: 1.45, color: '#d1d1d6' }}>
        {review.records.length > 0 && <span><b style={{ color: '#fff' }}>New bests:</b> {review.records.join(', ')}</span>}
        {review.sleep != null && <span><b style={{ color: '#fff' }}>Sleep:</b> {fmtNum(Math.round(review.sleep * 10) / 10)} h a night{review.sleep < 7 ? '. Aim for 7–9.' : '. Nice.'}</span>}
        {review.waist != null && <span><b style={{ color: '#fff' }}>Waist:</b> {fmtNum(review.waist)} cm</span>}
        <span><b style={{ color: '#fff' }}>Next week:</b> {review.nextFocus}</span>
      </div>
    </section>
  )
}
