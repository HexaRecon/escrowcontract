import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "BlockHash Predictor - Shardeum Testnet",
  description:
    "Predict the next block hash on Shardeum EVM Testnet (Chain ID 8119) and verify your predictions on-chain.",
}

export const viewport: Viewport = {
  themeColor: "#0f0f14",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
