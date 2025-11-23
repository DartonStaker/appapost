"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AccountSettingsProps {
  account: {
    id: string
    platform: string
    accountName: string
    isActive: boolean
    autoPost: boolean
  }
}

export function AccountSettings({ account }: AccountSettingsProps) {
  const [isActive, setIsActive] = useState(account.isActive)
  const [autoPost, setAutoPost] = useState(account.autoPost)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggle = async (field: "isActive" | "autoPost", value: boolean) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) {
        throw new Error("Failed to update account")
      }

      if (field === "isActive") {
        setIsActive(value)
      } else {
        setAutoPost(value)
      }

      toast.success("Account updated successfully")
    } catch (error) {
      toast.error("Failed to update account")
      // Revert state
      if (field === "isActive") {
        setIsActive(!value)
      } else {
        setAutoPost(!value)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete account")
      }

      toast.success("Account disconnected successfully")
      window.location.reload()
    } catch (error) {
      toast.error("Failed to delete account")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Auto-post</span>
        <Switch
          checked={autoPost}
          onCheckedChange={(checked) => handleToggle("autoPost", checked)}
          disabled={isUpdating || !isActive}
        />
      </div>
      <Switch
        checked={isActive}
        onCheckedChange={(checked) => handleToggle("isActive", checked)}
        disabled={isUpdating}
      />
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect {account.accountName}? This will remove all
              access and you&apos;ll need to reconnect to post to this platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Disconnecting..." : "Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

