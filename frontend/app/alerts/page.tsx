"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePendingApprovals, useAgentGuardWrite, usePaymentHistory } from "@/hooks/useAgentGuard"
import { formatAddress, formatMNEE, formatTimestamp } from "@/lib/utils"
import { AlertCircle, AlertTriangle, CheckCircle, XCircle, Bell } from "lucide-react"

interface Agent {
  name: string
  id: `0x${string}`
}

export default function AlertsPage() {
  const { isConnected } = useAccount()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<`0x${string}` | undefined>()

  const { data: approvals, isLoading: approvalsLoading, refetch } = usePendingApprovals(selectedAgent)
  const { data: payments } = usePaymentHistory(selectedAgent, 0n, 100n)
  const { executeApproval, rejectApproval, isPending, isConfirming, isSuccess } = useAgentGuardWrite()

  useEffect(() => {
    const stored = localStorage.getItem("agentguard_agents")
    if (stored) {
      const parsed = JSON.parse(stored)
      setAgents(parsed)
      if (parsed.length > 0) {
        setSelectedAgent(parsed[0].id)
      }
    }
  }, [])

  useEffect(() => {
    if (isSuccess) {
      refetch()
    }
  }, [isSuccess, refetch])

  // Filter for flagged payments (blocked/suspicious)
  const blockedPayments = payments?.filter((p) => p.flagged) || []

  // Filter pending approvals (not executed and not rejected)
  const pendingApprovals = approvals?.filter((a) => !a.executed && !a.rejected) || []

  const handleApprove = (index: number) => {
    if (!selectedAgent) return
    executeApproval(selectedAgent, BigInt(index))
  }

  const handleReject = (index: number) => {
    if (!selectedAgent) return
    rejectApproval(selectedAgent, BigInt(index))
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
              <p className="text-muted-foreground text-center">
                Please connect your wallet to view alerts.
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
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">
            View pending approvals and blocked payment alerts
          </p>
        </div>
        <Select
          value={selectedAgent}
          onValueChange={(value) => setSelectedAgent(value as `0x${string}`)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Bell className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your decision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedPayments.length}</div>
            <p className="text-xs text-muted-foreground">Flagged transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Circuit Breakers</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Triggered this period</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="approvals">
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="blocked">
            Blocked Payments
            {blockedPayments.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {blockedPayments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="circuit">Circuit Breakers</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval Requests</CardTitle>
              <CardDescription>
                Review and approve or reject pending payment requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : pendingApprovals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map((approval, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">
                          {formatAddress(approval.recipient)}
                        </TableCell>
                        <TableCell>{formatMNEE(approval.amount)} MNEE</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {approval.reason}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatTimestamp(Number(approval.timestamp))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(index)}
                              disabled={isPending || isConfirming}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(index)}
                              disabled={isPending || isConfirming}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold">All clear!</h3>
                  <p className="text-muted-foreground mt-2">
                    No pending approval requests at this time.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked">
          <Card>
            <CardHeader>
              <CardTitle>Blocked Payments</CardTitle>
              <CardDescription>
                Payments that were blocked due to security policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blockedPayments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedPayments.map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">
                          {formatAddress(payment.paymentId)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatAddress(payment.recipient)}
                        </TableCell>
                        <TableCell>{formatMNEE(payment.amount)} MNEE</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {payment.reason}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatTimestamp(Number(payment.timestamp))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold">No blocked payments</h3>
                  <p className="text-muted-foreground mt-2">
                    All payment attempts have been processed successfully.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="circuit">
          <Card>
            <CardHeader>
              <CardTitle>Circuit Breaker Events</CardTitle>
              <CardDescription>
                Events where the circuit breaker was triggered to protect against rapid payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold">No circuit breaker events</h3>
                <p className="text-muted-foreground mt-2">
                  The circuit breaker has not been triggered for this agent.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Circuit breakers trigger when more than 10 payments are attempted per minute.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
