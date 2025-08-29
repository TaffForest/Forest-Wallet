import { get, set, del } from 'idb-keyval'
export type Contact = { id: string; name: string; address: string }
const KEY = 'addr_book'
export async function listContacts(): Promise<Contact[]> { return (await get(KEY)) || [] }
export async function saveContact(c: Contact) { const all = await listContacts(); const i = all.findIndex(x=>x.id===c.id); if(i>=0) all[i]=c; else all.push(c); await set(KEY, all) }
export async function removeContact(id: string) { const all = await listContacts(); await set(KEY, all.filter(x=>x.id!==id)) }
export async function clearContacts(): Promise<void> { await del(KEY) }

