"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { useSpaces } from "@/contexts/SpaceContext";

interface CreateSpaceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateSpaceDialog({ open, onOpenChange }: CreateSpaceDialogProps) {
    const router = useRouter();
    const { createSpace } = useSpaces();
    const [name, setName] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [creating, setCreating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setCreating(true);
            const newSpace = createSpace(name, isPublic);

            toast({
                title: "Space created",
                description: `"${name}" has been created successfully.`,
            });

            // Reset form
            setName("");
            setIsPublic(false);
            onOpenChange(false);

            // Navigate to the new space
            router.push(`/dashboard/spaces/${newSpace.id}`);
        } catch (error) {
            console.error("Error creating space:", error);
            toast({
                title: "Failed to create space",
                description: "Please try again later",
                variant: "destructive",
            });
        } finally {
            setCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create a new space</DialogTitle>
                    <DialogDescription>
                        Create a collaborative environment for coding with others
                    </DialogDescription>
                </DialogHeader>
                <form id="create-space-form" onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                placeholder="My Coding Space"
                                className="col-span-3"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
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
                                    {isPublic ? "Anyone can view" : "Only invited members can access"}
                                </Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={creating}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="create-space-form"
                            disabled={!name.trim() || creating}
                        >
                            {creating ? "Creating..." : "Create Space"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
