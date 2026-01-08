"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatMNEE } from "@/lib/utils"
import { Wallet, TrendingUp, Clock, Activity } from "lucide-react"
import type { AgentStats } from "@/lib/contracts"

interface StatsCardsProps {
  stats: AgentStats | undefined
  isLoading: boolean
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Select an agent to view stats</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dailyUsage = stats.dailyLimit > 0n
    ? Number((stats.dailySpent * 100n) / stats.dailyLimit)
    : 0
  const monthlyUsage = stats.monthlyLimit > 0n
    ? Number((stats.monthlySpent * 100n) / stats.monthlyLimit)
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatMNEE(stats.balance)} MNEE</div>
          <p className="text-xs text-muted-foreground">
            Available for payments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Spending</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatMNEE(stats.dailySpent)} / {formatMNEE(stats.dailyLimit)}
          </div>
          <Progress value={dailyUsage} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {dailyUsage.toFixed(1)}% of daily limit
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatMNEE(stats.monthlySpent)} / {formatMNEE(stats.monthlyLimit)}
          </div>
          <Progress value={monthlyUsage} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {monthlyUsage.toFixed(1)}% of monthly limit
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPayments.toString()}</div>
          <p className="text-xs text-muted-foreground">
            Per-tx limit: {formatMNEE(stats.perTxLimit)} MNEE
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
