/**
 * AgentGuard MCP Server - TypeScript Types
 * Defines interfaces for the payment governance layer for AI agents
 */

// ============ Configuration Types ============

/**
 * Agent configuration stored in the vault
 */
export interface AgentConfig {
  perTransactionLimit: bigint;
  dailyLimit: bigint;
  monthlyLimit: bigint;
  dailySpent: bigint;
  monthlySpent: bigint;
  lastDayReset: bigint;
  lastMonthReset: bigint;
  requiresApproval: boolean;
  approvalThreshold: bigint;
  isActive: boolean;
  authorizedCaller: string;
}

/**
 * Configuration for the MCP server connection
 */
export interface ServerConfig {
  vaultAddress: string;
  rpcUrl: string;
  privateKey?: string;
  agentId: string;
  chainId?: number;
}

/**
 * Current runtime configuration state
 */
export interface RuntimeConfig {
  configured: boolean;
  vaultAddress: string | null;
  rpcUrl: string | null;
  agentId: string | null;
  chainId: number | null;
  hasPrivateKey: boolean;
}

// ============ Payment Types ============

/**
 * Payment record from the vault
 */
export interface PaymentRecord {
  paymentId: string;
  recipient: string;
  amount: bigint;
  reason: string;
  timestamp: bigint;
  flagged: boolean;
}

/**
 * Serialized payment record for API responses
 */
export interface SerializedPaymentRecord {
  paymentId: string;
  recipient: string;
  amount: string;
  amountFormatted: string;
  reason: string;
  timestamp: number;
  date: string;
  flagged: boolean;
}

/**
 * Payment request input
 */
export interface PaymentRequest {
  recipient: string;
  amount: string;
  reason: string;
}

/**
 * Payment execution result
 */
export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  paymentId?: string;
  error?: string;
  blockReason?: string;
  gasUsed?: string;
}

// ============ Balance & Stats Types ============

/**
 * Agent statistics from the vault
 */
export interface AgentStats {
  balance: bigint;
  dailySpent: bigint;
  monthlySpent: bigint;
  dailyLimit: bigint;
  monthlyLimit: bigint;
  perTxLimit: bigint;
  totalPayments: bigint;
  isActive: boolean;
}

/**
 * Serialized agent stats for API responses
 */
export interface SerializedAgentStats {
  balance: string;
  balanceFormatted: string;
  dailySpent: string;
  dailySpentFormatted: string;
  monthlySpent: string;
  monthlySpentFormatted: string;
  dailyLimit: string;
  dailyLimitFormatted: string;
  monthlyLimit: string;
  monthlyLimitFormatted: string;
  perTxLimit: string;
  perTxLimitFormatted: string;
  dailyRemaining: string;
  dailyRemainingFormatted: string;
  monthlyRemaining: string;
  monthlyRemainingFormatted: string;
  totalPayments: number;
  isActive: boolean;
}

// ============ Limit Check Types ============

/**
 * Result of pre-checking if a payment would succeed
 */
export interface LimitCheckResult {
  wouldSucceed: boolean;
  reason: string;
  details: {
    hasBalance: boolean;
    withinPerTxLimit: boolean;
    withinDailyLimit: boolean;
    withinMonthlyLimit: boolean;
    recipientWhitelisted: boolean | null;
    currentBalance: string;
    requestedAmount: string;
  };
}

// ============ Whitelist Types ============

/**
 * Whitelist check result
 */
export interface WhitelistCheckResult {
  isWhitelisted: boolean;
  whitelistEnforced: boolean;
  recipient: string;
  agentId: string;
}

// ============ History Types ============

/**
 * Payment history request parameters
 */
export interface HistoryRequest {
  offset?: number;
  limit?: number;
}

/**
 * Payment history response
 */
export interface PaymentHistoryResponse {
  payments: SerializedPaymentRecord[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

// ============ Approval Types ============

/**
 * Pending approval request from the vault
 */
export interface ApprovalRequest {
  agentId: string;
  recipient: string;
  amount: bigint;
  reason: string;
  timestamp: bigint;
  executed: boolean;
  rejected: boolean;
}

/**
 * Serialized approval request for API responses
 */
export interface SerializedApprovalRequest {
  index: number;
  agentId: string;
  recipient: string;
  amount: string;
  amountFormatted: string;
  reason: string;
  timestamp: number;
  date: string;
  executed: boolean;
  rejected: boolean;
  status: 'pending' | 'executed' | 'rejected';
}

// ============ Error Types ============

/**
 * Standard error response
 */
export interface ErrorResponse {
  error: string;
  code: ErrorCode;
  details?: Record<string, unknown>;
}

/**
 * Error codes for the MCP server
 */
export enum ErrorCode {
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_AGENT_ID = 'INVALID_AGENT_ID',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  EXCEEDS_PER_TX_LIMIT = 'EXCEEDS_PER_TX_LIMIT',
  EXCEEDS_DAILY_LIMIT = 'EXCEEDS_DAILY_LIMIT',
  EXCEEDS_MONTHLY_LIMIT = 'EXCEEDS_MONTHLY_LIMIT',
  RECIPIENT_NOT_WHITELISTED = 'RECIPIENT_NOT_WHITELISTED',
  CIRCUIT_BREAKER_TRIGGERED = 'CIRCUIT_BREAKER_TRIGGERED',
  DUPLICATE_PAYMENT = 'DUPLICATE_PAYMENT',
  AGENT_NOT_ACTIVE = 'AGENT_NOT_ACTIVE',
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ============ Tool Input Types ============

/**
 * Input for agentguard_configure tool
 */
export interface ConfigureInput {
  vaultAddress: string;
  rpcUrl: string;
  agentId: string;
  privateKey?: string;
  chainId?: number;
}

/**
 * Input for agentguard_pay tool
 */
export interface PayInput {
  recipient: string;
  amount: string;
  reason: string;
}

/**
 * Input for agentguard_check_limits tool
 */
export interface CheckLimitsInput {
  recipient: string;
  amount: string;
}

/**
 * Input for agentguard_history tool
 */
export interface HistoryInput {
  offset?: number;
  limit?: number;
}

/**
 * Input for agentguard_whitelist_check tool
 */
export interface WhitelistCheckInput {
  recipient: string;
}

// ============ Constants ============

/**
 * MNEE token configuration
 */
export const MNEE_CONFIG = {
  address: '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF',
  decimals: 6,
  symbol: 'MNEE',
  name: 'MNEE Token',
} as const;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  chainId: 1, // Ethereum mainnet
  historyLimit: 50,
  historyMaxLimit: 100,
} as const;

/**
 * Contract constants from AgentGuardVault
 */
export const CONTRACT_CONSTANTS = {
  DUPLICATE_WINDOW: 5 * 60, // 5 minutes in seconds
  MAX_PAYMENTS_PER_MINUTE: 10,
  DAY_DURATION: 24 * 60 * 60, // 1 day in seconds
  MONTH_DURATION: 30 * 24 * 60 * 60, // 30 days in seconds
} as const;
