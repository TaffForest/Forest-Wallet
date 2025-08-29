import { HDNodeWallet, Mnemonic } from "ethers"
import { get, set, del } from 'idb-keyval'
import { scrypt } from 'scrypt-js'
import { clearContacts } from './db'

export type StoredWallet = {
  id: string
  name: string
  derivationIndex: number
  address: string
}

const COIN_TYPE_ETH = 60
const PATH = (i = 0) => `m/44'/${COIN_TYPE_ETH}'/0'/0/${i}`

async function kdf(password: string) {
  const N=1<<15, r=8, p=1, dkLen=32
  const key = await scrypt(new TextEncoder().encode(password), new TextEncoder().encode("forest"), N, r, p, dkLen)
  return crypto.subtle.importKey("raw", new Uint8Array(key), {name:"AES-GCM"}, false, ["encrypt","decrypt"])
}

export async function createWallet(password: string) {
  const entropy = crypto.getRandomValues(new Uint8Array(16))
  const m = Mnemonic.fromEntropy(entropy)
  await storeMnemonic(password, m.phrase)
  const acct = HDNodeWallet.fromMnemonic(m, PATH(0))
  return { address: acct.address, mnemonic: m.phrase }
}

export async function createAdditionalWallet(password: string, walletIndex: number) {
  // Get the existing mnemonic
  const m = await unlock(password)
  // Create a new account from the same mnemonic but different derivation path
  const acct = HDNodeWallet.fromMnemonic(m, PATH(walletIndex))
  return { address: acct.address }
}

export async function getStoredWallets(): Promise<StoredWallet[]> {
  const wallets = await get('wallets') || []
  return wallets
}

export async function saveWallet(wallet: StoredWallet): Promise<void> {
  const wallets = await getStoredWallets()
  const existingIndex = wallets.findIndex(w => w.id === wallet.id)
  
  if (existingIndex >= 0) {
    wallets[existingIndex] = wallet
  } else {
    wallets.push(wallet)
  }
  
  await set('wallets', wallets)
}

export async function removeWallet(walletId: string): Promise<void> {
  const wallets = await getStoredWallets()
  const filteredWallets = wallets.filter(w => w.id !== walletId)
  await set('wallets', filteredWallets)
}

export async function importExisting(password: string, phrase: string) {
  const m = Mnemonic.fromPhrase(phrase.trim())
  await storeMnemonic(password, m.phrase)
  const acct = HDNodeWallet.fromMnemonic(m, PATH(0))
  return { address: acct.address }
}

async function storeMnemonic(password: string, phrase: string) {
  const vaultKey = await kdf(password)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = await crypto.subtle.encrypt({name:"AES-GCM", iv}, vaultKey, new TextEncoder().encode(phrase))
  await set('vault', { enc: Array.from(new Uint8Array(enc)), iv: Array.from(iv) })
}

export async function unlock(password: string) {
  const v = await get('vault'); if(!v) throw new Error("No vault")
  const vaultKey = await kdf(password)
  const enc = new Uint8Array(v.enc); const iv = new Uint8Array(v.iv)
  const decBuf = await crypto.subtle.decrypt({name:"AES-GCM", iv}, vaultKey, enc)
  const phrase = new TextDecoder().decode(decBuf)
  return Mnemonic.fromPhrase(phrase)
}

export async function clearVault(): Promise<void> {
  try {
    // Clear individual key-value pairs first
    await del('vault');
    await clearContacts();
    
    // Then clear the entire database
    return new Promise((resolve, reject) => {
      indexedDB.databases().then(dbs => {
        const dbName = dbs.find(d => d.name?.includes('keyval-store'))?.name || 'keyval-store';
        const req = indexedDB.deleteDatabase(dbName);
        
        req.onsuccess = () => {
          console.log('Vault cleared successfully');
          resolve();
        };
        
        req.onerror = (e) => {
          console.error('Failed to clear vault:', e);
          reject(new Error('Failed to clear vault'));
        };
      }).catch(reject);
    });
  } catch (error) {
    console.error('Error clearing vault:', error);
    throw error;
  }
}

export function accountFromMnemonic(m: Mnemonic, index=0) {
  return HDNodeWallet.fromMnemonic(m, PATH(index))
}

