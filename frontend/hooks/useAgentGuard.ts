"use client"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useQueryClient } from "@tanstack/react-query"
import { AGENT_GUARD_VAULT_ABI, AGENT_GUARD_VAULT_ADDRESS, MNEE_TOKEN_ABI, MNEE_TOKEN_ADDRESS } from "@/lib/contracts"
import type { AgentStats, PaymentRecord, ApprovalRequest } from "@/lib/contracts"

export function useAgentStats(agentId: `0x${string}` | undefined) {
  return useReadContract({
    address: AGENT_GUARD_VAULT_ADDRESS,
    abi: AGENT_GUARD_VAULT_ABI,
    functionName: "getAgentStats",
    args: agentId ? [agentId] : undefined,
    query: {
      enabled: !!agentId,
      refetchInterval: 10000,
    },
  })
}

export function useAgentDetails(agentId: `0x${string}` | undefined) {
  return useReadContract({
    address: AGENT_GUARD_VAULT_ADDRESS,
    abi: AGENT_GUARD_VAULT_ABI,
    functionName: "agents",
    args: agentId ? [agentId] : undefined,
    query: {
      enabled: !!agentId,
      refetchInterval: 10000,
    },
  })
}

export function usePaymentHistory(agentId: `0x${string}` | undefined, offset: bigint = 0n, limit: bigint = 20n) {
  return useReadContract({
    address: AGENT_GUARD_VAULT_ADDRESS,
    abi: AGENT_GUARD_VAULT_ABI,
    functionName: "getPaymentHistory",
    args: agentId ? [agentId, offset, limit] : undefined,
    query: {
      enabled: !!agentId,
      refetchInterval: 15000,
    },
  })
}

export function usePendingApprovals(agentId: `0x${string}` | undefined) {
  return useReadContract({
    address: AGENT_GUARD_VAULT_ADDRESS,
    abi: AGENT_GUARD_VAULT_ABI,
    functionName: "getPendingApprovals",
    args: agentId ? [agentId] : undefined,
    query: {
      enabled: !!agentId,
      refetchInterval: 10000,
    },
  })
}

export function useWhitelistStatus(agentId: `0x${string}` | undefined, address: `0x${string}` | undefined) {
  return useReadContract({
    address: AGENT_GUARD_VAULT_ADDRESS,
    abi: AGENT_GUARD_VAULT_ABI,
    functionName: "agentWhitelist",
    args: agentId && address ? [agentId, address] : undefined,
    query: {
      enabled: !!agentId && !!address,
    },
  })
}

export function useWhitelistEnforced(agentId: `0x${string}` | undefined) {
  return useReadContract({
    address: AGENT_GUARD_VAULT_ADDRESS,
    abi: AGENT_GUARD_VAULT_ABI,
    functionName: "whitelistEnforced",
    args: agentId ? [agentId] : undefined,
    query: {
      enabled: !!agentId,
    },
  })
}

export function useMNEEBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: MNEE_TOKEN_ADDRESS,
    abi: MNEE_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  })
}

export function useMNEEAllowance(owner: `0x${string}` | undefined) {
  return useReadContract({
    address: MNEE_TOKEN_ADDRESS,
    abi: MNEE_TOKEN_ABI,
    functionName: "allowance",
    args: owner ? [owner, AGENT_GUARD_VAULT_ADDRESS] : undefined,
    query: {
      enabled: !!owner,
      refetchInterval: 10000,
    },
  })
}

export function useAgentGuardWrite() {
  const queryClient = useQueryClient()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const registerAgent = (
    agentId: `0x${string}`,
    perTxLimit: bigint,
    dailyLimit: bigint,
    monthlyLimit: bigint,
    requiresApproval: boolean,
    approvalThreshold: bigint,
    authorizedCaller: `0x${string}`
  ) => {
    writeContract({
      address: AGENT_GUARD_VAULT_ADDRESS,
      abi: AGENT_GUARD_VAULT_ABI,
      functionName: "registerAgent",
      args: [agentId, perTxLimit, dailyLimit, monthlyLimit, requiresApproval, approvalThreshold, authorizedCaller],
    })
  }

  const deposit = (agentId: `0x${string}`, amount: bigint) => {
    writeContract({
      address: AGENT_GUARD_VAULT_ADDRESS,
      abi: AGENT_GUARD_VAULT_ABI,
      functionName: "deposit",
      args: [agentId, amount],
    })
  }

  const withdraw = (agentId: `0x${string}`, amount: bigint, recipient: `0x${string}`) => {
    writeContract({
      address: AGENT_GUARD_VAULT_ADDRESS,
      abi: AGENT_GUARD_VAULT_ABI,
      functionName: "withdraw",
      args: [agentId, amount, recipient],
    })
  }

  const updateLimits = (agentId: `0x${string}`, perTxLimit: bigint, dailyLimit: bigint, monthlyLimit: bigint) => {
    writeContract({
      address: AGENT_GUARD_VAULT_ADDRESS,
      abi: AGENT_GUARD_VAULT_ABI,
      functionName: "updateLimits",
      args: [agentId, perTxLimit, dailyLimit, monthlyLimit],
    })
  }

  const updateApprovalSettings = (agentId: `0x${string}`, requiresApproval: boolean, approvalThreshold: bigint) => {
    writeContract({
      address: AGENT_GUARD_VAULT_ADDRESS,
      abi: AGENT_GUARD_VAULT_ABI,
      functionName: "updateApprovalSettings",
      args: [agentId, requiresApproval, approvalThreshold],
    })
  }

  const pauseAgent = (agentId: `0x${string}`) => {
    writeContract({
      address: AGENT_GUARD_VAULT_ADDRESS,
      abi: AGENT_GUARD_VAULT_ABI,
      functionName: "pauseAgent",
      args: [agentId],
    })
  }

  const resumeAgent = (agentId: `0x${string}`) => {
    writeContract({
      address: AGENT_GUARD_VAULT_ADDRESS,
      abi: AGENT_GUARD_VAULT_ABI,
      functionName: "resumeAgent",
      args: [agentId],
    })
  }

  const setWhitelist = (agentId: `0x${string}`, recipient: `0x${string}`, allowed: boolean) => {
    writeContract({
      address: AGENT_GUARD_VAULT_ADDRESS,
      abi: AGENT_GUARD_VAULT_ABI,
      functionName: "setWhitelist",
      args: [agentId, recipient, allowed],
    })
  }

  const setWhitelistEnforced = (agentId: `0x${string}`, enforced: boolean) => {
    writeContract({
      address: AGENT_GUARD_VAULT_ADDRESS,
      abi: AGENT_GUARD_VAULT_ABI,
      functionName: "setWhitelistEnforced",
      args: [agentId, enforced],
    })
  }

  const executeApproval = (agentId: `0x${string}`, approvalIndex: bigint) => {
    writeContract({
      address: AGENT_GUARD_VAULT_ADDRESS,
      abi: AGENT_GUARD_VAULT_ABI,
      functionName: "executeApproval",
      args: [agentId, approvalIndex],
    })
  }

  const rejectApproval = (agentId: `0x${string}`, approvalIndex: bigint) => {
    writeContract({
      address: AGENT_GUARD_VAULT_ADDRESS,
      abi: AGENT_GUARD_VAULT_ABI,
      functionName: "rejectApproval",
      args: [agentId, approvalIndex],
    })
  }

  const approveMNEE = (amount: bigint) => {
    writeContract({
      address: MNEE_TOKEN_ADDRESS,
      abi: MNEE_TOKEN_ABI,
      functionName: "approve",
      args: [AGENT_GUARD_VAULT_ADDRESS, amount],
    })
  }

  return {
    registerAgent,
    deposit,
    withdraw,
    updateLimits,
    updateApprovalSettings,
    pauseAgent,
    resumeAgent,
    setWhitelist,
    setWhitelistEnforced,
    executeApproval,
    rejectApproval,
    approveMNEE,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}
