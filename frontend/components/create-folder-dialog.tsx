"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Folder, Check } from "lucide-react"

interface CreateFolderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onFolderCreated: () => void
    parentFolderId: string | null
}

export function CreateFolderDialog({ open, onOpenChange, onFolderCreated, parentFolderId }: CreateFolderDialogProps) {
    const [name, setName] = useState("New Folder")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        setError("")
        setSuccess(false)

        try {
            const token = localStorage.getItem("token")
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

            const response = await fetch(`${apiUrl}/api/v1/filesystem/files/create`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    directory: true,
                    parent: parentFolderId,
                    public: false,
                    content: null,
                    children: []
                }),
            })

            if (response.ok) {
                setSuccess(true)
                setTimeout(() => {
                    onFolderCreated()
                    onOpenChange(false)
                }, 1000)
            } else {
                const errorData = await response.json().catch(() => ({}))
                setError(errorData.detail || "Failed to create folder")
            }
        } catch (error) {
            setError("Network error. Please check your connection.")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !loading && onOpenChange(isOpen)}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Folder className="h-5 w-5" />
                        <DialogTitle>Create New Folder</DialogTitle>
                    </div>
                </DialogHeader>

                <form id="create-folder-form" onSubmit={handleSubmit}>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                            <Check className="h-4 w-4 text-green-600" />
                            <AlertDescription>Folder created successfully!</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Folder Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="New Folder"
                                autoFocus
                            />
                        </div>
                    </div>
                </form>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="create-folder-form"
                        disabled={loading || !name?.trim()}
                        className={`${loading ? "opacity-80" : ""} ${success ? "bg-green-600 hover:bg-green-700" : ""}`}
                    >
                        {loading ? "Creating..." : success ? "Created!" : "Create Folder"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}