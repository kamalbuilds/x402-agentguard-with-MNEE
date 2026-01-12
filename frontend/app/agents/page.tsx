"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAgentGuardWrite, useAgentStats } from "@/hooks/useAgentGuard"
import { generateAgentId, formatMNEE, formatAddress, parseMNEE } from "@/lib/utils"
import { Plus, Bot, AlertCircle } from "lucide-react"
import { useEffect } from "react"

interface Agent {
  name: string
  id: `0x${string}`
}

export default function AgentsPage() {
  const { address, isConnected } = useAccount()
  const [agents, setAgents] = useState<Agent[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAgentForStats, setSelectedAgentForStats] = useState<`0x${string}` | undefined>()

  // Form state
  const [agentName, setAgentName] = useState("")
  const [perTxLimit, setPerTxLimit] = useState("100")
  const [dailyLimit, setDailyLimit] = useState("1000")
  const [monthlyLimit, setMonthlyLimit] = useState("10000")
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [approvalThreshold, setApprovalThreshold] = useState("500")
  const [authorizedCaller, setAuthorizedCaller] = useState("")

  const { registerAgent, isPending, isConfirming, isSuccess, error } = useAgentGuardWrite()
  const { data: statsData } = useAgentStats(selectedAgentForStats)

  useEffect(() => {
    const stored = localStorage.getItem("agentguard_agents")
    if (stored) {
      setAgents(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    if (isSuccess) {
      const newAgent = { name: agentName, id: generateAgentId(agentName) }
      const updated = [...agents, newAgent]
      setAgents(updated)
      localStorage.setItem("agentguard_agents", JSON.stringify(updated))
      setDialogOpen(false)
      resetForm()
    }
  }, [isSuccess])

  const resetForm = () => {
    setAgentName("")
    setPerTxLimit("100")
    setDailyLimit("1000")
    setMonthlyLimit("10000")
    setRequiresApproval(false)
    setApprovalThreshold("500")
    setAuthorizedCaller("")
  }

  const handleRegister = () => {
    if (!agentName || !address) return

    const agentId = generateAgentId(agentName)
    const caller = (authorizedCaller as `0x${string}`) || address

    registerAgent(
      agentId,
      parseMNEE(perTxLimit),
      parseMNEE(dailyLimit),
      parseMNEE(monthlyLimit),
      requiresApproval,
      parseMNEE(approvalThreshold),
      caller
    )
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
                Please connect your wallet to manage agents.
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
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground">
            Register and manage your AI agents
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Register Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Register New Agent</DialogTitle>
              <DialogDescription>
                Create a new AI agent with spending limits and controls.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  placeholder="My AI Agent"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perTx">Per-Tx Limit (MNEE)</Label>
                  <Input
                    id="perTx"
                    type="number"
                    value={perTxLimit}
                    onChange={(e) => setPerTxLimit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily">Daily Limit (MNEE)</Label>
                  <Input
                    id="daily"
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly">Monthly Limit (MNEE)</Label>
                  <Input
                    id="monthly"
                    type="number"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Require manual approval for large payments
                  </p>
                </div>
                <Switch
                  checked={requiresApproval}
                  onCheckedChange={setRequiresApproval}
                />
              </div>

              {requiresApproval && (
                <div className="space-y-2">
                  <Label htmlFor="threshold">Approval Threshold (MNEE)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={approvalThreshold}
                    onChange={(e) => setApprovalThreshold(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="caller">Authorized Caller (Optional)</Label>
                <Input
                  id="caller"
                  placeholder="0x... (defaults to your wallet)"
                  value={authorizedCaller}
                  onChange={(e) => setAuthorizedCaller(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRegister}
                disabled={isPending || isConfirming || !agentName}
              >
                {isPending || isConfirming ? "Registering..." : "Register Agent"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Agents</CardTitle>
          <CardDescription>
            View and manage all your registered AI agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Agent ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <AgentRow key={agent.id} agent={agent} />
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No agents registered</h3>
              <p className="text-muted-foreground mt-2">
                Register your first AI agent to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AgentRow({ agent }: { agent: Agent }) {
  const { data: statsData, isLoading } = useAgentStats(agent.id)

  const stats = statsData ? {
    balance: statsData[0],
    isActive: statsData[7],
  } : undefined

  return (
    <TableRow>
      <TableCell className="font-medium">{agent.name}</TableCell>
      <TableCell className="font-mono text-xs">
        {formatAddress(agent.id)}
      </TableCell>
      <TableCell>
        {isLoading ? (
          <Badge variant="secondary">Loading...</Badge>
        ) : stats?.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="destructive">Inactive</Badge>
        )}
      </TableCell>
      <TableCell>
        {isLoading ? "..." : stats ? formatMNEE(stats.balance) + " MNEE" : "N/A"}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm">
          View Details
        </Button>
      </TableCell>
    </TableRow>
  )
}
