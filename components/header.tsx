"use client"

import { Button } from "@/components/ui/button"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useTheme } from "next-themes"

const supportedChains = [
  {
    id: 43114,
    name: "Avalanche",
    icon: <img src="/assets/avalanche-avax-vector-logo-seeklogo/avalanche-avax-seeklogo.png" alt="Avalanche" className="h-4 w-4" />,
  },
  {
    id: 43113,
    name: "Avalanche Fuji",
    icon: <img src="/assets/avalanche-avax-vector-logo-seeklogo/avalanche-avax-seeklogo.png" alt="Avalanche Fuji" className="h-4 w-4" />,
  },
  {
    id: 8453,
    name: "Base",
    icon: <img src="/assets/Base/Base_Network_Logo.png" alt="Avalanche Fuji" className="h-4 w-4" />,
  },
  {
    id: 84532,
    name: "Base Sepolia",
    icon: <img src="/assets/Base/Base_Network_Logo.png" alt="Avalanche Fuji" className="h-4 w-4" />,
  },
]

// ThemeToggle component
const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="rounded-full text-foreground border-foreground"
    >
      {theme === "light" ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </Button>
  )
}

export default function Header() {
  const { address: walletAddress, isConnected, chain } = useAccount()

  // Truncate wallet address
  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : ""

  // Map chain ID to network info
  const currentChain = chain
    ? supportedChains.find((c) => c.id === chain.id) || {
        id: chain.id,
        name: chain.name,
        icon: <img src="/assets/default-chain.png" alt="Unknown" className="h-4 w-4" />,
      }
    : {
        id: 0,
        name: "Unknown Network",
        icon: <img src="/assets/default-chain.png" alt="Unknown" className="h-4 w-4" />,
      }

  return (
    // *** Header JSX ***
    <header
      className="flex w-full items-center justify-between px-6 py-4 z-10"
      style={{ '--base-fill-color': '#6B48FF' } as React.CSSProperties}
    >
      <div className="font-bold text-xl text-foreground">LUCRA</div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }) => {
            return (
              <div
                {...(!mounted && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!mounted || !account || !chain) {
                    return (
                      <Button
                        onClick={openConnectModal}
                        className="bg-purple text-white hover:bg-purple/90 rounded-full px-4 py-2"
                      >
                        Connect Wallet
                      </Button>
                    )
                  }

                  return (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={openAccountModal}
                        className="flex items-center gap-1 bg-purple text-white hover:bg-purple/90 rounded-full px-3 py-1.5"
                      >
                        <span className="text-sm font-medium">{truncatedAddress}</span>
                      </Button>
                      <Button
                        onClick={openChainModal}
                        className="flex items-center gap-1 bg-purple text-white hover:bg-purple/90 rounded-full px-3 py-1.5"
                      >
                        {currentChain.icon}
                        <span className="text-sm font-medium">{currentChain.name}</span>
                      </Button>
                    </div>
                  )
                })()}
              </div>
            )
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  )
}