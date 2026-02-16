"use client"

import { useState } from "react"

interface ConnectWalletProps {
  onConnect: () => Promise<void>
}

export function ConnectWallet({ onConnect }: ConnectWalletProps) {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    setError("")
    setLoading(true)
    try {
      await onConnect()
    } catch (err: unknown) {
      const e = err as Error
      setError(e.message || "Failed to connect")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Connect Wallet
      </h2>
      <p className="mb-4 text-sm text-muted">
        Make sure MetaMask is set to{" "}
        <strong className="text-foreground">Shardeum EVM Testnet</strong> (Chain
        8119).
      </p>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground" />
            Connecting...
          </>
        ) : (
          "Connect MetaMask"
        )}
      </button>
      {error && (
        <div className="mt-4 rounded-lg border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
    </div>
  )
}
