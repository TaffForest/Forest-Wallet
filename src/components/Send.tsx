import { useEffect, useState } from 'react'
import { unlock, accountFromMnemonic } from '../keys'
import { sendNativeFromPK } from '../monad'
import { getRuntimePassword, updateActivity, updateActivityOnUse } from '../session'
import { listContacts, saveContact, removeContact, type Contact } from '../db'
import TransactionSuccess from './TransactionSuccess'

type Props = { 
  onBack: () => void;
  selectedWalletIndex?: number;
}

export default function Send({ onBack, selectedWalletIndex = 0 }: Props) {
  const [to, setTo] = useState('')
  const [amt, setAmt] = useState('')
  const [busy, setBusy] = useState(false)
  const [book, setBook] = useState<Contact[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [successAmount, setSuccessAmount] = useState('')
  const [successRecipient, setSuccessRecipient] = useState('')

  useEffect(()=>{ listContacts().then(setBook) },[])

  const handleActivity = () => {
    updateActivity();
  };

  async function doSend() {
    try {
      setBusy(true)
      const pwd = getRuntimePassword(); if(!pwd) throw new Error('Session locked')
      const m = await unlock(pwd); updateActivityOnUse(); const acct = accountFromMnemonic(m, selectedWalletIndex)
      const res = await sendNativeFromPK(acct.privateKey, to.trim(), amt.trim())
      
      // Show success notification instead of alert
      setTxHash(res?.hash || '')
      setSuccessAmount(amt.trim())
      setSuccessRecipient(to.trim())
      setShowSuccess(true)
      
      // Clear form
      setTo('')
      setAmt('')
    } catch(e:any) { 
      alert(e?.message || 'Send failed') 
    } finally { 
      setBusy(false) 
    }
  }

  async function addToBook() {
    const name = prompt('Name for this address?')?.trim(); if(!name) return
    const id = crypto.randomUUID(); const c = { id, name, address: to.trim() }
    await saveContact(c); setBook(await listContacts())
  }

  return (
    <div className="content">
      <div className="card">
        <h3 style={{marginTop:0}}>Send MON</h3>
        <input className="input" placeholder="Recipient address" value={to} onChange={e=>setTo(e.target.value)} />
        <div className="row" style={{marginTop:6}}>
          <input className="input" placeholder="Amount (MON)" value={amt} onChange={e=>setAmt(e.target.value)} />
        </div>
        <div className="row" style={{marginTop:8, gap:8}}>
          <button className="btn" disabled={!to||!amt||busy} onClick={doSend}>Send</button>
          <button className="btn ghost" onClick={() => { handleActivity(); onBack(); }}>Back</button>
          <button className="btn ghost" disabled={!to} onClick={addToBook}>Save to Address Book</button>
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h4 style={{margin:0}}>Address Book</h4>
          <small style={{opacity:.75}}>{book.length} saved</small>
        </div>
        <div className="divider"/>
        {book.length===0 ? <div style={{opacity:.7}}>No saved addresses yet.</div> : (
          <div className="row stack">
            {book.map(c => (
              <div key={c.id} className="stat" style={{gridTemplateColumns:'1fr auto auto', gap:8}}>
                <div>
                  <div style={{fontWeight:700}}>{c.name}</div>
                  <small style={{opacity:.8}}>{c.address.slice(0,10)}…{c.address.slice(-6)}</small>
                </div>
                <button className="btn ghost" onClick={()=>setTo(c.address)}>Use</button>
                <button className="btn ghost" onClick={async()=>{ await removeContact(c.id); setBook(await listContacts()) }}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Success Modal */}
      {showSuccess && (
        <TransactionSuccess
          txHash={txHash}
          amount={successAmount}
          recipient={successRecipient}
          onClose={() => {
            setShowSuccess(false)
            onBack()
          }}
        />
      )}
    </div>
  )
}

