import { useEffect } from 'react'

type Props = {
  txHash: string
  amount: string
  recipient: string
  onClose: () => void
}

export default function TransactionSuccess({ txHash, amount, recipient, onClose }: Props) {
  const explorerUrl = `https://monad-testnet.socialscan.io/tx/${txHash}`
  
  // Auto-close after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 10000)
    
    return () => clearTimeout(timer)
  }, [onClose])

  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(txHash)
    } catch (error) {
      console.error('Failed to copy hash:', error)
    }
  }

  const handleViewExplorer = () => {
    chrome.tabs.create({ url: explorerUrl })
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--card)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        {/* Success Icon */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <img 
              src={chrome.runtime.getURL('logo-forest.png')} 
              alt="Forest" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain' 
              }} 
            />
          </div>
          <h3 style={{
            margin: 0,
            color: 'var(--success)',
            fontSize: '20px',
            fontWeight: 600
          }}>
            Transaction Successful!
          </h3>
        </div>

        {/* Transaction Details */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Amount:</span>
            <span style={{ color: 'var(--forest)', fontWeight: 600 }}>{amount} MON</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>To:</span>
            <span style={{ color: 'var(--fg)', fontSize: '13px' }}>
              {recipient.slice(0, 6)}...{recipient.slice(-4)}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Hash:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--fg)', fontSize: '12px', fontFamily: 'monospace' }}>
                {txHash.slice(0, 8)}...{txHash.slice(-6)}
              </span>
              <button
                onClick={handleCopyHash}
                style={{
                  background: 'none',
                  color: 'var(--forest)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--forest)'
                }}
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={handleViewExplorer}
            style={{
              flex: 1,
              background: 'var(--forest)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            View on Explorer
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.1)',
              color: 'var(--fg)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
          >
            Close
          </button>
        </div>

        {/* Auto-close notice */}
        <div style={{
          textAlign: 'center',
          marginTop: '12px',
          fontSize: '11px',
          color: 'var(--muted)',
          opacity: 0.7
        }}>
          Auto-closes in 10 seconds
        </div>
      </div>
    </div>
  )
}
