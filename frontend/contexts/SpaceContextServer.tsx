"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CodeSpace, SpaceUser } from '@/types/spaces';
import { VirtualFile } from '@/types';

// Define the context shape
interface SpaceContextType {
    activeSpaces: CodeSpace[];           // List of all currently active spaces
    currentSpace: CodeSpace | null;      // The space the user is currently in
    currentUser: SpaceUser | null;       // Current user info
    loading: boolean;
    error: string | null;

    // Core space operations
    createSpace: (name: string, isPublic: boolean) => Promise<CodeSpace>;
    joinSpace: (joinCode: string) => Promise<boolean>;
    joinSpaceById: (spaceId: string) => Promise<boolean>;
    joinSpaceByCode: (joinCode: string) => Promise<boolean>;
    leaveSpace: () => void;

    // Communication
    sendMessage: (message: string) => void;

    // File operations
    setActiveFile: (file: VirtualFile) => void;

    // Edit permissions
    requestEditPermission: () => Promise<boolean>;
    grantEditPermission: (userId: string) => Promise<boolean>;
    denyEditPermission: (userId: string) => Promise<boolean>;

    // File saving (Y.js integration)
    yDoc: any;
    provider: any;
    saveFile: () => Promise<boolean>;
}

// Create the context
const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

// Session storage key for current user's space session
const SESSION_STORAGE_KEY = "sensei_current_space_session";

// Create a mock current user
const createCurrentUser = (): SpaceUser => {
    // Try to get from sessionStorage first for refresh persistence
    const storedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSession) {
        try {
            const session = JSON.parse(storedSession);
            return {
                id: session.userId,
                username: session.username,
                isCreator: false,
                canEdit: false,
                isActive: true,
                lastActivity: Date.now(),
            };
        } catch (e) {
            console.error("Failed to parse stored session", e);
        }
    }

    // Generate a new user
    const id = crypto.randomUUID();
    const username = `User_${id.substring(0, 5)}`;

    return {
        id,
        username,
        isCreator: false,
        canEdit: false,
        isActive: true,
        lastActivity: Date.now(),
    };
};

// API helper functions
const apiClient = {
    async createSpace(name: string, isPublic: boolean, userId: string, username: string): Promise<CodeSpace> {
        const response = await fetch('/api/spaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                isPublic,
                creatorName: username,
                userId
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create space');
        }

        const data = await response.json();
        return data.space;
    },

    async joinSpaceByCode(joinCode: string, userId: string, username: string): Promise<CodeSpace> {
        const response = await fetch('/api/spaces/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                joinCode,
                userId,
                username
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to join space');
        }

        const data = await response.json();
        return data.space;
    },

    async joinSpaceById(spaceId: string, userId: string, username: string): Promise<CodeSpace> {
        const response = await fetch(`/api/spaces/${spaceId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                username
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to join space');
        }

        const data = await response.json();
        return data.space;
    },

    async leaveSpace(spaceId: string, userId: string): Promise<void> {
        const response = await fetch(`/api/spaces/${spaceId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            throw new Error('Failed to leave space');
        }
    },

    async getActiveSpaces(): Promise<CodeSpace[]> {
        const response = await fetch('/api/spaces');

        if (!response.ok) {
            throw new Error('Failed to fetch spaces');
        }

        const data = await response.json();
        return data.spaces;
    }
};

// Provider component
export const SpaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeSpaces, setActiveSpaces] = useState<CodeSpace[]>([]);
    const [currentSpace, setCurrentSpace] = useState<CodeSpace | null>(null);
    const [currentUser, setCurrentUser] = useState<SpaceUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [yDoc, setYDoc] = useState<any>(null);
    const [provider, setProvider] = useState<any>(null);

    // Initialize state
    useEffect(() => {
        const user = createCurrentUser();
        setCurrentUser(user);

        // Load active spaces
        loadActiveSpaces();

        setLoading(false);

        // Handle page unload/close - clean up user presence
        const handleBeforeUnload = () => {
            if (currentSpace && user) {
                apiClient.leaveSpace(currentSpace.id, user.id).catch(console.error);
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // Load active spaces from server
    const loadActiveSpaces = async () => {
        try {
            const spaces = await apiClient.getActiveSpaces();
            setActiveSpaces(spaces);
        } catch (err) {
            console.error('Failed to load active spaces:', err);
            setError('Failed to load active spaces');
        }
    };

    // Periodically refresh spaces list
    useEffect(() => {
        const interval = setInterval(loadActiveSpaces, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const createSpace = async (name: string, isPublic: boolean): Promise<CodeSpace> => {
        if (!currentUser) throw new Error("No current user");

        try {
            const space = await apiClient.createSpace(name, isPublic, currentUser.id, currentUser.username);

            // Update local state
            setCurrentSpace(space);
            setActiveSpaces(prev => [...prev, space]);

            // Store session
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                spaceCode: space.joinCode,
                spaceId: space.id,
                userId: currentUser.id,
                username: currentUser.username
            }));

            console.log('Created space:', space);
            return space;
        } catch (err) {
            console.error('Failed to create space:', err);
            throw err;
        }
    };

    const joinSpace = async (joinCode: string): Promise<boolean> => {
        if (!currentUser) {
            console.error("No current user");
            return false;
        }

        try {
            const space = await apiClient.joinSpaceByCode(joinCode, currentUser.id, currentUser.username);

            // Update local state
            setCurrentSpace(space);
            await loadActiveSpaces(); // Refresh the list

            // Store session
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                spaceCode: space.joinCode,
                spaceId: space.id,
                userId: currentUser.id,
                username: currentUser.username
            }));

            console.log('Joined space:', space);
            return true;
        } catch (err) {
            console.error('Failed to join space:', err);
            setError('Failed to join space');
            return false;
        }
    };

    const joinSpaceById = async (spaceId: string): Promise<boolean> => {
        if (!currentUser) {
            console.error("No current user");
            return false;
        }

        try {
            const space = await apiClient.joinSpaceById(spaceId, currentUser.id, currentUser.username);

            // Update local state
            setCurrentSpace(space);
            await loadActiveSpaces(); // Refresh the list

            // Store session
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                spaceCode: space.joinCode,
                spaceId: space.id,
                userId: currentUser.id,
                username: currentUser.username
            }));

            console.log('Joined space by ID:', space);
            return true;
        } catch (err) {
            console.error('Failed to join space by ID:', err);
            setError('Failed to join space');
            return false;
        }
    };

    const joinSpaceByCode = async (joinCode: string): Promise<boolean> => {
        return await joinSpace(joinCode);
    };

    const leaveSpace = async (): Promise<void> => {
        if (!currentSpace || !currentUser) return;

        try {
            await apiClient.leaveSpace(currentSpace.id, currentUser.id);

            // Update local state
            setCurrentSpace(null);
            await loadActiveSpaces(); // Refresh the list

            // Clear session
            sessionStorage.removeItem(SESSION_STORAGE_KEY);

            console.log('Left space');
        } catch (err) {
            console.error('Failed to leave space:', err);
            setError('Failed to leave space');
        }
    };

    // Placeholder implementations for other functions
    const sendMessage = (message: string) => {
        console.log('Sending message:', message);
    };

    const setActiveFile = (file: VirtualFile) => {
        console.log('Setting active file:', file);
    };

    const requestEditPermission = async (): Promise<boolean> => {
        console.log('Requesting edit permission');
        return true;
    };

    const grantEditPermission = async (userId: string): Promise<boolean> => {
        console.log('Granting edit permission to:', userId);
        return true;
    };

    const denyEditPermission = async (userId: string): Promise<boolean> => {
        console.log('Denying edit permission to:', userId);
        return true;
    };

    const saveFile = async (): Promise<boolean> => {
        console.log('Saving file');
        return true;
    };

    const contextValue: SpaceContextType = {
        activeSpaces,
        currentSpace,
        currentUser,
        loading,
        error,
        createSpace,
        joinSpace,
        joinSpaceById,
        joinSpaceByCode,
        leaveSpace,
        sendMessage,
        setActiveFile,
        requestEditPermission,
        grantEditPermission,
        denyEditPermission,
        yDoc,
        provider,
        saveFile,
    };

    return (
        <SpaceContext.Provider value={contextValue}>
            {children}
        </SpaceContext.Provider>
    );
};

// Hook to use the context
export const useSpaces = (): SpaceContextType => {
    const context = useContext(SpaceContext);
    if (context === undefined) {
        throw new Error('useSpaces must be used within a SpaceProvider');
    }
    return context;
};

export default SpaceProvider;
