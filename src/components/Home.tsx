import { useEffect, useState } from 'react'
import { unlock, accountFromMnemonic, createAdditionalWallet, getStoredWallets, saveWallet, type StoredWallet } from '../keys'
import { getBalance } from '../monad'
import { getRuntimePassword, updateActivity, updateActivityOnUse, getTimeUntilLock } from '../session'

type Props = { 
  onSend: () => void, 
  onReceive: () => void, 
  onStake: () => void, 
  onMagma: () => void,
  onActivity: () => void,
  onExport: () => void,
  onLogout: () => void 
}

type Wallet = {
  id: string;
  address: string;
  balance: string;
  name: string;
}

export default function Home({ onSend, onReceive, onStake, onMagma, onActivity, onExport }: Props) {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [selectedWalletIndex, setSelectedWalletIndex] = useState(0)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle')
  const [timeUntilLock, setTimeUntilLock] = useState(0)
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)

  const selectedWallet = wallets[selectedWalletIndex]

  useEffect(() => {
    (async () => {
      try {
        const pwd = getRuntimePassword(); if(!pwd) return
        
        // Load stored wallets
        const storedWallets = await getStoredWallets()
        
        if (storedWallets.length === 0) {
          // Create initial wallet if none exist
          const m = await unlock(pwd)
          updateActivityOnUse() // Update activity when using password
          const acct = accountFromMnemonic(m, 0)
          const balance = await getBalance(acct.address)
          
          const initialWallet: StoredWallet = {
            id: '0',
            name: 'Wallet 1',
            derivationIndex: 0,
            address: acct.address
          }
          
          await saveWallet(initialWallet)
          
          setWallets([{
            id: '0',
            address: acct.address,
            balance,
            name: 'Wallet 1'
          }])
        } else {
          // Load existing wallets
          const m = await unlock(pwd)
          updateActivityOnUse() // Update activity when using password
          const walletPromises = storedWallets.map(async (stored) => {
            const acct = accountFromMnemonic(m, stored.derivationIndex)
            const balance = await getBalance(acct.address)
            return {
              id: stored.id,
              address: acct.address,
              balance,
              name: stored.name
            }
          })
          
          const loadedWallets = await Promise.all(walletPromises)
          setWallets(loadedWallets)
        }
      } catch (error) {
        console.error('Failed to load wallets:', error)
      }
    })()
  }, [])

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilLock(getTimeUntilLock());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Track user activity to reset auto-lock timer
  const handleActivity = () => {
    updateActivity();
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCopyAddress = async () => {
    if (!selectedWallet) return;
    
    handleActivity(); // Track activity
    setCopyStatus('copying');
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(selectedWallet.address);
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = selectedWallet.address;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopyStatus('success');
          setTimeout(() => setCopyStatus('idle'), 2000);
        } else {
          throw new Error('Copy command failed');
        }
      }
    } catch (error) {
      console.error('Failed to copy address:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleCreateWallet = async () => {
    if (wallets.length >= 5) {
      alert('Maximum of 5 wallets allowed');
      return;
    }

    handleActivity();
    setIsCreatingWallet(true);

    try {
      const pwd = getRuntimePassword();
      if (!pwd) throw new Error('No password available');

      const newDerivationIndex = wallets.length;
      const { address } = await createAdditionalWallet(pwd, newDerivationIndex);
      updateActivityOnUse() // Update activity when using password
      const balance = await getBalance(address);
      
      const newWalletId = Date.now().toString();
      const newWalletName = `Wallet ${wallets.length + 1}`;
      
      // Save to storage
      const storedWallet: StoredWallet = {
        id: newWalletId,
        name: newWalletName,
        derivationIndex: newDerivationIndex,
        address
      };
      await saveWallet(storedWallet);
      
      // Update UI
      const newWallet: Wallet = {
        id: newWalletId,
        address,
        balance,
        name: newWalletName
      };

      setWallets(prev => [...prev, newWallet]);
      setSelectedWalletIndex(wallets.length);
    } catch (error) {
      console.error('Failed to create wallet:', error);
      alert('Failed to create new wallet');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const getCopyButtonText = () => {
    switch (copyStatus) {
      case 'copying': return 'Copying...';
      case 'success': return 'Copied!';
      case 'error': return 'Failed';
      default: return 'Copy';
    }
  };

  const getCopyButtonStyle = () => {
    switch (copyStatus) {
      case 'success': 
        return { 
          color: 'var(--success)', 
          backgroundColor: 'var(--success-bg)',
          border: '1px solid var(--success)'
        };
      case 'error': 
        return { 
          color: 'var(--error)', 
          backgroundColor: 'var(--error-bg)',
          border: '1px solid var(--error)'
        };
      case 'copying':
        return {
          opacity: 0.7,
          cursor: 'not-allowed'
        };
      default: 
        return {};
    }
  };

  return (
    <div className="content">
      <div className="card" style={{marginBottom:12, marginTop:8}}>
        {/* Auto-lock timer - subtle and small */}
        <div style={{fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginBottom: 16, opacity: 0.7}}>
          Auto-lock in {formatTime(timeUntilLock)}
        </div>
        
        {/* Wallet selector - only show when needed */}
        {wallets.length > 1 && (
          <div style={{marginBottom: 16}}>
            <select 
              value={selectedWalletIndex}
              onChange={(e) => {
                handleActivity();
                setSelectedWalletIndex(Number(e.target.value));
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--fg)',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              {wallets.map((wallet, index) => (
                <option key={wallet.id} value={index}>
                  {wallet.name} • {wallet.address.slice(0,6)}...{wallet.address.slice(-4)}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Balance section - prominent */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: 20,
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{opacity: 0.6, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px'}}>
            Balance
          </div>
          <div style={{fontSize: 28, fontWeight: 700, color: 'var(--forest)'}}>
            {selectedWallet?.balance || '0'} MON
          </div>
        </div>

        {/* Address section - cleaner layout */}
        <div style={{marginBottom: 20}}>
          <div style={{opacity: 0.6, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px'}}>
            Address
          </div>
          <div style={{fontSize: 13, fontWeight: 500, lineHeight: 1.4, color: 'var(--muted)'}}>
            {selectedWallet?.address ? `${selectedWallet.address.slice(0,6)}...${selectedWallet.address.slice(-4)}` : '—'}
          </div>
          <button 
            className="btn ghost" 
            disabled={!selectedWallet || copyStatus === 'copying'} 
            onClick={handleCopyAddress}
            style={{
              ...getCopyButtonStyle(),
              marginTop: 8,
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '6px'
            }}
          >
            {getCopyButtonText()}
          </button>
        </div>

        {/* Action buttons - cleaner grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: wallets.length < 5 ? 16 : 0
        }}>
          <button 
            className="btn ghost" 
            onClick={() => { handleActivity(); onSend(); }} 
            disabled={!selectedWallet}
            style={{fontSize: '13px', padding: '12px 8px'}}
          >
            Send
          </button>
          <button 
            className="btn ghost" 
            onClick={() => { handleActivity(); onReceive(); }} 
            disabled={!selectedWallet}
            style={{fontSize: '13px', padding: '12px 8px'}}
          >
            Receive
          </button>
          <button 
            className="btn ghost" 
            onClick={() => { handleActivity(); onStake(); }}
            style={{fontSize: '13px', padding: '12px 8px'}}
          >
            Stake
          </button>
          <button 
            className="btn ghost" 
            onClick={() => { handleActivity(); onMagma(); }}
            style={{fontSize: '13px', padding: '12px 8px'}}
          >
            Magma MEV
          </button>
        </div>

        {/* Activity and Export buttons - separate rows */}
        <div style={{ marginBottom: wallets.length < 5 ? 16 : 0 }}>
          <button 
            className="btn ghost" 
            onClick={() => { handleActivity(); onActivity(); }}
            style={{
              fontSize: '13px',
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)',
              marginBottom: '8px'
            }}
          >
            📊 Activity
          </button>
          <button 
            className="btn ghost" 
            onClick={() => { handleActivity(); onExport(); }}
            style={{
              fontSize: '13px',
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            🔑 Export Wallet
          </button>
        </div>
        
        {/* Create new wallet button - subtle */}
        {wallets.length < 5 && (
          <button 
            className="btn ghost" 
            onClick={handleCreateWallet}
            disabled={isCreatingWallet}
            style={{
              fontSize: '12px',
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              opacity: 0.8,
              border: '1px dashed rgba(255,255,255,0.2)'
            }}
          >
            {isCreatingWallet ? 'Creating...' : `+ Create Wallet ${wallets.length + 1}`}
          </button>
        )}
      </div>
    </div>
  )
}

