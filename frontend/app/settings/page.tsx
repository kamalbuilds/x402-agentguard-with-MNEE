"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAgentGuardWrite, useAgentDetails, useAgentStats } from "@/hooks/useAgentGuard"
import { formatMNEE, parseMNEE, formatAddress } from "@/lib/utils"
import { AlertCircle, Settings, Pause, Play, RefreshCw } from "lucide-react"

interface Agent {
  name: string
  id: `0x${string}`
}

export default function SettingsPage() {
  const { address, isConnected } = useAccount()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<`0x${string}` | undefined>()

  // Form state
  const [perTxLimit, setPerTxLimit] = useState("")
  const [dailyLimit, setDailyLimit] = useState("")
  const [monthlyLimit, setMonthlyLimit] = useState("")
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [approvalThreshold, setApprovalThreshold] = useState("")
  const [authorizedCaller, setAuthorizedCaller] = useState("")

  const { data: agentData, isLoading: detailsLoading, refetch } = useAgentDetails(selectedAgent)
  const { data: statsData } = useAgentStats(selectedAgent)
  const {
    updateLimits,
    updateApprovalSettings,
    pauseAgent,
    resumeAgent,
    isPending,
    isConfirming,
    isSuccess,
    error,
  } = useAgentGuardWrite()

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
    if (agentData) {
      setPerTxLimit(formatMNEE(agentData[0]))
      setDailyLimit(formatMNEE(agentData[1]))
      setMonthlyLimit(formatMNEE(agentData[2]))
      setRequiresApproval(agentData[7])
      setApprovalThreshold(formatMNEE(agentData[8]))
      setAuthorizedCaller(agentData[10])
    }
  }, [agentData])

  useEffect(() => {
    if (isSuccess) {
      refetch()
    }
  }, [isSuccess, refetch])

  const handleUpdateLimits = () => {
    if (!selectedAgent) return
    updateLimits(
      selectedAgent,
      parseMNEE(perTxLimit),
      parseMNEE(dailyLimit),
      parseMNEE(monthlyLimit)
    )
  }

  const handleUpdateApprovalSettings = () => {
    if (!selectedAgent) return
    updateApprovalSettings(
      selectedAgent,
      requiresApproval,
      parseMNEE(approvalThreshold)
    )
  }

  const handleTogglePause = () => {
    if (!selectedAgent || !statsData) return
    if (statsData[7]) {
      pauseAgent(selectedAgent)
    } else {
      resumeAgent(selectedAgent)
    }
  }

  const isActive = statsData?.[7] || false

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
              <p className="text-muted-foreground text-center">
                Please connect your wallet to access settings.
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
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure limits and approval settings for your agents
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

      {selectedAgent ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Agent Status</CardTitle>
                  <CardDescription>
                    Current status and control for this agent
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  {isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Paused</Badge>
                  )}
                  <Button
                    variant={isActive ? "destructive" : "default"}
                    onClick={handleTogglePause}
                    disabled={isPending || isConfirming}
                  >
                    {isActive ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Agent
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Resume Agent
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Agent ID</p>
                  <p className="font-mono">{formatAddress(selectedAgent)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Authorized Caller</p>
                  <p className="font-mono">{formatAddress(authorizedCaller)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spending Limits</CardTitle>
              <CardDescription>
                Set the maximum amounts the agent can spend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="perTx">Per Transaction Limit (MNEE)</Label>
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

                  <Button
                    onClick={handleUpdateLimits}
                    disabled={isPending || isConfirming}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {isPending || isConfirming ? "Updating..." : "Update Limits"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Settings</CardTitle>
              <CardDescription>
                Configure when payments require manual approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Require Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Payments above the threshold will require manual approval
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
                    placeholder="Payments above this amount require approval"
                  />
                </div>
              )}

              <Button
                onClick={handleUpdateApprovalSettings}
                disabled={isPending || isConfirming}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isPending || isConfirming ? "Updating..." : "Update Approval Settings"}
              </Button>

              {error && (
                <p className="text-sm text-destructive">{error.message}</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Settings className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No agent selected</h3>
              <p className="text-muted-foreground mt-2">
                Select an agent from the dropdown to configure its settings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
