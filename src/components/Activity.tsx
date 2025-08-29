import { useEffect, useState } from 'react'
import { getRuntimePassword, updateActivity, updateActivityOnUse } from '../session'
import { unlock, accountFromMnemonic } from '../keys'
import { getTransactionHistory } from '../monad'

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
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true)
        setError('')
        
        const pwd = getRuntimePassword()
        if (!pwd) return
        
        const m = await unlock(pwd)
        updateActivityOnUse() // Update activity when using password
        const acct = accountFromMnemonic(m, 0)
        setSelectedWallet(acct.address)
        
        // Fetch real transaction history from blockchain
        const realTransactions = await getTransactionHistory(acct.address, 20)
        
        // Convert blockchain data to our Transaction format
        const formattedTransactions: Transaction[] = realTransactions.map(tx => {
          const isIncoming = tx.to.toLowerCase() === acct.address.toLowerCase()
          const isOutgoing = tx.from.toLowerCase() === acct.address.toLowerCase()
          
          let type: 'send' | 'receive' | 'stake' | 'unstake' = 'send'
          if (isIncoming && !isOutgoing) {
            type = 'receive'
          } else if (isOutgoing && !isIncoming) {
            type = 'send'
          } else if (isIncoming && isOutgoing) {
            // Self-transaction, could be stake/unstake
            type = 'stake'
          }
          
          return {
            hash: tx.hash,
            type,
            amount: tx.value,
            timestamp: tx.timestamp * 1000, // Convert to milliseconds
            status: tx.status === 'success' ? 'confirmed' : 'failed',
            from: tx.from,
            to: tx.to,
            fee: tx.gasPrice
          }
        })
        
        setTransactions(formattedTransactions)
      } catch (error) {
        console.error('Failed to load activity:', error)
        setError('Failed to load transaction history. Please try again.')
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
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>Loading transactions...</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>Fetching from Monad testnet</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--error)' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>Failed to load</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                background: 'var(--forest)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Try Again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>No transactions found</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>This wallet has no transaction history yet</div>
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
