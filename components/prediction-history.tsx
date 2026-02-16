"use client"

import { useState } from "react"
import type { Prediction } from "@/components/block-hash-predictor"

interface PredictionHistoryProps {
  onLoad: () => Promise<Prediction[]>
  onReveal: (id: string) => Promise<void>
}

function Badge({ revealed, correct }: { revealed: boolean; correct: boolean }) {
  if (!revealed) {
    return (
      <span className="inline-block rounded bg-border px-2 py-0.5 text-xs font-semibold text-muted">
        PENDING
      </span>
    )
  }
  if (correct) {
    return (
      <span className="inline-block rounded bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
        CORRECT
      </span>
    )
  }
  return (
    <span className="inline-block rounded bg-danger/15 px-2 py-0.5 text-xs font-semibold text-danger">
      WRONG
    </span>
  )
}

export function PredictionHistory({ onLoad, onReveal }: PredictionHistoryProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [revealingId, setRevealingId] = useState<string | null>(null)

  async function handleLoad() {
    setLoading(true)
    try {
      const preds = await onLoad()
      setPredictions(preds)
      setLoaded(true)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }

  async function handleReveal(id: string) {
    setRevealingId(id)
    try {
      await onReveal(id)
      const preds = await onLoad()
      setPredictions(preds)
    } catch {
      /* silent */
    } finally {
      setRevealingId(null)
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        My Predictions
      </h2>
      <button
        onClick={handleLoad}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-accent bg-transparent px-4 py-2 text-sm text-accent transition-opacity hover:opacity-70"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
            Loading...
          </>
        ) : (
          "Load My Predictions"
        )}
      </button>

      {loaded && predictions.length === 0 && (
        <p className="mt-4 text-sm text-muted">No predictions yet.</p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {predictions.map((pred) => (
          <div
            key={pred.id}
            className="rounded-lg border border-border bg-background p-4 text-sm"
          >
            <div className="mb-1 flex justify-between">
              <span className="text-muted">ID</span>
              <span className="text-foreground">#{pred.id}</span>
            </div>
            <div className="mb-1 flex justify-between">
              <span className="text-muted">Target Block</span>
              <span className="text-foreground">#{pred.targetBlock}</span>
            </div>
            <div className="mb-1 flex justify-between">
              <span className="text-muted">Predicted</span>
              <span className="max-w-[60%] break-all text-right font-mono text-xs text-foreground">
                {pred.predictedHash}
              </span>
            </div>
            {pred.revealed && (
              <div className="mb-1 flex justify-between">
                <span className="text-muted">Actual</span>
                <span className="max-w-[60%] break-all text-right font-mono text-xs text-foreground">
                  {pred.actualHash}
                </span>
              </div>
            )}
            <div className="mb-1 flex items-center justify-between">
              <span className="text-muted">Status</span>
              <Badge revealed={pred.revealed} correct={pred.correct} />
            </div>

            {!pred.revealed && (
              <button
                onClick={() => handleReveal(pred.id)}
                disabled={revealingId === pred.id}
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-accent bg-transparent px-3 py-1.5 text-xs text-accent transition-opacity hover:opacity-70 disabled:opacity-40"
              >
                {revealingId === pred.id ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
                    Revealing...
                  </>
                ) : (
                  "Reveal Result"
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
