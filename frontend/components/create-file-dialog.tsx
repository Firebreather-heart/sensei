"use client"

import type React from "react"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

interface CreateFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileCreated: (file: VirtualFile) => void
}

export function CreateFileDialog({ open, onOpenChange, onFileCreated }: CreateFileDialogProps) {
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"
      console.log("Creating file at:", `${apiUrl}/api/v1/filesystem/files/create`)

      const response = await fetch(`${apiUrl}/api/v1/filesystem/files/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          content,
          directory: false,
          public: false,
        }),
      })

      console.log("Create file response status:", response.status)

      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const newFile = await response.json()
          console.log("File created:", newFile)
          onFileCreated(newFile)
          setName("")
          setContent("")
          onOpenChange(false)
        } else {
          setError("Invalid response from server")
        }
      } else {
        const responseText = await response.text()
        console.error("Create file failed:", response.status, responseText)

        try {
          const errorData = JSON.parse(responseText)
          setError(errorData.detail || "Failed to create file")
        } catch {
          setError(`Failed to create file: ${response.status} ${response.statusText}`)
        }
      }
    } catch (error) {
      console.error("Network error:", error)
      setError("Cannot connect to server. Please check your internet connection.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New File</DialogTitle>
          <DialogDescription>Create a new code file in your workspace</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">File Name</Label>
              <Input
                id="name"
                placeholder="example.js"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="// Your code here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Creating..." : "Create File"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
