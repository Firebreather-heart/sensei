"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSpaces } from "@/contexts/SpaceContext";
import { FileSystemExplorer } from "@/components/file-system-explorer";
import { VirtualFile } from "@/types";

export function FileSelector() {
    const { currentSpace, currentUser, setActiveFile } = useSpaces();
    const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null);

    const handleFileSelect = (file: VirtualFile) => {
        if (file.directory) return; // Only allow selecting files, not folders
        setSelectedFile(file);
    };

    const handleShareFile = async () => {
        if (!selectedFile) return;

        await setActiveFile(selectedFile);
    };

    if (!currentSpace || !currentUser || !currentUser.isCreator) {
        return null;
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg">Select File to Share</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col h-full gap-4">
                    <div className="flex-1 min-h-[400px] border rounded">
                        <FileSystemExplorer
                            onFileSelect={handleFileSelect}
                            onRefresh={() => { }}
                            onShareFile={() => { }}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleShareFile}
                            disabled={!selectedFile || selectedFile.directory}
                        >
                            Share Selected File
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
