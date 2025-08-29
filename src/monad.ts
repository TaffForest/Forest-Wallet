import { JsonRpcProvider, Wallet, formatEther, parseEther } from "ethers"

export const MONAD = {
  chainId: 10143,
  name: "Monad Testnet",
  rpcUrl: "https://testnet-rpc.monad.xyz"
}

export const rpc = new JsonRpcProvider(MONAD.rpcUrl, MONAD)

export async function getBalance(addr: string) {
  const bal = await rpc.getBalance(addr)
  return formatEther(bal)
}

export async function sendNativeFromPK(privateKey: string, to: string, amountEth: string) {
  const wallet = new Wallet(privateKey, rpc)
  const tx = await wallet.sendTransaction({ to, value: parseEther(amountEth) })
  return tx.wait()
}

