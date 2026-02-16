import { BlockHashPredictor } from "@/components/block-hash-predictor"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-8">
      <BlockHashPredictor />
    </main>
  )
}
