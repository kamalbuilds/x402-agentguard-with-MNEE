#!/usr/bin/env node
/**
 * AgentGuard MCP Server
 * Provides AI agents with payment capabilities through the AgentGuardVault contract
 *
 * Tools:
 * - agentguard_configure: Configure the agent with vault address, RPC, etc.
 * - agentguard_pay: Execute a payment with spending controls
 * - agentguard_balance: Check agent balance and spending stats
 * - agentguard_check_limits: Pre-check if payment would succeed
 * - agentguard_history: Get payment history
 * - agentguard_whitelist_check: Check if recipient is whitelisted
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ethers, Contract, Wallet, JsonRpcProvider, formatUnits, parseUnits } from 'ethers';

import {
  ConfigureInput,
  PayInput,
  CheckLimitsInput,
  HistoryInput,
  WhitelistCheckInput,
  RuntimeConfig,
  SerializedAgentStats,
  SerializedPaymentRecord,
  PaymentHistoryResponse,
  LimitCheckResult,
  WhitelistCheckResult,
  PaymentResult,
  ErrorCode,
  MNEE_CONFIG,
  DEFAULT_CONFIG,
} from './types.js';

import { AGENT_GUARD_VAULT_ABI } from './contract-abis.js';

// ============ Server State ============

let runtimeConfig: RuntimeConfig = {
  configured: false,
  vaultAddress: null,
  rpcUrl: null,
  agentId: null,
  chainId: null,
  hasPrivateKey: false,
};

let provider: JsonRpcProvider | null = null;
let wallet: Wallet | null = null;
let vaultContract: Contract | null = null;

// ============ Utility Functions ============

/**
 * Format amount from wei to human-readable with MNEE decimals
 */
function formatMnee(amount: bigint): string {
  return formatUnits(amount, MNEE_CONFIG.decimals);
}

/**
 * Parse amount from human-readable to wei with MNEE decimals
 */
function parseMnee(amount: string): bigint {
  return parseUnits(amount, MNEE_CONFIG.decimals);
}

/**
 * Convert agent ID string to bytes32
 */
function agentIdToBytes32(agentId: string): string {
  // If already bytes32 format, return as-is
  if (agentId.startsWith('0x') && agentId.length === 66) {
    return agentId;
  }
  // Otherwise, convert string to bytes32
  return ethers.encodeBytes32String(agentId.slice(0, 31));
}

/**
 * Validate Ethereum address
 */
function isValidAddress(address: string): boolean {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format timestamp to ISO date string
 */
function formatTimestamp(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toISOString();
}

/**
 * Check if server is configured
 */
function ensureConfigured(): void {
  if (!runtimeConfig.configured || !vaultContract) {
    throw new Error('Server not configured. Call agentguard_configure first.');
  }
}

/**
 * Check if server has write capability
 */
function ensureCanWrite(): void {
  ensureConfigured();
  if (!wallet) {
    throw new Error('No private key configured. Cannot execute transactions.');
  }
}

// ============ Tool Handlers ============

/**
 * Configure the MCP server
 */
async function handleConfigure(input: ConfigureInput): Promise<object> {
  // Validate inputs
  if (!isValidAddress(input.vaultAddress)) {
    throw new Error(`Invalid vault address: ${input.vaultAddress}`);
  }

  if (!input.rpcUrl) {
    throw new Error('RPC URL is required');
  }

  if (!input.agentId) {
    throw new Error('Agent ID is required');
  }

  try {
    // Create provider
    provider = new JsonRpcProvider(input.rpcUrl);
    const network = await provider.getNetwork();

    // Create wallet if private key provided
    if (input.privateKey) {
      wallet = new Wallet(input.privateKey, provider);
    }

    // Create contract instance
    const signer = wallet || provider;
    vaultContract = new Contract(input.vaultAddress, AGENT_GUARD_VAULT_ABI, signer);

    // Update runtime config
    runtimeConfig = {
      configured: true,
      vaultAddress: input.vaultAddress,
      rpcUrl: input.rpcUrl,
      agentId: input.agentId,
      chainId: Number(network.chainId),
      hasPrivateKey: !!wallet,
    };

    // Verify contract by calling a view function
    const agentIdBytes32 = agentIdToBytes32(input.agentId);
    const stats = await vaultContract.getFunction('getAgentStats')(agentIdBytes32);

    return {
      success: true,
      message: 'AgentGuard MCP Server configured successfully',
      config: {
        vaultAddress: runtimeConfig.vaultAddress,
        agentId: runtimeConfig.agentId,
        chainId: runtimeConfig.chainId,
        hasPrivateKey: runtimeConfig.hasPrivateKey,
        agentActive: stats.isActive,
      },
    };
  } catch (error) {
    // Reset state on error
    provider = null;
    wallet = null;
    vaultContract = null;
    runtimeConfig = {
      configured: false,
      vaultAddress: null,
      rpcUrl: null,
      agentId: null,
      chainId: null,
      hasPrivateKey: false,
    };

    throw new Error(`Configuration failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Execute a payment
 */
async function handlePay(input: PayInput): Promise<PaymentResult> {
  ensureCanWrite();

  // Validate inputs
  if (!isValidAddress(input.recipient)) {
    return {
      success: false,
      error: `Invalid recipient address: ${input.recipient}`,
      blockReason: ErrorCode.INVALID_ADDRESS,
    };
  }

  let amount: bigint;
  try {
    amount = parseMnee(input.amount);
    if (amount <= 0n) {
      throw new Error('Amount must be positive');
    }
  } catch (error) {
    return {
      success: false,
      error: `Invalid amount: ${input.amount}`,
      blockReason: ErrorCode.INVALID_AMOUNT,
    };
  }

  if (!input.reason || input.reason.trim().length === 0) {
    return {
      success: false,
      error: 'Payment reason is required',
      blockReason: ErrorCode.UNKNOWN_ERROR,
    };
  }

  const agentIdBytes32 = agentIdToBytes32(runtimeConfig.agentId!);

  try {
    // Pre-check if payment would succeed
    const checkPaymentResult = await vaultContract!.getFunction('checkPayment')(
      agentIdBytes32,
      input.recipient,
      amount
    );
    const wouldSucceed = checkPaymentResult[0] as boolean;
    const checkReason = checkPaymentResult[1] as string;

    if (!wouldSucceed) {
      return {
        success: false,
        error: `Payment pre-check failed: ${checkReason}`,
        blockReason: checkReason,
      };
    }

    // Execute payment
    const tx = await vaultContract!.getFunction('executePayment')(
      agentIdBytes32,
      input.recipient,
      amount,
      input.reason
    );

    const receipt = await tx.wait();

    // Extract payment ID from events
    let paymentId: string | undefined;
    for (const log of receipt.logs) {
      try {
        const parsed = vaultContract!.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed && parsed.name === 'PaymentExecuted') {
          paymentId = parsed.args.paymentId;
          break;
        }
      } catch {
        // Skip logs that don't match our ABI
      }
    }

    return {
      success: true,
      transactionHash: receipt.hash,
      paymentId,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Parse revert reasons
    if (errorMessage.includes('Agent not active')) {
      return { success: false, error: errorMessage, blockReason: ErrorCode.AGENT_NOT_ACTIVE };
    }
    if (errorMessage.includes('Not authorized')) {
      return { success: false, error: errorMessage, blockReason: ErrorCode.NOT_AUTHORIZED };
    }
    if (errorMessage.includes('EXCEEDS_PER_TX_LIMIT')) {
      return { success: false, error: errorMessage, blockReason: ErrorCode.EXCEEDS_PER_TX_LIMIT };
    }
    if (errorMessage.includes('EXCEEDS_DAILY_LIMIT')) {
      return { success: false, error: errorMessage, blockReason: ErrorCode.EXCEEDS_DAILY_LIMIT };
    }
    if (errorMessage.includes('EXCEEDS_MONTHLY_LIMIT')) {
      return { success: false, error: errorMessage, blockReason: ErrorCode.EXCEEDS_MONTHLY_LIMIT };
    }
    if (errorMessage.includes('RECIPIENT_NOT_WHITELISTED')) {
      return { success: false, error: errorMessage, blockReason: ErrorCode.RECIPIENT_NOT_WHITELISTED };
    }
    if (errorMessage.includes('CIRCUIT_BREAKER')) {
      return { success: false, error: errorMessage, blockReason: ErrorCode.CIRCUIT_BREAKER_TRIGGERED };
    }
    if (errorMessage.includes('DUPLICATE')) {
      return { success: false, error: errorMessage, blockReason: ErrorCode.DUPLICATE_PAYMENT };
    }
    if (errorMessage.includes('INSUFFICIENT_BALANCE')) {
      return { success: false, error: errorMessage, blockReason: ErrorCode.INSUFFICIENT_BALANCE };
    }

    return {
      success: false,
      error: errorMessage,
      blockReason: ErrorCode.CONTRACT_ERROR,
    };
  }
}

/**
 * Get agent balance and spending stats
 */
async function handleBalance(): Promise<SerializedAgentStats> {
  ensureConfigured();

  const agentIdBytes32 = agentIdToBytes32(runtimeConfig.agentId!);

  try {
    const stats = await vaultContract!.getFunction('getAgentStats')(agentIdBytes32);

    const balance = stats[0] as bigint;
    const dailySpent = stats[1] as bigint;
    const monthlySpent = stats[2] as bigint;
    const dailyLimit = stats[3] as bigint;
    const monthlyLimit = stats[4] as bigint;
    const perTxLimit = stats[5] as bigint;
    const totalPayments = stats[6] as bigint;
    const isActive = stats[7] as boolean;

    const dailyRemaining = dailyLimit > dailySpent ? dailyLimit - dailySpent : 0n;
    const monthlyRemaining = monthlyLimit > monthlySpent ? monthlyLimit - monthlySpent : 0n;

    return {
      balance: balance.toString(),
      balanceFormatted: `${formatMnee(balance)} MNEE`,
      dailySpent: dailySpent.toString(),
      dailySpentFormatted: `${formatMnee(dailySpent)} MNEE`,
      monthlySpent: monthlySpent.toString(),
      monthlySpentFormatted: `${formatMnee(monthlySpent)} MNEE`,
      dailyLimit: dailyLimit.toString(),
      dailyLimitFormatted: `${formatMnee(dailyLimit)} MNEE`,
      monthlyLimit: monthlyLimit.toString(),
      monthlyLimitFormatted: `${formatMnee(monthlyLimit)} MNEE`,
      perTxLimit: perTxLimit.toString(),
      perTxLimitFormatted: `${formatMnee(perTxLimit)} MNEE`,
      dailyRemaining: dailyRemaining.toString(),
      dailyRemainingFormatted: `${formatMnee(dailyRemaining)} MNEE`,
      monthlyRemaining: monthlyRemaining.toString(),
      monthlyRemainingFormatted: `${formatMnee(monthlyRemaining)} MNEE`,
      totalPayments: Number(totalPayments),
      isActive: isActive,
    };
  } catch (error) {
    throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Pre-check if payment would succeed
 */
async function handleCheckLimits(input: CheckLimitsInput): Promise<LimitCheckResult> {
  ensureConfigured();

  if (!isValidAddress(input.recipient)) {
    return {
      wouldSucceed: false,
      reason: 'Invalid recipient address',
      details: {
        hasBalance: false,
        withinPerTxLimit: false,
        withinDailyLimit: false,
        withinMonthlyLimit: false,
        recipientWhitelisted: null,
        currentBalance: '0',
        requestedAmount: input.amount,
      },
    };
  }

  let amount: bigint;
  try {
    amount = parseMnee(input.amount);
  } catch {
    return {
      wouldSucceed: false,
      reason: 'Invalid amount format',
      details: {
        hasBalance: false,
        withinPerTxLimit: false,
        withinDailyLimit: false,
        withinMonthlyLimit: false,
        recipientWhitelisted: null,
        currentBalance: '0',
        requestedAmount: input.amount,
      },
    };
  }

  const agentIdBytes32 = agentIdToBytes32(runtimeConfig.agentId!);

  try {
    // Get stats for detailed breakdown
    const stats = await vaultContract!.getFunction('getAgentStats')(agentIdBytes32);

    // Check payment simulation
    const checkResult = await vaultContract!.getFunction('checkPayment')(
      agentIdBytes32,
      input.recipient,
      amount
    );
    const wouldSucceed = checkResult[0] as boolean;
    const reason = checkResult[1] as string;

    // Check whitelist
    const whitelistEnforced = await vaultContract!.getFunction('whitelistEnforced')(agentIdBytes32) as boolean;
    let recipientWhitelisted: boolean | null = null;
    if (whitelistEnforced) {
      recipientWhitelisted = await vaultContract!.getFunction('agentWhitelist')(agentIdBytes32, input.recipient) as boolean;
    }

    const balance = stats[0] as bigint;
    const dailySpent = stats[1] as bigint;
    const monthlySpent = stats[2] as bigint;
    const dailyLimit = stats[3] as bigint;
    const monthlyLimit = stats[4] as bigint;
    const perTxLimit = stats[5] as bigint;

    return {
      wouldSucceed,
      reason,
      details: {
        hasBalance: balance >= amount,
        withinPerTxLimit: amount <= perTxLimit,
        withinDailyLimit: dailySpent + amount <= dailyLimit,
        withinMonthlyLimit: monthlySpent + amount <= monthlyLimit,
        recipientWhitelisted,
        currentBalance: formatMnee(balance),
        requestedAmount: formatMnee(amount),
      },
    };
  } catch (error) {
    throw new Error(`Failed to check limits: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get payment history
 */
async function handleHistory(input: HistoryInput): Promise<PaymentHistoryResponse> {
  ensureConfigured();

  const offset = input.offset ?? 0;
  const limit = Math.min(input.limit ?? DEFAULT_CONFIG.historyLimit, DEFAULT_CONFIG.historyMaxLimit);

  const agentIdBytes32 = agentIdToBytes32(runtimeConfig.agentId!);

  try {
    // Get total payment count
    const stats = await vaultContract!.getFunction('getAgentStats')(agentIdBytes32);
    const total = Number(stats[6] as bigint);

    if (total === 0 || offset >= total) {
      return {
        payments: [],
        total,
        offset,
        limit,
        hasMore: false,
      };
    }

    // Fetch payment history
    const records = await vaultContract!.getFunction('getPaymentHistory')(agentIdBytes32, offset, limit);

    const payments: SerializedPaymentRecord[] = records.map((record: {
      paymentId: string;
      recipient: string;
      amount: bigint;
      reason: string;
      timestamp: bigint;
      flagged: boolean;
    }) => ({
      paymentId: record.paymentId,
      recipient: record.recipient,
      amount: record.amount.toString(),
      amountFormatted: `${formatMnee(record.amount)} MNEE`,
      reason: record.reason,
      timestamp: Number(record.timestamp),
      date: formatTimestamp(record.timestamp),
      flagged: record.flagged,
    }));

    return {
      payments,
      total,
      offset,
      limit,
      hasMore: offset + payments.length < total,
    };
  } catch (error) {
    throw new Error(`Failed to get history: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if recipient is whitelisted
 */
async function handleWhitelistCheck(input: WhitelistCheckInput): Promise<WhitelistCheckResult> {
  ensureConfigured();

  if (!isValidAddress(input.recipient)) {
    throw new Error(`Invalid recipient address: ${input.recipient}`);
  }

  const agentIdBytes32 = agentIdToBytes32(runtimeConfig.agentId!);

  try {
    const whitelistEnforced = await vaultContract!.getFunction('whitelistEnforced')(agentIdBytes32) as boolean;
    const isWhitelisted = await vaultContract!.getFunction('agentWhitelist')(agentIdBytes32, input.recipient) as boolean;

    return {
      isWhitelisted,
      whitelistEnforced,
      recipient: input.recipient,
      agentId: runtimeConfig.agentId!,
    };
  } catch (error) {
    throw new Error(`Failed to check whitelist: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ============ Tool Definitions ============

const TOOLS: Tool[] = [
  {
    name: 'agentguard_configure',
    description:
      'Configure the AgentGuard MCP server with vault address, RPC URL, and agent credentials. Must be called before using any other tools.',
    inputSchema: {
      type: 'object',
      properties: {
        vaultAddress: {
          type: 'string',
          description: 'The Ethereum address of the AgentGuardVault contract',
        },
        rpcUrl: {
          type: 'string',
          description: 'The JSON-RPC URL for the Ethereum node (e.g., https://eth-mainnet.g.alchemy.com/v2/...)',
        },
        agentId: {
          type: 'string',
          description: 'The unique identifier for this agent (max 31 characters, or bytes32 hex)',
        },
        privateKey: {
          type: 'string',
          description: 'Optional: Private key for signing transactions. Required for executing payments.',
        },
        chainId: {
          type: 'number',
          description: 'Optional: Chain ID (defaults to 1 for Ethereum mainnet)',
        },
      },
      required: ['vaultAddress', 'rpcUrl', 'agentId'],
    },
  },
  {
    name: 'agentguard_pay',
    description:
      'Execute a payment through the AgentGuardVault with full spending controls. Checks per-transaction limits, daily/monthly limits, whitelist, circuit breaker, and duplicate detection before processing.',
    inputSchema: {
      type: 'object',
      properties: {
        recipient: {
          type: 'string',
          description: 'The Ethereum address to receive the payment',
        },
        amount: {
          type: 'string',
          description: 'The amount to pay in MNEE tokens (e.g., "100" for 100 MNEE)',
        },
        reason: {
          type: 'string',
          description: 'Human-readable reason for the payment (for audit trail)',
        },
      },
      required: ['recipient', 'amount', 'reason'],
    },
  },
  {
    name: 'agentguard_balance',
    description:
      'Get the current balance and spending statistics for the configured agent, including daily/monthly spent amounts, remaining limits, and total payment count.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'agentguard_check_limits',
    description:
      'Pre-check if a payment would succeed without actually executing it. Returns detailed information about which limits would pass or fail.',
    inputSchema: {
      type: 'object',
      properties: {
        recipient: {
          type: 'string',
          description: 'The Ethereum address that would receive the payment',
        },
        amount: {
          type: 'string',
          description: 'The amount to check in MNEE tokens (e.g., "100" for 100 MNEE)',
        },
      },
      required: ['recipient', 'amount'],
    },
  },
  {
    name: 'agentguard_history',
    description:
      'Get the payment history for the configured agent. Returns a paginated list of past payments with amounts, recipients, reasons, and timestamps.',
    inputSchema: {
      type: 'object',
      properties: {
        offset: {
          type: 'number',
          description: 'Number of records to skip (for pagination). Default: 0',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of records to return. Default: 50, Max: 100',
        },
      },
      required: [],
    },
  },
  {
    name: 'agentguard_whitelist_check',
    description:
      'Check if a recipient address is whitelisted for payments from this agent, and whether whitelist enforcement is enabled.',
    inputSchema: {
      type: 'object',
      properties: {
        recipient: {
          type: 'string',
          description: 'The Ethereum address to check',
        },
      },
      required: ['recipient'],
    },
  },
];

// ============ MCP Server Setup ============

const server = new Server(
  {
    name: 'agentguard-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const toolArgs = args ?? {};

  try {
    let result: object;

    switch (name) {
      case 'agentguard_configure':
        result = await handleConfigure(toolArgs as unknown as ConfigureInput);
        break;

      case 'agentguard_pay':
        result = await handlePay(toolArgs as unknown as PayInput);
        break;

      case 'agentguard_balance':
        result = await handleBalance();
        break;

      case 'agentguard_check_limits':
        result = await handleCheckLimits(toolArgs as unknown as CheckLimitsInput);
        break;

      case 'agentguard_history':
        result = await handleHistory(toolArgs as unknown as HistoryInput);
        break;

      case 'agentguard_whitelist_check':
        result = await handleWhitelistCheck(toolArgs as unknown as WhitelistCheckInput);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: errorMessage,
            code: ErrorCode.UNKNOWN_ERROR,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// ============ Server Startup ============

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AgentGuard MCP Server started');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
