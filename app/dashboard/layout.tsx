import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { DashboardNav } from "@/components/dashboard-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sparkles, LogOut } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import Image from "next/image"

// Force dynamic rendering for dashboard routes
// Deployment trigger
export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      redirect("/login")
    }

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="https://skerjjeuapdbshgbhvrh.supabase.co/storage/v1/object/public/images/2.png"
                alt="AppaPost Logo"
                width={40}
                height={40}
                className="rounded-lg object-contain"
                priority
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AppaPost
              </span>
            </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="text-sm text-muted-foreground">
              {user.email}
            </div>
            <LogoutButton />
          </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <DashboardNav />
          <main className="mt-8">{children}</main>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in dashboard layout:", error)
    redirect("/login")
  }
}

