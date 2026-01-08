"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAgentGuardWrite, useMNEEAllowance, useMNEEBalance } from "@/hooks/useAgentGuard"
import { AGENT_GUARD_VAULT_ADDRESS } from "@/lib/contracts"
import { formatMNEE, parseMNEE } from "@/lib/utils"
import { useAccount } from "wagmi"
import { Plus } from "lucide-react"

interface DepositDialogProps {
  agentId: `0x${string}` | undefined
}

export function DepositDialog({ agentId }: DepositDialogProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const { address } = useAccount()

  const { data: balance } = useMNEEBalance(address)
  const { data: allowance } = useMNEEAllowance(address)
  const { deposit, approveMNEE, isPending, isConfirming, isSuccess } = useAgentGuardWrite()

  const parsedAmount = amount ? parseMNEE(amount) : 0n
  const needsApproval = allowance !== undefined && parsedAmount > allowance

  const handleDeposit = () => {
    if (!agentId || parsedAmount === 0n) return

    if (needsApproval) {
      approveMNEE(parsedAmount)
    } else {
      deposit(agentId, parsedAmount)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!agentId}>
          <Plus className="h-4 w-4 mr-2" />
          Deposit MNEE
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit MNEE</DialogTitle>
          <DialogDescription>
            Deposit MNEE tokens to fund your agent&apos;s payment operations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {balance !== undefined && (
              <p className="text-xs text-muted-foreground">
                Available: {formatMNEE(balance)} MNEE
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeposit}
            disabled={isPending || isConfirming || parsedAmount === 0n}
          >
            {isPending || isConfirming
              ? "Processing..."
              : needsApproval
              ? "Approve MNEE"
              : "Deposit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
