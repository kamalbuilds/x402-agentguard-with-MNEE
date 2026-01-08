"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatAddress, formatMNEE, formatTimestamp } from "@/lib/utils"
import type { PaymentRecord } from "@/lib/contracts"

interface RecentPaymentsProps {
  payments: readonly PaymentRecord[] | undefined
  isLoading: boolean
}

export function RecentPayments({ payments, isLoading }: RecentPaymentsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const recentPayments = payments?.slice(0, 10) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
      </CardHeader>
      <CardContent>
        {recentPayments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.map((payment, index) => (
                <TableRow key={index}>
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
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No payments yet
          </p>
        )}
      </CardContent>
    </Card>
  )
}
