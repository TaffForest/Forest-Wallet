// Forest DeFi Contract Addresses
// Deployed contracts on Monad testnet

export const DEFI = {
  MANAGER: "0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519", // Forest Staking Manager
  fMON: "0xC7f2Cf4845C6db0e1a1e91ED41Bcd0FcC1b0E141",   // fMON Token
  ADAPTER: "0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496", // AdapterMock
  MON_TOKEN: "0xcF1192714317Ba35AA9768C09DFA99B125877850" // Official MON Token
};

// Network configuration
export const NETWORKS = {
  MONAD_TESTNET: {
    chainId: 1337,
    rpcUrl: "https://testnet-rpc.monad.xyz",
    explorer: "https://monad-testnet.socialscan.io"
  }
};

// Contract ABIs (you can import these from the compiled contracts)
export const CONTRACT_ABIS = {
  // Add contract ABIs here when needed
};
