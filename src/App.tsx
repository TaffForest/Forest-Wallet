import { useEffect, useState } from 'react'
import Splash from './components/Splash'
import Onboarding from './components/Onboarding'
import Home from './components/Home'
import Send from './components/Send'
import Receive from './components/Receive'
import Stake from './components/Stake'
import Magma from './components/Magma'
import Activity from './components/Activity'
import Export from './components/Export'
import Unlock from './components/Unlock'
import { setOnLock } from './session'

export default function App() {
  const [view, setView] = useState<'splash'|'onboard'|'unlock'|'home'|'send'|'receive'|'stake'|'magma'|'activity'|'export'>('splash')

  useEffect(() => {
    const killer = setTimeout(() => setView(v=> v==='splash' ? 'onboard' : v), 12000)
    return () => clearTimeout(killer)
  }, [])

  useEffect(() => {
    // Set up auto-lock callback
    setOnLock(() => {
      console.log('Wallet auto-locked, redirecting to unlock screen');
      setView('unlock');
    });
  }, []);

  return (
    <div className="app-shell">
      <header className="header" style={{justifyContent:'center'}}>
        <img src={chrome.runtime.getURL('logo-forest.png')} alt="Forest" style={{ height: 96, width: 'auto' }} />
      </header>

      {view==='splash' && <Splash onEnter={() => setView('onboard')} />}
      {view==='onboard' && <Onboarding onDone={() => setView('home')} onNoVault={() => setView('unlock')} />}
      {view==='unlock' && <Unlock onUnlocked={() => setView('home')} onNoVault={() => setView('onboard')} />}
      {view==='home' && <Home 
        onSend={()=>setView('send')} 
        onReceive={()=>setView('receive')} 
        onStake={()=>setView('stake')} 
        onMagma={()=>setView('magma')}
        onActivity={()=>setView('activity')}
        onExport={()=>setView('export')}
        onLogout={()=>setView('onboard')}
      />}
      {view==='send' && <Send onBack={()=>setView('home')} />}
      {view==='receive' && <Receive onBack={()=>setView('home')} />}
      {view==='stake' && <Stake onBack={()=>setView('home')} />}
      {view==='magma' && <Magma onBack={()=>setView('home')} />}
      {view==='activity' && <Activity onBack={()=>setView('home')} />}
      {view==='export' && <Export onBack={()=>setView('home')} />}

      <footer className="footer">
        <span>v0.0.3 • Testnet</span>
      </footer>
    </div>
  )
}
