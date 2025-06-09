"use client"

import { useState } from "react"
import { ArrowDown, ChevronDown, Info, X, TrendingUp, Shield, Coins } from "lucide-react"
import type { JSX } from "react/jsx-runtime"

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
}

const availableTokens: Token[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    icon: <BitcoinIcon />,
    balance: "0.0023",
    value: "$126.45",
    color: "#F7931A",
    supplyApy: "4.2",
    borrowApy: "6.8",
    stakingApy: "8.5",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    icon: <EthereumIcon />,
    balance: "0.045",
    value: "$98.32",
    color: "#627EEA",
    supplyApy: "3.8",
    borrowApy: "5.9",
    stakingApy: "7.2",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    icon: <USDCIcon />,
    balance: "12.34",
    value: "$12.34",
    color: "#2775CA",
    supplyApy: "5.1",
    borrowApy: "7.3",
    stakingApy: "6.8",
  },
  {
    symbol: "USDT",
    name: "Tether",
    icon: <USDTIcon />,
    balance: "5.67",
    value: "$5.67",
    color: "#26A17B",
    supplyApy: "4.9",
    borrowApy: "7.1",
    stakingApy: "6.5",
  },
]

const thresholdOptions = [
  { label: "$10", value: 10 },
  { label: "$100", value: 100 },
  { label: "$1000", value: 1000 },
  { label: "MAX", value: "MAX" },
]

type ModalType = "lend" | "borrow" | "stake" | null

export default function CryptoSwap() {
  const [selectedFromTokens, setSelectedFromTokens] = useState<Token[]>([availableTokens[0]])
  const [selectedToToken, setSelectedToToken] = useState<Token>(availableTokens[1])
  const [fromAmount, setFromAmount] = useState("0.1705")
  const [toAmount, setToAmount] = useState("3.84")
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false)
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false)
  const [showActionOptions, setShowActionOptions] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [lendAmount, setLendAmount] = useState("")
  const [borrowAmount, setBorrowAmount] = useState("")
  const [stakeAmount, setStakeAmount] = useState("")
  const [selectedThreshold, setSelectedThreshold] = useState(thresholdOptions[0])
  const [isThresholdDropdownOpen, setIsThresholdDropdownOpen] = useState(false)

  const totalValue = selectedFromTokens.reduce((sum, token) => {
    return sum + Number.parseFloat(token.value.replace("$", ""))
  }, 0)

  const handleFromTokenSelect = (token: Token) => {
    const isAlreadySelected = selectedFromTokens.some((t) => t.symbol === token.symbol)

    let newSelection: Token[]
    if (isAlreadySelected) {
      newSelection = selectedFromTokens.filter((t) => t.symbol !== token.symbol)
    } else {
      newSelection = [...selectedFromTokens, token]
    }

    setSelectedFromTokens(newSelection)

    // Calculate total value of selected tokens and update "to" amount
    const totalFromValue = newSelection.reduce((sum, t) => {
      return sum + Number.parseFloat(t.value.replace("$", ""))
    }, 0)

    // Convert to selected "to" token amount (simplified conversion rate)
    const toTokenPrice =
      Number.parseFloat(selectedToToken.value.replace("$", "")) / Number.parseFloat(selectedToToken.balance)
    const calculatedToAmount = (totalFromValue / toTokenPrice).toFixed(4)
    setToAmount(calculatedToAmount)
  }

  const handleToTokenSelect = (token: Token) => {
    setSelectedToToken(token)
    setIsToDropdownOpen(false)

    // Recalculate "to" amount based on new token selection
    const totalFromValue = selectedFromTokens.reduce((sum, t) => {
      return sum + Number.parseFloat(t.value.replace("$", ""))
    }, 0)

    const toTokenPrice = Number.parseFloat(token.value.replace("$", "")) / Number.parseFloat(token.balance)
    const calculatedToAmount = (totalFromValue / toTokenPrice).toFixed(4)
    setToAmount(calculatedToAmount)
  }

  const removeFromToken = (token: Token) => {
    const newSelection = selectedFromTokens.filter((t) => t.symbol !== token.symbol)
    setSelectedFromTokens(newSelection)

    // Recalculate "to" amount after removing token
    const totalFromValue = newSelection.reduce((sum, t) => {
      return sum + Number.parseFloat(t.value.replace("$", ""))
    }, 0)

    const toTokenPrice =
      Number.parseFloat(selectedToToken.value.replace("$", "")) / Number.parseFloat(selectedToToken.balance)
    const calculatedToAmount = totalFromValue > 0 ? (totalFromValue / toTokenPrice).toFixed(4) : "0"
    setToAmount(calculatedToAmount)
  }

  const handleConsolidate = () => {
    setShowActionOptions(true)
  }

  const openModal = (modalType: ModalType) => {
    setActiveModal(modalType)
  }

  const closeModal = () => {
    setActiveModal(null)
    setLendAmount("")
    setBorrowAmount("")
    setStakeAmount("")
  }

  const handleThresholdSelect = (threshold: (typeof thresholdOptions)[0]) => {
    setSelectedThreshold(threshold)
    setIsThresholdDropdownOpen(false)
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Card container */}
      <div className="rounded-[20px] bg-white shadow-md dark:bg-gray-800">
        {/* Swap from section */}
        <div className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-[#666666] dark:text-gray-400">Swap from</span>
            <div className="relative">
              <button
                onClick={() => setIsFromDropdownOpen(!isFromDropdownOpen)}
                className="flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800"
              >
                {selectedFromTokens.length > 1 ? (
                  <div className="flex items-center">
                    <div className="flex -space-x-2 mr-2">
                      {selectedFromTokens.slice(0, 2).map((token, i) => (
                        <div
                          key={token.symbol}
                          className="flex h-[30px] w-[30px] items-center justify-center rounded-full ring-2 ring-white dark:ring-gray-800"
                          style={{ backgroundColor: token.color, zIndex: 10 - i }}
                        >
                          {token.icon}
                        </div>
                      ))}
                    </div>
                    <span className="font-medium dark:text-white">{selectedFromTokens.length} tokens</span>
                  </div>
                ) : (
                  <>
                    <div
                      className="mr-2 flex h-[30px] w-[30px] items-center justify-center rounded-full"
                      style={{ backgroundColor: selectedFromTokens[0]?.color || "#F7931A" }}
                    >
                      {selectedFromTokens[0]?.icon || <BitcoinIcon />}
                    </div>
                    <span className="font-medium dark:text-white">{selectedFromTokens[0]?.symbol || "BTC"}</span>
                  </>
                )}
                <ChevronDown className="ml-1 h-4 w-4 dark:text-gray-400" />
              </button>

              {isFromDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
                  <div className="p-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    Select dust tokens to consolidate
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {availableTokens.map((token) => {
                      const isSelected = selectedFromTokens.some((t) => t.symbol === token.symbol)
                      return (
                        <button
                          key={token.symbol}
                          onClick={() => handleFromTokenSelect(token)}
                          className={`flex w-full items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-full"
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
            </div>
          </div>

          <div className="mb-1">
            <input
              type="text"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="w-full border-none bg-transparent p-0 text-2xl font-medium outline-none dark:text-white"
            />
            <div className="text-sm text-[#666666] dark:text-gray-400">~${totalValue.toFixed(2)}</div>
          </div>

          {/* Selected tokens display */}
          {selectedFromTokens.length > 0 && (
            <div className="mt-2 mb-2">
              <div className="flex flex-wrap gap-1.5">
                {selectedFromTokens.map((token) => (
                  <div
                    key={token.symbol}
                    className="flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs dark:border-gray-700 dark:bg-gray-700"
                  >
                    <div
                      className="mr-1 flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ backgroundColor: token.color }}
                    >
                      <span className="text-[8px] text-white">{token.icon}</span>
                    </div>
                    <span className="mr-1 dark:text-white">{token.symbol}</span>
                    <button
                      onClick={() => removeFromToken(token)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[#666666] dark:text-gray-400">
              {selectedFromTokens.length > 1
                ? `${selectedFromTokens.length} tokens selected`
                : `${selectedFromTokens[0]?.balance || "79.7053"} ${selectedFromTokens[0]?.symbol || "BTC"} available`}
            </span>
            <div className="relative">
              <button
                onClick={() => setIsThresholdDropdownOpen(!isThresholdDropdownOpen)}
                className="flex items-center rounded-lg bg-[#6B48FF] px-3 py-1 text-xs font-medium text-white hover:bg-[#5a3dd9] transition-colors"
              >
                {selectedThreshold.label}
                <ChevronDown className="ml-1 h-3 w-3" />
              </button>

              {isThresholdDropdownOpen && (
                <div className="absolute right-0 mt-2 w-20 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
                  {thresholdOptions.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => handleThresholdSelect(option)}
                      className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                        selectedThreshold.value === option.value
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "dark:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider with arrow */}
        <div className="relative flex justify-center">
          <div className="absolute -top-5 flex h-[40px] w-[40px] items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <ArrowDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <hr className="w-full border-t border-gray-100 dark:border-gray-700" />
        </div>

        {/* To section */}
        <div className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-[#666666] dark:text-gray-400">To</span>
            <div className="relative">
              <button
                onClick={() => setIsToDropdownOpen(!isToDropdownOpen)}
                className="flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800"
              >
                <div
                  className="mr-2 flex h-[30px] w-[30px] items-center justify-center rounded-full"
                  style={{ backgroundColor: selectedToToken.color }}
                >
                  {selectedToToken.icon}
                </div>
                <span className="font-medium dark:text-white">{selectedToToken.symbol}</span>
                <ChevronDown className="ml-1 h-4 w-4 dark:text-gray-400" />
              </button>

              {isToDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
                  <div className="p-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    Select target token
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {availableTokens.map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => handleToTokenSelect(token)}
                        className="flex w-full items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full"
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
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-1">
            <input
              type="text"
              value={toAmount}
              onChange={(e) => setToAmount(e.target.value)}
              className="w-full border-none bg-transparent p-0 text-2xl font-medium outline-none dark:text-white"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-xs text-[#666666] dark:text-gray-400">
              Estimated Fee: $3.78
              <Info className="ml-1 h-3 w-3" />
            </div>
            {/* Fast component commented out */}
            {/* <button className="flex items-center rounded-lg bg-[#FFC107] px-3 py-1 text-xs font-medium text-black">
              <Zap className="mr-1 h-3 w-3" />
              Fast
              <ChevronDown className="ml-1 h-3 w-3" />
            </button> */}
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-6 pt-0">
          {!showActionOptions ? (
            <button
              onClick={handleConsolidate}
              className="w-full rounded-lg bg-[#6B48FF] py-3 text-white font-medium hover:bg-[#5a3dd9] transition-colors"
            >
              Consolidate
            </button>
          ) : (
            <div className="space-y-3">
              <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What would you like to do with your {selectedToToken.symbol}?
              </div>

              {/* Lending and Borrowing buttons side by side */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openModal("lend")}
                  className="flex flex-col items-center rounded-lg bg-emerald-600 py-3 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  <TrendingUp className="h-4 w-4 mb-1" />
                  <span className="text-sm">Lend</span>
                  <span className="text-xs opacity-90">{selectedToToken.supplyApy}% APY</span>
                </button>
                <button
                  onClick={() => openModal("borrow")}
                  className="flex flex-col items-center rounded-lg bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  <Shield className="h-4 w-4 mb-1" />
                  <span className="text-sm">Borrow</span>
                  <span className="text-xs opacity-90">{selectedToToken.borrowApy}% APY</span>
                </button>
              </div>

              {/* Staking button */}
              <button
                onClick={() => openModal("stake")}
                className="w-full flex items-center justify-center rounded-lg bg-purple-600 py-3 text-white font-medium hover:bg-purple-700 transition-colors"
              >
                <Coins className="mr-2 h-4 w-4" />
                Stake {selectedToToken.symbol} ({selectedToToken.stakingApy}% APY)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-[20px] p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold dark:text-white">
                {activeModal === "lend" && "Lend " + selectedToToken.symbol}
                {activeModal === "borrow" && "Borrow " + selectedToToken.symbol}
                {activeModal === "stake" && "Stake " + selectedToToken.symbol}
              </h2>
              <button onClick={closeModal} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-5 w-5 dark:text-gray-400" />
              </button>
            </div>

            {/* Lending Modal */}
            {activeModal === "lend" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4">
                  <h3 className="font-medium text-emerald-700 dark:text-emerald-400 mb-3">Morpho Lending Pool</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-gray-600 dark:text-gray-400">Supply APY:</div>
                    <div className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {selectedToToken.supplyApy}%
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Total Supply:</div>
                    <div className="text-right font-medium">$24.5M</div>
                    <div className="text-gray-600 dark:text-gray-400">Utilization:</div>
                    <div className="text-right font-medium">68%</div>
                    <div className="text-gray-600 dark:text-gray-400">Your Supply:</div>
                    <div className="text-right font-medium">0 {selectedToToken.symbol}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supply Amount
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={lendAmount}
                      onChange={(e) => setLendAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 pr-16 text-right dark:text-white"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                      {selectedToToken.symbol}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>
                      Available: {selectedToToken.balance} {selectedToToken.symbol}
                    </span>
                    <button
                      onClick={() => setLendAmount(selectedToToken.balance)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estimated Earnings</div>
                  <div className="font-medium dark:text-white">
                    {lendAmount
                      ? ((Number.parseFloat(lendAmount) * Number.parseFloat(selectedToToken.supplyApy)) / 100).toFixed(
                          4,
                        )
                      : "0.0000"}{" "}
                    {selectedToToken.symbol}/year
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Protocol fee: 10% (shared with LUCRA)</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={closeModal}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 py-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!lendAmount}
                    className="rounded-lg bg-emerald-600 py-2 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Supply
                  </button>
                </div>
              </div>
            )}

            {/* Borrowing Modal */}
            {activeModal === "borrow" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                  <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-3">Morpho Borrowing Pool</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-gray-600 dark:text-gray-400">Borrow APY:</div>
                    <div className="text-right font-medium text-blue-600 dark:text-blue-400">
                      {selectedToToken.borrowApy}%
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Available:</div>
                    <div className="text-right font-medium">$12.3M</div>
                    <div className="text-gray-600 dark:text-gray-400">Collateral Factor:</div>
                    <div className="text-right font-medium">75%</div>
                    <div className="text-gray-600 dark:text-gray-400">Your Debt:</div>
                    <div className="text-right font-medium">0 {selectedToToken.symbol}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Borrow Amount
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 pr-16 text-right dark:text-white"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                      {selectedToToken.symbol}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>
                      Max: {(Number.parseFloat(toAmount) * 0.75).toFixed(2)} {selectedToToken.symbol}
                    </span>
                    <button
                      onClick={() => setBorrowAmount((Number.parseFloat(toAmount) * 0.75).toFixed(2))}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Interest Cost</div>
                  <div className="font-medium dark:text-white">
                    {borrowAmount
                      ? (
                          (Number.parseFloat(borrowAmount) * Number.parseFloat(selectedToToken.borrowApy)) /
                          100
                        ).toFixed(4)
                      : "0.0000"}{" "}
                    {selectedToToken.symbol}/year
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Health Factor:{" "}
                    {borrowAmount
                      ? (75 / ((Number.parseFloat(borrowAmount) / Number.parseFloat(toAmount)) * 100)).toFixed(2)
                      : "∞"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={closeModal}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 py-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!borrowAmount}
                    className="rounded-lg bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Borrow
                  </button>
                </div>
              </div>
            )}

            {/* Staking Modal */}
            {activeModal === "stake" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4">
                  <h3 className="font-medium text-purple-700 dark:text-purple-400 mb-3">LUCRA Staking Pool</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-gray-600 dark:text-gray-400">Staking APY:</div>
                    <div className="text-right font-medium text-purple-600 dark:text-purple-400">
                      {selectedToToken.stakingApy}%
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Total Staked:</div>
                    <div className="text-right font-medium">$18.2M</div>
                    <div className="text-gray-600 dark:text-gray-400">Lock Period:</div>
                    <div className="text-right font-medium">30 days</div>
                    <div className="text-gray-600 dark:text-gray-400">Your Stake:</div>
                    <div className="text-right font-medium">0 {selectedToToken.symbol}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stake Amount
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 pr-16 text-right dark:text-white"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                      {selectedToToken.symbol}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>
                      Available: {selectedToToken.balance} {selectedToToken.symbol}
                    </span>
                    <button
                      onClick={() => setStakeAmount(selectedToToken.balance)}
                      className="text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Reward Breakdown</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Your Rewards:</span>
                      <span className="font-medium dark:text-white">
                        {stakeAmount
                          ? (
                              ((Number.parseFloat(stakeAmount) * Number.parseFloat(selectedToToken.stakingApy)) / 100) *
                              0.85
                            ).toFixed(4)
                          : "0.0000"}{" "}
                        {selectedToToken.symbol}/year
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">LUCRA Fee (15%):</span>
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {stakeAmount
                          ? (
                              ((Number.parseFloat(stakeAmount) * Number.parseFloat(selectedToToken.stakingApy)) / 100) *
                              0.15
                            ).toFixed(4)
                          : "0.0000"}{" "}
                        {selectedToToken.symbol}/year
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
                  <div className="text-sm text-yellow-700 dark:text-yellow-400">
                    ⚠️ Staked tokens are locked for 30 days. Early withdrawal incurs a 5% penalty.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={closeModal}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 py-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!stakeAmount}
                    className="rounded-lg bg-purple-600 py-2 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Stake
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function BitcoinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.1998 8.13325C11.3331 7.13325 10.5331 6.66659 9.46646 6.33325L9.79979 5.06659L9.06646 4.86659L8.73312 6.09992C8.53312 6.03325 8.33312 5.99992 8.13312 5.93325L8.46646 4.69992L7.73312 4.49992L7.39979 5.76659C7.23312 5.73325 7.06646 5.66659 6.93312 5.63325V5.63325L5.93312 5.36659L5.73312 6.16659C5.73312 6.16659 6.26646 6.29992 6.26646 6.33325C6.59979 6.39992 6.66646 6.63325 6.66646 6.79992L6.26646 8.26659C6.29979 8.26659 6.33312 8.29992 6.36646 8.29992C6.33312 8.29992 6.29979 8.29992 6.26646 8.26659L5.73312 10.2666C5.69979 10.3666 5.59979 10.4999 5.36646 10.4666C5.36646 10.4999 4.86646 10.3333 4.86646 10.3333L4.46646 11.1999L5.39979 11.4666C5.59979 11.5333 5.76646 11.5666 5.93312 11.6333L5.59979 12.8999L6.33312 13.0999L6.66646 11.8333C6.86646 11.8999 7.06646 11.9666 7.26646 12.0333L6.93312 13.2999L7.66646 13.4999L7.99979 12.2333C9.39979 12.5333 10.4665 12.3999 10.9331 11.1333C11.3331 10.0999 10.9331 9.49992 10.1998 9.09992C10.7331 8.93325 11.0998 8.59992 11.1998 8.13325ZM9.33312 10.5666C9.06646 11.5999 7.46646 11.0333 6.93312 10.8999L7.39979 9.13325C7.93312 9.26659 9.63312 9.49992 9.33312 10.5666ZM9.59979 8.09992C9.33312 9.03325 8.06646 8.56659 7.59979 8.43325L7.99979 6.83325C8.46646 6.96659 9.86646 7.13325 9.59979 8.09992Z"
        fill="white"
      />
    </svg>
  )
}

function EthereumIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.24902 2V6.435L11.9975 8.11L8.24902 2Z" fill="white" fillOpacity="0.602" />
      <path d="M8.249 2L4.5 8.11L8.249 6.435V2Z" fill="white" />
      <path d="M8.24902 10.9842V13.9975L12 8.80371L8.24902 10.9842Z" fill="white" fillOpacity="0.602" />
      <path d="M8.249 13.9975V10.9837L4.5 8.80371L8.249 13.9975Z" fill="white" />
      <path d="M8.24902 10.2855L11.9975 8.10352L8.24902 6.43652V10.2855Z" fill="white" fillOpacity="0.2" />
      <path d="M4.5 8.10352L8.249 10.2855V6.43652L4.5 8.10352Z" fill="white" fillOpacity="0.602" />
    </svg>
  )
}

function USDCIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.5 5.2C9.5 4.6 9 4.2 8.3 4.1V3H7.2V4.1C7 4.1 6.7 4.2 6.5 4.2C5.6 4.5 5 5.2 5 6.2C5 7.4 5.8 8 7 8.4L7.2 8.5V11C6.8 10.9 6.4 10.6 6.4 10.1H5C5 11.1 5.7 11.8 7.2 11.9V13H8.3V11.9C9.6 11.8 10.5 11.1 10.5 9.9C10.5 8.7 9.8 8.1 8.5 7.7L8.3 7.6V5.1C8.7 5.2 9 5.5 9 5.9H10.4C10.5 5.7 9.5 5.2 9.5 5.2ZM7.2 7.2L7.1 7.1C6.5 6.9 6.3 6.6 6.3 6.2C6.3 5.7 6.6 5.4 7.2 5.3V7.2ZM8.7 9.8C8.7 10.3 8.3 10.6 7.7 10.7V8.8L7.9 8.9C8.5 9.1 8.7 9.3 8.7 9.8Z"
        fill="white"
      />
    </svg>
  )
}

function USDTIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8.93 7.72V6.06H11.4V4.5H4.6V6.06H7.07V7.72C5.4 7.8 4.13 8.19 4.13 8.66C4.13 9.13 5.4 9.52 7.07 9.6V12.5H8.93V9.6C10.6 9.52 11.87 9.13 11.87 8.66C11.87 8.19 10.6 7.8 8.93 7.72ZM8.93 9.31V9.31C8.89 9.31 8.53 9.33 8.01 9.33C7.59 9.33 7.28 9.32 7.07 9.31V9.31C5.64 9.24 4.6 8.95 4.6 8.6C4.6 8.25 5.64 7.96 7.07 7.89V9.03C7.29 9.04 7.61 9.06 8.02 9.06C8.5 9.06 8.89 9.04 8.93 9.03V7.89C10.36 7.96 11.4 8.25 11.4 8.6C11.4 8.95 10.36 9.24 8.93 9.31Z"
        fill="white"
      />
    </svg>
  )
}
