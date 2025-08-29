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

export type TransactionHistory = {
  hash: string
  blockNumber: number
  timestamp: number
  from: string
  to: string
  value: string
  gasUsed: string
  gasPrice: string
  status: 'success' | 'failed'
}

export async function getTransactionHistory(address: string, limit: number = 20): Promise<TransactionHistory[]> {
  try {
    // Get the latest block number to calculate block range
    const latestBlock = await rpc.getBlockNumber()
    const fromBlock = Math.max(0, latestBlock - 10000) // Look back 10,000 blocks
    
    // Get transaction receipts for the address
    const filter = {
      fromBlock: fromBlock,
      toBlock: 'latest',
      address: address
    }
    
    const logs = await rpc.getLogs(filter)
    
    // Get transaction details for each log
    const transactions: TransactionHistory[] = []
    
    for (const log of logs) {
      try {
        const tx = await rpc.getTransaction(log.transactionHash)
        if (!tx || !tx.blockNumber) continue
        
        const receipt = await rpc.getTransactionReceipt(log.transactionHash)
        const block = await rpc.getBlock(tx.blockNumber)
        
        if (tx && receipt && block) {
          transactions.push({
            hash: tx.hash,
            blockNumber: tx.blockNumber!,
            timestamp: block.timestamp,
            from: tx.from,
            to: tx.to!,
            value: formatEther(tx.value),
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: formatEther(tx.gasPrice!),
            status: receipt.status === 1 ? 'success' : 'failed'
          })
        }
      } catch (error) {
        console.error('Error fetching transaction details:', error)
      }
    }
    
    // Sort by timestamp (newest first) and limit results
    return transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      
  } catch (error) {
    console.error('Error fetching transaction history:', error)
    return []
  }
}

