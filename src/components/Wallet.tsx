import { useMemo, useState } from 'react'
import { unlock, accountFromMnemonic } from '../keys'
import { getBalance, sendNativeFromPK } from '../monad'

export default function Wallet() {
  const [pwd, setPwd] = useState('')
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState('0')
  const [busy, setBusy] = useState(false)

  const short = useMemo(() => address ? `${address.slice(0,6)}…${address.slice(-4)}` : '—', [address])

  async function handleUnlock() {
    try {
      setBusy(true)
      const m = await unlock(pwd)
      const acct = accountFromMnemonic(m, 0)
      setAddress(acct.address)
      const bal = await getBalance(acct.address)
      setBalance(bal)
    } catch (e:any) {
      alert(e?.message || 'Unlock failed')
    } finally { setBusy(false) }
  }

  async function handleSend() {
    if (!address) return
    const to = prompt('Recipient address') || ''
    const amt = prompt('Amount (MON)') || ''
    if (!to || !amt) return
    try {
      setBusy(true)
      const m = await unlock(pwd)
      const acct = accountFromMnemonic(m, 0)
      const res = await sendNativeFromPK(acct.privateKey, to, amt)
      alert(`Sent!\nTx: ${res?.hash}`)
      const bal = await getBalance(acct.address)
      setBalance(bal)
    } catch (e:any) {
      alert(e?.message || 'Send failed')
    } finally { setBusy(false) }
  }

  return (
    <div className="content">
      <div className="card" style={{marginBottom:12}}>
        <div className="row" style={{alignItems:'center', justifyContent:'flex-end'}}>
          <button className="btn ghost" onClick={() => window.open('https://monad.xyz', '_blank')}>Docs</button>
        </div>
        <div className="divider" />
        <div className="row stack">
          <label>Password</label>
          <input className="input" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Enter your vault password"/>
          <div className="row" style={{gap:8}}>
            <button className="btn" disabled={!pwd || busy} onClick={handleUnlock}>Unlock</button>
            <button className="btn ghost" disabled={!address} onClick={handleSend}>Send MON</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div style={{opacity:.75, fontSize:12}}>Address</div>
            <div style={{fontSize:18, fontWeight:700}}>{short}</div>
          </div>
          <button className="btn ghost" disabled={!address}
            onClick={() => { navigator.clipboard.writeText(address); }}
          >Copy</button>
        </div>
        <div className="stat" style={{marginTop:10}}>
          <div style={{opacity:.8}}>Balance</div>
          <div />
          <div style={{fontSize:20, fontWeight:800}}>{balance} MON</div>
        </div>
      </div>
    </div>
  )
}

