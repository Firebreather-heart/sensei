"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Code2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"
      console.log("Making login request to:", `${apiUrl}/api/v1/auth/login`)

      const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("Login response status:", response.status)
      console.log("Login response headers:", response.headers.get("content-type"))

      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json()
          // console.log("Login successful:", data)
          localStorage.setItem("token", data.access_token)
          router.push("/dashboard")
        } else {
          const responseText = await response.text()
          console.error("Non-JSON response:", responseText)
          setError("Invalid response from server")
        }
      } else {
        const responseText = await response.text()
        console.error("Login failed:", response.status, responseText)

        try {
          const errorData = JSON.parse(responseText)
          setError(errorData.detail || "Login failed")
        } catch {
          setError(`Login failed: ${response.status} ${response.statusText}`)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
          >
            <Code2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            Sensei
          </Link>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
            Welcome back to your code sanctuary
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl">Sign In</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {"Don't have an account? "}
              <Link href="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
