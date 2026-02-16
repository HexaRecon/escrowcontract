"use client"

import { useState } from "react"
import type { ChainData } from "@/components/block-hash-predictor"

interface PredictionFormProps {
  chainData: ChainData | null
  onSubmit: (hash: string) => Promise<{ txHash: string; predId: string } | undefined>
  explorer: string
}

export function PredictionForm({ chainData, onSubmit, explorer }: PredictionFormProps) {
  const [selectedHash, setSelectedHash] = useState<string | null>(null)
  const [customHash, setCustomHash] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

  function short(hash: string) {
    return hash.slice(0, 6) + "..." + hash.slice(-4)
  }

  function handleOptionClick(hash: string) {
    setSelectedHash(hash)
    setCustomHash("")
    setStatus(null)
  }

  function handleCustomInput(value: string) {
    setCustomHash(value)
    if (value.startsWith("0x") && value.length === 66) {
      setSelectedHash(value)
    } else if (value === "") {
      setSelectedHash(null)
    }
  }

  async function handleSubmit() {
    const hashToSubmit = selectedHash
    if (!hashToSubmit) return

    setSubmitting(true)
    setStatus(null)

    try {
      const result = await onSubmit(hashToSubmit)
      if (result) {
        setStatus({
          type: "success",
          message: `Prediction #${result.predId} stored on-chain!`,
        })
      }
    } catch (err: unknown) {
      const e = err as Error
      setStatus({ type: "error", message: e.message || "Transaction failed" })
    } finally {
      setSubmitting(false)
    }
  }

  const isReady = !!selectedHash

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-6">
      <h2 className="mb-2 text-lg font-semibold text-foreground">
        Submit Prediction
      </h2>
      <p className="mb-3 text-sm text-muted">
        Pick a generated hash option or enter your own:
      </p>

      <div className="grid gap-3">
        {chainData?.options.map((opt, i) => (
          <button
            key={opt}
            onClick={() => handleOptionClick(opt)}
            className={`rounded-lg border px-4 py-3 text-left font-mono text-xs transition-all break-all ${
              selectedHash === opt
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border bg-background text-foreground hover:border-primary hover:bg-card"
            }`}
          >
            {`Option ${i + 1}: ${opt}`}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={customHash}
        onChange={(e) => handleCustomInput(e.target.value)}
        placeholder="Or paste a custom bytes32 (0x...64 hex chars)"
        className="mt-3 w-full rounded-lg border border-border bg-input px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
      />

      <button
        onClick={handleSubmit}
        disabled={!isReady || submitting}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground" />
            Submitting...
          </>
        ) : (
          "Submit Prediction"
        )}
      </button>

      {status && (
        <div
          className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
            status.type === "success"
              ? "border-accent bg-accent/10 text-accent"
              : status.type === "error"
                ? "border-danger bg-danger/10 text-danger"
                : "border-primary bg-primary/10 text-primary"
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  )
}
