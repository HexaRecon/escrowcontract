"use client"

import type { ChainData } from "@/components/block-hash-predictor"

interface ChainInfoProps {
  walletAddress: string
  chainData: ChainData | null
  onRefresh: () => void
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between border-b border-border px-0 py-2 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span
        className={`max-w-[65%] break-all text-right font-mono ${
          highlight ? "font-bold text-accent" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  )
}

export function ChainInfo({ walletAddress, chainData, onRefresh }: ChainInfoProps) {
  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">Chain Info</h2>
        <button
          onClick={onRefresh}
          className="ml-auto text-lg text-primary transition-opacity hover:opacity-70"
          title="Refresh"
          aria-label="Refresh chain info"
        >
          &#x27F3;
        </button>
      </div>
      <InfoRow label="Connected Wallet" value={walletAddress || "-"} />
      <InfoRow
        label="Current Block"
        value={chainData ? `#${chainData.currentBlock}` : "-"}
      />
      <InfoRow
        label="Latest Block Hash"
        value={chainData?.latestHash || "-"}
      />
      <InfoRow
        label="Predicting For"
        value={chainData ? `#${chainData.targetBlock}` : "-"}
        highlight
      />
    </div>
  )
}
