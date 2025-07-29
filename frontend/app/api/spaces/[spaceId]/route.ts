import { NextRequest, NextResponse } from 'next/server';

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

// GET /api/spaces/[spaceId] - Get a specific space
export async function GET(
    request: NextRequest,
    { params }: { params: { spaceId: string } }
) {
    try {
        const { spaceId } = params;
        const { serverSpaces } = getSpacesStorage();

        const space = serverSpaces.get(spaceId);
        if (!space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        return NextResponse.json({ space });
    } catch (error) {
        console.error('Error fetching space:', error);
        return NextResponse.json({ error: 'Failed to fetch space' }, { status: 500 });
    }
}

// POST /api/spaces/[spaceId] - Join a space by ID
export async function POST(
    request: NextRequest,
    { params }: { params: { spaceId: string } }
) {
    try {
        const { spaceId } = params;
        const body = await request.json();
        const { userId, username } = body;

        if (!userId || !username) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { serverSpaces, userSessions } = getSpacesStorage();
        const space = serverSpaces.get(spaceId);

        if (!space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        // Check if user is already in the space
        const existingUser = space.users.find((user: SpaceUser) => user.id === userId);

        if (existingUser) {
            // Update existing user as active
            existingUser.isActive = true;
            existingUser.lastActivity = Date.now();
            existingUser.username = username;
        } else {
            // Add new user to the space
            const newUser: SpaceUser = {
                id: userId,
                username,
                isCreator: false,
                canEdit: false,
                isActive: true,
                lastActivity: Date.now(),
            };

            space.users.push(newUser);
        }

        // Update space activity
        space.lastActivity = Date.now();

        // Update user session
        userSessions.set(userId, { spaceId, userId, username });

        console.log(`User ${username} (${userId}) joined space: ${space.name} (${spaceId})`);

        return NextResponse.json({ space, success: true });
    } catch (error) {
        console.error('Error joining space:', error);
        return NextResponse.json({ error: 'Failed to join space' }, { status: 500 });
    }
}

// DELETE /api/spaces/[spaceId] - Leave a space
export async function DELETE(
    request: NextRequest,
    { params }: { params: { spaceId: string } }
) {
    try {
        const { spaceId } = params;
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const { serverSpaces, userSessions } = getSpacesStorage();
        const space = serverSpaces.get(spaceId);

        if (!space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        // Remove user from space
        space.users = space.users.filter((user: SpaceUser) => user.id !== userId);

        // Update space activity
        space.lastActivity = Date.now();

        // Remove user session
        userSessions.delete(userId);

        console.log(`User ${userId} left space: ${space.name} (${spaceId})`);

        // If no users left, remove the space
        if (space.users.length === 0) {
            serverSpaces.delete(spaceId);
            console.log(`Removed empty space: ${space.name} (${spaceId})`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error leaving space:', error);
        return NextResponse.json({ error: 'Failed to leave space' }, { status: 500 });
    }
}
