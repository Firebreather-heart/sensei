"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, Edit, Code2, FileText } from "lucide-react"

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

interface CodeEditorProps {
  file: VirtualFile
  onSave: (content: string) => void
  readOnly?: boolean
}

export function CodeEditor({ file, onSave, readOnly = false }: CodeEditorProps) {
  const [content, setContent] = useState(file.content || "")
  const [isEditing, setIsEditing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setContent(file.content || "")
    setHasChanges(false)
    setIsEditing(false)
  }, [file])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasChanges(newContent !== file.content)
  }

  const handleSave = () => {
    onSave(content)
    setHasChanges(false)
    setIsEditing(false)
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

  const getLanguage = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase()
    switch (ext) {
      case "js":
        return "javascript"
      case "ts":
        return "typescript"
      case "jsx":
        return "javascript"
      case "tsx":
        return "typescript"
      case "py":
        return "python"
      case "java":
        return "java"
      case "cpp":
      case "c":
        return "cpp"
      case "html":
        return "html"
      case "css":
        return "css"
      case "json":
        return "json"
      default:
        return "text"
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getFileIcon(file.name)}
            <CardTitle className="text-lg">{file.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {file.public && <Badge variant="secondary">Public</Badge>}
            {readOnly && <Badge variant="outline">Read Only</Badge>}
            {!readOnly && (
              <>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setContent(file.content || "")
                        setIsEditing(false)
                        setHasChanges(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-500">
          By {file.root} • Updated {new Date(file.updated_at).toLocaleDateString()}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="min-h-[400px] font-mono text-sm border-0 resize-none focus:ring-0"
            placeholder="Start typing your code..."
          />
        ) : (
          <div className="relative">
            <pre className="p-4 text-sm bg-gray-50 dark:bg-gray-900 overflow-auto min-h-[400px] font-mono">
              <code className={`language-${getLanguage(file.name)}`}>{content || "// Empty file"}</code>
            </pre>
            {!readOnly && (
              <div className="absolute top-2 right-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
