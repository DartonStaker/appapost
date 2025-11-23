"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { toast } from "sonner"

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success("Signed out successfully")
      router.push("/login")
      router.refresh()
    } catch (error) {
      toast.error("Failed to sign out")
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      <LogOut className="w-4 h-4 mr-2" />
      Sign Out
    </Button>
  )
}

