"use client"

import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Trash2, CheckCircle2, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import Link from "next/link"

interface Account {
  id: string
  platform: string
  account_name?: string
  is_active: boolean
  auto_post: boolean
  ayrshare_profile_id?: string
}

interface AccountListProps {
  accounts: Account[]
  platforms: ReadonlyArray<{ id: string; name: string; icon: any }>
}

export function AccountList({ accounts, platforms }: AccountListProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  const handleToggle = async (accountId: string, field: "is_active" | "auto_post", value: boolean) => {
    setUpdating(accountId)
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to update account")
      }

      toast.success("Account updated successfully")
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || "Failed to update account")
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async (accountId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to delete account")
      }

      toast.success("Account disconnected successfully")
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(null)
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground mb-4">No accounts connected yet</p>
        <Link href="/dashboard/settings/connections">
          <Button>Connect Your First Account</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => {
        const platform = platforms.find((p) => p.id === account.platform)
        const Icon = platform?.icon

        return (
          <div
            key={account.id}
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium capitalize truncate">{account.platform}</p>
                  {account.ayrshare_profile_id && (
                    <Badge variant="outline" className="text-xs">
                      Ayrshare
                    </Badge>
                  )}
                </div>
                {account.account_name && (
                  <p className="text-sm text-muted-foreground truncate">{account.account_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Active</span>
                <Switch
                  checked={account.is_active}
                  onCheckedChange={(checked) => handleToggle(account.id, "is_active", checked)}
                  disabled={updating === account.id}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Auto</span>
                <Switch
                  checked={account.auto_post}
                  onCheckedChange={(checked) => handleToggle(account.id, "auto_post", checked)}
                  disabled={updating === account.id || !account.is_active}
                />
              </div>
              <Dialog open={showDeleteDialog === account.id} onOpenChange={(open) => setShowDeleteDialog(open ? account.id : null)}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Disconnect Account</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to disconnect {account.account_name || account.platform}? This will remove all
                      access and you&apos;ll need to reconnect to post to this platform.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(null)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={() => handleDelete(account.id)} disabled={isDeleting}>
                      {isDeleting ? "Disconnecting..." : "Disconnect"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )
      })}
    </div>
  )
}

