import { ethers } from "ethers";
import { useWriteContract } from "wagmi";

const CONTRACT_ADDRESS = "0x0B7Ea66B01011203Bad67885B53d66F52B418069"; // Example for chain ID 84532
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

interface token {
    tokenAddress: String
}

export default function WhitelistTokenButton({ tokenAddress }) {
  const { writeContractAsync } = useWriteContract();

  const handleWhitelistToken = async () => {
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "whitelistToken",
        args: [tokenAddress, true], // Whitelist the token
      });
      console.log(`Token ${tokenAddress} whitelisted successfully`);
    } catch (error) {
      console.error("Failed to whitelist token:", error);
    }
  };

  return (
    <button onClick={handleWhitelistToken} className="rounded-lg bg-blue-500 text-white px-4 py-2">
      Whitelist Token
    </button>
  );
}