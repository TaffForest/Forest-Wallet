import { updateActivity } from '../session'

type Props = { onBack: () => void }

export default function Stake({ onBack }: Props) {
  const handleActivity = () => {
    updateActivity();
  };

  return (
    <div className="content">
      <div className="card" style={{textAlign:'center', padding:'24px 14px'}}>
        <img src={chrome.runtime.getURL('logo-forest.png')} alt="Forest" style={{height:64, width:'auto', margin:'8px auto 6px', display:'block'}}/>
        <h2 style={{margin:0}}>Coming Soon</h2>
        <p style={{opacity:.8}}>Staking will launch with Forest validators on Monad.</p>
        <button className="btn ghost" onClick={() => { handleActivity(); onBack(); }}>Back</button>
      </div>
    </div>
  )
}

