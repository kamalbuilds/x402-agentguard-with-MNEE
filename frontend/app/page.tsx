"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AgentSelector } from "@/components/dashboard/AgentSelector"
import { StatsCards } from "@/components/dashboard/StatsCards"
import { SpendingChart } from "@/components/dashboard/SpendingChart"
import { RecentPayments } from "@/components/dashboard/RecentPayments"
import { DepositDialog } from "@/components/dashboard/DepositDialog"
import { useAgentStats, usePaymentHistory } from "@/hooks/useAgentGuard"
import { AlertCircle } from "lucide-react"

export default function DashboardPage() {
  const { isConnected } = useAccount()
  const [selectedAgent, setSelectedAgent] = useState<`0x${string}` | undefined>()

  const { data: statsData, isLoading: statsLoading } = useAgentStats(selectedAgent)
  const { data: payments, isLoading: paymentsLoading } = usePaymentHistory(selectedAgent, 0n, 50n)

  const stats = statsData ? {
    balance: statsData[0],
    dailySpent: statsData[1],
    monthlySpent: statsData[2],
    dailyLimit: statsData[3],
    monthlyLimit: statsData[4],
    perTxLimit: statsData[5],
    totalPayments: statsData[6],
    isActive: statsData[7],
  } : undefined

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
              <p className="text-muted-foreground text-center">
                Please connect your wallet to access the AgentGuard dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your AI agent payments
          </p>
        </div>
        <DepositDialog agentId={selectedAgent} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <AgentSelector
            selectedAgent={selectedAgent}
            onAgentChange={setSelectedAgent}
          />
        </CardContent>
      </Card>

      <StatsCards stats={stats} isLoading={statsLoading} />

      <div className="grid gap-6 md:grid-cols-2">
        <SpendingChart payments={payments} />
        <RecentPayments payments={payments} isLoading={paymentsLoading} />
      </div>
    </div>
  )
}
