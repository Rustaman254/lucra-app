"use client"

import { useState } from "react"
import { ChevronDown, Search, X } from "lucide-react"

interface Token {
  symbol: string
  name: string
  icon: string
  balance: string
  value: string
  color: string
}

const availableTokens: Token[] = [
  { symbol: "BTC", name: "Bitcoin", icon: "₿", balance: "0.0023", value: "$126.45", color: "#F7931A" },
  { symbol: "ETH", name: "Ethereum", icon: "Ξ", balance: "0.045", value: "$98.32", color: "#627EEA" },
  { symbol: "USDC", name: "USD Coin", icon: "$", balance: "12.34", value: "$12.34", color: "#2775CA" },
  { symbol: "LINK", name: "Chainlink", icon: "⬡", balance: "2.1", value: "$31.50", color: "#375BD2" },
  { symbol: "UNI", name: "Uniswap", icon: "🦄", balance: "0.8", value: "$6.40", color: "#FF007A" },
  { symbol: "AAVE", name: "Aave", icon: "👻", balance: "0.05", value: "$4.25", color: "#B6509E" },
]

interface TokenSelectorProps {
  selectedTokens?: Token[]
  onTokenSelect?: (tokens: Token[]) => void
  onSingleTokenSelect?: (token: Token) => void
  multiSelect?: boolean
  placeholder?: string
}

export default function TokenSelector({
  selectedTokens = [],
  onTokenSelect,
  onSingleTokenSelect,
  multiSelect = false,
  placeholder = "Select token",
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTokens = availableTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleTokenClick = (token: Token) => {
    if (multiSelect) {
      const isSelected = selectedTokens.some((t) => t.symbol === token.symbol)
      let newSelection: Token[]

      if (isSelected) {
        newSelection = selectedTokens.filter((t) => t.symbol !== token.symbol)
      } else {
        newSelection = [...selectedTokens, token]
      }

      onTokenSelect?.(newSelection)
    } else {
      onSingleTokenSelect?.(token)
      setIsOpen(false)
    }
  }

  const removeToken = (tokenToRemove: Token) => {
    const newSelection = selectedTokens.filter((t) => t.symbol !== tokenToRemove.symbol)
    onTokenSelect?.(newSelection)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="flex items-center gap-2">
          {multiSelect && selectedTokens.length > 0 ? (
            <span className="text-sm font-medium dark:text-white">
              {selectedTokens.length} token{selectedTokens.length !== 1 ? "s" : ""} selected
            </span>
          ) : !multiSelect && selectedTokens.length > 0 ? (
            <>
              <div
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-white text-sm font-bold"
                style={{ backgroundColor: selectedTokens[0].color }}
              >
                {selectedTokens[0].icon}
              </div>
              <span className="font-medium dark:text-white">{selectedTokens[0].symbol}</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className="ml-1 h-4 w-4 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredTokens.map((token) => {
              const isSelected = selectedTokens.some((t) => t.symbol === token.symbol)
              return (
                <button
                  key={token.symbol}
                  onClick={() => handleTokenClick(token)}
                  className={`flex w-full items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold"
                      style={{ backgroundColor: token.color }}
                    >
                      {token.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium dark:text-white">{token.symbol}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium dark:text-white">{token.balance}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{token.value}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {multiSelect && selectedTokens.length > 0 && (
        <div className="mt-3 space-y-2">
          {selectedTokens.map((token) => (
            <div
              key={token.symbol}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-700"
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold"
                  style={{ backgroundColor: token.color }}
                >
                  {token.icon}
                </div>
                <span className="text-sm font-medium dark:text-white">{token.symbol}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{token.balance}</span>
              </div>
              <button
                onClick={() => removeToken(token)}
                className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <X className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
