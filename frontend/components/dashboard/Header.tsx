"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"

export function Header() {
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold">Agent Payment Management</h1>
      </div>
      <div className="flex items-center gap-4">
        <ConnectButton />
      </div>
    </header>
  )
}
