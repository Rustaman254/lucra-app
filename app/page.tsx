import CryptoSwap from "@/components/crypto-swap"
import Header from "@/components/header"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#ECECEC] dark:bg-gray-900">
      <Header />
      <div className="flex flex-1 items-center justify-center p-4">
        <CryptoSwap />
      </div>
    </main>
  )
}
