"use client"

import { ThemeToggle } from "./theme-toggle"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useState, useEffect } from "react"
import { useAccount, useDisconnect } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { createPublicClient, http } from "viem"
import { avalanche } from "viem/chains"
import { Circle } from "lucide-react"

const CONTRACT_ADDRESS = "0x0B7Ea66B01011203Bad67885B53d66F52B418069" as const

const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "bool", name: "isWhitelisted", type: "bool" },
    ],
    name: "whitelistToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "depositDust",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "withdrawDust",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "withdrawAggregatedDust",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getWhitelistedTokens",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "token", type: "address" },
    ],
    name: "getDustBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

interface Token {
  symbol: string
  name: string
  icon: JSX.Element
  balance: string
  value: string
  color: string
  supplyApy: string
  borrowApy: string
  stakingApy: string
  address: string
}

interface ThresholdOption {
  label: string
  value: number | "MAX"
}

const thresholdOptions: ThresholdOption[] = [
  { label: "$10", value: 10 },
  { label: "$100", value: 100 },
  { label: "$1000", value: 1000 },
  { label: "MAX", value: "MAX" },
]

type ModalType = "lend" | "borrow" | "stake" | null

// Placeholder component for GenericTokenIcon
const GenericTokenIcon: React.FC = () => {
  return <Circle className="h-4 w-4 text-gray-500" />
}

// Placeholder function for getTokenColor
const getTokenColor = (symbol: string): string => {
  const colors: Record<string, string> = {
    USDC: "#2775CA",
    WETH: "#FF9900",
    default: "#6B48FF",
  }
  return colors[symbol] || colors.default
}

export default function Header() {
  const [selectedToToken, setSelectedToToken] = useState<Token | null>(null)
  const [fromAmount, setFromAmount] = useState<string>("0")
  const [toAmount, setToAmount] = useState<string>("0")
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState<boolean>(false)
  const [isToDropdownOpen, setIsToDropdownOpen] = useState<boolean>(false)
  const [showActionOptions, setShowActionOptions] = useState<boolean>(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [lendAmount, setLendAmount] = useState<string>("")
  const [borrowAmount, setBorrowAmount] = useState<string>("")
  const [stakeAmount, setStakeAmount] = useState<string>("")
  const [selectedThreshold, setSelectedThreshold] = useState<ThresholdOption>(
    thresholdOptions[0]
  )
  const [isThresholdDropdownOpen, setIsThresholdDropdownOpen] =
    useState<boolean>(false)
  const [availableTokens, setAvailableTokens] = useState<Token[]>([])

  const { address: walletAddress, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  // Initialize Viem client
  const publicClient = createPublicClient({
    chain: avalanche,
    transport: http(),
  })

  useEffect(() => {
    // Fetch available tokens from backend when wallet is connected
    const fetchTokens = async () => {
      if (walletAddress) {
        try {
          const response = await fetch(
            `http://localhost:8080/wallet/43114/${walletAddress}`
          )
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const tokens: Token[] = await response.json()
          setAvailableTokens(
            tokens.map((token) => ({
              ...token,
              icon: <GenericTokenIcon />,
              color: getTokenColor(token.symbol),
              address: token.address || "0x0",
            }))
          )
          if (tokens.length > 0) {
            setSelectedToToken(tokens[0])
          }
        } catch (error) {
          console.error("Failed to fetch tokens:", error)
        }
      }
    }
    void fetchTokens()
  }, [walletAddress])

  return (
    <header className="flex w-full items-center justify-between px-6 py-4">
      <div className="font-bold text-xl dark:text-white">LUCRA</div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, mounted }) => {
            return (
              <div
                {...(!mounted && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                  },
                })}
              >
                {(() => {
                  if (!mounted || !account || !chain) {
                    return (
                      <Button
                        onClick={openConnectModal}
                        className="flex items-center gap-2 bg-[#6B48FF] text-white hover:bg-[#5a3dd9] rounded-full px-4 py-2"
                      >
                        <Wallet className="h-4 w-4" />
                        Connect Wallet
                      </Button>
                    )
                  }

                  return (
                    <Button
                      onClick={() => {
                        disconnect()
                      className="flex items-center gap-2 bg-[#6B48ff] text-white hover:bg-[#5a3dd9] rounded-full px-4 py-2"}
                      }>
                      <Wallet className="h-4 w-4" />
                      Disconnect
                    </Button>
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