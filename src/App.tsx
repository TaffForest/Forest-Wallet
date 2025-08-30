import { useEffect, useState } from 'react'
import Splash from './components/Splash'
import Onboarding from './components/Onboarding'
import Home from './components/Home'
import Send from './components/Send'
import Receive from './components/Receive'
import Stake from './components/Stake'
import DeFi from './components/DeFi'
import Magma from './components/Magma'
import Activity from './components/Activity'
import Export from './components/Export'
import Unlock from './components/Unlock'
import { setOnLock, updateActivity } from './session'

export default function App() {
  const [view, setView] = useState<'splash'|'onboard'|'unlock'|'home'|'send'|'receive'|'stake'|'defi'|'magma'|'activity'|'export'>('splash')
  const [selectedWalletIndex, setSelectedWalletIndex] = useState(0)

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
        selectedWalletIndex={selectedWalletIndex}
        onWalletIndexChange={setSelectedWalletIndex}
      />}
      {view==='send' && <Send onBack={()=>setView('home')} selectedWalletIndex={selectedWalletIndex} />}
      {view==='receive' && <Receive onBack={()=>setView('home')} />}
      {view==='stake' && <Stake onBack={()=>setView('home')} />}
      {view==='defi' && <DeFi onBack={()=>setView('home')} />}
      {view==='magma' && <Magma onBack={()=>setView('home')} />}
      {view==='activity' && <Activity onBack={()=>setView('home')} />}
      {view==='export' && <Export onBack={()=>setView('home')} />}

      {/* Static Footer Navigation - Show on all pages except splash, onboarding, and unlock */}
      {view !== 'splash' && view !== 'onboard' && view !== 'unlock' && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          backdropFilter: 'blur(10px)',
          zIndex: 1000
        }}>
          <button 
            className="btn ghost" 
            onClick={() => { updateActivity(); setView('home'); }}
            style={{
              fontSize: '11px',
              padding: '8px 8px',
              border: view === 'home' ? '2px solid rgba(255, 255, 255, 0.8)' : '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              background: view === 'home' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              color: view === 'home' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
              fontWeight: view === 'home' ? '600' : '400'
            }}
          >
            Home
          </button>
          <button 
            className="btn ghost" 
            onClick={() => { updateActivity(); setView('activity'); }}
            style={{
              fontSize: '11px',
              padding: '8px 8px',
              border: view === 'activity' ? '2px solid rgba(255, 255, 255, 0.8)' : '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              background: view === 'activity' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              color: view === 'activity' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
              fontWeight: view === 'activity' ? '600' : '400'
            }}
          >
            Activity
          </button>
          <button 
            className="btn ghost" 
            onClick={() => { updateActivity(); setView('defi'); }}
            style={{
              fontSize: '11px',
              padding: '8px 8px',
              border: view === 'defi' ? '2px solid rgba(255, 255, 255, 0.8)' : '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              background: view === 'defi' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              color: view === 'defi' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
              fontWeight: view === 'defi' ? '600' : '400'
            }}
          >
            DeFi
          </button>
          <button 
            className="btn ghost" 
            onClick={() => { updateActivity(); setView('export'); }}
            style={{
              fontSize: '11px',
              padding: '8px 8px',
              border: view === 'export' ? '2px solid rgba(255, 255, 255, 0.8)' : '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              background: view === 'export' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              color: view === 'export' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
              fontWeight: view === 'export' ? '600' : '400'
            }}
          >
            Settings
          </button>
        </div>
      )}

      <footer className="footer">
        <span>v0.0.3 • Testnet</span>
      </footer>
    </div>
  )
}
