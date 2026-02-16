"use client"

import { useState, useCallback } from "react"
import { BrowserProvider, Contract, Interface, solidityPackedKeccak256 } from "ethers"
import { ConnectWallet } from "@/components/connect-wallet"
import { ChainInfo } from "@/components/chain-info"
import { PredictionForm } from "@/components/prediction-form"
import { PredictionHistory } from "@/components/prediction-history"

const ABI = [
  "function submitPrediction(bytes32 _predictedHash) external returns (uint256)",
  "function revealPrediction(uint256 _predictionId) external",
  "function currentBlockNumber() view returns (uint256)",
  "function getBlockHash(uint256 _blockNumber) view returns (bytes32)",
  "function totalPredictions() view returns (uint256)",
  "function getPrediction(uint256 _id) view returns (address,uint256,bytes32,bytes32,bool,bool,uint256)",
  "function getUserPredictions(address _user) view returns (uint256[])",
  "event PredictionSubmitted(uint256 indexed predictionId, address indexed predictor, uint256 targetBlock, bytes32 predictedHash)",
  "event PredictionRevealed(uint256 indexed predictionId, address indexed predictor, bytes32 actualHash, bool correct)",
]

const CHAIN_ID = 8119
const RPC_URL = "https://api-mezame.shardeum.org"
const EXPLORER = "https://explorer-mezame.shardeum.org"
const DEFAULT_CONTRACT = "0xE5FF751467fFdE6F04E9469ca7d2Dba9B4d0d16D"

export type ChainData = {
  currentBlock: number
  latestHash: string
  targetBlock: number
  options: string[]
}

export type Prediction = {
  id: string
  targetBlock: string
  predictedHash: string
  actualHash: string
  revealed: boolean
  correct: boolean
}

export function BlockHashPredictor() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ReturnType<BrowserProvider["getSigner"]> extends Promise<infer T> ? T : never>(null as never)
  const [userAddress, setUserAddress] = useState("")
  const [connected, setConnected] = useState(false)
  const [contractAddr, setContractAddr] = useState(DEFAULT_CONTRACT)
  const [chainData, setChainData] = useState<ChainData | null>(null)

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not detected!")
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + CHAIN_ID.toString(16) }],
      })
    } catch (switchErr: unknown) {
      const err = switchErr as { code?: number }
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x" + CHAIN_ID.toString(16),
              chainName: "Shardeum EVM Testnet",
              rpcUrls: [RPC_URL],
              blockExplorerUrls: [EXPLORER],
              nativeCurrency: { name: "SHM", symbol: "SHM", decimals: 18 },
            },
          ],
        })
      }
    }

    const bp = new BrowserProvider(window.ethereum)
    const s = await bp.getSigner()
    const addr = await s.getAddress()

    setProvider(bp)
    setSigner(s)
    setUserAddress(addr)
    setConnected(true)

    await refreshChainData(bp)
  }, [])

  const refreshChainData = useCallback(async (bp?: BrowserProvider) => {
    const p = bp || provider
    if (!p) return

    const currentBlock = await p.getBlockNumber()
    const block = await p.getBlock(currentBlock)
    const latestHash = block?.hash || ""

    const options: string[] = []
    for (let i = 1; i <= 4; i++) {
      options.push(
        solidityPackedKeccak256(
          ["bytes32", "uint256", "uint256"],
          [latestHash, currentBlock, i]
        )
      )
    }

    setChainData({
      currentBlock,
      latestHash,
      targetBlock: currentBlock + 1,
      options,
    })
  }, [provider])

  const submitPrediction = useCallback(
    async (hash: string) => {
      if (!signer || !contractAddr) return

      const contract = new Contract(contractAddr, ABI, signer)
      const tx = await contract.submitPrediction(hash)

      const receipt = await tx.wait()
      const iface = new Interface(ABI)
      let predId = "?"
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics, data: log.data })
          if (parsed && parsed.name === "PredictionSubmitted") {
            predId = parsed.args[0].toString()
          }
        } catch {
          /* skip */
        }
      }

      return { txHash: tx.hash as string, predId }
    },
    [signer, contractAddr]
  )

  const loadPredictions = useCallback(async (): Promise<Prediction[]> => {
    if (!signer || !contractAddr || !userAddress) return []

    const contract = new Contract(contractAddr, ABI, signer)
    const ids: bigint[] = await contract.getUserPredictions(userAddress)

    const predictions: Prediction[] = []
    for (const id of ids) {
      const p = await contract.getPrediction(id)
      predictions.push({
        id: id.toString(),
        targetBlock: p[1].toString(),
        predictedHash: p[2],
        actualHash: p[3],
        revealed: p[4],
        correct: p[5],
      })
    }

    return predictions
  }, [signer, contractAddr, userAddress])

  const revealPrediction = useCallback(
    async (id: string) => {
      if (!signer || !contractAddr) return

      const contract = new Contract(contractAddr, ABI, signer)
      const tx = await contract.revealPrediction(id)
      await tx.wait()
    },
    [signer, contractAddr]
  )

  function short(addr: string) {
    return addr.slice(0, 6) + "..." + addr.slice(-4)
  }

  return (
    <div className="w-full max-w-[640px]">
      <h1 className="text-center text-3xl font-bold text-foreground text-balance">
        BlockHash Predictor
      </h1>
      <p className="mb-8 text-center text-sm text-muted">
        Shardeum EVM Testnet (Chain ID 8119)
      </p>

      {!connected ? (
        <ConnectWallet onConnect={connectWallet} />
      ) : (
        <>
          <ChainInfo
            walletAddress={short(userAddress)}
            chainData={chainData}
            onRefresh={() => refreshChainData()}
          />
          <PredictionForm
            chainData={chainData}
            onSubmit={submitPrediction}
            explorer={EXPLORER}
          />
          <PredictionHistory
            onLoad={loadPredictions}
            onReveal={revealPrediction}
          />
        </>
      )}

      <div className="mt-4 rounded-xl border border-border bg-card p-4 text-center">
        <p className="text-xs text-muted">Contract:</p>
        <input
          type="text"
          value={contractAddr}
          onChange={(e) => setContractAddr(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-input px-3 py-2 text-center font-mono text-xs text-foreground focus:border-primary focus:outline-none"
        />
      </div>
    </div>
  )
}
