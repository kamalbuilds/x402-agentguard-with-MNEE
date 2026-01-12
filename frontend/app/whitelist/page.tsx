"use client"

import { useState, useEffect } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAgentGuardWrite, useWhitelistEnforced, useWhitelistStatus } from "@/hooks/useAgentGuard"
import { formatAddress } from "@/lib/utils"
import { AlertCircle, Plus, Shield, Trash2 } from "lucide-react"

interface Agent {
  name: string
  id: `0x${string}`
}

interface WhitelistEntry {
  address: `0x${string}`
  name: string
}

export default function WhitelistPage() {
  const { isConnected } = useAccount()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<`0x${string}` | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newAddress, setNewAddress] = useState("")
  const [newName, setNewName] = useState("")
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([])

  const { data: whitelistEnforced, isLoading: enforcedLoading } = useWhitelistEnforced(selectedAgent)
  const { setWhitelist: setWhitelistContract, setWhitelistEnforced, isPending, isConfirming, isSuccess } = useAgentGuardWrite()

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
    if (selectedAgent) {
      const stored = localStorage.getItem(`agentguard_whitelist_${selectedAgent}`)
      if (stored) {
        setWhitelist(JSON.parse(stored))
      } else {
        setWhitelist([])
      }
    }
  }, [selectedAgent])

  useEffect(() => {
    if (isSuccess && dialogOpen) {
      const newEntry: WhitelistEntry = {
        address: newAddress as `0x${string}`,
        name: newName,
      }
      const updated = [...whitelist, newEntry]
      setWhitelist(updated)
      if (selectedAgent) {
        localStorage.setItem(`agentguard_whitelist_${selectedAgent}`, JSON.stringify(updated))
      }
      setDialogOpen(false)
      setNewAddress("")
      setNewName("")
    }
  }, [isSuccess])

  const handleAddToWhitelist = () => {
    if (!selectedAgent || !newAddress) return
    setWhitelistContract(selectedAgent, newAddress as `0x${string}`, true)
  }

  const handleRemoveFromWhitelist = (address: `0x${string}`) => {
    if (!selectedAgent) return
    setWhitelistContract(selectedAgent, address, false)
    const updated = whitelist.filter((w) => w.address !== address)
    setWhitelist(updated)
    localStorage.setItem(`agentguard_whitelist_${selectedAgent}`, JSON.stringify(updated))
  }

  const handleToggleEnforced = (enforced: boolean) => {
    if (!selectedAgent) return
    setWhitelistEnforced(selectedAgent, enforced)
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
                Please connect your wallet to manage whitelists.
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
        <h1 className="text-3xl font-bold">Whitelist Management</h1>
        <p className="text-muted-foreground">
          Control which addresses your agents can pay
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Whitelist Settings</CardTitle>
              <CardDescription>
                Configure whitelist enforcement for each agent
              </CardDescription>
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
        </CardHeader>
        <CardContent>
          {selectedAgent ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Enforce Whitelist</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, the agent can only pay whitelisted addresses
                </p>
              </div>
              <Switch
                checked={whitelistEnforced || false}
                onCheckedChange={handleToggleEnforced}
                disabled={enforcedLoading || isPending || isConfirming}
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Select an agent to configure whitelist settings
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Whitelisted Addresses</CardTitle>
              <CardDescription>
                Addresses that this agent is allowed to pay
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!selectedAgent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add to Whitelist</DialogTitle>
                  <DialogDescription>
                    Add a new address to the whitelist for this agent.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="0x..."
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label">Label (Optional)</Label>
                    <Input
                      id="label"
                      placeholder="e.g., Payment Provider"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddToWhitelist}
                    disabled={isPending || isConfirming || !newAddress}
                  >
                    {isPending || isConfirming ? "Adding..." : "Add to Whitelist"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {whitelist.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whitelist.map((entry) => (
                  <WhitelistRow
                    key={entry.address}
                    entry={entry}
                    agentId={selectedAgent}
                    onRemove={handleRemoveFromWhitelist}
                  />
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No whitelisted addresses</h3>
              <p className="text-muted-foreground mt-2">
                {selectedAgent
                  ? "Add addresses to the whitelist to control payment destinations."
                  : "Select an agent to manage its whitelist."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function WhitelistRow({
  entry,
  agentId,
  onRemove,
}: {
  entry: WhitelistEntry
  agentId: `0x${string}` | undefined
  onRemove: (address: `0x${string}`) => void
}) {
  const { data: isWhitelisted } = useWhitelistStatus(agentId, entry.address)

  return (
    <TableRow>
      <TableCell className="font-medium">
        {entry.name || "Unnamed"}
      </TableCell>
      <TableCell className="font-mono">{formatAddress(entry.address)}</TableCell>
      <TableCell>
        {isWhitelisted ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Pending</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(entry.address)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  )
}
