import { updateActivity } from '../session'

type Props = { onBack: () => void }

export default function Magma({ onBack }: Props) {
  const handleActivity = () => {
    updateActivity();
  };

  return (
    <div className="content">
      <div className="card" style={{textAlign:'center', padding:'24px 14px'}}>
        <img src={chrome.runtime.getURL('Magma_Logo+Text.png')} alt="Magma" style={{height:48, width:'auto', margin:'0 auto 8px', display:'block'}}/>
        <h3 style={{margin:0}}>Coming Soon</h3>
        <p style={{opacity:.9, lineHeight:1.6}}>
          Forest Staking has been <b>whitelisted as a validator</b>.<br/>
          <b>Magma MEV</b> will be integrated into the Forest Staking Monad Wallet soon.
        </p>
        <button className="btn ghost" onClick={() => { handleActivity(); onBack(); }}>Back</button>
      </div>
    </div>
  )
}
