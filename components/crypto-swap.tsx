"use client";

import { useState, useEffect } from "react";
import { ArrowDown, ChevronDown, Info, X, TrendingUp, Shield, Coins } from "lucide-react";
import { useAccount, useWriteContract, useContractRead } from "wagmi";
import { ethers } from "ethers";
import type { JSX } from "react/jsx-runtime";

// Mapping of chain IDs to DustAggregator contract addresses
const CONTRACT_ADDRESS_MAP: { [chainId: number]: string } = {
  84532: "0x07E9a60e43025d14F14086780E67CF3B66fCA842", 
};

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
];

const TOKEN_ABI = [
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
];

interface Token {
  symbol: string;
  name: string;
  icon: JSX.Element;
  balance: string;
  value: string;
  color: string;
  supplyApy: string;
  borrowApy: string;
  stakingApy: string;
  address: string;
  decimals?: number;
}

interface ThresholdOption {
  label: string;
  value: number | "MAX";
}

const thresholdOptions: ThresholdOption[] = [
  { label: "$10", value: 10 },
  { label: "$100", value: 100 },
  { label: "$1000", value: 1000 },
  { label: "MAX", value: "MAX" },
];

type ModalType = "lend" | "borrow" | "stake" | null;

interface TokenDetailsProps {
  tokenAddress: string;
  userAddress: string;
  onTokenFetched: (token: Token | null) => void;
}

function TokenDetails({ tokenAddress, userAddress, onTokenFetched }: TokenDetailsProps) {
  const { data: symbol } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: "symbol",
  });

  const { data: name } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: "name",
  });

  const { data: decimals } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: "decimals",
  });

  const { data: balance } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: "balanceOf",
    args: [userAddress],
  });

  useEffect(() => {
    if (symbol && name && decimals !== undefined && balance !== undefined) {
      const formattedBalance = ethers.utils.formatUnits(balance.toString(), decimals);
      onTokenFetched({
        symbol: symbol as string,
        name: name as string,
        icon: <GenericTokenIcon />,
        balance: formattedBalance,
        value: `$${parseFloat(formattedBalance).toFixed(2)}`, // Dummy value
        color: getTokenColor(symbol as string),
        supplyApy: "5.0", // Dummy APY
        borrowApy: "6.0", // Dummy APY
        stakingApy: "7.0", // Dummy APY
        address: tokenAddress,
        decimals: decimals as number,
      });
    } else if (symbol === undefined || name === undefined || decimals === undefined || balance === undefined) {
      onTokenFetched(null);
    }
  }, [symbol, name, decimals, balance, tokenAddress, onTokenFetched]);

  return null;
}

function getTokenColor(symbol: string): string {
  switch (symbol) {
    case "BTC":
      return "#F7931A";
    case "ETH":
      return "#627EEA";
    case "USDC":
      return "#2775CA";
    case "USDT":
      return "#26A17B";
    default:
      return "#666666";
  }
}

export default function CryptoSwap() {
  const { address, isConnected, chain } = useAccount();
  const chainId = chain?.id || 43114; // Default to Avalanche
  const CONTRACT_ADDRESS = CONTRACT_ADDRESS_MAP[chainId] || CONTRACT_ADDRESS_MAP[43114]; // Fallback to Avalanche

  const [selectedFromTokens, setSelectedFromTokens] = useState<Token[]>([]);
  const [selectedToToken, setSelectedToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState<string>("0");
  const [toAmount, setToAmount] = useState<string>("0");
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState<boolean>(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState<boolean>(false);
  const [showActionOptions, setShowActionOptions] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [lendAmount, setLendAmount] = useState<string>("");
  const [borrowAmount, setBorrowAmount] = useState<string>("");
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [selectedThreshold, setSelectedThreshold] = useState<ThresholdOption>(thresholdOptions[0]);
  const [isThresholdDropdownOpen, setIsThresholdDropdownOpen] = useState<boolean>(false);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { data: tokenAddresses, error: contractError } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "getWhitelistedTokens",
    enabled: !!isConnected && !!address && !!CONTRACT_ADDRESS,
  });

  const handleTokenFetched = (token: Token | null) => {
    if (token) {
      setAvailableTokens((prev) => {
        if (!prev.some((t) => t.address === token.address)) {
          return [...prev, token];
        }
        return prev;
      });
    }
  };

  useEffect(() => {
    if (tokenAddresses && address) {
      setIsLoading(true);
      setAvailableTokens([]); // Clear previous tokens
    }
  }, [tokenAddresses, address]);

  useEffect(() => {
    if (availableTokens.length > 0 && !selectedToToken) {
      setSelectedToToken(availableTokens[0]);
    }
    if (availableTokens.length === (tokenAddresses?.length || 0)) {
      setIsLoading(false);
    }
  }, [availableTokens, tokenAddresses, selectedToToken]);

  useEffect(() => {
    if (contractError) {
      console.error("Contract error:", contractError);
      setError("Failed to fetch whitelisted tokens from contract.");
      setIsLoading(false);
    }
  }, [contractError]);

  const totalValue = selectedFromTokens.reduce((sum, token) => {
    return sum + Number.parseFloat(token.value.replace("$", ""));
  }, 0);

  const handleFromTokenSelect = (token: Token) => {
    const isAlreadySelected = selectedFromTokens.some((t) => t.symbol === token.symbol);
    let newSelection: Token[];
    if (isAlreadySelected) {
      newSelection = selectedFromTokens.filter((t) => t.symbol !== token.symbol);
    } else {
      newSelection = [...selectedFromTokens, token];
    }
    setSelectedFromTokens(newSelection);

    const totalFromValue = newSelection.reduce((sum, t) => {
      return sum + Number.parseFloat(t.value.replace("$", ""));
    }, 0);

    if (selectedToToken) {
      const toTokenPrice =
        Number.parseFloat(selectedToToken.value.replace("$", "")) / Number.parseFloat(selectedToToken.balance);
      const calculatedToAmount = totalFromValue > 0 ? (totalFromValue / toTokenPrice).toFixed(4) : "0";
      setToAmount(calculatedToAmount);
      setFromAmount(totalFromValue.toFixed(4));
    }
  };

  const handleToTokenSelect = (token: Token) => {
    setSelectedToToken(token);
    setIsToDropdownOpen(false);

    const totalFromValue = selectedFromTokens.reduce((sum, t) => {
      return sum + Number.parseFloat(t.value.replace("$", ""));
    }, 0);

    const toTokenPrice = Number.parseFloat(token.value.replace("$", "")) / Number.parseFloat(token.balance);
    const calculatedToAmount = totalFromValue > 0 ? (totalFromValue / toTokenPrice).toFixed(4) : "0";
    setToAmount(calculatedToAmount);
  };

  const removeFromToken = (token: Token) => {
    const newSelection = selectedFromTokens.filter((t) => t.symbol !== token.symbol);
    setSelectedFromTokens(newSelection);

    const totalFromValue = newSelection.reduce((sum, t) => {
      return sum + Number.parseFloat(t.value.replace("$", ""));
    }, 0);

    if (selectedToToken) {
      const toTokenPrice = Number.parseFloat(selectedToToken.value.replace("$", "")) / Number.parseFloat(selectedToToken.balance);
      const calculatedToAmount = totalFromValue > 0 ? (totalFromValue / toTokenPrice).toFixed(4) : "0";
      setToAmount(calculatedToAmount);
      setFromAmount(totalFromValue.toFixed(4));
    }
  };

  const { writeContractAsync: approveToken } = useWriteContract();
  const { writeContractAsync: depositDust } = useWriteContract();

  const handleConsolidate = async () => {
    if (!isConnected || !address || !selectedToToken || !CONTRACT_ADDRESS) {
      setError("Missing wallet connection, target token, or contract address for this chain.");
      return;
    }

    try {
      setError(null);
      for (const token of selectedFromTokens) {
        // Approve token
        await approveToken({
          address: token.address as `0x${string}`,
          abi: TOKEN_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESS as `0x${string}`, ethers.utils.parseUnits(token.balance, token.decimals || 18)],
        });

        // Deposit dust
        await depositDust({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: "depositDust",
          args: [token.address as `0x${string}`, ethers.utils.parseUnits(token.balance, token.decimals || 18)],
        });
      }

      // Call backend API
      await fetch("http://localhost:8080/consolidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          from_tokens: selectedFromTokens.map((t) => t.address),
          to_token: selectedToToken.address,
          amount: totalValue,
          chain_id: chainId,
        }),
      });
      setShowActionOptions(true);
    } catch (error) {
      console.error("Consolidation failed:", error);
      setError("Consolidation failed. Please check your inputs or try again.");
    }
  };

  const openModal = (modalType: ModalType) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
    setLendAmount("");
    setBorrowAmount("");
    setStakeAmount("");
  };

  const handleThresholdSelect = (threshold: ThresholdOption) => {
    setSelectedThreshold(threshold);
    setIsThresholdDropdownOpen(false);
  };

  const handleAction = async (action: ModalType, amount: string) => {
    if (!selectedToToken || !amount) {
      setError("Please select a token and enter an amount.");
      return;
    }

    try {
      setError(null);
      await fetch(`http://localhost:8080/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          token_address: selectedToToken.address,
          amount: Number.parseFloat(amount),
          chain_id: chainId,
        }),
      });
      closeModal();
    } catch (error) {
      console.error(`${action} failed:`, error);
      setError(`${action} failed. Please try again.`);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {isLoading && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          Loading tokens...
        </div>
      )}
      {isConnected ? (
        <div className="rounded-[20px] bg-white shadow-md dark:bg-gray-800">
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
                        {selectedFromTokens[0]?.icon || <GenericTokenIcon />}
                      </div>
                      <span className="font-medium dark:text-white">{selectedFromTokens[0]?.symbol || "Select"}</span>
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
                        const isSelected = selectedFromTokens.some((t) => t.symbol === token.symbol);
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
                        );
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
                readOnly
                className="w-full border-none bg-transparent p-0 text-2xl font-medium outline-none dark:text-white"
              />
              <div className="text-sm text-[#666666] dark:text-gray-400">~${totalValue.toFixed(2)}</div>
            </div>

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
                  : `${selectedFromTokens[0]?.balance || "0"} ${selectedFromTokens[0]?.symbol || "Select"} available`}
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

          <div className="relative flex justify-center">
            <div className="absolute -top-5 flex h-[40px] w-[40px] items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <ArrowDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
            <hr className="w-full border-t border-gray-100 dark:border-gray-700" />
          </div>

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
                    style={{ backgroundColor: selectedToToken?.color || "#666666" }}
                  >
                    {selectedToToken?.icon || <GenericTokenIcon />}
                  </div>
                  <span className="font-medium dark:text-white">{selectedToToken?.symbol || "Select"}</span>
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
                readOnly
                className="w-full border-none bg-transparent p-0 text-2xl font-medium outline-none dark:text-white"
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center text-xs text-[#666666] dark:text-gray-400">
                Estimated Fee: $3.00
                <Info className="ml-1 h-3 w-3" />
              </div>
            </div>
          </div>

          <div className="p-6 pt-0">
            {!showActionOptions ? (
              <button
                onClick={handleConsolidate}
                className="w-full rounded-lg bg-[#6B48FF] py-3 text-white font-medium hover:bg-[#5a3dd9] transition-colors"
                disabled={!selectedFromTokens.length || !selectedToToken || !CONTRACT_ADDRESS || !isConnected}
              >
                {CONTRACT_ADDRESS ? "Consolidate" : "Chain Not Supported"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  What would you like to do with your {selectedToToken?.symbol || "token"}?
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openModal("lend")}
                    className="flex flex-col items-center rounded-lg bg-emerald-600 py-3 text-white font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <TrendingUp className="h-4 w-4 mb-1" />
                    <span className="text-sm">Lend</span>
                    <span className="text-xs opacity-90">{selectedToToken?.supplyApy || "0"}% APY</span>
                  </button>
                  <button
                    onClick={() => openModal("borrow")}
                    className="flex flex-col items-center rounded-lg bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Shield className="h-4 w-4 mb-1" />
                    <span className="text-sm">Borrow</span>
                    <span className="text-xs opacity-90">{selectedToToken?.borrowApy || "0"}% APY</span>
                  </button>
                </div>

                <button
                  onClick={() => openModal("stake")}
                  className="w-full flex items-center justify-center rounded-lg bg-purple-600 py-3 text-white font-medium hover:bg-purple-700 transition-colors"
                >
                  <Coins className="mr-2 h-4 w-4" />
                  Stake {selectedToToken?.symbol || "token"} ({selectedToToken?.stakingApy || "0"}% APY)
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">
          Please connect your wallet using the header to proceed.
        </div>
      )}

      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-[20px] p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold dark:text-white">
                {activeModal === "lend" && `Lend ${selectedToToken?.symbol || ""}`}
                {activeModal === "borrow" && `Borrow ${selectedToToken?.symbol || ""}`}
                {activeModal === "stake" && `Stake ${selectedToToken?.symbol || ""}`}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 dark:text-gray-400" />
              </button>
            </div>

            {activeModal === "lend" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4">
                  <h3 className="font-medium text-emerald-700 dark:text-emerald-400 mb-3">
                    Morpho Lending Pool
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-gray-600 dark:text-gray-400">Supply APY:</div>
                    <div className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {selectedToToken?.supplyApy || "0"}%
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Total Supply:</div>
                    <div className="text-right font-medium">$24.5M</div>
                    <div className="text-gray-600 dark:text-gray-400">Utilization:</div>
                    <div className="text-right font-medium">68%</div>
                    <div className="text-gray-600 dark:text-gray-400">Your Supply:</div>
                    <div className="text-right font-medium">0 {selectedToToken?.symbol || ""}</div>
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
                      {selectedToToken?.symbol || ""}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>
                      Available: {selectedToToken?.balance || "0"} {selectedToToken?.symbol || ""}
                    </span>
                    <button
                      onClick={() => setLendAmount(selectedToToken?.balance || "")}
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
                      ? (
                          (Number.parseFloat(lendAmount) * Number.parseFloat(selectedToToken?.supplyApy || "0")) /
                          100
                        ).toFixed(4)
                      : "0.0000"}{" "}
                    {selectedToToken?.symbol || ""}/year
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Protocol fee: 10% (shared with LUCRA)
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
                    disabled={!lendAmount}
                    onClick={() => handleAction("lend", lendAmount)}
                    className="rounded-lg bg-emerald-600 py-2 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Supply
                  </button>
                </div>
              </div>
            )}

            {activeModal === "borrow" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                  <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-3">
                    Morpho Borrowing Pool
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-gray-600 dark:text-gray-400">Borrow APY:</div>
                    <div className="text-right font-medium text-blue-600 dark:text-blue-400">
                      {selectedToToken?.borrowApy || "0"}%
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Available:</div>
                    <div className="text-right font-medium">$12.3M</div>
                    <div className="text-gray-600 dark:text-gray-400">Collateral Factor:</div>
                    <div className="text-right font-medium">75%</div>
                    <div className="text-gray-600 dark:text-gray-400">Your Debt:</div>
                    <div className="text-right font-medium">0 {selectedToToken?.symbol || ""}</div>
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
                      {selectedToToken?.symbol || ""}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>
                      Max: {(Number.parseFloat(toAmount) * 0.75).toFixed(2)} {selectedToToken?.symbol || ""}
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
                          (Number.parseFloat(borrowAmount) * Number.parseFloat(selectedToToken?.borrowApy || "0")) /
                          100
                        ).toFixed(4)
                      : "0.0000"}{" "}
                    {selectedToToken?.symbol || ""}/year
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
                    onClick={() => handleAction("borrow", borrowAmount)}
                    className="rounded-lg bg-blue-600(py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Borrow
                  </button>
                </div>
              </div>
            )}

            {activeModal === "stake" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4">
                  <h3 className="font-medium text-purple-700 dark:text-purple-400 mb-3">
                    LUCRA Staking Pool
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-gray-600 dark:text-gray-400">Staking APY:</div>
                    <div className="text-right font-medium text-purple-600 dark:text-purple-400">
                      {selectedToToken?.stakingApy || "0"}%
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Total Staked:</div>
                    <div className="text-right font-medium">$18.2M</div>
                    <div className="text-gray-600 dark:text-gray-400">Lock Period:</div>
                    <div className="text-right font-medium">30 days</div>
                    <div className="text-gray-600 dark:text-gray-400">Your Stake:</div>
                    <div className="text-right font-medium">0 {selectedToToken?.symbol || ""}</div>
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
                      {selectedToToken?.symbol || ""}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>
                      Available: {selectedToToken?.balance || "0"} {selectedToToken?.symbol || ""}
                    </span>
                    <button
                      onClick={() => setStakeAmount(selectedToToken?.balance || "")}
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
                              ((Number.parseFloat(stakeAmount) * Number.parseFloat(selectedToToken?.stakingApy || "0")) /
                                100) *
                              0.85
                            ).toFixed(4)
                          : "0.0000"}{" "}
                        {selectedToToken?.symbol || ""}/year
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">LUCRA Fee (15%):</span>
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {stakeAmount
                          ? (
                              ((Number.parseFloat(stakeAmount) * Number.parseFloat(selectedToToken?.stakingApy || "0")) /
                                100) *
                              0.15
                            ).toFixed(4)
                          : "0.0000"}{" "}
                        {selectedToToken?.symbol || ""}/year
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
                  <div className="text-sm text-yellow-700 dark:text-yellow-400">
                    ⚠️ Warning: Staked tokens are locked for 30 days. Early withdrawal incurs a 5% penalty.
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
                    onClick={() => handleAction("stake", stakeAmount)}
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

      {tokenAddresses && address && (tokenAddresses as string[]).map((tokenAddress) => (
        <TokenDetails
          key={tokenAddress}
          tokenAddress={tokenAddress}
          userAddress={address}
          onTokenFetched={handleTokenFetched}
        />
      ))}
    </div>
  );
}

function GenericTokenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="8" fill="white" />
      <circle cx="8" cy="8" r="5" fill="#666666" />
    </svg>
  );
}