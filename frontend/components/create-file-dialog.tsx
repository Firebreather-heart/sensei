"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Folder, ChevronRight, Home, Check, Code, FileText } from "lucide-react"
import CodeMirror from "@uiw/react-codemirror"
import { oneDark } from "@codemirror/theme-one-dark"
import { javascript } from "@codemirror/lang-javascript"
import { python } from "@codemirror/lang-python"
import { java } from "@codemirror/lang-java"
import { cpp } from "@codemirror/lang-cpp"
import { html } from "@codemirror/lang-html"
import { css } from "@codemirror/lang-css"
import { json } from "@codemirror/lang-json"
import { markdown } from "@codemirror/lang-markdown"
import { VirtualFile } from "@/types"

const FILE_TEMPLATES = {
  js: "// JavaScript file\nconsole.log('Hello world!');\n",
  ts: "// TypeScript file\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet('World'));\n",
  py: "# Python file\ndef greet(name):\n    return f'Hello, {name}!'\n\nprint(greet('World'))\n",
  html: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>",
  css: "body {\n  font-family: system-ui, sans-serif;\n  color: #333;\n}\n",
  json: "{\n  \"name\": \"example\"\n}",
  md: "# Hello World\n\nThis is a markdown file.\n",
  java: "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello World\");\n  }\n}",
  cpp: "#include <iostream>\n\nint main() {\n  std::cout << \"Hello World\" << std::endl;\n  return 0;\n}\n",
  c: "#include <stdio.h>\n\nint main() {\n  printf(\"Hello World\\n\");\n  return 0;\n}\n"
}

type FileExtension = keyof typeof FILE_TEMPLATES


interface CreateFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileCreated: (file: VirtualFile) => void
  files: VirtualFile[] 
  parentFolderId?: string | null 
}

function getLanguageExtension(ext: string) {
  switch (ext) {
    case "js": return [javascript({ jsx: false })]
    case "ts": return [javascript({ typescript: true })]
    case "py": return [python()]
    case "java": return [java()]
    case "cpp": case "c": return [cpp()]
    case "html": return [html()]
    case "css": return [css()]
    case "json": return [json()]
    case "md": return [markdown()]
    default: return [javascript()]
  }
}

// Helper to build folder paths from flat file list
function buildFolderPaths(files: VirtualFile[]) {
  // Only folders (files with children or directory: true)
  const folders = files.filter(f => f.children && f.children.length > 0 || f.directory)
  // Build a map for quick lookup
  const fileMap = Object.fromEntries(files.map(f => [f.id, f]))
  // Recursively build path for each folder
  function getPath(folder: VirtualFile): string[] {
    const path: string[] = []
    let current = folder
    while (current.parent) {
      const parent = fileMap[current.parent]
      if (!parent) break
      path.unshift(parent.name)
      current = parent
    }
    return path
  }
  // Return folders with their full path
  return folders.map(f => ({
    id: f.id,
    name: f.name,
    path: getPath(f)
  }))
}

export function CreateFileDialog({
  open,
  onOpenChange,
  onFileCreated,
  files,
  parentFolderId
}: CreateFileDialogProps) {
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [fileType, setFileType] = useState<FileExtension>("js")
  const [selectedFolderId, setSelectedFolderId] = useState<string>("root")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Build folders and paths from files
  const folders = useMemo(() => {
    const folderList = buildFolderPaths(files)
    return [{ id: "root", name: "Root", path: [] }, ...folderList]
  }, [files])

  useEffect(() => {
    if (open) {
      setName("")
      setContent(FILE_TEMPLATES["js"])
      setFileType("js")
      setError("")
      setSuccess(false)
      setSelectedFolderId(parentFolderId || "root")
    }
  }, [open, parentFolderId])

  useEffect(() => {
    // Update content when file type changes
    setContent(FILE_TEMPLATES[fileType])
    // Update extension in name
    if (name && !name.includes(".")) {
      setName(`example.${fileType}`)
    } else if (name) {
      const baseName = name.split(".")[0]
      setName(`${baseName}.${fileType}`)
    } else {
      setName(`example.${fileType}`)
    }
  }, [fileType])

  const handleNameChange = (value: string) => {
    setName(value)
    const ext = value.split(".").pop()?.toLowerCase()
    if (ext && Object.keys(FILE_TEMPLATES).includes(ext)) {
      setFileType(ext as FileExtension)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name?.trim()) return

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
          content,
          directory: false,
          public: false,
          parent: selectedFolderId === "root" ? null : selectedFolderId
        }),
      })

      if (response.ok) {
        const newFile = await response.json()
        setSuccess(true)
        setTimeout(() => {
          onFileCreated(newFile)
          onOpenChange(false)
        }, 1000)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.detail || "Failed to create file")
      }
    } catch (error) {
      setError("Network error. Please check your connection.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => !loading && onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <DialogTitle>Create New File</DialogTitle>
          </div>
          {/* Folder indicator */}
          <div className="mt-2 p-2 bg-muted/50 rounded-md">
            <div className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
              <Folder className="h-3.5 w-3.5 text-blue-500" />
              <span>Creating in:</span>
              <span className="flex items-center gap-1">
                <Home className="h-3 w-3 text-gray-500" />
                {selectedFolderId === "root"
                  ? <span className="text-sm font-medium text-blue-600">Root</span>
                  : <>
                    {folders.find(f => f.id === selectedFolderId)?.path.map((segment, i) => (
                      <span key={i} className="flex items-center">
                        <ChevronRight className="h-3 w-3 mx-0.5 text-gray-400" />
                        <span className="text-sm text-gray-600">{segment}</span>
                      </span>
                    ))}
                    <ChevronRight className="h-3 w-3 mx-0.5 text-gray-400" />
                    <span className="text-sm font-medium text-blue-600">
                      {folders.find(f => f.id === selectedFolderId)?.name}
                    </span>
                  </>
                }
              </span>
            </div>
          </div>
        </DialogHeader>
        <form id="create-file-form" onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-900/20">
              <Check className="w-4 h-4 text-green-600" />
              <AlertDescription>File created successfully!</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">File Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="example.js"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="fileType">File Type</Label>
              <Select
                value={fileType}
                onValueChange={value => setFileType(value as FileExtension)}
              >
                <SelectTrigger id="fileType" className="mt-1">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(FILE_TEMPLATES).map(ext => (
                    <SelectItem key={ext} value={ext}>
                      {ext.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="folder">Destination Folder</Label>
            <Select
              value={selectedFolderId}
              onValueChange={setSelectedFolderId}
            >
              <SelectTrigger id="folder" className="flex-1 mt-1">
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-blue-500" />
                      <span>
                        {folder.id === "root"
                          ? "Root"
                          : folder.path.length > 0
                            ? folder.path.join(" / ") + " / " + folder.name
                            : folder.name
                        }
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label htmlFor="content">Content</Label>
            <div className="mt-1 border rounded-md overflow-hidden">
              <CodeMirror
                value={content}
                height="350px"
                theme={oneDark}
                extensions={getLanguageExtension(fileType)}
                onChange={setContent}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLine: true,
                  highlightSelectionMatches: true,
                  foldGutter: true,
                  autocompletion: true,
                  closeBrackets: true,
                  bracketMatching: true,
                }}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-file-form"
              disabled={loading || !name?.trim() || !content?.trim()}
              className={`${loading ? "opacity-80" : ""} ${success ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
              {loading ? "Creating..." : success ? "Created!" : "Create File"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}