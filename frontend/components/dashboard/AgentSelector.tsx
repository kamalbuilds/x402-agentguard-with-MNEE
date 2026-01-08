"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { generateAgentId } from "@/lib/utils"

interface AgentSelectorProps {
  selectedAgent: `0x${string}` | undefined
  onAgentChange: (agentId: `0x${string}`) => void
}

export function AgentSelector({ selectedAgent, onAgentChange }: AgentSelectorProps) {
  const [agentName, setAgentName] = useState("")
  const [savedAgents, setSavedAgents] = useState<{ name: string; id: `0x${string}` }[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("agentguard_agents")
    if (stored) {
      setSavedAgents(JSON.parse(stored))
    }
  }, [])

  const handleAddAgent = () => {
    if (!agentName.trim()) return
    const agentId = generateAgentId(agentName)
    const newAgent = { name: agentName, id: agentId }
    const updated = [...savedAgents, newAgent]
    setSavedAgents(updated)
    localStorage.setItem("agentguard_agents", JSON.stringify(updated))
    onAgentChange(agentId)
    setAgentName("")
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Select Agent</Label>
        <Select
          value={selectedAgent}
          onValueChange={(value) => onAgentChange(value as `0x${string}`)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent>
            {savedAgents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Enter agent name"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
        />
        <Button onClick={handleAddAgent} variant="outline">
          Add
        </Button>
      </div>
      {selectedAgent && (
        <p className="text-xs text-muted-foreground font-mono break-all">
          Agent ID: {selectedAgent}
        </p>
      )}
    </div>
  )
}
