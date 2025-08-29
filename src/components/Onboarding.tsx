import { useState, useEffect } from 'react'
import { createWallet, importExisting } from '../keys'
import { setRuntimePassword } from '../session'
import { get as idbGet } from 'idb-keyval'

type Props = { onDone: () => void; onNoVault: () => void }

export default function Onboarding({ onDone, onNoVault }: Props) {
  const [step, setStep] = useState<'choice'|'new'|'import'|'confirm'>('choice')
  const [pwd, setPwd] = useState('')
  const [mnemonic, setMnemonic] = useState('')
  const [addr, setAddr] = useState('')

  useEffect(() => {
    (async () => {
      const v = await idbGet('vault')
      if (v) onNoVault() // vault exists, go to unlock
    })()
  }, [onNoVault])

  async function handleCreate() {
    if (!pwd) return alert('Set a password (used for local encryption)')
    const { address, mnemonic } = await createWallet(pwd)
    setRuntimePassword(pwd)
    setAddr(address); setMnemonic(mnemonic); setStep('confirm')
  }

  async function handleImport(phrase: string) {
    if (!pwd) return alert('Set a password (used for local encryption)')
    const { address } = await importExisting(pwd, phrase)
    setRuntimePassword(pwd)
    setAddr(address); setMnemonic(phrase.trim()); setStep('confirm')
  }

  if (step === 'choice') return (
    <div className="content">
      <div className="card" style={{marginBottom:12}}>
        <h3 style={{marginTop:0}}>Welcome</h3>
        <p>Create a new wallet or import an existing one.</p>
        <div className="divider"/>
        <label>Password (encrypts your seed locally)</label>
        <input className="input" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Choose a strong password"/>
        <div className="row" style={{marginTop:10}}>
          <button className="btn" onClick={()=>setStep('new')}>Create Wallet</button>
          <button className="btn ghost" onClick={()=>setStep('import')}>Import</button>
        </div>
      </div>
    </div>
  )

  if (step === 'new') return (
    <div className="content">
      <div className="card">
        <h3 style={{marginTop:0}}>Your Recovery Phrase</h3>
        <p>Write these 12 words down in order and keep them offline. Anyone with these can access your funds.</p>
        <div className="divider"/>
        <button className="btn" onClick={handleCreate}>Reveal Phrase</button>
        <button className="btn ghost" style={{marginLeft:8}} onClick={()=>setStep('choice')}>Back</button>
      </div>
    </div>
  )

  if (step === 'import') {
    const [phrase, setPhrase] = useState('') as any
    return (
      <div className="content">
        <div className="card">
          <h3 style={{marginTop:0}}>Import Wallet</h3>
          <textarea className="input" rows={3} placeholder="Enter your 12/24-word phrase" value={phrase} onChange={e=>setPhrase(e.target.value)} />
          <div className="row" style={{marginTop:10}}>
            <button className="btn" onClick={()=>handleImport(phrase)}>Import</button>
            <button className="btn ghost" onClick={()=>setStep('choice')}>Back</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content">
      <div className="card">
        <img src={chrome.runtime.getURL('logo-forest.png')} alt="Forest" style={{height:40, width:'auto', display:'block', margin:'0 auto 8px'}}/>
        <h3 style={{textAlign:'center', marginTop:0}}>Save Your Phrase</h3>
        <div className="stat" style={{fontSize:16, lineHeight:1.6, userSelect:'text'}}>
          {mnemonic}
        </div>
        <p style={{opacity:.85}}>Address: {addr}</p>
        <label><input type="checkbox" id="ack"/> I wrote the phrase down and will keep it safe.</label>
        <div className="row" style={{marginTop:10}}>
          <button className="btn" onClick={()=>{
            const ack = (document.getElementById('ack') as HTMLInputElement)?.checked
            if(!ack) return alert('Please confirm you saved the phrase.')
            onDone()
          }}>Continue</button>
        </div>
      </div>
    </div>
  )
}

