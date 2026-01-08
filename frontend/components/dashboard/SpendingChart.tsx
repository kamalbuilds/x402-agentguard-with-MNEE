"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import type { PaymentRecord } from "@/lib/contracts"
import { formatMNEE } from "@/lib/utils"

interface SpendingChartProps {
  payments: readonly PaymentRecord[] | undefined
}

export function SpendingChart({ payments }: SpendingChartProps) {
  // Group payments by day
  const dailyData = payments?.reduce((acc, payment) => {
    const date = new Date(Number(payment.timestamp) * 1000).toLocaleDateString()
    const existing = acc.find((d) => d.date === date)
    if (existing) {
      existing.amount += Number(payment.amount) / 1e8
      existing.count += 1
    } else {
      acc.push({ date, amount: Number(payment.amount) / 1e8, count: 1 })
    }
    return acc
  }, [] as { date: string; amount: number; count: number }[]) || []

  // Group payments by month
  const monthlyData = payments?.reduce((acc, payment) => {
    const date = new Date(Number(payment.timestamp) * 1000)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const existing = acc.find((d) => d.month === month)
    if (existing) {
      existing.amount += Number(payment.amount) / 1e8
      existing.count += 1
    } else {
      acc.push({ month, amount: Number(payment.amount) / 1e8, count: 1 })
    }
    return acc
  }, [] as { month: string; amount: number; count: number }[]) || []

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Spending Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="h-[300px]">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)} MNEE`, "Amount"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No payment data available
              </div>
            )}
          </TabsContent>
          <TabsContent value="monthly" className="h-[300px]">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)} MNEE`, "Amount"]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar
                    dataKey="amount"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No payment data available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
