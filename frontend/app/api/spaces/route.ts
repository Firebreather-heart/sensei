import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// In-memory storage for spaces (server-side)
// In production, you might want to use Redis or a database
function getSpacesStorage() {
    if (typeof (globalThis as any).serverSpaces === 'undefined') {
        (globalThis as any).serverSpaces = new Map();
    }
    if (typeof (globalThis as any).userSessions === 'undefined') {
        (globalThis as any).userSessions = new Map();
    }
    return {
        serverSpaces: (globalThis as any).serverSpaces as Map<string, CodeSpace>,
        userSessions: (globalThis as any).userSessions as Map<string, { spaceId?: string, userId: string, username: string }>
    };
}

interface SpaceUser {
    id: string;
    username: string;
    isCreator: boolean;
    canEdit: boolean;
    isActive: boolean;
    lastActivity: number;
}

interface VirtualFile {
    id: string;
    name: string;
    content: string;
    language: string;
    isActive: boolean;
}

interface CodeSpace {
    id: string;
    name: string;
    joinCode: string;
    isPublic: boolean;
    createdAt: number;
    lastActivity: number;
    creatorName: string;
    users: SpaceUser[];
    files: VirtualFile[];
    messages: Array<{
        id: string;
        userId: string;
        username: string;
        message: string;
        timestamp: number;
    }>;
}

// Helper function to generate join code
function generateJoinCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Helper function to clean up empty spaces
function cleanupEmptySpaces() {
    const { serverSpaces } = getSpacesStorage();
    const spacesToDelete: string[] = [];

    for (const [spaceId, space] of serverSpaces.entries()) {
        if (space.users.length === 0) {
            spacesToDelete.push(spaceId);
        }
    }

    spacesToDelete.forEach(spaceId => {
        console.log(`Removing empty space: ${spaceId}`);
        serverSpaces.delete(spaceId);
    });
}

// GET /api/spaces - List all active spaces
export async function GET(request: NextRequest) {
    try {
        cleanupEmptySpaces();

        const { serverSpaces } = getSpacesStorage();
        const spaces = Array.from(serverSpaces.values()).map(space => ({
            ...space,
            users: space.users.map(user => ({
                ...user,
                // Don't expose sensitive user data
            }))
        }));

        return NextResponse.json({ spaces });
    } catch (error) {
        console.error('Error fetching spaces:', error);
        return NextResponse.json({ error: 'Failed to fetch spaces' }, { status: 500 });
    }
}

// POST /api/spaces - Create a new space
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, isPublic, creatorName, userId } = body;

        if (!name || !creatorName || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate unique IDs
        const spaceId = randomUUID();
        const joinCode = generateJoinCode();

        // Create the creator user
        const creator: SpaceUser = {
            id: userId,
            username: creatorName,
            isCreator: true,
            canEdit: true,
            isActive: true,
            lastActivity: Date.now(),
        };

        // Create the space
        const space: CodeSpace = {
            id: spaceId,
            name,
            joinCode,
            isPublic: isPublic || false,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            creatorName,
            users: [creator],
            files: [
                {
                    id: randomUUID(),
                    name: 'main.js',
                    content: '// Welcome to your collaborative coding space!\nconsole.log("Hello, World!");',
                    language: 'javascript',
                    isActive: true,
                }
            ],
            messages: [],
        };

        // Store the space
        const { serverSpaces, userSessions } = getSpacesStorage();
        serverSpaces.set(spaceId, space);

        // Update user session
        userSessions.set(userId, { spaceId, userId, username: creatorName });

        console.log(`Created space: ${name} (${spaceId}) with join code: ${joinCode}`);

        return NextResponse.json({ space });
    } catch (error) {
        console.error('Error creating space:', error);
        return NextResponse.json({ error: 'Failed to create space' }, { status: 500 });
    }
}
