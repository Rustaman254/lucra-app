"use client"

import type { ReactNode } from "react"
import { WagmiProvider } from "wagmi"
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { avalanche, optimism, baseSepolia, base, avalancheFuji } from "viem/chains"
import "@rainbow-me/rainbowkit/styles.css" 

// Initialize TanStack Query client
const queryClient = new QueryClient()

// Configure Wagmi with RainbowKit
const config = getDefaultConfig({
  appName: "Lucra App",
  projectId: "773755cc8d60c42417a9024fe65d88dc", 
  chains: [baseSepolia, base, avalancheFuji, avalanche],
  ssr: true,
})

interface WagmiProviderWrapperProps {
  children: ReactNode
}

export default function WagmiProviderWrapper({ children }: WagmiProviderWrapperProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact">{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}