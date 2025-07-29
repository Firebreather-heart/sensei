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
import { toast } from "@/components/ui/use-toast";
import { useSpaces } from "@/contexts/SpaceContext";

interface JoinSpaceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function JoinSpaceDialog({ open, onOpenChange }: JoinSpaceDialogProps) {
    const router = useRouter();
    const { joinSpace } = useSpaces();
    const [joinCode, setJoinCode] = useState("");
    const [joining, setJoining] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        try {
            setJoining(true);
            const success = await joinSpace(joinCode);

            if (success) {
                toast({
                    title: "Space joined",
                    description: "You've successfully joined the space.",
                });

                // Reset form and close dialog
                setJoinCode("");
                onOpenChange(false);

                // Navigate to the joined space
                router.push(`/dashboard/spaces/${joinCode}`);
            } else {
                toast({
                    title: "Invalid join code",
                    description: "Please check the code and try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error joining space:", error);
            toast({
                title: "Failed to join space",
                description: "Please try again later",
                variant: "destructive",
            });
        } finally {
            setJoining(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Join a space</DialogTitle>
                    <DialogDescription>
                        Enter the invite code to join a collaborative coding space
                    </DialogDescription>
                </DialogHeader>
                <form id="join-space-form" onSubmit={handleSubmit}>
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
                                required
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Enter the 6-digit join code provided by the space creator
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={joining}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="join-space-form"
                            disabled={!joinCode.trim() || joining}
                        >
                            {joining ? "Joining..." : "Join Space"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
