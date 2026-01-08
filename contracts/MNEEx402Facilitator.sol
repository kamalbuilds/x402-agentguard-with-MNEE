// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IAgentGuardVault {
    function executePayment(
        bytes32 agentId,
        address recipient,
        uint256 amount,
        string calldata reason
    ) external returns (bool);
}

/**
 * @title MNEEx402Facilitator
 * @notice x402-compatible payment facilitator for MNEE stablecoin
 * @dev Implements the x402 protocol for MNEE using signature-based authorization
 *      Since MNEE doesn't implement EIP-3009, we use a custom authorization scheme
 *      that routes through AgentGuard for governance controls
 */
contract MNEEx402Facilitator is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @notice The MNEE token contract
    IERC20 public immutable mneeToken;

    /// @notice The AgentGuard vault for governance controls
    IAgentGuardVault public agentGuardVault;

    /// @notice x402 payment authorization structure
    struct X402Authorization {
        address from;           // Payer address
        address to;             // Payee address
        uint256 value;          // Amount in wei
        uint256 validAfter;     // Unix timestamp when auth becomes valid
        uint256 validBefore;    // Unix timestamp when auth expires
        bytes32 nonce;          // Unique nonce for replay protection
        string resource;        // Resource URL being paid for
    }

    /// @notice Track used nonces for replay protection
    mapping(bytes32 => bool) public usedNonces;

    /// @notice Mapping from address to deposited balances (for direct payments)
    mapping(address => uint256) public deposits;

    /// @notice Authorized facilitator operators (can call settle)
    mapping(address => bool) public operators;

    /// @notice EIP-712 domain separator
    bytes32 public immutable DOMAIN_SEPARATOR;

    /// @notice EIP-712 typehash for authorization
    bytes32 public constant AUTHORIZATION_TYPEHASH = keccak256(
        "X402Authorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce,string resource)"
    );

    // Events
    event X402PaymentVerified(
        address indexed payer,
        address indexed payee,
        uint256 amount,
        bytes32 nonce,
        string resource
    );

    event X402PaymentSettled(
        address indexed payer,
        address indexed payee,
        uint256 amount,
        bytes32 nonce,
        string resource,
        bytes32 indexed agentId
    );

    event Deposited(address indexed depositor, uint256 amount);
    event Withdrawn(address indexed withdrawer, uint256 amount);
    event OperatorUpdated(address indexed operator, bool status);
    event AgentGuardVaultUpdated(address indexed newVault);

    /// @notice Creates the MNEE x402 Facilitator
    /// @param _mneeToken Address of the MNEE token contract
    /// @param _agentGuardVault Address of the AgentGuard vault (optional, can be set later)
    constructor(address _mneeToken, address _agentGuardVault) Ownable(msg.sender) {
        require(_mneeToken != address(0), "Invalid token address");
        mneeToken = IERC20(_mneeToken);

        if (_agentGuardVault != address(0)) {
            agentGuardVault = IAgentGuardVault(_agentGuardVault);
        }

        // Build EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("MNEEx402Facilitator"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );

        // Set deployer as operator
        operators[msg.sender] = true;
    }

    // ============ User Functions ============

    /// @notice Deposit MNEE for use with x402 payments
    /// @param amount Amount to deposit
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        mneeToken.safeTransferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    /// @notice Withdraw deposited MNEE
    /// @param amount Amount to withdraw
    function withdraw(uint256 amount) external nonReentrant {
        require(deposits[msg.sender] >= amount, "Insufficient deposit");
        deposits[msg.sender] -= amount;
        mneeToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    // ============ x402 Protocol Functions ============

    /**
     * @notice Verify an x402 payment authorization without executing
     * @param auth The authorization struct
     * @param signature The EIP-712 signature
     * @return isValid Whether the payment would be valid
     * @return payer The recovered payer address
     * @return invalidReason Reason if invalid
     */
    function verify(
        X402Authorization calldata auth,
        bytes calldata signature
    ) external view returns (bool isValid, address payer, string memory invalidReason) {
        // 1. Verify timing
        if (block.timestamp < auth.validAfter) {
            return (false, address(0), "not_yet_valid");
        }
        if (block.timestamp > auth.validBefore) {
            return (false, address(0), "expired");
        }

        // 2. Check nonce hasn't been used
        if (usedNonces[auth.nonce]) {
            return (false, address(0), "nonce_already_used");
        }

        // 3. Recover signer
        bytes32 structHash = keccak256(
            abi.encode(
                AUTHORIZATION_TYPEHASH,
                auth.from,
                auth.to,
                auth.value,
                auth.validAfter,
                auth.validBefore,
                auth.nonce,
                keccak256(bytes(auth.resource))
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);

        // 4. Verify signer matches from
        if (signer != auth.from) {
            return (false, address(0), "invalid_signature");
        }

        // 5. Check balance
        uint256 balance = deposits[auth.from];
        if (balance < auth.value) {
            return (false, signer, "insufficient_balance");
        }

        return (true, signer, "");
    }

    /**
     * @notice Settle an x402 payment - execute the transfer
     * @param auth The authorization struct
     * @param signature The EIP-712 signature
     * @param agentId Optional agent ID for AgentGuard routing (bytes32(0) for direct)
     * @return success Whether settlement succeeded
     * @return txHash Pseudo transaction hash for reference
     */
    function settle(
        X402Authorization calldata auth,
        bytes calldata signature,
        bytes32 agentId
    ) external nonReentrant returns (bool success, bytes32 txHash) {
        require(operators[msg.sender] || msg.sender == owner(), "Not authorized operator");

        // 1. Verify timing
        require(block.timestamp >= auth.validAfter, "Not yet valid");
        require(block.timestamp <= auth.validBefore, "Expired");

        // 2. Check nonce
        require(!usedNonces[auth.nonce], "Nonce already used");

        // 3. Verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                AUTHORIZATION_TYPEHASH,
                auth.from,
                auth.to,
                auth.value,
                auth.validAfter,
                auth.validBefore,
                auth.nonce,
                keccak256(bytes(auth.resource))
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        require(signer == auth.from, "Invalid signature");

        // Mark nonce as used
        usedNonces[auth.nonce] = true;

        // 4. Execute payment
        if (agentId != bytes32(0) && address(agentGuardVault) != address(0)) {
            // Route through AgentGuard for governance controls
            success = agentGuardVault.executePayment(
                agentId,
                auth.to,
                auth.value,
                string(abi.encodePacked("x402:", auth.resource))
            );
            require(success, "AgentGuard payment failed");
        } else {
            // Direct payment from deposits
            require(deposits[auth.from] >= auth.value, "Insufficient deposit");
            deposits[auth.from] -= auth.value;
            mneeToken.safeTransfer(auth.to, auth.value);
            success = true;
        }

        // Generate pseudo transaction hash
        txHash = keccak256(
            abi.encodePacked(
                auth.from,
                auth.to,
                auth.value,
                auth.nonce,
                block.timestamp,
                block.number
            )
        );

        if (agentId != bytes32(0)) {
            emit X402PaymentSettled(auth.from, auth.to, auth.value, auth.nonce, auth.resource, agentId);
        } else {
            emit X402PaymentSettled(auth.from, auth.to, auth.value, auth.nonce, auth.resource, bytes32(0));
        }

        return (success, txHash);
    }

    /**
     * @notice Generate x402 payment requirements (for server to send in 402 response)
     * @param payee Recipient address
     * @param amount Required payment amount
     * @param resource Resource URL
     * @param timeout Validity period in seconds
     * @return JSON-formatted payment requirements
     */
    function generatePaymentRequirements(
        address payee,
        uint256 amount,
        string calldata resource,
        uint256 timeout
    ) external view returns (string memory) {
        return string(
            abi.encodePacked(
                '{"x402Version":1,"scheme":"mnee-x402","network":"eip155:',
                _uint256ToString(block.chainid),
                '","asset":"',
                _addressToString(address(mneeToken)),
                '","payTo":"',
                _addressToString(payee),
                '","maxAmountRequired":"',
                _uint256ToString(amount),
                '","resource":"',
                resource,
                '","maxTimeoutSeconds":',
                _uint256ToString(timeout),
                ',"facilitator":"',
                _addressToString(address(this)),
                '","extra":{"name":"MNEEx402Facilitator","version":"1"}}'
            )
        );
    }

    // ============ Admin Functions ============

    /// @notice Set AgentGuard vault address
    function setAgentGuardVault(address _vault) external onlyOwner {
        agentGuardVault = IAgentGuardVault(_vault);
        emit AgentGuardVaultUpdated(_vault);
    }

    /// @notice Set operator status
    function setOperator(address operator, bool status) external onlyOwner {
        operators[operator] = status;
        emit OperatorUpdated(operator, status);
    }

    // ============ Internal Functions ============

    /// @notice Compute EIP-712 typed data hash
    function _hashTypedDataV4(bytes32 structHash) internal view returns (bytes32) {
        return MessageHashUtils.toTypedDataHash(DOMAIN_SEPARATOR, structHash);
    }

    /// @notice Convert address to string
    function _addressToString(address addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(uint160(addr) >> (8 * (19 - i)) >> 4)];
            str[3 + i * 2] = alphabet[uint8(uint160(addr) >> (8 * (19 - i))) & 0x0f];
        }
        return string(str);
    }

    /// @notice Convert uint256 to string
    function _uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // ============ View Functions ============

    /// @notice Get supported payment info
    function getSupportedPaymentKinds() external view returns (string memory) {
        return string(
            abi.encodePacked(
                '{"kinds":[{"scheme":"mnee-x402","network":"eip155:',
                _uint256ToString(block.chainid),
                '","asset":"',
                _addressToString(address(mneeToken)),
                '"}]}'
            )
        );
    }

    /// @notice Check if a nonce has been used
    function isNonceUsed(bytes32 nonce) external view returns (bool) {
        return usedNonces[nonce];
    }

    /// @notice Get deposit balance
    function getDeposit(address account) external view returns (uint256) {
        return deposits[account];
    }
}
