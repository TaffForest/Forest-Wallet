import { useEffect, useState } from 'react'
import { getRuntimePassword, updateActivity } from '../session'
import { unlock, accountFromMnemonic } from '../keys'

type Props = {
  onBack: () => void
}

type Transaction = {
  hash: string
  type: 'send' | 'receive' | 'stake' | 'unstake'
  amount: string
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  from: string
  to: string
  fee?: string
}

export default function Activity({ onBack }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWallet, setSelectedWallet] = useState<string>('')

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const pwd = getRuntimePassword()
        if (!pwd) return
        
        const m = await unlock(pwd)
        const acct = accountFromMnemonic(m, 0)
        setSelectedWallet(acct.address)
        
        // Mock transaction data - in a real implementation, this would fetch from blockchain
        const mockTransactions: Transaction[] = [
          {
            hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            type: 'receive',
            amount: '100.5',
            timestamp: Date.now() - 3600000, // 1 hour ago
            status: 'confirmed',
            from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            to: acct.address
          },
          {
            hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            type: 'send',
            amount: '25.0',
            timestamp: Date.now() - 7200000, // 2 hours ago
            status: 'confirmed',
            from: acct.address,
            to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            fee: '0.001'
          },
          {
            hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
            type: 'stake',
            amount: '50.0',
            timestamp: Date.now() - 86400000, // 1 day ago
            status: 'confirmed',
            from: acct.address,
            to: acct.address
          },
          {
            hash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
            type: 'receive',
            amount: '75.25',
            timestamp: Date.now() - 172800000, // 2 days ago
            status: 'confirmed',
            from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            to: acct.address
          }
        ]
        
        setTransactions(mockTransactions)
      } catch (error) {
        console.error('Failed to load activity:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadActivity()
  }, [])

  const handleActivity = () => {
    updateActivity()
  }

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'send':
        return '↗️'
      case 'receive':
        return '↘️'
      case 'stake':
        return '🔒'
      case 'unstake':
        return '🔓'
      default:
        return '📄'
    }
  }

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return 'var(--success)'
      case 'pending':
        return 'var(--forest)'
      case 'failed':
        return 'var(--error)'
      default:
        return 'var(--muted)'
    }
  }

  const getAmountColor = (type: Transaction['type'], address: string) => {
    if (type === 'receive' || (type === 'stake' && address === selectedWallet)) {
      return 'var(--success)'
    } else if (type === 'send' || type === 'unstake') {
      return 'var(--error)'
    }
    return 'var(--fg)'
  }

  const getAmountPrefix = (type: Transaction['type'], address: string) => {
    if (type === 'receive' || (type === 'stake' && address === selectedWallet)) {
      return '+'
    } else if (type === 'send' || type === 'unstake') {
      return '-'
    }
    return ''
  }

  return (
    <div className="content">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Activity</h2>
          <button 
            className="btn ghost" 
            onClick={() => { handleActivity(); onBack(); }}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            ← Back
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            Loading activity...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>No activity yet</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>Your transactions will appear here</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {transactions.map((tx) => (
              <div 
                key={tx.hash} 
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
                onClick={() => {
                  handleActivity()
                  // In a real implementation, this would open transaction details
                  console.log('Transaction details:', tx)
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '20px' }}>{getTransactionIcon(tx.type)}</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>
                        {tx.type}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {formatDate(tx.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div 
                      style={{ 
                        fontSize: '16px', 
                        fontWeight: 600,
                        color: getAmountColor(tx.type, tx.to)
                      }}
                    >
                      {getAmountPrefix(tx.type, tx.to)}{tx.amount} MON
                    </div>
                    <div 
                      style={{ 
                        fontSize: '11px', 
                        color: getStatusColor(tx.status),
                        textTransform: 'capitalize'
                      }}
                    >
                      {tx.status}
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                  <div>From: {formatAddress(tx.from)}</div>
                  <div>To: {formatAddress(tx.to)}</div>
                  {tx.fee && <div>Fee: {tx.fee} MON</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
