import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatMNEE(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals)
  const integerPart = amount / divisor
  const decimalPart = amount % divisor
  const decimalStr = decimalPart.toString().padStart(decimals, "0")
  return `${integerPart}.${decimalStr.slice(0, 2)}`
}

export function parseMNEE(amount: string, decimals: number = 18): bigint {
  const [integer, decimal = ""] = amount.split(".")
  const paddedDecimal = decimal.padEnd(decimals, "0").slice(0, decimals)
  return BigInt(integer + paddedDecimal)
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString()
}

export function generateAgentId(name: string): `0x${string}` {
  const encoder = new TextEncoder()
  const data = encoder.encode(name)
  let hash = 0n
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 8n) | BigInt(data[i])
    hash = hash % (2n ** 256n)
  }
  return `0x${hash.toString(16).padStart(64, "0")}` as `0x${string}`
}
