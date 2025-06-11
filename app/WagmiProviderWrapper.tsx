"use client";

import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { avalanche, base, baseSepolia, avalancheFuji } from "viem/chains";
import { http } from "viem";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "Lucra App",
  projectId: "773755cc8d60c42417a9024fe65d88dc",
  chains: [base, baseSepolia, avalanche, avalancheFuji],
  transports: {
    [avalanche.id]: http("https://api.avax.network/ext/bc/C/rpc"),
    [base.id]: http("https://mainnet.base.org"), 
    [baseSepolia.id]: http("https://sepolia.base.org"), 
    // [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"), 
  },
  ssr: true,
});

interface WagmiProviderWrapperProps {
  children: ReactNode;
}

export default function WagmiProviderWrapper({ children }: WagmiProviderWrapperProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact">{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}