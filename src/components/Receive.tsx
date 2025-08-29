import { useEffect, useRef, useState } from 'react'
import { unlock, accountFromMnemonic } from '../keys'
import { getRuntimePassword, updateActivity } from '../session'
import QRCode from 'qrcode'

type Props = { onBack: () => void }

export default function Receive({ onBack }: Props) {
  const [address, setAddress] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleActivity = () => {
    updateActivity();
  };

  useEffect(()=>{
    (async()=>{
      const pwd = getRuntimePassword(); if(!pwd) return
      const m = await unlock(pwd); const acct = accountFromMnemonic(m,0)
      setAddress(acct.address)
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, acct.address, { errorCorrectionLevel: 'M', margin: 1, scale: 5 })
      }
    })()
  },[])

  return (
    <div className="content">
      <div className="card" style={{textAlign:'center'}}>
        <h3 style={{marginTop:0}}>Receive MON</h3>
        <canvas ref={canvasRef} style={{background:'#fff', borderRadius:12, padding:6}} />
        <div style={{marginTop:10, fontWeight:700}}>{address ? `${address.slice(0,10)}…${address.slice(-8)}` : '—'}</div>
        <div className="row" style={{marginTop:8, justifyContent:'center', gap:8}}>
          <button className="btn" disabled={!address} onClick={()=>navigator.clipboard.writeText(address)}>Copy Address</button>
          <button className="btn ghost" onClick={() => { handleActivity(); onBack(); }}>Back</button>
        </div>
      </div>
    </div>
  )
}

