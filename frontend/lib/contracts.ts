export const MNEE_TOKEN_ADDRESS = "0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF" as const

// AgentGuardVault contract address - deployed to Ethereum mainnet
export const AGENT_GUARD_VAULT_ADDRESS = "0x9415F22d4eAA120f34C7fE37377D60B8d59850Ad" as const

export const MNEE_TOKEN_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
] as const

export const AGENT_GUARD_VAULT_ABI = [
  {
    type: "constructor",
    inputs: [{ name: "_mneeToken", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "DAY_DURATION",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "DUPLICATE_WINDOW",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_PAYMENTS_PER_MINUTE",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MONTH_DURATION",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "agentBalances",
    inputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "agentWhitelist",
    inputs: [
      { name: "", type: "bytes32", internalType: "bytes32" },
      { name: "", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "agents",
    inputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    outputs: [
      { name: "perTransactionLimit", type: "uint256", internalType: "uint256" },
      { name: "dailyLimit", type: "uint256", internalType: "uint256" },
      { name: "monthlyLimit", type: "uint256", internalType: "uint256" },
      { name: "dailySpent", type: "uint256", internalType: "uint256" },
      { name: "monthlySpent", type: "uint256", internalType: "uint256" },
      { name: "lastDayReset", type: "uint256", internalType: "uint256" },
      { name: "lastMonthReset", type: "uint256", internalType: "uint256" },
      { name: "requiresApproval", type: "bool", internalType: "bool" },
      { name: "approvalThreshold", type: "uint256", internalType: "uint256" },
      { name: "isActive", type: "bool", internalType: "bool" },
      { name: "authorizedCaller", type: "address", internalType: "address" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "batchSetWhitelist",
    inputs: [
      { name: "agentId", type: "bytes32", internalType: "bytes32" },
      { name: "recipients", type: "address[]", internalType: "address[]" },
      { name: "allowed", type: "bool[]", internalType: "bool[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "checkPayment",
    inputs: [
      { name: "agentId", type: "bytes32", internalType: "bytes32" },
      { name: "recipient", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "wouldSucceed", type: "bool", internalType: "bool" },
      { name: "reason", type: "string", internalType: "string" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "agentId", type: "bytes32", internalType: "bytes32" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "executeApproval",
    inputs: [
      { name: "agentId", type: "bytes32", internalType: "bytes32" },
      { name: "approvalIndex", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "executePayment",
    inputs: [
      { name: "agentId", type: "bytes32", internalType: "bytes32" },
      { name: "recipient", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "reason", type: "string", internalType: "string" },
    ],
    outputs: [{ name: "success", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAgentStats",
    inputs: [{ name: "agentId", type: "bytes32", internalType: "bytes32" }],
    outputs: [
      { name: "balance", type: "uint256", internalType: "uint256" },
      { name: "dailySpent", type: "uint256", internalType: "uint256" },
      { name: "monthlySpent", type: "uint256", internalType: "uint256" },
      { name: "dailyLimit", type: "uint256", internalType: "uint256" },
      { name: "monthlyLimit", type: "uint256", internalType: "uint256" },
      { name: "perTxLimit", type: "uint256", internalType: "uint256" },
      { name: "totalPayments", type: "uint256", internalType: "uint256" },
      { name: "isActive", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPaymentHistory",
    inputs: [
      { name: "agentId", type: "bytes32", internalType: "bytes32" },
      { name: "offset", type: "uint256", internalType: "uint256" },
      { name: "limit", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct AgentGuardVault.PaymentRecord[]",
        components: [
          { name: "paymentId", type: "bytes32", internalType: "bytes32" },
          { name: "recipient", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "reason", type: "string", internalType: "string" },
          { name: "timestamp", type: "uint256", internalType: "uint256" },
          { name: "flagged", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPendingApprovals",
    inputs: [{ name: "agentId", type: "bytes32", internalType: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct AgentGuardVault.ApprovalRequest[]",
        components: [
          { name: "agentId", type: "bytes32", internalType: "bytes32" },
          { name: "recipient", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "reason", type: "string", internalType: "string" },
          { name: "timestamp", type: "uint256", internalType: "uint256" },
          { name: "executed", type: "bool", internalType: "bool" },
          { name: "rejected", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "mneeToken",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IERC20" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pauseAgent",
    inputs: [{ name: "agentId", type: "bytes32", internalType: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "paymentCount",
    inputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerAgent",
    inputs: [
      { name: "agentId", type: "bytes32", internalType: "bytes32" },
      { name: "perTxLimit", type: "uint256", internalType: "uint256" },
      { name: "dailyLimit", type: "uint256", internalType: "uint256" },
      { name: "monthlyLimit", type: "uint256", internalType: "uint256" },
      { name: "requiresApproval", type: "bool", internalType: "bool" },
      { name: "approvalThreshold", type: "uint256", internalType: "uint256" },
      { name: "authorizedCaller", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "rejectApproval",
    inputs: [
      { name: "agentId", type: "bytes32", internalType: "bytes32" },
      { name: "approvalIndex", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resumeAgent",
    inputs: [{ name: "agentId", type: "bytes32", internalType: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setWhitelist",
    inputs: [
      { name: "agentId", type: "bytes32", internalType: "bytes32" },
      { name: "recipient", type: "address", internalType: "address" },
      { name: "allowed", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setWhitelistEnforced",
    inputs: [
      { name: "agentId", type: "bytes32", internalType: "bytes32" },
      { name: "enforced", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateApprovalSettings",
    inputs: [
      { name: "agentId", type: "bytes32", internalType: "bytes32" },
      { name: "requiresApproval", type: "bool", internalType: "bool" },
      { name: "approvalThreshold", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateAuthorizedCaller",
    inputs: [
      { name: "agentId", type: "bytes32", internalType: "bytes32" },
      { name: "newCaller", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateLimits",
    inputs: [
      { name: "agentId", type: "bytes32", internalType: "bytes32" },
      { name: "perTxLimit", type: "uint256", internalType: "uint256" },
      { name: "dailyLimit", type: "uint256", internalType: "uint256" },
      { name: "monthlyLimit", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "whitelistEnforced",
    inputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "agentId", type: "bytes32", internalType: "bytes32" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "recipient", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "AgentConfigUpdated",
    inputs: [{ name: "agentId", type: "bytes32", indexed: true, internalType: "bytes32" }],
    anonymous: false,
  },
  {
    type: "event",
    name: "AgentPaused",
    inputs: [{ name: "agentId", type: "bytes32", indexed: true, internalType: "bytes32" }],
    anonymous: false,
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "owner", type: "address", indexed: true, internalType: "address" },
      { name: "authorizedCaller", type: "address", indexed: false, internalType: "address" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "AgentResumed",
    inputs: [{ name: "agentId", type: "bytes32", indexed: true, internalType: "bytes32" }],
    anonymous: false,
  },
  {
    type: "event",
    name: "ApprovalExecuted",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "approvalIndex", type: "uint256", indexed: true, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ApprovalRejected",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "approvalIndex", type: "uint256", indexed: true, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ApprovalRequested",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "approvalIndex", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "recipient", type: "address", indexed: false, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "CircuitBreakerTriggered",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "paymentCount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Deposit",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "depositor", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "DuplicateDetected",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "paymentHash", type: "bytes32", indexed: false, internalType: "bytes32" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PaymentBlocked",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "recipient", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "blockReason", type: "string", indexed: false, internalType: "string" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PaymentExecuted",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "recipient", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "reason", type: "string", indexed: false, internalType: "string" },
      { name: "paymentId", type: "bytes32", indexed: false, internalType: "bytes32" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WhitelistUpdated",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "recipient", type: "address", indexed: true, internalType: "address" },
      { name: "allowed", type: "bool", indexed: false, internalType: "bool" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Withdrawal",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "recipient", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
] as const

export type PaymentRecord = {
  paymentId: `0x${string}`
  recipient: `0x${string}`
  amount: bigint
  reason: string
  timestamp: bigint
  flagged: boolean
}

export type ApprovalRequest = {
  agentId: `0x${string}`
  recipient: `0x${string}`
  amount: bigint
  reason: string
  timestamp: bigint
  executed: boolean
  rejected: boolean
}

export type AgentStats = {
  balance: bigint
  dailySpent: bigint
  monthlySpent: bigint
  dailyLimit: bigint
  monthlyLimit: bigint
  perTxLimit: bigint
  totalPayments: bigint
  isActive: boolean
}
