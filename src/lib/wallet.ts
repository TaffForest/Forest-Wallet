import { HDNodeWallet, Mnemonic } from "ethers"
import { get, set } from 'idb-keyval'
import { scrypt } from 'scrypt-js'

const COIN_TYPE_ETH = 60 // EVM chains use 60
const PATH = (i = 0) => `m/44'/${COIN_TYPE_ETH}'/0'/0/${i}`

async function kdf(password: string) {
  const N = 1 << 15, r = 8, p = 1, dkLen = 32
  const key = await scrypt(new TextEncoder().encode(password), new TextEncoder().encode("forest"), N, r, p, dkLen)
  return crypto.subtle.importKey("raw", new Uint8Array(key), { name: "AES-GCM" }, false, ["encrypt", "decrypt"])
}

export async function createWallet(password: string) {
  // create a fresh mnemonic (128-bit entropy)
  const entropy = crypto.getRandomValues(new Uint8Array(16))
  const m = Mnemonic.fromEntropy(entropy)

  // construct the account AT the derivation path (no derivePath later)
  const acct = HDNodeWallet.fromMnemonic(m, PATH(0))

  // encrypt and store the phrase
  const vaultKey = await kdf(password)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, vaultKey, new TextEncoder().encode(m.phrase))
  await set('vault', { enc: Array.from(new Uint8Array(enc)), iv: Array.from(iv) })

  return { address: acct.address }
}

export async function unlock(password: string) {
  const v = await get('vault'); if (!v) throw new Error("No vault")
  const vaultKey = await kdf(password)
  const enc = new Uint8Array(v.enc); const iv = new Uint8Array(v.iv)
  const decBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, vaultKey, enc)
  const phrase = new TextDecoder().decode(decBuf)
  return Mnemonic.fromPhrase(phrase)
}

export function accountFromMnemonic(m: Mnemonic, index = 0) {
  // create the wallet directly at the desired path
  return HDNodeWallet.fromMnemonic(m, PATH(index))
}


