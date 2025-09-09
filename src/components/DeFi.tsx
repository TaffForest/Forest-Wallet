import { updateActivity } from '../session'

type Props = {
  onBack: () => void
}

export default function DeFi({ onBack }: Props) {
  const handleActivity = () => {
    updateActivity()
  }

  const openDeFiWebpage = () => {
    // Open the DeFi webpage in a new tab
    if (typeof window !== 'undefined') {
      // Use production URL when available, fallback to localhost for development
      const defiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://forest-defi.vercel.app' // Replace with actual production URL
        : 'http://localhost:5173';
      window.open(defiUrl, '_blank')
    }
  }

  return (
    <div className="content">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>DeFi</h3>
          <button 
            className="btn ghost" 
            onClick={() => { handleActivity(); onBack(); }}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            ← Back
          </button>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>🌲</div>
          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--forest)' }}>
            Forest DeFi Platform
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4, marginBottom: '16px' }}>
            Access the full DeFi experience with staking, rewards, and more on our dedicated DeFi platform.
          </p>
          <button
            onClick={openDeFiWebpage}
            style={{
              background: 'var(--forest)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Open DeFi Platform
          </button>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid rgba(255,255,255,0.03)'
        }}>
          <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--fg)' }}>
            What's Available:
          </h5>
          <ul style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, paddingLeft: '16px' }}>
            <li>Stake MON tokens to earn fMON rewards</li>
            <li>Harvest accumulated rewards</li>
            <li>Unstake fMON tokens</li>
            <li>Real-time balance tracking</li>
            <li>Transaction history</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
