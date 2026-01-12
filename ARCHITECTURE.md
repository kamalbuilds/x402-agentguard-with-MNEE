# AgentGuard Architecture

## System Overview

AgentGuard is a payment governance middleware that sits between AI agents and payment protocols to provide spending controls, security guardrails, and audit capabilities.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AI AGENTS                                       │
│                    (Claude, GPT-4, Custom Agents)                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ MCP Protocol
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MCP SERVER                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐    │
│  │ agentguard  │  │ agentguard  │  │  agentguard  │  │   agentguard   │    │
│  │  _configure │  │    _pay     │  │   _balance   │  │ _check_limits  │    │
│  └─────────────┘  └─────────────┘  └──────────────┘  └────────────────┘    │
│  ┌─────────────┐  ┌──────────────────────┐                                  │
│  │ agentguard  │  │ agentguard           │                                  │
│  │  _history   │  │ _whitelist_check     │                                  │
│  └─────────────┘  └──────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ JSON-RPC / ethers.js
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SMART CONTRACTS (Base Mainnet)                        │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      AgentGuardVault.sol                              │  │
│  │                                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │  │
│  │  │  Spending   │  │  Circuit    │  │  Duplicate  │  │  Whitelist │  │  │
│  │  │   Limits    │  │  Breaker    │  │  Detection  │  │ Enforcement│  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │  │
│  │                                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────────┐  │  │
│  │  │  Approval   │  │   Audit     │  │     Multi-Agent Support      │  │  │
│  │  │  Workflow   │  │    Trail    │  │                              │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    MNEEx402Facilitator.sol                            │  │
│  │                                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────────┐  │  │
│  │  │  EIP-712    │  │   Nonce     │  │   x402 Payment               │  │  │
│  │  │ Signatures  │  │ Management  │  │   Requirements               │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         MNEE Token                                    │  │
│  │                 0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND DASHBOARD                                │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │  Dashboard  │  │   Agents    │  │  Payments   │  │     Whitelist       ││
│  │  Overview   │  │   Config    │  │   History   │  │     Management      ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘│
│  ┌─────────────┐  ┌─────────────────────────────────────────────────────┐  │
│  │   Alerts    │  │                   Settings                          │  │
│  │   Center    │  │                                                     │  │
│  └─────────────┘  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Smart Contracts

#### AgentGuardVault.sol
The core governance contract that manages all payment controls.

**Key Features:**
- **Spending Limits**: Per-transaction, daily, and monthly limits
- **Circuit Breaker**: Blocks more than 10 payments per minute
- **Duplicate Detection**: 5-minute window for identical payments
- **Whitelist**: Optional recipient address restrictions
- **Approval Workflow**: High-value transactions require owner approval
- **Audit Trail**: Complete history of all payment attempts

**Data Structures:**
```solidity
struct AgentConfig {
    uint256 perTransactionLimit;  // Max single payment
    uint256 dailyLimit;           // Max per day
    uint256 monthlyLimit;         // Max per month
    bool requiresApproval;        // Approval mode
    uint256 approvalThreshold;    // Threshold for approval
    bool whitelistEnabled;        // Whitelist enforcement
    bool isActive;                // Agent status
    uint256 lastPaymentTime;      // For circuit breaker
    uint256 paymentsInCurrentMinute; // Circuit breaker counter
}
```

#### MNEEx402Facilitator.sol
x402-compatible payment facilitator for MNEE stablecoin.

**Key Features:**
- **EIP-712 Signatures**: Typed data signing for authorization
- **Nonce Management**: Replay protection
- **Deposit/Withdraw**: User fund management
- **Payment Requirements**: Generates x402-compatible JSON
- **AgentGuard Integration**: Routes payments through governance

**x402 Authorization Structure:**
```solidity
struct X402Authorization {
    address from;        // Payer
    address to;          // Payee
    uint256 value;       // Amount
    uint256 validAfter;  // Start validity
    uint256 validBefore; // End validity
    bytes32 nonce;       // Unique nonce
    string resource;     // Resource URL
}
```

### 2. MCP Server

Provides AI agents with payment capabilities through the Model Context Protocol.

**Tools:**

| Tool | Description |
|------|-------------|
| `agentguard_configure` | Set vault address, RPC URL, agent credentials |
| `agentguard_pay` | Execute a payment with governance controls |
| `agentguard_balance` | Check balance and spending statistics |
| `agentguard_check_limits` | Pre-validate if payment would succeed |
| `agentguard_history` | Get payment history for an agent |
| `agentguard_whitelist_check` | Check if recipient is whitelisted |

**Integration Flow:**
```
1. Agent calls agentguard_configure with vault address
2. Agent calls agentguard_check_limits before payment
3. Agent calls agentguard_pay to execute payment
4. Transaction routes through AgentGuardVault
5. Governance checks applied (limits, whitelist, etc.)
6. If approved, payment executes on-chain
7. Result returned to agent
```

### 3. Frontend Dashboard

Next.js application for monitoring and management.

**Pages:**
- **Dashboard** (`/`): Overview with spending charts and stats
- **Agents** (`/agents`): Register and configure AI agents
- **Payments** (`/payments`): Complete payment history
- **Whitelist** (`/whitelist`): Manage approved recipients
- **Alerts** (`/alerts`): Security alerts and notifications
- **Settings** (`/settings`): Global configuration

**Tech Stack:**
- Next.js 14 with App Router
- Tailwind CSS + shadcn/ui
- wagmi + viem for Web3
- RainbowKit for wallet connection
- Recharts for data visualization

## Security Model

### Defense Layers

```
┌──────────────────────────────────────────────────────────────┐
│                     Layer 1: Per-Transaction                  │
│                     Maximum single payment limit              │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     Layer 2: Daily Limits                     │
│                     Maximum spending per day                  │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     Layer 3: Monthly Limits                   │
│                     Maximum spending per month                │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     Layer 4: Circuit Breaker                  │
│                     Max 10 payments per minute                │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     Layer 5: Duplicate Detection              │
│                     5-minute window for identical payments    │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     Layer 6: Whitelist                        │
│                     Only approved recipients                  │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     Layer 7: Approval Workflow                │
│                     High-value transactions require approval  │
└──────────────────────────────────────────────────────────────┘
```

### Attack Scenarios Prevented

1. **Runaway AI Loops**
   - Circuit breaker stops after 10 payments/minute
   - Maximum damage: ~$0.50 vs $47,000 without protection

2. **Prompt Injection**
   - Whitelist blocks unauthorized recipients
   - Per-transaction limits cap maximum loss

3. **Accidental Double-Payments**
   - Duplicate detection blocks identical payments within 5 minutes

4. **Budget Overruns**
   - Daily and monthly limits enforce spending caps
   - Real-time tracking prevents overspending

## Data Flow

### Payment Execution Flow

```
AI Agent                    MCP Server              AgentGuardVault           MNEE Token
    │                           │                         │                        │
    │  agentguard_pay()         │                         │                        │
    ├─────────────────────────►│                         │                        │
    │                           │                         │                        │
    │                           │  executePayment()       │                        │
    │                           ├───────────────────────►│                        │
    │                           │                         │                        │
    │                           │                         │  Check per-tx limit    │
    │                           │                         ├─────────┐              │
    │                           │                         │◄────────┘              │
    │                           │                         │                        │
    │                           │                         │  Check daily limit     │
    │                           │                         ├─────────┐              │
    │                           │                         │◄────────┘              │
    │                           │                         │                        │
    │                           │                         │  Check monthly limit   │
    │                           │                         ├─────────┐              │
    │                           │                         │◄────────┘              │
    │                           │                         │                        │
    │                           │                         │  Check circuit breaker │
    │                           │                         ├─────────┐              │
    │                           │                         │◄────────┘              │
    │                           │                         │                        │
    │                           │                         │  Check duplicate       │
    │                           │                         ├─────────┐              │
    │                           │                         │◄────────┘              │
    │                           │                         │                        │
    │                           │                         │  Check whitelist       │
    │                           │                         ├─────────┐              │
    │                           │                         │◄────────┘              │
    │                           │                         │                        │
    │                           │                         │  safeTransfer()        │
    │                           │                         ├───────────────────────►│
    │                           │                         │                        │
    │                           │                         │◄───────────────────────┤
    │                           │                         │                        │
    │                           │  PaymentRecord          │                        │
    │                           │◄───────────────────────┤                        │
    │                           │                         │                        │
    │  { success: true }        │                         │                        │
    │◄─────────────────────────┤                         │                        │
    │                           │                         │                        │
```

## Deployment Architecture

### Mainnet Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                       Base Mainnet                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ MNEE Token: 0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ AgentGuardVault: <deployed address>                    │ │
│  │                                                         │ │
│  │ - Owner: Deployer EOA                                  │ │
│  │ - MNEE Token: 0x8ccedba...                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ MNEEx402Facilitator: <deployed address>                │ │
│  │                                                         │ │
│  │ - Owner: Deployer EOA                                  │ │
│  │ - AgentGuardVault: <vault address>                     │ │
│  │ - MNEE Token: 0x8ccedba...                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Scripts

| Script | Purpose |
|--------|---------|
| `Deploy.s.sol` | Deploy both contracts |
| `RegisterAgent.s.sol` | Register a new AI agent |
| `DepositFunds.s.sol` | Deposit MNEE into vault |
| `UpdateLimits.s.sol` | Modify agent spending limits |
| `ManageWhitelist.s.sol` | Add/remove whitelisted addresses |

## Testing

### Test Coverage

| Contract | Tests | Status |
|----------|-------|--------|
| AgentGuardVault | 32 | All passing |
| MNEEx402Facilitator | 20 | All passing |
| **Total** | **52** | **All passing** |

### Test Categories

**AgentGuardVault Tests:**
- Agent registration and configuration
- Spending limit enforcement
- Circuit breaker activation
- Duplicate payment detection
- Whitelist operations
- Approval workflow
- Emergency pause/unpause
- Payment history tracking

**MNEEx402Facilitator Tests:**
- Deposit and withdrawal
- EIP-712 signature verification
- x402 authorization flow
- Nonce replay protection
- AgentGuard integration
- Payment requirements generation

## File Structure

```
agentguard/
├── contracts/
│   ├── AgentGuardVault.sol      # Core governance contract
│   └── MNEEx402Facilitator.sol  # x402 payment facilitator
├── test/
│   ├── AgentGuardVault.t.sol    # Vault tests (32 tests)
│   └── MNEEx402Facilitator.t.sol # Facilitator tests (20 tests)
├── scripts/
│   ├── Deploy.s.sol             # Deployment script
│   ├── RegisterAgent.s.sol      # Agent registration
│   ├── DepositFunds.s.sol       # Fund deposit
│   ├── UpdateLimits.s.sol       # Limit updates
│   └── ManageWhitelist.s.sol    # Whitelist management
├── src/mcp-server/
│   ├── index.ts                 # MCP server entry point
│   ├── types.ts                 # TypeScript types
│   └── contract-abis.ts         # Contract ABIs
├── frontend/
│   ├── app/                     # Next.js pages
│   ├── components/              # React components
│   ├── lib/                     # Utilities and contracts
│   └── hooks/                   # Custom React hooks
├── lib/                         # OpenZeppelin contracts
├── foundry.toml                 # Foundry configuration
├── README.md                    # Project documentation
└── ARCHITECTURE.md              # This file
```

## Future Enhancements

1. **Multi-signature Approvals**: Require multiple owners for high-value transactions
2. **Rate Limiting by Recipient**: Prevent concentration attacks
3. **ML-based Anomaly Detection**: Learn normal patterns and flag deviations
4. **Cross-chain Support**: Extend to other EVM chains
5. **Notification Webhooks**: Real-time alerts to external systems
6. **Role-based Access**: Granular permissions beyond owner/agent
