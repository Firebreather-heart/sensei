"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code2, FileText, Share2, Users, Search, Lock, Globe } from "lucide-react"
import Link from "next/link"

interface PublicFile {
  id: string
  name: string
  content: string
  created_at: string
  root: string
}

export default function HomePage() {
  const [publicFiles, setPublicFiles] = useState<PublicFile[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchPublicFiles()
  }, [])

  const fetchPublicFiles = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"
      const response = await fetch(`${apiUrl}/api/v1/filesystem/files/public?limit=6`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("API Response Status:", response.status)
      console.log("API Response Headers:", response.headers.get("content-type"))

      if (!response.ok) {
        console.error("API response not ok:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("Error response:", errorText)
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON:", contentType)
        const responseText = await response.text()
        console.error("Response text:", responseText)
        return
      }

      const files = await response.json()
      console.log("Fetched files:", files)
      setPublicFiles(files)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sensei</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-sm">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 sm:py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Share Code Like a <span className="text-blue-600">Shinobi</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 leading-relaxed px-4">
            Create, edit, share, and collaborate on code with permission management and real-time editing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8">
                Start Coding
              </Button>
            </Link>
            <Link href="/public">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 sm:px-8 bg-transparent">
                Explore Public Code
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-8 sm:mb-12">
          Powerful Features
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="text-center">
            <CardHeader className="pb-4">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">Code Management</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm sm:text-base">
                Create and organize your code files with full editing capabilities.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-4">
              <Share2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">Smart Sharing</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm sm:text-base">
                Share code with specific users or make it public with granular permissions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-4">
              <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 mx-auto mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">Access Control</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm sm:text-base">
                Control who can view and edit your code with flexible permissions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-4">
              <Search className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600 mx-auto mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">Advanced Search</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm sm:text-base">
                Find code by name or content across your own, shared, and public repositories.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Public Files Preview */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Recent Public Code</h3>
          <Link href="/public">
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              View All <Globe className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {publicFiles.map((file) => (
              <Card key={file.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.name)}
                    <CardTitle className="text-base sm:text-lg truncate">{file.name}</CardTitle>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Badge variant="secondary" className="text-xs w-fit">
                      <Users className="w-3 h-3 mr-1" />
                      {file.root}
                    </Badge>
                    <span className="text-xs sm:text-sm text-gray-500">{formatDate(file.created_at)}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <pre className="text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded overflow-hidden">
                    <code className="line-clamp-4">
                      {file.content?.substring(0, 120)}
                      {file.content && file.content.length > 120 ? "..." : ""}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && publicFiles.length === 0 && (
          <Card className="text-center py-8 sm:py-12">
            <CardContent>
              <Globe className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <CardTitle className="text-lg sm:text-xl mb-2">No Public Code Yet</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Be the first to share your code with the community!
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-gray-900 dark:text-white">Sensei Code</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Live Collaboration</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
