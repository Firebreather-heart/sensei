"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSpaces } from "@/contexts/SpaceContext";
import { Check, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function EditRequestNotification() {
    const { currentSpace, currentUser, grantEditPermission, denyEditPermission } = useSpaces();
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);

    useEffect(() => {
        if (currentSpace && currentUser?.isCreator) {
            const pending = currentSpace.editRequests?.filter(req => req.pending) || [];
            setPendingRequests(pending);
        } else {
            setPendingRequests([]);
        }
    }, [currentSpace, currentUser]);

    const handleGrant = async (userId: string, username: string) => {
        const success = await grantEditPermission(userId);
        if (success) {
            toast({
                title: "Edit permission granted",
                description: `${username} can now edit the file.`
            });
        }
    };

    const handleDeny = async (userId: string, username: string) => {
        const success = await denyEditPermission(userId);
        if (success) {
            toast({
                title: "Edit permission denied",
                description: `${username}'s edit request was denied.`
            });
        }
    };

    if (!currentSpace || !currentUser?.isCreator || pendingRequests.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {pendingRequests.map((request) => (
                <div
                    key={request.id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border flex flex-col gap-2 min-w-[300px]"
                >
                    <div className="text-sm">
                        <span className="font-medium">{request.username}</span> requested edit permission
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeny(request.userId, request.username)}
                        >
                            <X className="h-4 w-4 mr-1" /> Deny
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => handleGrant(request.userId, request.username)}
                        >
                            <Check className="h-4 w-4 mr-1" /> Allow
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
