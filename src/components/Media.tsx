import { useState } from 'react'
import { photoUrl, type Exercise } from '../data/exercises'
import { IconExternal, IconPlay } from './Icons'

/** Poster first; the YouTube player (privacy-enhanced, free embed) loads only when tapped. */
export function VideoPlayer({ ex, height = 300 }: { ex: Exercise; height?: number }) {
  const [playing, setPlaying] = useState(false)
  const poster = ex.photos ? photoUrl(ex.key, ex.photos > 1 ? 1 : 0) : ex.video ? `https://i.ytimg.com/vi/${ex.video.id}/hqdefault.jpg` : ''
  const online = typeof navigator === 'undefined' || navigator.onLine

  return (
    <div className="media" style={{ height }}>
      {playing && ex.video ? (
        <iframe
          title={`${ex.name} form video`}
          src={`https://www.youtube-nocookie.com/embed/${ex.video.id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 0, display: 'block', animation: 'fade .4s ease both' }}
        />
      ) : (
        <>
          {poster && <img src={poster} alt={`${ex.name} demonstration`} style={{ objectPosition: '50% 20%' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.28)' }} />
          {ex.video && (
            <button
              type="button"
              aria-label={`Play ${ex.name} form video`}
              onClick={() => setPlaying(true)}
              disabled={!online}
              style={{
                position: 'absolute', left: '50%', top: '50%', width: 72, height: 72, marginLeft: -36, marginTop: -36,
                borderRadius: 36, border: 0, background: 'rgba(255,255,255,.94)', color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,.3)',
              }}
            >
              <IconPlay size={28} style={{ marginLeft: 3 }} />
            </button>
          )}
          {!online && ex.video && (
            <span style={{ position: 'absolute', left: 0, right: 0, bottom: 16, textAlign: 'center', color: '#fff', fontSize: 13, fontWeight: 600 }}>
              Connect to the internet to watch the video
            </span>
          )}
        </>
      )}
    </div>
  )
}

export function VideoCredit({ ex }: { ex: Exercise }) {
  if (!ex.video) return null
  return (
    <a
      href={`https://www.youtube.com/watch?v=${ex.video.id}`}
      target="_blank"
      rel="noreferrer"
      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--label-2)', minHeight: 32 }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Video: {ex.video.channel} · Open in YouTube</span>
      <IconExternal size={14} />
    </a>
  )
}

export function ExerciseThumb({ ex, size = 56, radius = 10 }: { ex: Exercise; size?: number; radius?: number }) {
  if (!ex.photos) {
    return (
      <span className="thumb" style={{ width: size, height: size, borderRadius: radius, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-2)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>
      </span>
    )
  }
  return <img className="thumb" src={photoUrl(ex.key)} alt="" loading="lazy" style={{ width: size, height: size, borderRadius: radius, objectPosition: '50% 25%' }} />
}
