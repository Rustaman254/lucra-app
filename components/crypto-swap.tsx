"use client";

import { useState, useEffect } from "react";
import { ArrowDown, ChevronDown, X } from "lucide-react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { ethers } from "ethers";
import type { JSX } from "react/jsx-runtime";

// Mapping of chain IDs to DustAggregator contract addresses
const CONTRACT_ADDRESS_MAP: { [chainId: number]: string } = {
  84532: "0x2a7051559e3aC6fF3e48d40Ea12E306cF624446a", // Base
};

const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "registerToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
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
    name: "getRegisteredTokens",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserTokenBalances",
    outputs: [
      { internalType: "address[]", name: "tokens", type: "address[]" },
      { internalType: "uint256[]", name: "balances", type: "uint256[]" },
      { internalType: "uint256[]", name: "contractBalances", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "getTokenInfo",
    outputs: [
      { internalType: "string", name: "symbol", type: "string" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "uint8", name: "decimals", type: "uint8" },
      { internalType: "bool", name: "success", type: "bool" },
    ],
    stateMutability: "view",
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
  contractBalance: string;
  value: string;
  color: string;
  address: string;
  decimals: number;
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

// Dummy token price function (replace with actual price feed integration)
function getDummyTokenPrice(symbol: string, chainId: number): number {
  const basePrices: { [key: string]: number } = {
    BTC: 60000,
    ETH: 3000,
    USDC: 1,
    USDT: 1,
  };
  const chainMultiplier = chainId === 43114 ? 1 : 0.95;
  return (basePrices[symbol] || 1) * chainMultiplier;
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
  const chainId = chain?.id || 84532; // Default to Base
  const CONTRACT_ADDRESS = CONTRACT_ADDRESS_MAP[chainId] || CONTRACT_ADDRESS_MAP[84532];

  const { data: userTokenData, error: contractError } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "getUserTokenBalances",
    args: [address],
    query: { enabled: !!isConnected && !!address && !!CONTRACT_ADDRESS },
  });

  const { writeContractAsync: approveToken } = useWriteContract();
  const { writeContractAsync: depositDust } = useWriteContract();
  const { readContract } = useReadContract();

  const [selectedFromTokens, setSelectedFromTokens] = useState<Token[]>([]);
  const [selectedToToken, setSelectedToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState<string>("0");
  const [toAmount, setToAmount] = useState<string>("0");
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState<boolean>(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState<boolean>(false);
  const [selectedThreshold, setSelectedThreshold] = useState<ThresholdOption>(thresholdOptions[0]);
  const [isThresholdDropdownOpen, setIsThresholdDropdownOpen] = useState<boolean>(false);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchTokensWithBalances = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!userTokenData) {
        setAvailableTokens([]);
        return;
      }

      const [tokenAddresses, balances, contractBalances] = userTokenData as [string[], bigint[], bigint[]];
      const tokensWithBalances: Token[] = [];

      for (let i = 0; i < tokenAddresses.length; i++) {
        const tokenAddress = tokenAddresses[i];
        try {
          // Get token info from contract
          const tokenInfo = await readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: "getTokenInfo",
            args: [tokenAddress],
          });

          const [symbol, name, decimals, success] = tokenInfo as [string, string, number, boolean];

          // Skip if token info fetch failed
          if (!success) {
            console.warn(`Token ${tokenAddress} info fetch failed`);
            continue;
          }

          const formattedBalance = ethers.formatUnits(balances[i], decimals);
          const formattedContractBalance = ethers.formatUnits(contractBalances[i], decimals);

          // Only include tokens with balance > 0
          if (parseFloat(formattedBalance) > 0) {
            const tokenPrice = getDummyTokenPrice(symbol, chainId);
            const value = `$${(parseFloat(formattedBalance) * tokenPrice).toFixed(2)}`;

            tokensWithBalances.push({
              symbol: symbol || tokenAddress.slice(0, 6),
              name: name || `Token ${tokenAddress.slice(0, 6)}...`,
              icon: <GenericTokenIcon />,
              balance: formattedBalance,
              contractBalance: formattedContractBalance,
              value,
              color: getTokenColor(symbol),
              address: tokenAddress,
              decimals,
            });
          }
        } catch (error) {
          console.error(`Failed to fetch details for token ${tokenAddress}:`, error);
          continue;
        }
      }

      setAvailableTokens(tokensWithBalances);

      // Auto-select the first token as "To" token if none selected
      if (tokensWithBalances.length > 0 && !selectedToToken) {
        setSelectedToToken(tokensWithBalances[0]);
      }
    } catch (error) {
      console.error("Failed to load tokens:", error);
      setError("Failed to load token balances. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!address || !userTokenData) return;

    const fetchData = async () => {
      try {
        await fetchTokensWithBalances();
      } catch (error) {
        console.error("Token loading error:", error);
        setError("Error loading tokens. Some tokens might not be displayed.");
      }
    };

    fetchData();
  }, [address, userTokenData, chainId, readContract, selectedToToken]);

  useEffect(() => {
    if (contractError) {
      console.error("Contract error:", contractError);
      setError("Failed to fetch user token balances from contract.");
    }
  }, [contractError]);

  const totalValue = selectedFromTokens.reduce((sum, token) => {
    return sum + Number.parseFloat(token.value.replace("$", ""));
  }, 0);

  const handleFromTokenSelect = (token: Token) => {
    const isAlreadySelected = selectedFromTokens.some((t) => t.address === token.address);
    let newSelection: Token[];

    if (isAlreadySelected) {
      newSelection = selectedFromTokens.filter((t) => t.address !== token.address);
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
    const newSelection = selectedFromTokens.filter((t) => t.address !== token.address);
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

  const handleConsolidate = async () => {
    if (!isConnected || !address || !selectedToToken || !CONTRACT_ADDRESS) {
      setError("Missing wallet connection, target token, or contract address for this chain.");
      return;
    }

    try {
      setError(null);
      const successMessages: string[] = [];
      const errorMessages: string[] = [];

      for (const token of selectedFromTokens) {
        const balance = Number.parseFloat(token.balance);
        if (balance > 0) {
          try {
            // Approve token
            await approveToken({
              address: token.address as `0x${string}`,
              abi: TOKEN_ABI,
              functionName: "approve",
              args: [CONTRACT_ADDRESS as `0x${string}`, ethers.parseUnits(token.balance, token.decimals)],
            });

            // Deposit dust
            await depositDust({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: CONTRACT_ABI,
              functionName: "depositDust",
              args: [token.address as `0x${string}`, ethers.parseUnits(token.balance, token.decimals)],
            });

            successMessages.push(`Successfully processed ${token.symbol || token.address.slice(0, 6)}`);
          } catch (tokenError) {
            console.error(`Failed to process token ${token.symbol || token.address}:`, tokenError);
            errorMessages.push(`Failed to process ${token.symbol || token.address.slice(0, 6)}`);
            continue;
          }
        }
      }

      // Call backend API for swapping
      try {
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

        setSelectedFromTokens([]);
        setToAmount("0");
        setFromAmount("0");

        let finalMessage = "";
        if (successMessages.length > 0) {
          finalMessage += `Success: ${successMessages.join(", ")}. `;
        }
        if (errorMessages.length > 0) {
          finalMessage += `Errors: ${errorMessages.join(", ")}`;
        }
        setError(finalMessage || "Consolidation completed with no tokens processed.");
      } catch (apiError) {
        console.error("API call failed:", apiError);
        setError("Consolidation completed but API update failed.");
      }
    } catch (error) {
      console.error("Consolidation failed:", error);
      setError("Consolidation failed. Please check your inputs or try again.");
    }
  };

  const handleThresholdSelect = (threshold: ThresholdOption) => {
    setSelectedThreshold(threshold);
    setIsThresholdDropdownOpen(false);
    if (threshold.value === "MAX") {
      setSelectedFromTokens(availableTokens);
    } else {
      setSelectedFromTokens(
        availableTokens.filter((token) => Number.parseFloat(token.value.replace("$", "")) <= threshold.value)
      );
    }
  };

  return (
    <div className="relative w-full max-w-md">
      {error && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm ${
            error.includes("Success") || error.includes("completed")
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
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
                            key={token.address}
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
                      <span className="font-medium dark:text-white">
                        {selectedFromTokens[0]?.symbol || "Select"}
                      </span>
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
                      {availableTokens.length > 0 ? (
                        availableTokens.map((token) => {
                          const isSelected = selectedFromTokens.some((t) => t.address === token.address);
                          return (
                            <button
                              key={token.address}
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
                                  <div className="font-medium dark:text-white">
                                    {token.symbol || token.address.slice(0, 6) + '...'}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {token.name || 'Unknown Token'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium dark:text-white">{token.balance}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{token.value}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  In Contract: {token.contractBalance}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          {isLoading ? "Loading tokens..." : "No tokens found in your wallet"}
                        </div>
                      )}
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
                      key={token.address}
                      className="flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs dark:border-gray-700 dark:bg-gray-700"
                    >
                      <div
                        className="mr-1 flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ backgroundColor: token.color }}
                      >
                        <span className="text-[8px] text-white">{token.icon}</span>
                      </div>
                      <span className="mr-1 dark:text-white">{token.symbol || token.address.slice(0, 6)}</span>
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
                          key={token.address}
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
                              <div className="font-medium dark:text-white">
                                {token.symbol || token.address.slice(0, 6) + '...'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {token.name || 'Unknown Token'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium dark:text-white">{token.balance}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{token.value}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              In Contract: {token.contractBalance}
                            </div>
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
          </div>

          <div className="p-6 pt-0">
            <button
              onClick={handleConsolidate}
              className="w-full rounded-lg bg-[#6B48FF] py-3 text-white font-medium hover:bg-[#5a3dd9] transition-colors"
              disabled={!selectedFromTokens.length || !selectedToToken || !CONTRACT_ADDRESS || !isConnected}
            >
              {CONTRACT_ADDRESS ? "Consolidate" : "Chain Not Supported"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">
          Please connect your wallet using the header to proceed.
        </div>
      )}
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