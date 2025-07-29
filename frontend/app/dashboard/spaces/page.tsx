"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code2, Plus, Users, Clock, Globe, Lock, ArrowRight } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { toast } from "@/components/ui/use-toast"
import { CodeSpace } from "@/types/spaces"

interface User {
    id: string
    username: string
    email: string
    role: string
}

export default function SpacesPage() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [mySpaces, setMySpaces] = useState<CodeSpace[]>([])
    const [joinedSpaces, setJoinedSpaces] = useState<CodeSpace[]>([])
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showJoinDialog, setShowJoinDialog] = useState(false)
    const [newSpaceName, setNewSpaceName] = useState("")
    const [isPublic, setIsPublic] = useState(false)
    const [joinCode, setJoinCode] = useState("")
    const [creating, setCreating] = useState(false)
    const [joining, setJoining] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.push("/login")
            return
        }

        fetchUserData()
        fetchSpaces()
    }, [])

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem("token")
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"

            const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                console.error("Auth failed:", response.status)
                router.push("/login")
                return
            }

            const contentType = response.headers.get("content-type")
            if (contentType && contentType.includes("application/json")) {
                const userData = await response.json()
                setUser(userData)
            } else {
                console.error("Non-JSON response from auth endpoint")
                router.push("/login")
            }
        } catch (error) {
            console.error("Error fetching user data:", error)
            router.push("/login")
        }
    }

    const fetchSpaces = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("token")
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"

            // For demo purposes - in real app these would come from API
            // Replace with actual API calls when backend is ready

            // Example data for demonstration
            const mockMySpaces: CodeSpace[] = [
                {
                    id: "space-1",
                    name: "JavaScript Project",
                    joinCode: "JS123",
                    createdAt: Date.now() - 86400000, // 1 day ago
                    creatorId: user?.id || "user-1",
                    creatorName: user?.username || "You",
                    users: [
                        {
                            id: user?.id || "user-1",
                            username: user?.username || "You",
                            isCreator: true,
                            canEdit: true,
                            isActive: true,
                            lastActivity: Date.now()
                        },
                        {
                            id: "user-2",
                            username: "collaborator1",
                            isCreator: false,
                            canEdit: true,
                            isActive: false,
                            lastActivity: Date.now() - 3600000 // 1 hour ago
                        }
                    ],
                    activeFile: null,
                    messages: [],
                    editRequests: [],
                    isPublic: false,
                    lastActivity: Date.now() - 7200000 // 2 hours ago
                },
                {
                    id: "space-2",
                    name: "Public Demo Space",
                    joinCode: "PUB456",
                    createdAt: Date.now() - 172800000, // 2 days ago
                    creatorId: user?.id || "user-1",
                    creatorName: user?.username || "You",
                    users: [
                        {
                            id: user?.id || "user-1",
                            username: user?.username || "You",
                            isCreator: true,
                            canEdit: true,
                            isActive: true,
                            lastActivity: Date.now()
                        },
                        {
                            id: "user-3",
                            username: "guest1",
                            isCreator: false,
                            canEdit: false,
                            isActive: false,
                            lastActivity: Date.now() - 43200000 // 12 hours ago
                        },
                        {
                            id: "user-4",
                            username: "guest2",
                            isCreator: false,
                            canEdit: false,
                            isActive: false,
                            lastActivity: Date.now() - 86400000 // 1 day ago
                        }
                    ],
                    activeFile: null,
                    messages: [],
                    editRequests: [],
                    isPublic: true,
                    lastActivity: Date.now() - 3600000 // 1 hour ago
                }
            ]

            const mockJoinedSpaces: CodeSpace[] = [
                {
                    id: "space-3",
                    name: "Python Learning Group",
                    joinCode: "PY789",
                    createdAt: Date.now() - 259200000, // 3 days ago
                    creatorId: "user-5",
                    creatorName: "python_master",
                    users: [
                        {
                            id: "user-5",
                            username: "python_master",
                            isCreator: true,
                            canEdit: true,
                            isActive: false,
                            lastActivity: Date.now() - 14400000 // 4 hours ago
                        },
                        {
                            id: user?.id || "user-1",
                            username: user?.username || "You",
                            isCreator: false,
                            canEdit: true,
                            isActive: true,
                            lastActivity: Date.now()
                        }
                    ],
                    activeFile: null,
                    messages: [],
                    editRequests: [],
                    isPublic: false,
                    lastActivity: Date.now() - 14400000 // 4 hours ago
                }
            ]

            setMySpaces(mockMySpaces)
            setJoinedSpaces(mockJoinedSpaces)

        } catch (error) {
            console.error("Error fetching spaces:", error)
            toast({
                title: "Error fetching spaces",
                description: "Please try again later",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCreateSpace = async () => {
        if (!newSpaceName.trim()) return

        try {
            setCreating(true)
            const token = localStorage.getItem("token")
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"

            // Mock successful creation for now
            setTimeout(() => {
                // Create a new mock space
                const newSpace: CodeSpace = {
                    id: `space-${Date.now()}`,
                    name: newSpaceName,
                    joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                    createdAt: Date.now(),
                    creatorId: user?.id || "user-1",
                    creatorName: user?.username || "You",
                    users: [
                        {
                            id: user?.id || "user-1",
                            username: user?.username || "You",
                            isCreator: true,
                            canEdit: true,
                            isActive: true,
                            lastActivity: Date.now()
                        }
                    ],
                    activeFile: null,
                    messages: [],
                    editRequests: [],
                    isPublic: isPublic,
                    lastActivity: Date.now()
                }

                setMySpaces([newSpace, ...mySpaces])
                setShowCreateDialog(false)
                setNewSpaceName("")
                setIsPublic(false)
                setCreating(false)

                toast({
                    title: "Space created",
                    description: `"${newSpaceName}" has been created successfully.`,
                })

                // Navigate to the new space
                router.push(`/dashboard/spaces/${newSpace.id}`)
            }, 1000)

        } catch (error) {
            console.error("Error creating space:", error)
            toast({
                title: "Failed to create space",
                description: "Please try again later",
                variant: "destructive",
            })
            setCreating(false)
        }
    }

    const handleJoinSpace = async () => {
        if (!joinCode.trim()) return

        try {
            setJoining(true)
            const token = localStorage.getItem("token")
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com"

            // Mock successful join for now
            setTimeout(() => {
                // Check if the code matches any existing spaces
                // In real app, this would be validated by the backend
                if (joinCode === "TEST123") {
                    // Create a mock joined space
                    const joinedSpace: CodeSpace = {
                        id: `space-${Date.now()}`,
                        name: "Test Join Space",
                        joinCode: joinCode,
                        createdAt: Date.now() - 345600000, // 4 days ago
                        creatorId: "user-6",
                        creatorName: "test_creator",
                        users: [
                            {
                                id: "user-6",
                                username: "test_creator",
                                isCreator: true,
                                canEdit: true,
                                isActive: false,
                                lastActivity: Date.now() - 3600000 // 1 hour ago
                            },
                            {
                                id: user?.id || "user-1",
                                username: user?.username || "You",
                                isCreator: false,
                                canEdit: false,
                                isActive: true,
                                lastActivity: Date.now()
                            }
                        ],
                        activeFile: null,
                        messages: [],
                        editRequests: [],
                        isPublic: false,
                        lastActivity: Date.now() - 3600000 // 1 hour ago
                    }

                    setJoinedSpaces([joinedSpace, ...joinedSpaces])
                    setShowJoinDialog(false)
                    setJoinCode("")
                    setJoining(false)

                    toast({
                        title: "Space joined",
                        description: "You've successfully joined the space.",
                    })

                    // Navigate to the joined space
                    router.push(`/dashboard/spaces/${joinedSpace.id}`)
                } else {
                    toast({
                        title: "Invalid join code",
                        description: "Please check the code and try again.",
                        variant: "destructive",
                    })
                    setJoining(false)
                }
            }, 1000)

        } catch (error) {
            console.error("Error joining space:", error)
            toast({
                title: "Failed to join space",
                description: "Please try again later",
                variant: "destructive",
            })
            setJoining(false)
        }
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString()
    }

    const formatRelativeTime = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000)

        let interval = Math.floor(seconds / 31536000)
        if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`

        interval = Math.floor(seconds / 2592000)
        if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`

        interval = Math.floor(seconds / 86400)
        if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`

        interval = Math.floor(seconds / 3600)
        if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`

        interval = Math.floor(seconds / 60)
        if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`

        return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            Code Spaces
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                            Create and join collaborative coding environments
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={() => setShowJoinDialog(true)} variant="outline">
                            Join Space
                        </Button>
                        <Button onClick={() => setShowCreateDialog(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Space
                        </Button>
                    </div>
                </div>

                {/* Space Tabs */}
                <Tabs defaultValue="my-spaces" className="w-full">
                    <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
                        <TabsTrigger value="my-spaces">My Spaces</TabsTrigger>
                        <TabsTrigger value="joined-spaces">Joined Spaces</TabsTrigger>
                    </TabsList>

                    {/* My Spaces */}
                    <TabsContent value="my-spaces" className="space-y-4 mt-6">
                        {mySpaces.length === 0 ? (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <Code2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <CardTitle className="text-xl mb-2">No spaces yet</CardTitle>
                                    <CardDescription className="text-base mb-4">
                                        Create your first collaborative coding space
                                    </CardDescription>
                                    <Button onClick={() => setShowCreateDialog(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Space
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {mySpaces.map((space) => (
                                    <Card key={space.id} className="overflow-hidden">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg font-medium">{space.name}</CardTitle>
                                                {space.isPublic ? (
                                                    <Badge variant="secondary" className="ml-2">
                                                        <Globe className="w-3 h-3 mr-1" />
                                                        Public
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="ml-2">
                                                        <Lock className="w-3 h-3 mr-1" />
                                                        Private
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardDescription className="flex items-center text-sm">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Created {formatDate(space.createdAt)}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center mb-3">
                                                <Users className="w-4 h-4 mr-2 text-gray-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {space.users.length} {space.users.length === 1 ? "member" : "members"}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    Last activity {formatRelativeTime(space.lastActivity)}
                                                </span>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex justify-between pt-2">
                                            <div className="text-sm flex items-center">
                                                <Badge variant="secondary" className="text-xs">
                                                    JOIN: {space.joinCode}
                                                </Badge>
                                            </div>
                                            <Link href={`/dashboard/spaces/${space.id}`}>
                                                <Button size="sm">
                                                    Enter
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Joined Spaces */}
                    <TabsContent value="joined-spaces" className="space-y-4 mt-6">
                        {joinedSpaces.length === 0 ? (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <CardTitle className="text-xl mb-2">No joined spaces</CardTitle>
                                    <CardDescription className="text-base mb-4">
                                        Join a space using an invite code
                                    </CardDescription>
                                    <Button onClick={() => setShowJoinDialog(true)}>
                                        Join a Space
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {joinedSpaces.map((space) => (
                                    <Card key={space.id} className="overflow-hidden">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg font-medium">{space.name}</CardTitle>
                                                {space.isPublic ? (
                                                    <Badge variant="secondary" className="ml-2">
                                                        <Globe className="w-3 h-3 mr-1" />
                                                        Public
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="ml-2">
                                                        <Lock className="w-3 h-3 mr-1" />
                                                        Private
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardDescription className="flex items-center text-sm">
                                                By {space.creatorName} • {formatDate(space.createdAt)}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center mb-3">
                                                <Users className="w-4 h-4 mr-2 text-gray-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {space.users.length} {space.users.length === 1 ? "member" : "members"}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    Last activity {formatRelativeTime(space.lastActivity)}
                                                </span>
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <Link href={`/dashboard/spaces/${space.id}`} className="w-full">
                                                <Button size="sm" className="w-full">
                                                    Enter Space
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Create Space Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create a new space</DialogTitle>
                        <DialogDescription>
                            Create a collaborative environment for coding with others
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                placeholder="My Coding Space"
                                className="col-span-3"
                                value={newSpaceName}
                                onChange={(e) => setNewSpaceName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="visibility" className="text-right">
                                Public
                            </Label>
                            <div className="flex items-center space-x-2 col-span-3">
                                <Switch
                                    id="visibility"
                                    checked={isPublic}
                                    onCheckedChange={setIsPublic}
                                />
                                <Label htmlFor="visibility" className="text-sm text-gray-500">
                                    {isPublic ? "Anyone with the link can view" : "Only invited members can access"}
                                </Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCreateDialog(false)}
                            disabled={creating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSpace}
                            disabled={!newSpaceName.trim() || creating}
                        >
                            {creating ? "Creating..." : "Create Space"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Join Space Dialog */}
            <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Join a space</DialogTitle>
                        <DialogDescription>
                            Enter the invite code to join a collaborative coding space
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="code" className="text-right">
                                Code
                            </Label>
                            <Input
                                id="code"
                                placeholder="Enter invite code"
                                className="col-span-3"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            For testing, use the code: TEST123
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowJoinDialog(false)}
                            disabled={joining}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleJoinSpace}
                            disabled={!joinCode.trim() || joining}
                        >
                            {joining ? "Joining..." : "Join Space"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
