"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { usePaymentHistory } from "@/hooks/useAgentGuard"
import { formatAddress, formatMNEE, formatTimestamp } from "@/lib/utils"
import { AlertCircle, Search, ChevronLeft, ChevronRight, CreditCard } from "lucide-react"

interface Agent {
  name: string
  id: `0x${string}`
}

export default function PaymentsPage() {
  const { isConnected } = useAccount()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<`0x${string}` | undefined>()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "flagged" | "success">("all")
  const [page, setPage] = useState(0)
  const pageSize = 10n

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

  const { data: payments, isLoading } = usePaymentHistory(
    selectedAgent,
    BigInt(page) * pageSize,
    pageSize + 1n
  )

  const hasNextPage = payments && payments.length > Number(pageSize)
  const displayPayments = payments?.slice(0, Number(pageSize)) || []

  const filteredPayments = displayPayments.filter((payment) => {
    const matchesSearch =
      !searchTerm ||
      payment.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reason.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "flagged" && payment.flagged) ||
      (statusFilter === "success" && !payment.flagged)

    return matchesSearch && matchesStatus
  })

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
              <p className="text-muted-foreground text-center">
                Please connect your wallet to view payments.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground">
          View and search payment history for your agents
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            All payments executed by your AI agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select
              value={selectedAgent}
              onValueChange={(value) => {
                setSelectedAgent(value as `0x${string}`)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]">
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

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by recipient or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            >
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredPayments.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment, index) => (
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
                      <TableCell>
                        {payment.flagged ? (
                          <Badge variant="warning">Flagged</Badge>
                        ) : (
                          <Badge variant="success">Success</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!hasNextPage}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No payments found</h3>
              <p className="text-muted-foreground mt-2">
                {selectedAgent
                  ? "No payment history for this agent yet."
                  : "Select an agent to view payment history."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
