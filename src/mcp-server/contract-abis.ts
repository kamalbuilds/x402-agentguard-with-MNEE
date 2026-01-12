/**
 * AgentGuard MCP Server - Contract ABIs
 * Contains the ABI for the AgentGuardVault contract
 */

/**
 * AgentGuardVault contract ABI
 * Provides payment governance for AI agents with spending controls
 */
export const AGENT_GUARD_VAULT_ABI = [
  // Constructor
  {
    inputs: [{ internalType: 'address', name: '_mneeToken', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: false, internalType: 'address', name: 'authorizedCaller', type: 'address' },
    ],
    name: 'AgentRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'bytes32', name: 'agentId', type: 'bytes32' }],
    name: 'AgentConfigUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'reason', type: 'string' },
      { indexed: false, internalType: 'bytes32', name: 'paymentId', type: 'bytes32' },
    ],
    name: 'PaymentExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'blockReason', type: 'string' },
    ],
    name: 'PaymentBlocked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'paymentCount', type: 'uint256' },
    ],
    name: 'CircuitBreakerTriggered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { indexed: false, internalType: 'bytes32', name: 'paymentHash', type: 'bytes32' },
    ],
    name: 'DuplicateDetected',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { indexed: true, internalType: 'uint256', name: 'approvalIndex', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'recipient', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'ApprovalRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { indexed: true, internalType: 'uint256', name: 'approvalIndex', type: 'uint256' },
    ],
    name: 'ApprovalExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { indexed: true, internalType: 'uint256', name: 'approvalIndex', type: 'uint256' },
    ],
    name: 'ApprovalRejected',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'depositor', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'Deposit',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'Withdrawal',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'allowed', type: 'bool' },
    ],
    name: 'WhitelistUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'bytes32', name: 'agentId', type: 'bytes32' }],
    name: 'AgentPaused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'bytes32', name: 'agentId', type: 'bytes32' }],
    name: 'AgentResumed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },

  // Read-only functions (view/pure)
  {
    inputs: [],
    name: 'DUPLICATE_WINDOW',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MAX_PAYMENTS_PER_MINUTE',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'DAY_DURATION',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MONTH_DURATION',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mneeToken',
    outputs: [{ internalType: 'contract IERC20', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'agents',
    outputs: [
      { internalType: 'uint256', name: 'perTransactionLimit', type: 'uint256' },
      { internalType: 'uint256', name: 'dailyLimit', type: 'uint256' },
      { internalType: 'uint256', name: 'monthlyLimit', type: 'uint256' },
      { internalType: 'uint256', name: 'dailySpent', type: 'uint256' },
      { internalType: 'uint256', name: 'monthlySpent', type: 'uint256' },
      { internalType: 'uint256', name: 'lastDayReset', type: 'uint256' },
      { internalType: 'uint256', name: 'lastMonthReset', type: 'uint256' },
      { internalType: 'bool', name: 'requiresApproval', type: 'bool' },
      { internalType: 'uint256', name: 'approvalThreshold', type: 'uint256' },
      { internalType: 'bool', name: 'isActive', type: 'bool' },
      { internalType: 'address', name: 'authorizedCaller', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'agentBalances',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'agentWhitelist',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'whitelistEnforced',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'bytes32', name: '', type: 'bytes32' },
    ],
    name: 'recentPayments',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    name: 'paymentHistory',
    outputs: [
      { internalType: 'bytes32', name: 'paymentId', type: 'bytes32' },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'reason', type: 'string' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { internalType: 'bool', name: 'flagged', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'paymentCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'lastPaymentWindow',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    name: 'pendingApprovals',
    outputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'reason', type: 'string' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { internalType: 'bool', name: 'executed', type: 'bool' },
      { internalType: 'bool', name: 'rejected', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'agentId', type: 'bytes32' }],
    name: 'getAgentStats',
    outputs: [
      { internalType: 'uint256', name: 'balance', type: 'uint256' },
      { internalType: 'uint256', name: 'dailySpent', type: 'uint256' },
      { internalType: 'uint256', name: 'monthlySpent', type: 'uint256' },
      { internalType: 'uint256', name: 'dailyLimit', type: 'uint256' },
      { internalType: 'uint256', name: 'monthlyLimit', type: 'uint256' },
      { internalType: 'uint256', name: 'perTxLimit', type: 'uint256' },
      { internalType: 'uint256', name: 'totalPayments', type: 'uint256' },
      { internalType: 'bool', name: 'isActive', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getPaymentHistory',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'paymentId', type: 'bytes32' },
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'string', name: 'reason', type: 'string' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'bool', name: 'flagged', type: 'bool' },
        ],
        internalType: 'struct AgentGuardVault.PaymentRecord[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'agentId', type: 'bytes32' }],
    name: 'getPendingApprovals',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'string', name: 'reason', type: 'string' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'bool', name: 'executed', type: 'bool' },
          { internalType: 'bool', name: 'rejected', type: 'bool' },
        ],
        internalType: 'struct AgentGuardVault.ApprovalRequest[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'checkPayment',
    outputs: [
      { internalType: 'bool', name: 'wouldSucceed', type: 'bool' },
      { internalType: 'string', name: 'reason', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },

  // State-modifying functions
  {
    inputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'uint256', name: 'perTxLimit', type: 'uint256' },
      { internalType: 'uint256', name: 'dailyLimit', type: 'uint256' },
      { internalType: 'uint256', name: 'monthlyLimit', type: 'uint256' },
      { internalType: 'bool', name: 'requiresApproval', type: 'bool' },
      { internalType: 'uint256', name: 'approvalThreshold', type: 'uint256' },
      { internalType: 'address', name: 'authorizedCaller', type: 'address' },
    ],
    name: 'registerAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'reason', type: 'string' },
    ],
    name: 'executePayment',
    outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'uint256', name: 'approvalIndex', type: 'uint256' },
    ],
    name: 'executeApproval',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'uint256', name: 'approvalIndex', type: 'uint256' },
    ],
    name: 'rejectApproval',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'bool', name: 'allowed', type: 'bool' },
    ],
    name: 'setWhitelist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'address[]', name: 'recipients', type: 'address[]' },
      { internalType: 'bool[]', name: 'allowed', type: 'bool[]' },
    ],
    name: 'batchSetWhitelist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'bool', name: 'enforced', type: 'bool' },
    ],
    name: 'setWhitelistEnforced',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'uint256', name: 'perTxLimit', type: 'uint256' },
      { internalType: 'uint256', name: 'dailyLimit', type: 'uint256' },
      { internalType: 'uint256', name: 'monthlyLimit', type: 'uint256' },
    ],
    name: 'updateLimits',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'bool', name: 'requiresApproval', type: 'bool' },
      { internalType: 'uint256', name: 'approvalThreshold', type: 'uint256' },
    ],
    name: 'updateApprovalSettings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'address', name: 'newCaller', type: 'address' },
    ],
    name: 'updateAuthorizedCaller',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'agentId', type: 'bytes32' }],
    name: 'pauseAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'agentId', type: 'bytes32' }],
    name: 'resumeAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'agentId', type: 'bytes32' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

/**
 * ERC20 Token ABI (minimal for balance/approve/transfer)
 */
export const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export default AGENT_GUARD_VAULT_ABI;
