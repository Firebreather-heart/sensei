"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Code2, FileText, Search, Users, Globe, ArrowLeft } from "lucide-react"

interface PublicFile {
  id: string
  name: string
  content: string
  created_at: string
  updated_at: string
  root: string
  public: boolean
}

export default function PublicFilesPage() {
  const [files, setFiles] = useState<PublicFile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredFiles, setFilteredFiles] = useState<PublicFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<PublicFile | null>(null)

  useEffect(() => {
    fetchPublicFiles()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = files.filter(
        (file) =>
          file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.root.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredFiles(filtered)
    } else {
      setFilteredFiles(files)
    }
  }, [searchQuery, files])

  const fetchPublicFiles = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"
      console.log("Fetching public files from:", `${apiUrl}/api/v1/filesystem/files/public?limit=100`)

      const response = await fetch(`${apiUrl}/api/v1/filesystem/files/public?limit=100`, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Public files response status:", response.status)

      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const filesData = await response.json()
          console.log("Public files fetched:", filesData)
          setFiles(filesData)
          setFilteredFiles(filesData)
        } else {
          console.error("Non-JSON response:", contentType)
        }
      } else {
        console.error("Failed to fetch public files:", response.status)
      }
    } catch (error) {
      console.error("Error fetching public files:", error)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <h1 className="text-lg sm:text-2xl font-bold">Public Code</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-xs sm:text-sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {selectedFile ? (
          /* File Viewer */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setSelectedFile(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Files
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFile.name)}
                  <CardTitle className="text-xl">{selectedFile.name}</CardTitle>
                  <Badge variant="secondary">
                    <Globe className="w-3 h-3 mr-1" />
                    Public
                  </Badge>
                </div>
                <CardDescription>
                  By {selectedFile.root} • Updated {formatDate(selectedFile.updated_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="p-4 text-sm bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto max-h-96 font-mono">
                  <code>{selectedFile.content || "// Empty file"}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* File List */
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search public files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xl sm:text-2xl font-bold">{files.length}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Public Files</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xl sm:text-2xl font-bold">{new Set(files.map((f) => f.root)).size}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Contributors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xl sm:text-2xl font-bold">{filteredFiles.length}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{searchQuery ? "Results" : "Total"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Files Grid */}
            {filteredFiles.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  {searchQuery ? (
                    <>
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <CardTitle className="text-xl mb-2">No files found</CardTitle>
                      <CardDescription>Try adjusting your search terms</CardDescription>
                    </>
                  ) : (
                    <>
                      <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <CardTitle className="text-xl mb-2">No public files yet</CardTitle>
                      <CardDescription>Be the first to share your code with the community!</CardDescription>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFiles.map((file) => (
                  <Card
                    key={file.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedFile(file)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.name)}
                        <CardTitle className="text-lg truncate">{file.name}</CardTitle>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          <Users className="w-3 h-3 mr-1" />
                          {file.root}
                        </Badge>
                        <span className="text-sm text-gray-500">{formatDate(file.updated_at)}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded overflow-hidden">
                        <code className="line-clamp-4">
                          {file.content?.substring(0, 150)}
                          {file.content && file.content.length > 150 ? "..." : ""}
                        </code>
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
