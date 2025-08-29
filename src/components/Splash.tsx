import { useEffect, useRef } from 'react'

type Props = { onEnter: () => void }

export default function Splash({ onEnter }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    const onEnded = () => onEnter()
    vid.addEventListener('ended', onEnded)
    const timer = setTimeout(() => { if (!vid.paused) return; onEnter() }, 9000)
    return () => { vid.removeEventListener('ended', onEnded); clearTimeout(timer) }
  }, [onEnter])

  return (
    <div className="splash" onClick={onEnter}>
      <video ref={videoRef} src={chrome.runtime.getURL('Logo no text - small MP4.mp4')} autoPlay playsInline muted />
      <div className="veil" />
    </div>
  )
}

