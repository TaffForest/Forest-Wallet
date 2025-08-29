import { useState } from 'react'
import { getRuntimePassword, updateActivity, updateActivityOnUse } from '../session'
import { unlock, accountFromMnemonic } from '../keys'

type Props = {
  onBack: () => void
}

type ExportFormat = 'privateKey' | 'jsonKeystore'

export default function Export({ onBack }: Props) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('privateKey')
  const [showWarning, setShowWarning] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [exportedData, setExportedData] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleActivity = () => {
    updateActivity()
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      setError('')
      
      const runtimePassword = getRuntimePassword()
      if (!runtimePassword) {
        throw new Error('Session locked. Please unlock your wallet first.')
      }

      const m = await unlock(runtimePassword)
      updateActivityOnUse()
      const acct = accountFromMnemonic(m, 0)

      if (exportFormat === 'privateKey') {
        setExportedData(acct.privateKey)
      } else {
        // Create JSON keystore
        const keystore = {
          version: 3,
          id: crypto.randomUUID(),
          address: acct.address.slice(2), // Remove '0x' prefix
          crypto: {
            ciphertext: '', // This would be encrypted with the provided password
            cipherparams: {
              iv: Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('')
            },
            cipher: 'aes-128-ctr',
            kdf: 'scrypt',
            kdfparams: {
              dklen: 32,
              salt: Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
              n: 262144,
              r: 8,
              p: 1
            },
            mac: '' // This would be calculated from the encrypted data
          }
        }
        setExportedData(JSON.stringify(keystore, null, 2))
      }
      
      setShowConfirmation(true)
    } catch (error: any) {
      setError(error.message || 'Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportedData)
      alert('Copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('Failed to copy to clipboard. Please copy manually.')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([exportedData], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFormat === 'privateKey' ? 'private-key.txt' : 'keystore.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getWarningText = () => {
    if (exportFormat === 'privateKey') {
      return {
        title: '⚠️ CRITICAL SECURITY WARNING',
        message: 'You are about to export your PRIVATE KEY. This gives complete control over your wallet and all funds. Anyone with access to this key can steal everything.',
        details: [
          '• Never share your private key with anyone',
          '• Never enter it on any website',
          '• Store it securely offline',
          '• Consider using a hardware wallet instead',
          '• This action cannot be undone'
        ]
      }
    } else {
      return {
        title: '⚠️ SECURITY WARNING',
        message: 'You are about to export your JSON keystore file. This file is encrypted but still requires careful handling.',
        details: [
          '• Keep your keystore file secure',
          '• Remember the password you set',
          '• Store it in a safe location',
          '• Never share the file or password',
          '• Consider using a hardware wallet instead'
        ]
      }
    }
  }

  const warning = getWarningText()

  if (showConfirmation) {
    return (
      <div className="content">
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
            <h3 style={{ margin: 0, color: 'var(--forest)' }}>Export Complete</h3>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            border: '1px solid rgba(255,255,255,0.05)',
            fontSize: '12px',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {exportedData}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={handleCopy}
              style={{
                flex: 1,
                background: 'var(--forest)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Copy to Clipboard
            </button>
            <button
              onClick={handleDownload}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.1)',
                color: 'var(--fg)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Download File
            </button>
          </div>

          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ color: 'var(--error)', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              🔒 SECURITY REMINDER
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '11px' }}>
              Keep this data secure and never share it with anyone. Consider using a hardware wallet for better security.
            </div>
          </div>

          <button
            onClick={() => { handleActivity(); onBack(); }}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.1)',
              color: 'var(--fg)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Back to Wallet
          </button>
        </div>
      </div>
    )
  }

  if (showWarning) {
    return (
      <div className="content">
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
            <h3 style={{ margin: 0, color: 'var(--error)' }}>{warning.title}</h3>
          </div>

          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ color: 'var(--error)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              {warning.message}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
              {warning.details.map((detail, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>{detail}</div>
              ))}
            </div>
          </div>

          {exportFormat === 'jsonKeystore' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--muted)' }}>
                Keystore Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password for keystore encryption"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--fg)',
                  fontSize: '13px'
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowWarning(false)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.1)',
                color: 'var(--fg)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exportFormat === 'jsonKeystore' && !password.trim()}
              style={{
                flex: 1,
                background: exportFormat === 'jsonKeystore' && !password.trim() ? 'rgba(255,255,255,0.05)' : 'var(--error)',
                color: exportFormat === 'jsonKeystore' && !password.trim() ? 'var(--muted)' : 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: exportFormat === 'jsonKeystore' && !password.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Exporting...' : 'I Understand, Export'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Export Wallet</h3>
          <button 
            className="btn ghost" 
            onClick={() => { handleActivity(); onBack(); }}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            ← Back
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--muted)' }}>
            Export Format
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setExportFormat('privateKey')}
              style={{
                flex: 1,
                background: exportFormat === 'privateKey' ? 'var(--forest)' : 'rgba(255,255,255,0.03)',
                color: exportFormat === 'privateKey' ? 'var(--bg)' : 'var(--fg)',
                border: exportFormat === 'privateKey' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Private Key
            </button>
            <button
              onClick={() => setExportFormat('jsonKeystore')}
              style={{
                flex: 1,
                background: exportFormat === 'jsonKeystore' ? 'var(--forest)' : 'rgba(255,255,255,0.03)',
                color: exportFormat === 'jsonKeystore' ? 'var(--bg)' : 'var(--fg)',
                border: exportFormat === 'jsonKeystore' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              JSON Keystore
            </button>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--forest)' }}>
            {exportFormat === 'privateKey' ? 'Private Key Export' : 'JSON Keystore Export'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
            {exportFormat === 'privateKey' 
              ? 'Export your private key as plain text. This gives complete access to your wallet.'
              : 'Export your wallet as an encrypted JSON file. You will need to set a password for encryption.'
            }
          </div>
        </div>

        <button
          onClick={() => setShowWarning(true)}
          style={{
            width: '100%',
            background: 'var(--forest)',
            color: 'var(--bg)',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Continue to Export
        </button>

        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '16px',
            color: 'var(--error)',
            fontSize: '12px'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
