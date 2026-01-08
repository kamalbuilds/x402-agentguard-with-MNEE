import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { Header } from "@/components/dashboard/Header"
import { TooltipProvider } from "@/components/ui/tooltip"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AgentGuard Dashboard",
  description: "Manage AI agent payments with security and control",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <TooltipProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1">
                <Header />
                <main className="p-6">{children}</main>
              </div>
            </div>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  )
}
