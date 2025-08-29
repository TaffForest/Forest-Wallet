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
    <div className="content">
      <div className="card">
        <h3 style={{marginTop:0}}>Unlock</h3>
        <input className="input" type="password" placeholder="Enter password"
               value={pwd} onChange={(e)=>setPwd(e.target.value)} />
        <div className="row" style={{marginTop:8}}>
          <button className="btn" disabled={!pwd || busy} onClick={doUnlock}>Unlock</button>
        </div>
      </div>
    </div>
  );
}
