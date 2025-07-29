"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpaces } from "@/contexts/SpaceContext";
import { CheckIcon, XIcon } from "lucide-react";

export function ParticipantsList() {
    const { activeSpace, approveEditRequest, denyEditRequest } = useSpaces();

    if (!activeSpace) {
        return <div>Loading...</div>;
    }

    // Find if current user is creator
    const isCreator = activeSpace.users.some(u => u.isCreator);

    // Format the relative time
    const formatRelativeTime = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;

        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;

        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;

        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;

        interval = Math.floor(seconds / 60);
        if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;

        return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
    };

    return (
        <div className="flex flex-col h-full border rounded-md">
            <div className="p-3 border-b bg-muted/50">
                <h3 className="font-medium">Participants ({activeSpace.users.length})</h3>
            </div>

            <ScrollArea className="flex-1 p-2">
                <div className="space-y-1">
                    {activeSpace.users.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center justify-between p-2 rounded hover:bg-muted"
                        >
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                        {user.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-sm font-medium flex items-center gap-1">
                                        {user.username}
                                        {user.isCreator && (
                                            <Badge variant="secondary" className="text-xs px-1 py-0">
                                                Owner
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center text-xs">
                                        {user.isActive ? (
                                            <span className="flex items-center text-green-600">
                                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                                                Online
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">
                                                Last seen {formatRelativeTime(user.lastActivity)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                {user.canEdit ? (
                                    <Badge variant="outline" className="text-xs">Editor</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-xs text-gray-500">Viewer</Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {isCreator && activeSpace.editRequests.length > 0 && (
                    <>
                        <div className="mt-4 mb-2">
                            <h4 className="text-sm font-medium px-2">Edit Requests</h4>
                        </div>
                        <div className="space-y-2">
                            {activeSpace.editRequests.filter(r => r.pending).map((request) => (
                                <div key={request.id} className="p-2 border rounded-md text-xs mx-2">
                                    <div className="font-medium">{request.username}</div>
                                    <div className="text-gray-500 mb-2">
                                        Requested {formatRelativeTime(request.timestamp)}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => approveEditRequest(request.id)}
                                            className="h-7 text-xs"
                                            variant="default"
                                        >
                                            <CheckIcon className="h-3 w-3 mr-1" />
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => denyEditRequest(request.id)}
                                            className="h-7 text-xs"
                                            variant="outline"
                                        >
                                            <XIcon className="h-3 w-3 mr-1" />
                                            Deny
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </ScrollArea>
        </div>
    );
}
