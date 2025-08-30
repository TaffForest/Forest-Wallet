import { useState, useEffect } from 'react'
import { updateActivity } from '../session'
import { DEFI } from '../defi/addresses'
import { ethers } from 'ethers'
import { getRuntimePassword } from '../session'
import { unlock } from '../keys'

type Props = { onBack: () => void }

interface UserInfo {
  staked: string
  fMON: string
  pendingRewards: string
  lastHarvest: string
}

interface BalanceInfo {
  nativeMonBalance: string
  erc20MonBalance: string
  fmonBalance: string
}

// Contract ABIs (simplified for basic interactions)
const MANAGER_ABI = [
  "function getUserInfo(address user) external view returns (uint256 staked, uint256 fMON, uint256 pendingRewards, uint256 lastHarvest)",
  "function stake(uint256 amount) external",
  "function unstake(uint256 fMONAmount) external",
  "function harvest() external",
  "function totalStaked() external view returns (uint256)",
  "function fMONToken() external view returns (address)",
  "function getPendingRewards(address user) external view returns (uint256)",
  "function userStaked(address user) external view returns (uint256)",
  "function userfMON(address user) external view returns (uint256)"
]

export default function DeFi({ onBack }: Props) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [userAddress, setUserAddress] = useState<string | null>(null)

  const handleActivity = () => {
    updateActivity();
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance) / 1e18
    return num.toFixed(4)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Get user address on component mount
  useEffect(() => {
    const getUserAddress = async () => {
      try {
        const pwd = getRuntimePassword();
        if (!pwd) return;
        
        const m = await unlock(pwd);
        const acct = ethers.HDNodeWallet.fromMnemonic(m, "m/44'/60'/0'/0/0");
        setUserAddress(acct.address);
      } catch (err) {
        console.error('Failed to get user address:', err);
      }
    };
    
    getUserAddress();
  }, []);

  // Real-time data fetching with polling
  useEffect(() => {
    if (!userAddress) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
        const managerContract = new ethers.Contract(DEFI.MANAGER, MANAGER_ABI, provider);
        const fmonContract = new ethers.Contract(DEFI.fMON, [
          "function balanceOf(address owner) external view returns (uint256)",
          "function exchangeRate() external view returns (uint256)"
        ], provider);
        const erc20MonContract = new ethers.Contract(DEFI.MON_TOKEN, [
          "function balanceOf(address owner) external view returns (uint256)"
        ], provider);
        
        // Fetch data with error handling
        let userInfo;
        let exchangeRate;
        let fmonBalance;
        
        try {
          userInfo = await managerContract.getUserInfo(userAddress);
        } catch (userInfoErr) {
          console.warn('Failed to get user info, trying individual calls:', userInfoErr);
          // Fallback: get individual values
          try {
            const [staked, fMON, pendingRewards] = await Promise.all([
              managerContract.userStaked(userAddress),
              managerContract.userfMON(userAddress),
              managerContract.getPendingRewards(userAddress)
            ]);
            userInfo = [staked, fMON, pendingRewards, 0]; // lastHarvest defaults to 0
          } catch (fallbackErr) {
            console.warn('Fallback also failed, using defaults:', fallbackErr);
            // Set default values if both methods fail
            userInfo = [ethers.parseEther('0'), ethers.parseEther('0'), ethers.parseEther('0'), 0];
          }
        }
        
        try {
          exchangeRate = await managerContract.exchangeRate();
        } catch (exchangeErr) {
          console.warn('Failed to get exchange rate:', exchangeErr);
          exchangeRate = ethers.parseEther('1');
        }
        
        try {
          fmonBalance = await fmonContract.balanceOf(userAddress);
        } catch (fmonErr) {
          console.warn('Failed to get fMON balance:', fmonErr);
          fmonBalance = ethers.parseEther('0');
        }
        
        // Get native MON balance
        let nativeMonBalance = ethers.parseEther('0');
        try {
          nativeMonBalance = await provider.getBalance(userAddress);
        } catch (nativeErr) {
          console.warn('Failed to get native balance:', nativeErr);
        }
        
        // Get ERC20 MON balance
        let erc20MonBalance = ethers.parseEther('0');
        try {
          erc20MonBalance = await erc20MonContract.balanceOf(userAddress);
        } catch (erc20Err) {
          console.warn('Failed to get ERC20 MON balance:', erc20Err);
        }
        
        setUserInfo({
          staked: userInfo[0].toString(),
          fMON: userInfo[1].toString(),
          pendingRewards: userInfo[2].toString(),
          lastHarvest: userInfo[3].toString()
        });
        
        setBalanceInfo({
          nativeMonBalance: nativeMonBalance.toString(),
          erc20MonBalance: erc20MonBalance.toString(),
          fmonBalance: fmonBalance.toString()
        });
        
        // Store additional data if needed
        console.log('Exchange rate:', exchangeRate.toString());
        console.log('fMON balance:', fmonBalance.toString());
        console.log('Native MON balance:', nativeMonBalance.toString());
        console.log('ERC20 MON balance:', erc20MonBalance.toString());
        
      } catch (err) {
        console.error('Failed to fetch data:', err);
        // Only set error if it's not a contract call failure (which we handle individually)
        const errString = String(err);
        if (!errString.includes('could not decode result data')) {
          setError('Failed to load staking info: ' + (err as Error).message);
        }
      } finally {
        setLoading(false);
        // Poll every 10 seconds
        timeoutId = setTimeout(fetchData, 10000);
      }
    };
    
    fetchData();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [userAddress]);

  // Remove this since we're using the new useEffect above

  const handleStake = async () => {
    if (!stakeAmount || !userAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const pwd = getRuntimePassword();
      if (!pwd) {
        setError('Wallet not unlocked');
        return;
      }
      
      const m = await unlock(pwd);
      const account = ethers.HDNodeWallet.fromMnemonic(m, "m/44'/60'/0'/0/0");
      const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
      const wallet = new ethers.Wallet(account.privateKey, provider);
      
      const managerContract = new ethers.Contract(DEFI.MANAGER, MANAGER_ABI, wallet);
      
      const amount = ethers.parseEther(stakeAmount);
      
      // Check native MON balance first
      const balance = await provider.getBalance(userAddress);
      if (balance < amount) {
        setError(`Insufficient MON balance. You have ${ethers.formatEther(balance)} MON, trying to stake ${stakeAmount} MON`);
        return;
      }
      
      console.log('Staking amount:', ethers.formatEther(amount), 'MON');
      const tx = await managerContract.stake(amount);
      await tx.wait();
      
      setStakeAmount('');
      setError(null);
    } catch (err) {
      console.error('Stake failed:', err);
      setError('Stake failed: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || !userAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const pwd = getRuntimePassword();
      if (!pwd) {
        setError('Wallet not unlocked');
        return;
      }
      
      const m = await unlock(pwd);
      const account = ethers.HDNodeWallet.fromMnemonic(m, "m/44'/60'/0'/0/0");
      const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
      const wallet = new ethers.Wallet(account.privateKey, provider);
      
      const managerContract = new ethers.Contract(DEFI.MANAGER, MANAGER_ABI, wallet);
      const amount = ethers.parseEther(unstakeAmount);
      
      const tx = await managerContract.unstake(amount);
      await tx.wait();
      
      setUnstakeAmount('');
      setError(null);
    } catch (err) {
      console.error('Unstake failed:', err);
      setError('Unstake failed: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleHarvest = async () => {
    if (!userAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const pwd = getRuntimePassword();
      if (!pwd) {
        setError('Wallet not unlocked');
        return;
      }
      
      const m = await unlock(pwd);
      const account = ethers.HDNodeWallet.fromMnemonic(m, "m/44'/60'/0'/0/0");
      const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
      const wallet = new ethers.Wallet(account.privateKey, provider);
      
      const managerContract = new ethers.Contract(DEFI.MANAGER, MANAGER_ABI, wallet);
      
      const tx = await managerContract.harvest();
      await tx.wait();
      
      setError(null);
    } catch (err) {
      console.error('Harvest failed:', err);
      setError('Harvest failed: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content">
      <div className="card" style={{ padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <button 
            className="btn ghost" 
            onClick={() => { handleActivity(); onBack(); }}
            style={{ marginRight: '12px' }}
          >
            ← Back
          </button>
          <h2 style={{ margin: 0, flex: 1 }}>Forest DeFi</h2>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(255, 0, 0, 0.1)', 
            border: '1px solid rgba(255, 0, 0, 0.3)', 
            borderRadius: '8px', 
            padding: '12px', 
            marginBottom: '16px',
            color: '#ff6b6b'
          }}>
            {error}
        </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px' }}>
            <div>Your Address: {userAddress ? formatAddress(userAddress) : 'Loading...'}</div>
          </div>
          <button 
            onClick={() => {
              // Trigger a manual refresh by updating userAddress
              setUserAddress(userAddress);
            }}
            style={{ 
              padding: '4px 8px', 
              fontSize: '10px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Refresh Data
          </button>
        </div>

        {/* Available Balances */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Available Balances</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : balanceInfo ? (
            <div style={{ 
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>Native MON Balance</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--forest)' }}>
                  {formatBalance(balanceInfo.nativeMonBalance)} MON
                </div>
                <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>
                  For gas fees and transfers
                </div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>ERC20 MON Balance</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--forest)' }}>
                  {formatBalance(balanceInfo.erc20MonBalance)} MON
                </div>
                <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>
                  For staking in DeFi
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>fMON Balance</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--forest)' }}>
                  {formatBalance(balanceInfo.fmonBalance)} fMON
                </div>
                <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>
                  Staking rewards token
                </div>
              </div>
            </div>
          ) : (
            <div style={{ opacity: 0.6, fontSize: '14px' }}>
              No balance data available
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Your Staking Info</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : userInfo ? (
            <div style={{ fontSize: '14px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Staked:</strong> {formatBalance(userInfo.staked)} MON
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>fMON Balance:</strong> {formatBalance(userInfo.fMON)} fMON
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Pending Rewards:</strong> {formatBalance(userInfo.pendingRewards)} fMON
              </div>
            </div>
          ) : (
            <div style={{ opacity: 0.6, fontSize: '14px' }}>
              No staking data available
            </div>
          )}
        </div>

                            {/* Stake Section */}
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Stake MON</h4>
                      {balanceInfo && parseFloat(balanceInfo.erc20MonBalance) === 0 ? (
                        <div style={{
                          background: 'rgba(255, 193, 7, 0.1)',
                          border: '1px solid rgba(255, 193, 7, 0.3)',
                          borderRadius: '6px',
                          padding: '12px',
                          fontSize: '13px',
                          color: '#ffc107'
                        }}>
                          ⚠️ You need ERC20 MON tokens to stake. The staking contract requires ERC20 MON tokens, not native MON tokens. Get ERC20 MON tokens from the official MON token contract.
                        </div>
                      ) : balanceInfo && parseFloat(balanceInfo.erc20MonBalance) > 0 ? (
                        <div style={{
                          background: 'rgba(76, 175, 80, 0.1)',
                          border: '1px solid rgba(76, 175, 80, 0.3)',
                          borderRadius: '6px',
                          padding: '12px',
                          fontSize: '13px',
                          color: '#4CAF50'
                        }}>
                          ✅ You have ERC20 MON tokens available for staking!
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="number"
                            placeholder="Amount"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid rgba(255,255,255,0.2)',
                              background: 'rgba(255,255,255,0.05)',
                              color: 'white',
                              fontSize: '14px'
                            }}
                          />
                          <button
                            className="btn primary"
                            onClick={handleStake}
                            disabled={loading || !stakeAmount}
                            style={{ minWidth: '80px' }}
                          >
                            {loading ? 'Staking...' : 'Stake'}
                          </button>
                        </div>
                      )}
                    </div>

        {/* Unstake Section */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Unstake fMON</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              placeholder="Amount"
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: '14px'
              }}
            />
            <button 
              className="btn secondary" 
              onClick={handleUnstake}
              disabled={loading || !unstakeAmount}
              style={{ minWidth: '80px' }}
            >
              {loading ? 'Unstaking...' : 'Unstake'}
            </button>
          </div>
        </div>

        {/* Harvest Button */}
        <div style={{ marginBottom: '16px' }}>
          <button 
            className="btn ghost" 
            onClick={handleHarvest}
            disabled={loading}
            style={{ width: '100%', padding: '12px' }}
          >
            {loading ? 'Harvesting...' : 'Harvest Rewards'}
          </button>
        </div>

        <div style={{ marginTop: '16px', fontSize: '12px', opacity: 0.6, textAlign: 'center' }}>
          Forest DeFi - Earn rewards by staking MON tokens
          <br />
          <span style={{ color: '#4CAF50' }}>🔄 Auto-refreshing every 10 seconds</span>
        </div>
      </div>
    </div>
  )
}
