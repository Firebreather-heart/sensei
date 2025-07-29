"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Edit, Code2, FileText, Maximize2, Minimize2 } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';

// Yjs imports for collaborative editing
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { yCollab } from 'y-codemirror.next';
import { IndexeddbPersistence } from 'y-indexeddb';
import { useSpaces } from "@/contexts/SpaceContext";
import { VirtualFile } from "@/types";
import { toast } from "@/components/ui/use-toast";
import randomColor from 'randomcolor';

interface CollaborativeEditorProps {
  file: VirtualFile;
  spaceId: string;
  readOnly?: boolean;
}

export function CollaborativeEditor({ file, spaceId, readOnly = false }: CollaborativeEditorProps) {
  const [content, setContent] = useState(file.content || "");
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { currentUser, updateFileInSpace, usersEditingFile, registerUserEdit, unregisterUserEdit } = useSpaces();

  // Refs for Yjs document and providers
  const ydocRef = useRef<Y.Doc | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const persistenceRef = useRef<IndexeddbPersistence | null>(null);
  const providersRef = useRef<any[]>([]);
  const editorViewRef = useRef<EditorView | null>(null);
  const userColorRef = useRef<string>(randomColor({ luminosity: 'light' }));

  // Initialize Yjs collaboration
  useEffect(() => {
    if (!file || !currentUser) return;

    // Clean up previous instance
    if (ydocRef.current) {
      providersRef.current.forEach(provider => provider.destroy());
      persistenceRef.current?.destroy();
      ydocRef.current.destroy();
    }

    // Create new Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Get text from the document (or create if doesn't exist)
    const ytext = ydoc.getText('codemirror');
    yTextRef.current = ytext;

    // If the document is empty, initialize with file content
    if (ytext.toString() === '') {
      ytext.insert(0, file.content || '');
    }

    // Setup IndexedDB persistence for offline support
    const persistence = new IndexeddbPersistence(`sensei-space-${spaceId}-file-${file.id}`, ydoc);
    persistenceRef.current = persistence;

    // We're not using actual websockets, but we'll simulate real-time with localStorage
    // Create a custom awareness implementation
    const awareness = {
      setLocalState: (state: any) => {
        if (state.cursor && currentUser) {
          registerUserEdit(currentUser.id, currentUser.username, file.id, state.cursor.head);
        }
      },
      destroy: () => {
        if (currentUser) {
          unregisterUserEdit(currentUser.id, file.id);
        }
      }
    };

    providersRef.current = [awareness];

    // Listen for text changes
    ytext.observe(() => {
      const newContent = ytext.toString();
      setContent(newContent);

      // Update the file in the space
      const updatedFile = {
        ...file,
        content: newContent,
        updated_at: new Date().toISOString()
      };

      updateFileInSpace(updatedFile);
      setHasChanges(true);
    });

    // Set up simulated collaborative changes
    const interval = setInterval(() => {
      const fileEditors = usersEditingFile.get(file.id);

      if (fileEditors && fileEditors.size > 0) {
        const updatedFile = {
          ...file,
          updated_at: new Date().toISOString()
        };
        updateFileInSpace(updatedFile);
      }
    }, 5000);

    return () => {
      if (currentUser) {
        unregisterUserEdit(currentUser.id, file.id);
      }
      providersRef.current.forEach(provider => provider.destroy());
      persistenceRef.current?.destroy();
      clearInterval(interval);
    };
  }, [file.id, spaceId, currentUser]);

  // Handle manual save for file
  const handleSave = () => {
    if (!file || !yTextRef.current) return;

    const updatedFile = {
      ...file,
      content,
      updated_at: new Date().toISOString()
    };

    updateFileInSpace(updatedFile);
    setHasChanges(false);
    setIsEditing(false);

    toast({
      title: "File saved",
      description: "Your changes have been saved successfully.",
    });
  };

  // Handle content changes from the editor
  const handleContentChange = (value: string) => {
    if (!yTextRef.current || !isEditing) return;

    // Changes are already handled by Yjs, but we'll check if there are changes
    setHasChanges(value !== file.content);
  };

  // Get appropriate language extension for CodeMirror
  const getLanguageExtension = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
      case "jsx":
        return [javascript({ jsx: true })];
      case "ts":
      case "tsx":
        return [javascript({ jsx: true, typescript: true })];
      case "py":
        return [python()];
      case "java":
        return [java()];
      case "cpp":
      case "c":
        return [cpp()];
      case "html":
        return [html()];
      case "css":
        return [css()];
      case "json":
        return [json()];
      case "md":
        return [markdown()];
      default:
        return [javascript()];
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Create user cursor extension for CodeMirror
  const createUserCursors = () => {
    const cursorExtension = EditorView.domEventHandlers({
      keydown: (event, view) => {
        if (!currentUser || !isEditing) return false;

        // Get the current cursor position
        const pos = view.state.selection.main.head;

        // Register user's position
        registerUserEdit(currentUser.id, currentUser.username, file.id, pos);

        return false;
      },
      click: (event, view) => {
        if (!currentUser || !isEditing) return false;

        // Get the current cursor position
        const pos = view.state.selection.main.head;

        // Register user's position
        registerUserEdit(currentUser.id, currentUser.username, file.id, pos);

        return false;
      }
    });

    return [cursorExtension];
  };

  // Create Yjs collaboration extensions for CodeMirror
  const createCollaborationExtensions = () => {
    if (!ydocRef.current || !yTextRef.current) return [];

    // Create user information for Yjs
    const userInfo = {
      name: currentUser?.username || 'Anonymous',
      color: userColorRef.current
    };

    return [
      yCollab(yTextRef.current, providersRef.current[0], userInfo),
      ...createUserCursors()
    ];
  };

  // Get file type icon
  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
      case "py":
      case "java":
      case "cpp":
      case "c":
        return <Code2 className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Render user cursor markers
  const renderUserMarkers = () => {
    const fileEditors = usersEditingFile.get(file.id);
    if (!fileEditors || fileEditors.size === 0) return null;

    // Filter out current user
    const otherUsers = Array.from(fileEditors)
      .filter(entry => !entry.startsWith(`${currentUser?.id}:`))
      .map(entry => {
        const [userId, positionStr, username] = entry.split(':');
        return { userId, position: parseInt(positionStr), username };
      });

    if (otherUsers.length === 0) return null;

    return (
      <div className="absolute top-2 right-2 z-10">
        <div className="bg-background/80 backdrop-blur-sm rounded-md p-2 border shadow-sm">
          <div className="text-xs font-medium mb-1">Users editing:</div>
          <div className="space-y-1">
            {otherUsers.map((user) => (
              <div key={user.userId} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: randomColor({ seed: user.userId, luminosity: 'light' }) }}
                />
                <span className="text-xs">{user.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

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
                        setIsEditing(false);
                        setHasChanges(false);
                        // Restore original content
                        if (yTextRef.current) {
                          yTextRef.current.delete(0, yTextRef.current.length);
                          yTextRef.current.insert(0, file.content || "");
                        }
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
          By {file.root || 'Unknown'} • Updated {new Date(file.updated_at).toLocaleDateString()}
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        {renderUserMarkers()}
        <CodeMirror
          value={content}
          height={isFullscreen ? "calc(100vh - 100px)" : "400px"}
          theme={oneDark}
          extensions={[
            ...getLanguageExtension(file.name),
            ...(isEditing && !readOnly ? createCollaborationExtensions() : [])
          ]}
          onChange={handleContentChange}
          readOnly={!isEditing || readOnly}
          editable={isEditing && !readOnly}
          onCreateEditor={(view) => {
            editorViewRef.current = view;
          }}
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
  );
}
