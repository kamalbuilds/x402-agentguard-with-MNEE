// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentGuardVault
 * @notice Payment governance layer for AI agents with spending controls
 * @dev Prevents runaway AI spending with per-tx/daily/monthly limits,
 *      circuit breakers, duplicate detection, and whitelist enforcement
 */
contract AgentGuardVault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /// @notice The MNEE token contract
    IERC20 public immutable mneeToken;

    /// @notice Agent configuration with spending limits
    struct AgentConfig {
        uint256 perTransactionLimit;    // Max amount per single payment
        uint256 dailyLimit;              // Max daily spending
        uint256 monthlyLimit;            // Max monthly spending
        uint256 dailySpent;              // Current day spending
        uint256 monthlySpent;            // Current month spending
        uint256 lastDayReset;            // Timestamp of last daily reset
        uint256 lastMonthReset;          // Timestamp of last monthly reset
        bool requiresApproval;           // Whether high-value txs need approval
        uint256 approvalThreshold;       // Amount above which approval is required
        bool isActive;                   // Whether agent is active
        address authorizedCaller;        // Address authorized to execute payments
    }

    /// @notice Record of a payment for audit trail
    struct PaymentRecord {
        bytes32 paymentId;
        address recipient;
        uint256 amount;
        string reason;
        uint256 timestamp;
        bool flagged;
    }

    /// @notice Pending approval request
    struct ApprovalRequest {
        bytes32 agentId;
        address recipient;
        uint256 amount;
        string reason;
        uint256 timestamp;
        bool executed;
        bool rejected;
    }

    // State variables
    mapping(bytes32 => AgentConfig) public agents;
    mapping(bytes32 => uint256) public agentBalances;
    mapping(bytes32 => mapping(address => bool)) public agentWhitelist;
    mapping(bytes32 => bool) public whitelistEnforced;
    mapping(bytes32 => mapping(bytes32 => uint256)) public recentPayments;
    mapping(bytes32 => PaymentRecord[]) public paymentHistory;
    mapping(bytes32 => uint256) public paymentCount;
    mapping(bytes32 => uint256) public lastPaymentWindow;
    mapping(bytes32 => ApprovalRequest[]) public pendingApprovals;

    // Constants
    uint256 public constant DUPLICATE_WINDOW = 5 minutes;
    uint256 public constant MAX_PAYMENTS_PER_MINUTE = 10;
    uint256 public constant DAY_DURATION = 1 days;
    uint256 public constant MONTH_DURATION = 30 days;

    // Events
    event AgentRegistered(bytes32 indexed agentId, address indexed owner, address authorizedCaller);
    event AgentConfigUpdated(bytes32 indexed agentId);
    event PaymentExecuted(bytes32 indexed agentId, address indexed recipient, uint256 amount, string reason, bytes32 paymentId);
    event PaymentBlocked(bytes32 indexed agentId, address indexed recipient, uint256 amount, string blockReason);
    event CircuitBreakerTriggered(bytes32 indexed agentId, uint256 paymentCount);
    event DuplicateDetected(bytes32 indexed agentId, bytes32 paymentHash);
    event ApprovalRequested(bytes32 indexed agentId, uint256 indexed approvalIndex, address recipient, uint256 amount);
    event ApprovalExecuted(bytes32 indexed agentId, uint256 indexed approvalIndex);
    event ApprovalRejected(bytes32 indexed agentId, uint256 indexed approvalIndex);
    event Deposit(bytes32 indexed agentId, address indexed depositor, uint256 amount);
    event Withdrawal(bytes32 indexed agentId, address indexed recipient, uint256 amount);
    event WhitelistUpdated(bytes32 indexed agentId, address indexed recipient, bool allowed);
    event AgentPaused(bytes32 indexed agentId);
    event AgentResumed(bytes32 indexed agentId);

    /// @notice Creates the AgentGuard vault
    /// @param _mneeToken Address of the MNEE token contract
    constructor(address _mneeToken) Ownable(msg.sender) {
        require(_mneeToken != address(0), "Invalid token address");
        mneeToken = IERC20(_mneeToken);
    }

    /// @notice Register a new agent with spending configuration
    /// @param agentId Unique identifier for the agent (bytes32)
    /// @param perTxLimit Maximum amount per transaction
    /// @param dailyLimit Maximum daily spending
    /// @param monthlyLimit Maximum monthly spending
    /// @param requiresApproval Whether high-value txs need owner approval
    /// @param approvalThreshold Amount above which approval is required
    /// @param authorizedCaller Address authorized to execute payments for this agent
    function registerAgent(
        bytes32 agentId,
        uint256 perTxLimit,
        uint256 dailyLimit,
        uint256 monthlyLimit,
        bool requiresApproval,
        uint256 approvalThreshold,
        address authorizedCaller
    ) external {
        require(!agents[agentId].isActive, "Agent already exists");
        require(authorizedCaller != address(0), "Invalid authorized caller");
        require(perTxLimit > 0 && dailyLimit > 0 && monthlyLimit > 0, "Limits must be > 0");
        require(perTxLimit <= dailyLimit && dailyLimit <= monthlyLimit, "Invalid limit hierarchy");

        agents[agentId] = AgentConfig({
            perTransactionLimit: perTxLimit,
            dailyLimit: dailyLimit,
            monthlyLimit: monthlyLimit,
            dailySpent: 0,
            monthlySpent: 0,
            lastDayReset: block.timestamp,
            lastMonthReset: block.timestamp,
            requiresApproval: requiresApproval,
            approvalThreshold: approvalThreshold,
            isActive: true,
            authorizedCaller: authorizedCaller
        });

        emit AgentRegistered(agentId, msg.sender, authorizedCaller);
    }

    /// @notice Deposit MNEE tokens for an agent
    /// @param agentId The agent to deposit for
    /// @param amount Amount of MNEE to deposit
    function deposit(bytes32 agentId, uint256 amount) external nonReentrant {
        require(agents[agentId].isActive, "Agent not registered");
        require(amount > 0, "Amount must be > 0");

        mneeToken.safeTransferFrom(msg.sender, address(this), amount);
        agentBalances[agentId] += amount;

        emit Deposit(agentId, msg.sender, amount);
    }

    /// @notice Execute a payment with full governance checks
    /// @param agentId The agent making the payment
    /// @param recipient Payment recipient
    /// @param amount Payment amount
    /// @param reason Human-readable reason for the payment
    /// @return success Whether the payment was executed
    function executePayment(
        bytes32 agentId,
        address recipient,
        uint256 amount,
        string calldata reason
    ) external nonReentrant returns (bool success) {
        AgentConfig storage config = agents[agentId];

        // Basic validation
        require(config.isActive, "Agent not active");
        require(msg.sender == config.authorizedCaller || msg.sender == owner(), "Not authorized");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");

        // Reset daily/monthly limits if needed
        _resetLimitsIfNeeded(agentId);

        // Check 1: Per-transaction limit
        if (amount > config.perTransactionLimit) {
            emit PaymentBlocked(agentId, recipient, amount, "EXCEEDS_PER_TX_LIMIT");
            return false;
        }

        // Check 2: Daily limit
        if (config.dailySpent + amount > config.dailyLimit) {
            emit PaymentBlocked(agentId, recipient, amount, "EXCEEDS_DAILY_LIMIT");
            return false;
        }

        // Check 3: Monthly limit
        if (config.monthlySpent + amount > config.monthlyLimit) {
            emit PaymentBlocked(agentId, recipient, amount, "EXCEEDS_MONTHLY_LIMIT");
            return false;
        }

        // Check 4: Whitelist (if enforced)
        if (whitelistEnforced[agentId] && !agentWhitelist[agentId][recipient]) {
            emit PaymentBlocked(agentId, recipient, amount, "RECIPIENT_NOT_WHITELISTED");
            return false;
        }

        // Check 5: Circuit breaker (rate limiting)
        if (!_checkCircuitBreaker(agentId)) {
            emit CircuitBreakerTriggered(agentId, paymentCount[agentId]);
            emit PaymentBlocked(agentId, recipient, amount, "CIRCUIT_BREAKER_TRIGGERED");
            return false;
        }

        // Check 6: Duplicate detection
        bytes32 paymentHash = keccak256(abi.encodePacked(recipient, amount, reason));
        if (recentPayments[agentId][paymentHash] > block.timestamp - DUPLICATE_WINDOW) {
            emit DuplicateDetected(agentId, paymentHash);
            emit PaymentBlocked(agentId, recipient, amount, "DUPLICATE_PAYMENT");
            return false;
        }

        // Check 7: Sufficient balance
        if (agentBalances[agentId] < amount) {
            emit PaymentBlocked(agentId, recipient, amount, "INSUFFICIENT_BALANCE");
            return false;
        }

        // Check 8: Approval requirement
        if (config.requiresApproval && amount >= config.approvalThreshold) {
            // Queue for approval instead of executing
            _queueForApproval(agentId, recipient, amount, reason);
            return false;
        }

        // All checks passed - execute payment
        return _executePaymentInternal(agentId, recipient, amount, reason, paymentHash);
    }

    /// @notice Execute a queued approval
    /// @param agentId The agent
    /// @param approvalIndex Index of the approval in pendingApprovals array
    function executeApproval(bytes32 agentId, uint256 approvalIndex) external onlyOwner nonReentrant {
        require(approvalIndex < pendingApprovals[agentId].length, "Invalid approval index");
        ApprovalRequest storage approval = pendingApprovals[agentId][approvalIndex];
        require(!approval.executed && !approval.rejected, "Already processed");

        // Re-check balance
        require(agentBalances[agentId] >= approval.amount, "Insufficient balance");

        approval.executed = true;

        bytes32 paymentHash = keccak256(abi.encodePacked(approval.recipient, approval.amount, approval.reason));
        _executePaymentInternal(agentId, approval.recipient, approval.amount, approval.reason, paymentHash);

        emit ApprovalExecuted(agentId, approvalIndex);
    }

    /// @notice Reject a queued approval
    /// @param agentId The agent
    /// @param approvalIndex Index of the approval to reject
    function rejectApproval(bytes32 agentId, uint256 approvalIndex) external onlyOwner {
        require(approvalIndex < pendingApprovals[agentId].length, "Invalid approval index");
        ApprovalRequest storage approval = pendingApprovals[agentId][approvalIndex];
        require(!approval.executed && !approval.rejected, "Already processed");

        approval.rejected = true;
        emit ApprovalRejected(agentId, approvalIndex);
    }

    /// @notice Internal payment execution
    function _executePaymentInternal(
        bytes32 agentId,
        address recipient,
        uint256 amount,
        string memory reason,
        bytes32 paymentHash
    ) internal returns (bool) {
        AgentConfig storage config = agents[agentId];

        agentBalances[agentId] -= amount;
        config.dailySpent += amount;
        config.monthlySpent += amount;
        recentPayments[agentId][paymentHash] = block.timestamp;

        mneeToken.safeTransfer(recipient, amount);

        bytes32 paymentId = keccak256(abi.encodePacked(agentId, recipient, amount, block.timestamp, block.prevrandao));

        paymentHistory[agentId].push(PaymentRecord({
            paymentId: paymentId,
            recipient: recipient,
            amount: amount,
            reason: reason,
            timestamp: block.timestamp,
            flagged: false
        }));

        emit PaymentExecuted(agentId, recipient, amount, reason, paymentId);
        return true;
    }

    /// @notice Queue a payment for approval
    function _queueForApproval(
        bytes32 agentId,
        address recipient,
        uint256 amount,
        string calldata reason
    ) internal {
        uint256 approvalIndex = pendingApprovals[agentId].length;

        pendingApprovals[agentId].push(ApprovalRequest({
            agentId: agentId,
            recipient: recipient,
            amount: amount,
            reason: reason,
            timestamp: block.timestamp,
            executed: false,
            rejected: false
        }));

        emit ApprovalRequested(agentId, approvalIndex, recipient, amount);
    }

    /// @notice Check circuit breaker (rate limiting)
    function _checkCircuitBreaker(bytes32 agentId) internal returns (bool) {
        uint256 currentWindow = block.timestamp / 1 minutes;

        if (lastPaymentWindow[agentId] != currentWindow) {
            lastPaymentWindow[agentId] = currentWindow;
            paymentCount[agentId] = 1;
            return true;
        }

        paymentCount[agentId]++;
        return paymentCount[agentId] <= MAX_PAYMENTS_PER_MINUTE;
    }

    /// @notice Reset daily/monthly limits if time has passed
    function _resetLimitsIfNeeded(bytes32 agentId) internal {
        AgentConfig storage config = agents[agentId];

        // Check if a new day has started
        if (block.timestamp >= config.lastDayReset + DAY_DURATION) {
            config.dailySpent = 0;
            config.lastDayReset = block.timestamp;
        }

        // Check if a new month has started
        if (block.timestamp >= config.lastMonthReset + MONTH_DURATION) {
            config.monthlySpent = 0;
            config.lastMonthReset = block.timestamp;
        }
    }

    // ============ Whitelist Management ============

    /// @notice Set whitelist status for a recipient
    /// @param agentId The agent
    /// @param recipient The recipient address
    /// @param allowed Whether to whitelist or remove
    function setWhitelist(bytes32 agentId, address recipient, bool allowed) external onlyOwner {
        require(agents[agentId].isActive, "Agent not active");
        agentWhitelist[agentId][recipient] = allowed;
        emit WhitelistUpdated(agentId, recipient, allowed);
    }

    /// @notice Batch set whitelist
    /// @param agentId The agent
    /// @param recipients Array of recipient addresses
    /// @param allowed Array of whitelist statuses
    function batchSetWhitelist(bytes32 agentId, address[] calldata recipients, bool[] calldata allowed) external onlyOwner {
        require(agents[agentId].isActive, "Agent not active");
        require(recipients.length == allowed.length, "Array length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            agentWhitelist[agentId][recipients[i]] = allowed[i];
            emit WhitelistUpdated(agentId, recipients[i], allowed[i]);
        }
    }

    /// @notice Enable/disable whitelist enforcement
    /// @param agentId The agent
    /// @param enforced Whether to enforce whitelist
    function setWhitelistEnforced(bytes32 agentId, bool enforced) external onlyOwner {
        require(agents[agentId].isActive, "Agent not active");
        whitelistEnforced[agentId] = enforced;
    }

    // ============ Configuration Updates ============

    /// @notice Update agent limits
    function updateLimits(
        bytes32 agentId,
        uint256 perTxLimit,
        uint256 dailyLimit,
        uint256 monthlyLimit
    ) external onlyOwner {
        require(agents[agentId].isActive, "Agent not active");
        require(perTxLimit > 0 && dailyLimit > 0 && monthlyLimit > 0, "Limits must be > 0");
        require(perTxLimit <= dailyLimit && dailyLimit <= monthlyLimit, "Invalid limit hierarchy");

        AgentConfig storage config = agents[agentId];
        config.perTransactionLimit = perTxLimit;
        config.dailyLimit = dailyLimit;
        config.monthlyLimit = monthlyLimit;

        emit AgentConfigUpdated(agentId);
    }

    /// @notice Update approval settings
    function updateApprovalSettings(
        bytes32 agentId,
        bool requiresApproval,
        uint256 approvalThreshold
    ) external onlyOwner {
        require(agents[agentId].isActive, "Agent not active");

        AgentConfig storage config = agents[agentId];
        config.requiresApproval = requiresApproval;
        config.approvalThreshold = approvalThreshold;

        emit AgentConfigUpdated(agentId);
    }

    /// @notice Update authorized caller
    function updateAuthorizedCaller(bytes32 agentId, address newCaller) external onlyOwner {
        require(agents[agentId].isActive, "Agent not active");
        require(newCaller != address(0), "Invalid caller");

        agents[agentId].authorizedCaller = newCaller;
        emit AgentConfigUpdated(agentId);
    }

    // ============ Emergency Controls ============

    /// @notice Pause an agent
    function pauseAgent(bytes32 agentId) external onlyOwner {
        require(agents[agentId].isActive, "Agent not active");
        agents[agentId].isActive = false;
        emit AgentPaused(agentId);
    }

    /// @notice Resume an agent
    function resumeAgent(bytes32 agentId) external {
        require(!agents[agentId].isActive, "Agent already active");
        require(agents[agentId].authorizedCaller != address(0), "Agent not registered");
        agents[agentId].isActive = true;
        emit AgentResumed(agentId);
    }

    /// @notice Withdraw funds (owner only)
    function withdraw(bytes32 agentId, uint256 amount, address recipient) external onlyOwner nonReentrant {
        require(agentBalances[agentId] >= amount, "Insufficient balance");
        require(recipient != address(0), "Invalid recipient");

        agentBalances[agentId] -= amount;
        mneeToken.safeTransfer(recipient, amount);

        emit Withdrawal(agentId, recipient, amount);
    }

    // ============ View Functions ============

    /// @notice Get agent statistics
    function getAgentStats(bytes32 agentId) external view returns (
        uint256 balance,
        uint256 dailySpent,
        uint256 monthlySpent,
        uint256 dailyLimit,
        uint256 monthlyLimit,
        uint256 perTxLimit,
        uint256 totalPayments,
        bool isActive
    ) {
        AgentConfig storage config = agents[agentId];
        return (
            agentBalances[agentId],
            config.dailySpent,
            config.monthlySpent,
            config.dailyLimit,
            config.monthlyLimit,
            config.perTransactionLimit,
            paymentHistory[agentId].length,
            config.isActive
        );
    }

    /// @notice Get payment history for an agent
    function getPaymentHistory(bytes32 agentId, uint256 offset, uint256 limit) external view returns (PaymentRecord[] memory) {
        PaymentRecord[] storage history = paymentHistory[agentId];
        uint256 total = history.length;

        if (offset >= total) {
            return new PaymentRecord[](0);
        }

        uint256 end = offset + limit > total ? total : offset + limit;
        uint256 size = end - offset;

        PaymentRecord[] memory result = new PaymentRecord[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = history[offset + i];
        }

        return result;
    }

    /// @notice Get pending approvals for an agent
    function getPendingApprovals(bytes32 agentId) external view returns (ApprovalRequest[] memory) {
        return pendingApprovals[agentId];
    }

    /// @notice Check if a payment would be allowed (simulation)
    function checkPayment(
        bytes32 agentId,
        address recipient,
        uint256 amount
    ) external view returns (
        bool wouldSucceed,
        string memory reason
    ) {
        AgentConfig storage config = agents[agentId];

        if (!config.isActive) return (false, "Agent not active");
        if (recipient == address(0)) return (false, "Invalid recipient");
        if (amount == 0) return (false, "Amount must be > 0");
        if (amount > config.perTransactionLimit) return (false, "EXCEEDS_PER_TX_LIMIT");

        // Calculate effective daily/monthly spent after potential reset
        uint256 effectiveDailySpent = config.dailySpent;
        uint256 effectiveMonthlySpent = config.monthlySpent;

        if (block.timestamp >= config.lastDayReset + DAY_DURATION) {
            effectiveDailySpent = 0;
        }
        if (block.timestamp >= config.lastMonthReset + MONTH_DURATION) {
            effectiveMonthlySpent = 0;
        }

        if (effectiveDailySpent + amount > config.dailyLimit) return (false, "EXCEEDS_DAILY_LIMIT");
        if (effectiveMonthlySpent + amount > config.monthlyLimit) return (false, "EXCEEDS_MONTHLY_LIMIT");
        if (whitelistEnforced[agentId] && !agentWhitelist[agentId][recipient]) return (false, "RECIPIENT_NOT_WHITELISTED");
        if (agentBalances[agentId] < amount) return (false, "INSUFFICIENT_BALANCE");

        return (true, "Payment would succeed");
    }
}
