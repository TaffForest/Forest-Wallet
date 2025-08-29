import { useEffect, useState } from "react";
import { get as idbGet } from "idb-keyval";
import { unlock } from "../keys";
import { setRuntimePassword } from "../session";

type Props = { onUnlocked: () => void; onNoVault: () => void };

export default function Unlock({ onUnlocked, onNoVault }: Props) {
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { (async () => { const v = await idbGet("vault"); if (!v) onNoVault(); })(); }, [onNoVault]);

  async function doUnlock() {
    try {
      setBusy(true);
      await unlock(pwd);            // throws if wrong
      setRuntimePassword(pwd);      // keep only in memory
      onUnlocked();
    } catch (e: any) {
      alert(e?.message || "Wrong password");
    } finally { setBusy(false); }
  }

  return (
    <div className="content" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh'
    }}>
      <div className="card" style={{
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h3 style={{marginTop:0, marginBottom: '20px'}}>Unlock Wallet</h3>
        <input 
          className="input" 
          type="password" 
          placeholder="Enter your password"
          value={pwd} 
          onChange={(e)=>setPwd(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && pwd && !busy) {
              doUnlock();
            }
          }}
          style={{marginBottom: '16px'}}
        />
        <div className="row" style={{justifyContent: 'center'}}>
          <button 
            className="btn" 
            disabled={!pwd || busy} 
            onClick={doUnlock}
            style={{minWidth: '120px'}}
          >
            {busy ? 'Unlocking...' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}
