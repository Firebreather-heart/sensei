"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Users, Globe, Lock } from "lucide-react"

interface VirtualFile {
  id: string
  name: string
  content: string
  directory: boolean
  public: boolean
  can_view: string[]
  can_edit: string[]
  created_at: string
  updated_at: string
  root: string
}

interface User {
  id: string
  username: string
  email: string
}

interface ShareFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: VirtualFile | null
}

export function ShareFileDialog({ open, onOpenChange, file }: ShareFileDialogProps) {
  const [username, setUsername] = useState("")
  const [canEdit, setCanEdit] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open && file) {
      fetchUsers()
      fetchPermissions()
    }
  }, [open, file])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/v1/auth/users/all/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const usersData = await response.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchPermissions = async () => {
    if (!file) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/v1/filesystem/files/${file.id}/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const permissionsData = await response.json()
        setPermissions(permissionsData)
      }
    } catch (error) {
      console.error("Error fetching permissions:", error)
    }
  }

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !username.trim()) return

    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const permissions = canEdit ? ["view", "edit"] : ["view"]

      const response = await fetch(`/api/v1/filesystem/files/${file.id}/share`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          permissions,
        }),
      })

      if (response.ok) {
        setUsername("")
        setCanEdit(false)
        fetchPermissions() // Refresh permissions
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "Failed to share file")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeAccess = async (username: string) => {
    if (!file) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/v1/filesystem/files/${file.id}/share/${username}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchPermissions() // Refresh permissions
      }
    } catch (error) {
      console.error("Error revoking access:", error)
    }
  }

  const togglePublic = async () => {
    if (!file) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/v1/filesystem/files/${file.id}/public?make_public=${!file.public}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchPermissions() // Refresh permissions
      }
    } catch (error) {
      console.error("Error toggling public status:", error)
    }
  }

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Share "{file.name}"</DialogTitle>
          <DialogDescription>Manage who can access this file</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Public Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {file.public ? <Globe className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-gray-400" />}
              <div>
                <h4 className="font-medium">Public Access</h4>
                <p className="text-sm text-gray-500">
                  {file.public ? "Anyone can view this file" : "Only shared users can access"}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={togglePublic}>
              {file.public ? "Make Private" : "Make Public"}
            </Button>
          </div>

          {/* Share with User */}
          <form onSubmit={handleShare} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Share with user</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                list="users"
              />
              <datalist id="users">
                {users.map((user) => (
                  <option key={user.id} value={user.username} />
                ))}
              </datalist>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="can-edit" checked={canEdit} onCheckedChange={(checked) => setCanEdit(checked as boolean)} />
              <Label htmlFor="can-edit">Allow editing</Label>
            </div>

            <Button type="submit" disabled={loading || !username.trim()}>
              {loading ? "Sharing..." : "Share"}
            </Button>
          </form>

          {/* Current Permissions */}
          {permissions && (
            <div className="space-y-4">
              <h4 className="font-medium">Current Access</h4>

              {permissions.shared_with && permissions.shared_with.length > 0 ? (
                <div className="space-y-2">
                  {permissions.shared_with.map((share: any) => (
                    <div key={share.username} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4" />
                        <div>
                          <p className="font-medium">{share.username}</p>
                          <div className="flex gap-1">
                            {share.permissions.includes("view") && (
                              <Badge variant="secondary" className="text-xs">
                                View
                              </Badge>
                            )}
                            {share.permissions.includes("edit") && (
                              <Badge variant="secondary" className="text-xs">
                                Edit
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRevokeAccess(share.username)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No users have access to this file</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
