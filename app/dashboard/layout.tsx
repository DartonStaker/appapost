import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { DashboardNav } from "@/components/dashboard-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sparkles } from "lucide-react"
import Link from "next/link"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/api/auth/signin")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AppaPost
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="text-sm text-muted-foreground">
              {user.email}
            </div>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        <DashboardNav />
        <main className="mt-8">{children}</main>
      </div>
    </div>
  )
}

