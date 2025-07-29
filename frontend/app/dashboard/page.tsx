"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code2, FileText, Plus, Search, Share2, Users, Globe, Lock, Trash2, Eye, Folder } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreateFileDialog } from "@/components/create-file-dialog"
import { CreateFolderDialog } from "@/components/create-folder-dialog"
import { ShareFileDialog } from "@/components/share-file-dialog"
import { CodeEditor } from "@/components/code-editor"
import { FileSystemExplorer } from "@/components/file-system-explorer"
import { VirtualFile } from "@/types"


interface User {
  id: string
  username: string
  email: string
  role: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [files, setFiles] = useState<VirtualFile[]>([])
  const [sharedFiles, setSharedFiles] = useState<VirtualFile[]>([])
  const [publicFiles, setPublicFiles] = useState<VirtualFile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<VirtualFile[]>([])
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [fileToShare, setFileToShare] = useState<VirtualFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentFile, setCurrentFile] = useState<VirtualFile | null>(null)
  const [error, setError] = useState("")
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      console.log("Checking authentication in dashboard")
      const token = localStorage.getItem("token")
      console.log("Token found:", !!token)

      if (!token) {
        console.log("No token found, redirecting to login")
        router.push("/login")
        return
      }

      console.log("Token exists, fetching user data")
      fetchUserData()
      fetchFiles()
      fetchSharedFiles()
      fetchPublicFiles()
    }

    // Add a small delay to ensure localStorage is available
    if (typeof window !== 'undefined') {
      setTimeout(checkAuth, 50)
    }
  }, [])

  // Replace the fetchUserData function
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.log("No token in fetchUserData, redirecting")
        router.push("/login")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
        "https://sensei-2keb.onrender.com"
      console.log("Fetching user data from:", `${apiUrl}/api/v1/auth/me`)

      const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("User data response status:", response.status)

      if (!response.ok) {
        console.error("Auth failed:", response.status)
        // Clear invalid token
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const userData = await response.json()
        console.log("User data fetched:", userData)
        setUser(userData)
        setLoading(false)
      } else {
        console.error("Non-JSON response from auth endpoint")
        localStorage.removeItem("token")
        router.push("/login")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      localStorage.removeItem("token")
      router.push("/login")
    }
  }

  // Replace the fetchFiles function
  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"
      const response = await fetch(`${apiUrl}/api/v1/filesystem/user/files/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Files response status:", response.status)

      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const filesData = await response.json()
          console.log("Files fetched:", filesData)
          setFiles(filesData)
        }
      }
    } catch (error) {
      console.error("Error fetching files:", error)
    } finally {
      setLoading(false)
    }
  }

  // Replace the fetchSharedFiles function
  const fetchSharedFiles = async () => {
    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"
      const response = await fetch(`${apiUrl}/api/v1/filesystem/files/shared-with-me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const sharedData = await response.json()
          setSharedFiles(sharedData)
        }
      }
    } catch (error) {
      console.error("Error fetching shared files:", error)
    }
  }

  // Replace the fetchPublicFiles function
  const fetchPublicFiles = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"
      const response = await fetch(`${apiUrl}/api/v1/filesystem/files/public?limit=10`, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const publicData = await response.json()
          setPublicFiles(publicData)
        }
      }
    } catch (error) {
      console.error("Error fetching public files:", error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"
      const response = await fetch(
        `${apiUrl}/api/v1/filesystem/search?query=${encodeURIComponent(searchQuery)}&include_shared=true&include_public=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
      }
    } catch (error) {
      console.error("Error searching files:", error)
    }
  }

  const handleFileCreate = (newFile: VirtualFile) => {
    setFiles([...files, newFile])
    setShowCreateDialog(false)
  }

  const handleFileUpdate = async (fileId: string, content: string) => {
    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"
      const response = await fetch(`${apiUrl}/api/v1/filesystem/files/${fileId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        const updatedFile = await response.json()
        setFiles(files.map((f) => (f.id === fileId ? updatedFile : f)))
        setSelectedFile(updatedFile)
      }
    } catch (error) {
      console.error("Error updating file:", error)
    }
  }

  const handleFileDelete = async (fileId: string) => {
    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"
      const response = await fetch(`${apiUrl}/api/v1/filesystem/files/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setFiles(files.filter((f) => f.id !== fileId))
        if (selectedFile?.id === fileId) {
          setSelectedFile(null)
        }
      }
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  const handleShareFile = (file: VirtualFile) => {
    setFileToShare(file)
    setShowShareDialog(true)
  }

  const toggleFilePublic = async (file: VirtualFile) => {
    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"
      const response = await fetch(`${apiUrl}/api/v1/filesystem/files/${file.id}/public?make_public=${!file.public}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const updatedFiles = files.map((f) => (f.id === file.id ? { ...f, public: !f.public } : f))
        setFiles(updatedFiles)
      }
    } catch (error) {
      console.error("Error toggling file public status:", error)
    }
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase()
    switch (ext) {
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
      case "py":
      case "java":
      case "cpp":
      case "c":
        return <Code2 className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleFileSelect = (file: VirtualFile) => {
    setCurrentFile(file)
  }

  const refreshFiles = () => {
    // This function will be called when files are created or deleted
    // We don't need to do anything here as the FileSystemExplorer will handle its own refresh
    if (currentFile) {
      // Refresh the current file if it's open
      fetchFileById(currentFile.id)
    }
  }

  const fetchFileById = async (fileId: string) => {
    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

      const response = await fetch(`${apiUrl}/api/v1/filesystem/files/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const fileData = await response.json()
        setCurrentFile(fileData)
      }
    } catch (error) {
      console.error("Error fetching file:", error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Manage your code and collaborate with others
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New File
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search files by name or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>{searchResults.length} files found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {searchResults.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.name)}
                      <div>
                        <h4 className="font-medium">{file.name}</h4>
                        <p className="text-sm text-gray-500">by {file.root}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.public && (
                        <Badge variant="secondary">
                          <Globe className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">{formatDate(file.updated_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
          {/* File Lists */}
          <div className="lg:col-span-2">
            <FileSystemExplorer
              onFileSelect={(file) => setSelectedFile(file)}
              onRefresh={fetchFiles}
              onShareFile={handleShareFile}
              onTogglePublic={toggleFilePublic}
              onDeleteFile={(file) => handleFileDelete(file.id)}
            />
          </div>

          {/* File Editor */}
          <div className="lg:col-span-1">
            {selectedFile ? (
              selectedFile.directory ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Folder className="h-16 w-16 mx-auto text-blue-500 opacity-50" />
                    <h3 className="text-xl font-medium mt-2">{selectedFile.name}</h3>
                    <p className="text-gray-500 mt-1">
                      This is a folder with {selectedFile.children?.length || 0} items
                    </p>
                  </div>
                </div>
              ) : (
                <CodeEditor
                  file={selectedFile}
                  onSave={(content) => handleFileUpdate(selectedFile.id, content)}
                  readOnly={!files.some((f) => f.id === selectedFile.id)}
                />
              )
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto opacity-20" />
                  <h3 className="text-xl font-medium mt-2">No File Selected</h3>
                  <p className="text-gray-500 mt-1">Select a file from the explorer to view or edit</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
        onFolderCreated={fetchFiles}
        parentFolderId={currentFolderId}
      />

      <CreateFileDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onFileCreated={handleFileCreate}
        files={files}
        parentFolderId={currentFolderId}
      />

      <ShareFileDialog open={showShareDialog} onOpenChange={setShowShareDialog} file={fileToShare} />
    </DashboardLayout>
  )
}
