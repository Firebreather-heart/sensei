"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Save, Edit, Code2, FileText, Maximize2, Minimize2 } from "lucide-react"
import CodeMirror from '@uiw/react-codemirror'

// Import common language extensions
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { xml } from '@codemirror/lang-xml'

// Import theme (options: oneDark, oneDarkTheme, etc.)
import { oneDark } from '@codemirror/theme-one-dark'

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
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    setContent(file.content || "")
    setHasChanges(false)
    setIsEditing(false)
  }, [file])

  const handleContentChange = (value: string) => {
    setContent(value)
    setHasChanges(value !== file.content)
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

  const getLanguageExtension = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase()
    switch (ext) {
      case "js":
      case "jsx":
        return [javascript({ jsx: true })]
      case "ts":
      case "tsx":
        return [javascript({ jsx: true, typescript: true })]
      case "py":
        return [python()]
      case "java":
        return [java()]
      case "cpp":
      case "c":
        return [cpp()]
      case "html":
        return [html()]
      case "css":
        return [css()]
      case "json":
        return [json()]
      case "md":
        return [markdown()]
      case "xml":
      case "svg":
        return [xml()]
      default:
        // Use JavaScript as a fallback for unknown types
        return [javascript()]
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Add Escape key listener to exit fullscreen mode
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    document.addEventListener("keydown", handleEscKey)
    return () => document.removeEventListener("keydown", handleEscKey)
  }, [isFullscreen])

  return (
    <Card className={`h-full ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}>
      <CardHeader className={`${isFullscreen ? "bg-background border-b" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getFileIcon(file.name)}
            <CardTitle className="text-lg">{file.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {file.public && <Badge variant="secondary">Public</Badge>}
            {readOnly && <Badge variant="outline">Read Only</Badge>}

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

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
      <CardContent className="p-0 relative">
        <CodeMirror
          value={content}
          height={isFullscreen ? "calc(100vh - 100px)" : "400px"}
          theme={oneDark}
          extensions={getLanguageExtension(file.name)}
          onChange={handleContentChange}
          readOnly={!isEditing || readOnly}
          editable={isEditing && !readOnly}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: isEditing && !readOnly,
            highlightSelectionMatches: true,
            foldGutter: true,
            autocompletion: isEditing && !readOnly,
            closeBrackets: isEditing && !readOnly,
            bracketMatching: true,
            crosshairCursor: false,
            tabSize: 2,
          }}
          className="text-sm font-mono"
        />

        {!isEditing && !readOnly && !isFullscreen && (
          <div className="absolute top-[80px] right-2">
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
      </CardContent>
    </Card>
  )
}