"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSpaces } from "@/contexts/SpaceContext";
import { useToast } from "@/components/ui/use-toast";
import { Save, Edit, Code2, FileText, Users, CheckCircle } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';

// Import language extensions
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { xml } from '@codemirror/lang-xml';

// Import Y.js CodeMirror binding
import { yCollab } from 'y-codemirror.next';

// Simple UUID generator function
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function LiveCodeEditor() {
    const { currentSpace, currentUser, yDoc, provider, saveFile, requestEditPermission } = useSpaces();
    const { toast } = useToast();
    const [activeUsers, setActiveUsers] = useState<any[]>([]);
    const [editRequested, setEditRequested] = useState(false);

    useEffect(() => {
        if (currentSpace) {
            setActiveUsers(currentSpace.users.filter(u => u.isActive));
        } else {
            setActiveUsers([]);
        }
    }, [currentSpace]);

    useEffect(() => {
        // Reset edit requested state when current user permissions change
        if (currentUser?.canEdit) {
            setEditRequested(false);
        }
    }, [currentUser]);

    const handleSave = async () => {
        const success = await saveFile();
        if (success) {
            toast({
                title: "File saved",
                description: "Your changes have been saved successfully."
            });
        }
    };

    const handleRequestEdit = async () => {
        if (editRequested) return;

        const success = await requestEditPermission();
        if (success) {
            setEditRequested(true);
            toast({
                title: "Edit permission requested",
                description: "Your request has been sent to the space creator."
            });
        }
    };

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
            case "xml":
            case "svg":
                return [xml()];
            default:
                return [javascript()];
        }
    };

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

    if (!currentSpace || !currentUser) {
        return (
            <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-10">
                    <FileText className="h-16 w-16 mx-auto opacity-20 mb-4" />
                    <h3 className="text-xl font-medium">No Space Connected</h3>
                    <p className="text-gray-500 mt-1">Join or create a code space to start collaborating</p>
                </CardContent>
            </Card>
        );
    }

    if (!currentSpace.activeFile) {
        return (
            <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-10">
                    <FileText className="h-16 w-16 mx-auto opacity-20 mb-4" />
                    <h3 className="text-xl font-medium">No File Selected</h3>
                    <p className="text-gray-500 mt-1">
                        {currentUser.isCreator
                            ? "Select a file to share with your space"
                            : "Waiting for the space creator to select a file"}
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Set up collaboration extensions
    const extensions = [
        oneDark,
        ...getLanguageExtension(currentSpace.activeFile.name),
    ];

    if (yDoc) {
        const yText = yDoc.getText('content');
        // Initialize with file content if empty
        if (yText.length === 0 && currentSpace.activeFile.content) {
            yText.insert(0, currentSpace.activeFile.content);
        }

        extensions.push(
            yCollab(yText, currentUser.id || generateUUID(), { name: currentUser.username })
        );
    }

    const canEdit = currentUser.isCreator || currentUser.canEdit;

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                    {getFileIcon(currentSpace.activeFile.name)}
                    <CardTitle className="text-lg">{currentSpace.activeFile.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{activeUsers.length}</span>
                    </Badge>

                    {!canEdit && !editRequested && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRequestEdit}
                        >
                            <Edit className="h-4 w-4 mr-1" />
                            Request to Edit
                        </Button>
                    )}

                    {!canEdit && editRequested && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Edit Requested
                        </Badge>
                    )}

                    {currentUser.isCreator && (
                        <Button size="sm" onClick={handleSave}>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="border-t">
                    <CodeMirror
                        value={currentSpace.activeFile.content}
                        height="calc(100vh - 280px)"
                        extensions={extensions}
                        theme={oneDark}
                        basicSetup={{
                            lineNumbers: true,
                            highlightActiveLine: canEdit,
                            highlightSelectionMatches: true,
                            foldGutter: true,
                            autocompletion: canEdit,
                            closeBrackets: canEdit,
                            bracketMatching: true,
                            crosshairCursor: false,
                            tabSize: 2,
                        }}
                        editable={canEdit}
                        readOnly={!canEdit}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
