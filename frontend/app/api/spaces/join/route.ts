import { NextRequest, NextResponse } from 'next/server';

// Import the spaces storage from the main route
// Note: In a real app, this would be in a shared module or database
let serverSpaces: Map<string, any>;
let userSessions: Map<string, any>;

// Get the spaces from the main route (this is a workaround for the demo)
// In production, you'd use a database or Redis
try {
    const mainRoute = require('../route');
    // Access the shared storage - in production this would be properly modularized
} catch (e) {
    // Fallback - this will be populated by the main route
}

interface SpaceUser {
    id: string;
    username: string;
    isCreator: boolean;
    canEdit: boolean;
    isActive: boolean;
    lastActivity: number;
}

// Helper function to get spaces storage (shared with main route)
function getSpacesStorage() {
    // In production, this would be a proper database/Redis connection
    if (typeof (globalThis as any).serverSpaces === 'undefined') {
        (globalThis as any).serverSpaces = new Map();
    }
    if (typeof (globalThis as any).userSessions === 'undefined') {
        (globalThis as any).userSessions = new Map();
    }
    return {
        serverSpaces: (globalThis as any).serverSpaces,
        userSessions: (globalThis as any).userSessions
    };
}

// POST /api/spaces/join - Join an existing space by join code
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { joinCode, userId, username } = body;

        if (!joinCode || !userId || !username) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { serverSpaces, userSessions } = getSpacesStorage();

        // Find the space by join code
        let targetSpace = null;
        for (const [spaceId, space] of serverSpaces.entries()) {
            if (space.joinCode === joinCode.toUpperCase()) {
                targetSpace = space;
                break;
            }
        }

        if (!targetSpace) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        // Check if user is already in the space
        const existingUser = targetSpace.users.find((user: SpaceUser) => user.id === userId);

        if (existingUser) {
            // Update existing user as active
            existingUser.isActive = true;
            existingUser.lastActivity = Date.now();
            existingUser.username = username; // Update username in case it changed
        } else {
            // Add new user to the space
            const newUser: SpaceUser = {
                id: userId,
                username,
                isCreator: false,
                canEdit: false, // Can be modified later based on permissions
                isActive: true,
                lastActivity: Date.now(),
            };

            targetSpace.users.push(newUser);
        }

        // Update space activity
        targetSpace.lastActivity = Date.now();

        // Update user session
        userSessions.set(userId, { spaceId: targetSpace.id, userId, username });

        console.log(`User ${username} (${userId}) joined space: ${targetSpace.name} (${targetSpace.id})`);

        return NextResponse.json({
            space: targetSpace,
            success: true
        });

    } catch (error) {
        console.error('Error joining space:', error);
        return NextResponse.json({ error: 'Failed to join space' }, { status: 500 });
    }
}
