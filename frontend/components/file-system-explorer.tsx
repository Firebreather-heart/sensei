"use client"

import { useState, useEffect, useRef } from "react"
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
    Download,
    Upload,
    Share2,
    Globe,
    Lock,
    Trash2,
    Eye
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
import { toast } from "@/components/ui/use-toast"
import { VirtualFile } from "@/types"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

// Define a tree node structure for our file tree
interface FileTreeNode {
    id: string
    name: string
    directory: boolean
    public: boolean
    children: FileTreeNode[]
    parent?: string | null
    // Add displayName field to handle duplicates
    displayName?: string
}

interface FileSystemExplorerProps {
    onFileSelect: (file: VirtualFile) => void
    onRefresh: () => void
    onShareFile?: (file: VirtualFile) => void
    onTogglePublic?: (file: VirtualFile) => void
    onDeleteFile?: (file: VirtualFile) => void
}

export function FileSystemExplorer({
    onFileSelect,
    onRefresh,
    onShareFile,
    onTogglePublic,
    onDeleteFile
}: FileSystemExplorerProps) {
    const [fileTree, setFileTree] = useState<FileTreeNode[]>([])
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [showCreateFileDialog, setShowCreateFileDialog] = useState(false)
    const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
    const [currentPath, setCurrentPath] = useState<string[]>([])
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)

    // Add these state variables inside the FileSystemExplorer component
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [fileToDelete, setFileToDelete] = useState<FileTreeNode | null>(null)

    // File input refs for upload features
    const fileInputRef = useRef<HTMLInputElement>(null)
    const folderZipInputRef = useRef<HTMLInputElement>(null)

    // Fetch files and build tree
    useEffect(() => {
        fetchFiles()
    }, [])

    // Helper function to process duplicate file names
    const processFileNames = (nodes: FileTreeNode[]): FileTreeNode[] => {
        // Create a map to count occurrences of each name within this folder level
        const nameMap = new Map<string, number>()
        const nameOccurrences = new Map<string, number>()

        // First pass: count occurrences of each name
        nodes.forEach(node => {
            const count = nameMap.get(node.name) || 0
            nameMap.set(node.name, count + 1)
        })

        // Second pass: add suffixes to duplicate names
        return nodes.map(node => {
            // Process children recursively if this is a directory
            if (node.directory && node.children.length > 0) {
                node.children = processFileNames(node.children)
            }

            // If this name appears more than once, add a suffix
            if (nameMap.get(node.name)! > 1) {
                const occurrence = nameOccurrences.get(node.name) || 0
                nameOccurrences.set(node.name, occurrence + 1)

                // Only add suffix if this isn't the first occurrence
                if (occurrence > 0) {
                    node.displayName = `${node.name} (${occurrence})`
                } else {
                    node.displayName = node.name
                }
            } else {
                node.displayName = node.name
            }

            return node
        })
    }

    // Helper function to build a tree from flat file data
    const buildFileTree = (flatFiles: VirtualFile[]): FileTreeNode[] => {
        // Create a map for quick lookup of files by id
        const fileMap = new Map<string, FileTreeNode>()

        // First pass: create skeleton nodes
        flatFiles.forEach(file => {
            fileMap.set(file.id, {
                id: file.id,
                name: file.name,
                directory: file.directory,
                public: file.public,
                children: [],
                parent: file.parent
            })
        })

        // Second pass: connect children to parents
        const rootNodes: FileTreeNode[] = []

        flatFiles.forEach(file => {
            const node = fileMap.get(file.id)

            if (!node) return // Should never happen

            if (file.parent === null) {
                // This is a root node
                rootNodes.push(node)
            } else {
                // This is a child node
                const parentNode = fileMap.get(file.parent || "")
                if (parentNode) {
                    parentNode.children.push(node)
                } else {
                    // Parent doesn't exist in our data, treat as root
                    console.warn(`Parent ${file.parent} for file ${file.id} not found`)
                    rootNodes.push(node)
                }
            }
        })

        // Process duplicate file names
        const processedNodes = processFileNames(rootNodes)

        return processedNodes
    }

    const fetchFiles = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("token")
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

            // Get flat list of files/folders
            const response = await fetch(`${apiUrl}/api/v1/filesystem/user/files/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const filesData: VirtualFile[] = await response.json()
                console.log("Files fetched:", filesData.length)

                // Build tree from flat data
                const treeData = buildFileTree(filesData)
                console.log("Tree built:", treeData)

                setFileTree(treeData)
            } else {
                const errorData = await response.json().catch(() => ({}))
                setError(errorData.detail || "Failed to fetch files")
            }
        } catch (error) {
            setError("Error fetching files")
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
            // Check if currently expanded before toggling
            const isCurrentlyExpanded = expandedFolders.has(file.id)

            // Toggle the folder expansion state
            toggleFolder(file.id)

            // Set this as the current folder (for creating new files/folders)
            setCurrentFolderId(file.id)

            // Update breadcrumb path
            if (isCurrentlyExpanded) {
                // Folder was expanded, now collapsing
                setCurrentPath(prev => prev.filter(p => p !== file.displayName))
            } else {
                // Folder was collapsed, now expanding
                setCurrentPath(prev => [...prev, file.displayName || file.name])
            }
            return
        }

        // Handle file selection
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

    // Handle file sharing
    const handleShareFile = async (file: FileTreeNode) => {
        if (onShareFile) {
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
                    onShareFile(fileData)
                }
            } catch (error) {
                console.error("Error fetching file for sharing:", error)
            }
        }
    }

    // Handle toggle public state
    const handleTogglePublic = async (file: FileTreeNode) => {
        if (onTogglePublic) {
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
                    onTogglePublic(fileData)
                    fetchFiles() // Refresh to show updated status
                }
            } catch (error) {
                console.error("Error toggling public status:", error)
            }
        }
    }

    // Handle file deletion
    const handleDelete = async (file: FileTreeNode) => {
        // Show the delete dialog
        setFileToDelete(file)
        setShowDeleteDialog(true)
    }

    // Add this new function to perform the actual deletion
    const confirmDelete = async () => {
        if (!fileToDelete) return

        try {
            const token = localStorage.getItem("token")
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

            const response = await fetch(`${apiUrl}/api/v1/filesystem/files/${fileToDelete.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                toast({
                    title: "Deleted Successfully",
                    description: `"${fileToDelete.displayName || fileToDelete.name}" has been deleted.`,
                })

                // Call parent handler if provided
                if (onDeleteFile) {
                    const fileData = {
                        id: fileToDelete.id,
                        name: fileToDelete.name,
                        content: "",
                        directory: fileToDelete.directory,
                        public: fileToDelete.public,
                        can_view: [],
                        can_edit: [],
                        created_at: "",
                        updated_at: "",
                        root: "",
                    } as VirtualFile

                    onDeleteFile(fileData)
                }

                // Refresh the file tree
                fetchFiles()
                onRefresh()

                // If this was the selected file, clear selection
                if (selectedFile === fileToDelete.id) {
                    setSelectedFile(null)
                }
            } else {
                throw new Error("Failed to delete")
            }
        } catch (error) {
            console.error("Error deleting:", error)
            toast({
                title: "Delete Failed",
                description: "An error occurred while deleting.",
                variant: "destructive",
            })
        } finally {
            // Close the dialog
            setShowDeleteDialog(false)
            setFileToDelete(null)
        }
    }

    // Handle file download
    const handleDownloadFile = async (file: FileTreeNode) => {
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

                // Create a blob and download link
                const blob = new Blob([fileData.content], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = file.name  // Use the original name, not the display name with (n)
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

                toast({
                    title: "File Downloaded",
                    description: `File "${file.displayName || file.name}" downloaded successfully.`,
                })
            } else {
                throw new Error("Failed to fetch file")
            }
        } catch (error) {
            console.error("Error downloading file:", error)
            toast({
                title: "Download Failed",
                description: "There was an error downloading the file.",
                variant: "destructive",
            })
        }
    }

    const handleCreateFile = (newFile: VirtualFile) => {
        fetchFiles() // Refresh tree after creation
        onRefresh()
    }

    const handleCreateFolder = () => {
        fetchFiles() // Refresh tree after creation
        onRefresh()
    }

    const navigateToRoot = () => {
        setCurrentPath([])
        setCurrentFolderId(null)
    }

    const navigateToPath = (index: number) => {
        setCurrentPath(prev => prev.slice(0, index + 1))
    }

    // Recursive rendering function for the file tree
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
                    const nodePath = [...parentPath, node.displayName || node.name]

                    return (
                        <li key={node.id} className="select-none">
                            <div
                                className={cn(
                                    "flex items-center py-1 px-2 rounded-md hover:bg-muted/50 cursor-pointer group",
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

                                {/* Display the displayName (with duplicate numbering) instead of name */}
                                <span className="flex-1 truncate">{node.displayName || node.name}</span>

                                {/* Action icons visible on hover for desktop */}
                                <div className="hidden md:flex items-center opacity-0 group-hover:opacity-100 space-x-1">
                                    {!node.directory && onShareFile && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 p-1"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleShareFile(node)
                                            }}
                                            title="Share"
                                        >
                                            <Share2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}

                                    {!node.directory && onTogglePublic && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 p-1"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleTogglePublic(node)
                                            }}
                                            title={node.public ? "Make Private" : "Make Public"}
                                        >
                                            {node.public ? (
                                                <Globe className="h-3.5 w-3.5 text-green-500" />
                                            ) : (
                                                <Lock className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 p-1"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDownloadFile(node)
                                        }}
                                        title="Download"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 p-1 text-red-500 hover:text-red-600"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDelete(node)
                                        }}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                {/* Dropdown menu for all screen sizes */}
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
                                            <>
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleFileClick(node)
                                                }}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Open
                                                </DropdownMenuItem>

                                                {onShareFile && (
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleShareFile(node)
                                                    }}>
                                                        <Share2 className="h-4 w-4 mr-2" />
                                                        Share
                                                    </DropdownMenuItem>
                                                )}

                                                {onTogglePublic && (
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleTogglePublic(node)
                                                    }}>
                                                        {node.public ? (
                                                            <>
                                                                <Lock className="h-4 w-4 mr-2" />
                                                                Make Private
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Globe className="h-4 w-4 mr-2" />
                                                                Make Public
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDownloadFile(node)
                                                }}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(node)
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Render children if this folder is expanded */}
                            {node.directory && isExpanded && (
                                <div className="ml-2">
                                    {/* If this folder has children, render them */}
                                    {node.children && node.children.length > 0 ? (
                                        renderFileTree(node.children, depth + 1, nodePath)
                                    ) : (
                                        <div className="pl-6 py-2 text-sm text-gray-500">
                                            This folder is empty
                                        </div>
                                    )}
                                </div>
                            )}
                        </li>
                    )
                })}
            </ul>
        )
    }

    // Flatten file tree to pass to dialogs
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
                parent: node.parent || null  // Fixed TypeScript error - provide null as default
            }

            result.push(file)

            // Recursively add children
            if (node.children && node.children.length > 0) {
                result = result.concat(flattenFileTree(node.children))
            }
        }

        return result
    }

    const flattenedFiles = flattenFileTree(fileTree)

    return (
        <div className="h-full flex flex-col border rounded-md">
            <div className="flex items-center justify-between p-2 border-b bg-muted/50">
                <div className="font-medium">Files</div>
                <div className="flex space-x-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchFiles}
                        title="Refresh Files"
                    >
                        Refresh
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowCreateFolderDialog(true)}
                        title="Create Folder"
                    >
                        <Folder className="h-4 w-4" />
                        <Plus className="h-3 w-3 absolute bottom-0 right-0" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowCreateFileDialog(true)}
                        title="Create File"
                    >
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
                    <div className="flex justify-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2" />
                        Loading files...
                    </div>
                ) : error ? (
                    <div className="flex justify-center py-8 text-red-500">
                        {error}
                        <Button variant="outline" size="sm" className="ml-2" onClick={fetchFiles}>
                            Retry
                        </Button>
                    </div>
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

            <Dialog open={showDeleteDialog} onOpenChange={(open) => {
                if (!open) {
                    setShowDeleteDialog(false)
                    setFileToDelete(null)
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete {fileToDelete?.directory ? "Folder" : "File"}</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete
                            <span className="font-medium mx-1">
                                "{fileToDelete?.displayName || fileToDelete?.name}"
                            </span>
                            {fileToDelete?.directory ? " and all its contents" : ""}?
                            <div className="mt-2 text-red-500">
                                This action cannot be undone.
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDeleteDialog(false)
                                setFileToDelete(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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