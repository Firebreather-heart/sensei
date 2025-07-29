"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSpaces } from "@/contexts/SpaceContext";
import { ArrowRight, Clock, Code2, Globe, Lock, Users } from "lucide-react";

interface ActiveSpacesListProps {
    limit?: number;
    showViewAll?: boolean;
}

export function ActiveSpacesList({ limit = 3, showViewAll = true }: ActiveSpacesListProps) {
    const router = useRouter();
    const { activeSpaces, loading, joinSpace } = useSpaces();
    const [publicSpaces, setPublicSpaces] = useState<any[]>([]);

    useEffect(() => {
        const filteredSpaces = activeSpaces
            .filter(space => space.isPublic)
            .sort((a, b) => b.lastActivity - a.lastActivity);

        setPublicSpaces(limit ? filteredSpaces.slice(0, limit) : filteredSpaces);
    }, [activeSpaces, limit]);

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

    const handleJoinSpace = async (joinCode: string) => {
        const success = await joinSpace(joinCode);
        if (success) {
            router.push(`/dashboard/spaces/${joinCode}`);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(limit)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (publicSpaces.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <Code2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <CardTitle className="text-xl mb-2">No active spaces</CardTitle>
                    <p className="text-gray-500 mb-4">
                        Create a new space to start collaborating
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicSpaces.map(space => (
                    <Card key={space.id} className="overflow-hidden">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-medium">{space.name}</CardTitle>
                                {space.isPublic ? (
                                    <Badge variant="secondary" className="ml-2">
                                        <Globe className="w-3 h-3 mr-1" />
                                        Public
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="ml-2">
                                        <Lock className="w-3 h-3 mr-1" />
                                        Private
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">
                                By {space.creatorName}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center mb-3">
                                <Users className="w-4 h-4 mr-2 text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {space.users.length} {space.users.length === 1 ? "member" : "members"}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Activity {formatRelativeTime(space.lastActivity)}
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                            <div className="text-sm flex items-center">
                                <Badge variant="secondary" className="text-xs">
                                    JOIN: {space.joinCode}
                                </Badge>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleJoinSpace(space.joinCode)}
                            >
                                Join
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {showViewAll && activeSpaces.length > limit && (
                <div className="mt-6 text-center">
                    <Link href="/dashboard/spaces">
                        <Button variant="outline">
                            View All Spaces
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            )}
        </>
    );
}
