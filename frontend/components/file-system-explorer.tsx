"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    ChevronDown,
    ChevronRight,
    Folder,
    FolderOpen,
    FileText,
    Plus,
    MoreVertical,
    FileCode,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateFileDialog } from "@/components/create-file-dialog"
import { CreateFolderDialog } from "@/components/create-folder-dialog"
import { cn } from "@/lib/utils"

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
    children?: string[]
    parent?: string | null
}

interface FileTreeNode {
    id: string
    name: string
    directory: boolean
    public: boolean
    children: FileTreeNode[]
    parent?: string | null
}

interface FileSystemExplorerProps {
    onFileSelect: (file: VirtualFile) => void
    onRefresh: () => void
}

export function FileSystemExplorer({ onFileSelect, onRefresh }: FileSystemExplorerProps) {
    const [fileTree, setFileTree] = useState<FileTreeNode[]>([])
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [showCreateFileDialog, setShowCreateFileDialog] = useState(false)
    const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
    const [currentPath, setCurrentPath] = useState<string[]>([])
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)

    // Fetch file tree from backend
    useEffect(() => {
        fetchFileTree()
    }, [])

    const fetchFileTree = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("token")
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

            const response = await fetch(`${apiUrl}/api/v1/filesystem/user/tree`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setFileTree(data.tree)
            } else {
                const errorData = await response.json().catch(() => ({}))
                setError(errorData.detail || "Failed to fetch file tree")
            }
        } catch (error) {
            setError("Error fetching file tree")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev)
            if (newSet.has(folderId)) {
                newSet.delete(folderId)
            } else {
                newSet.add(folderId)
            }
            return newSet
        })
    }

    const handleFileClick = async (file: FileTreeNode) => {
        if (file.directory) {
            toggleFolder(file.id)
            setCurrentFolderId(file.id)

            // Update breadcrumb path
            if (expandedFolders.has(file.id)) {
                // Collapsing, remove from path
                setCurrentPath(prev => prev.filter(p => p !== file.name))
            } else {
                // Expanding, add to path
                setCurrentPath(prev => [...prev, file.name])
            }
            return
        }

        setSelectedFile(file.id)

        // Fetch full file details
        try {
            const token = localStorage.getItem("token")
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

            const response = await fetch(`${apiUrl}/api/v1/filesystem/files/${file.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const fileData = await response.json()
                onFileSelect(fileData)
            }
        } catch (error) {
            console.error("Error fetching file:", error)
        }
    }

    const handleCreateFile = (newFile: VirtualFile) => {
        fetchFileTree() // Refresh tree after creation
        onRefresh()
    }

    const handleCreateFolder = () => {
        fetchFileTree() // Refresh tree after creation
        onRefresh()
    }

    const navigateToRoot = () => {
        setCurrentPath([])
        setCurrentFolderId(null)
    }

    const navigateToPath = (index: number) => {
        setCurrentPath(prev => prev.slice(0, index + 1))
        // Ideally we'd also set the currentFolderId here, but we'd need to map paths to IDs
    }

    const renderFileTree = (nodes: FileTreeNode[], depth = 0, parentPath: string[] = []) => {
        // Sort nodes: folders first, then alphabetically
        const sortedNodes = [...nodes].sort((a, b) => {
            if (a.directory === b.directory) {
                return a.name.localeCompare(b.name)
            }
            return a.directory ? -1 : 1
        })

        return (
            <ul className="space-y-1">
                {sortedNodes.map(node => {
                    const isExpanded = expandedFolders.has(node.id)
                    const isSelected = selectedFile === node.id
                    const nodePath = [...parentPath, node.name]

                    return (
                        <li key={node.id} className="select-none">
                            <div
                                className={cn(
                                    "flex items-center py-1 px-2 rounded-md hover:bg-muted/50 cursor-pointer",
                                    isSelected && "bg-muted"
                                )}
                                onClick={() => handleFileClick(node)}
                            >
                                <div style={{ width: `${depth * 12}px` }} />

                                {node.directory ? (
                                    <div className="flex items-center">
                                        <Button variant="ghost" size="icon" className="h-4 w-4 mr-1 p-0">
                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </Button>
                                        {isExpanded ? (
                                            <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                                        ) : (
                                            <Folder className="h-4 w-4 mr-2 text-blue-500" />
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <div className="w-4 mr-1" />
                                        <FileCode className="h-4 w-4 mr-2 text-gray-500" />
                                    </div>
                                )}

                                <span className="flex-1 truncate">{node.name}</span>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 p-1 opacity-0 group-hover:opacity-100">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {node.directory ? (
                                            <>
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation()
                                                    setCurrentFolderId(node.id)
                                                    setShowCreateFileDialog(true)
                                                }}>
                                                    Create File Here
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation()
                                                    setCurrentFolderId(node.id)
                                                    setShowCreateFolderDialog(true)
                                                }}>
                                                    Create Folder Here
                                                </DropdownMenuItem>
                                            </>
                                        ) : (
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation()
                                                handleFileClick(node)
                                            }}>
                                                Open
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600">
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {node.directory && isExpanded && node.children && node.children.length > 0 && (
                                renderFileTree(node.children, depth + 1, nodePath)
                            )}
                        </li>
                    )
                })}
            </ul>
        )
    }

    // Add this function to flatten the file tree into a list of files
    const flattenFileTree = (nodes: FileTreeNode[]): VirtualFile[] => {
        let result: VirtualFile[] = []

        for (const node of nodes) {
            // Convert TreeNode to VirtualFile
            const file: VirtualFile = {
                id: node.id,
                name: node.name,
                content: "", // We don't have content in the tree nodes
                directory: node.directory,
                public: node.public,
                can_view: [],
                can_edit: [],
                created_at: "",
                updated_at: "",
                root: "",
                children: node.children?.map(child => child.id),
                parent: node.parent || null
            };

            result.push(file);

            // Recursively add children
            if (node.children && node.children.length > 0) {
                result = result.concat(flattenFileTree(node.children));
            }
        }

        return result;
    };

    const flattenedFiles = flattenFileTree(fileTree);

    return (
        <div className="h-full flex flex-col border rounded-md">
            <div className="flex items-center justify-between p-2 border-b bg-muted/50">
                <div className="font-medium">Files</div>
                <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => setShowCreateFolderDialog(true)} title="Create Folder">
                        <Folder className="h-4 w-4" />
                        <Plus className="h-3 w-3 absolute bottom-0 right-0" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setShowCreateFileDialog(true)} title="Create File">
                        <FileText className="h-4 w-4" />
                        <Plus className="h-3 w-3 absolute bottom-0 right-0" />
                    </Button>
                </div>
            </div>

            <div className="p-2 border-b bg-muted/30 flex items-center overflow-x-auto whitespace-nowrap">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 flex items-center"
                    onClick={navigateToRoot}
                >
                    <Folder className="h-3 w-3 mr-1" />
                    <span>Home</span>
                </Button>

                {currentPath.map((dir, index) => (
                    <div key={index} className="flex items-center">
                        <ChevronRight className="h-3 w-3 mx-1 text-gray-400" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => navigateToPath(index)}
                        >
                            {dir}
                        </Button>
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="flex justify-center py-8 text-gray-500">Loading files...</div>
                ) : error ? (
                    <div className="flex justify-center py-8 text-red-500">{error}</div>
                ) : fileTree.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mb-2 opacity-30" />
                        <p>No files yet</p>
                        <Button variant="outline" className="mt-2" onClick={() => setShowCreateFileDialog(true)}>
                            Create your first file
                        </Button>
                    </div>
                ) : (
                    renderFileTree(fileTree)
                )}
            </div>

            <CreateFileDialog
                open={showCreateFileDialog}
                onOpenChange={setShowCreateFileDialog}
                onFileCreated={handleCreateFile}
                files={flattenedFiles}
                parentFolderId={currentFolderId}
            />

            <CreateFolderDialog
                open={showCreateFolderDialog}
                onOpenChange={setShowCreateFolderDialog}
                onFolderCreated={handleCreateFolder}
                parentFolderId={currentFolderId}
            />
        </div>
    )
}