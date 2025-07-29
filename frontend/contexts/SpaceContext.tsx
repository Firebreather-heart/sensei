"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { CodeSpace, SpaceUser, ChatMessage, EditRequest } from "@/types/spaces";
import { VirtualFile } from "@/types";

// Define the context shape
interface SpaceContextType {
  spaces: CodeSpace[];
  activeSpace: CodeSpace | null;
  currentUser: SpaceUser | null;
  loadSpace: (spaceId: string) => Promise<CodeSpace | null>;
  createSpace: (name: string, isPublic: boolean) => Promise<CodeSpace>;
  joinSpace: (joinCode: string) => Promise<CodeSpace | null>;
  sendMessage: (message: string) => void;
  requestEditAccess: () => void;
  approveEditRequest: (requestId: string) => void;
  denyEditRequest: (requestId: string) => void;
  updateFileInSpace: (file: VirtualFile) => void;
  addFileToSpace: (file: VirtualFile) => void;
  usersEditingFile: Map<string, Set<string>>;
  registerUserEdit: (userId: string, username: string, fileId: string, position: number) => void;
  unregisterUserEdit: (userId: string, fileId: string) => void;
}

// Create the context
const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

// Create a mock current user based on localStorage or generate one
const createMockCurrentUser = (): SpaceUser => {
  // Try to get from localStorage first
  const storedUser = localStorage.getItem("space_current_user");
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      return {
        id: parsed.id,
        username: parsed.username,
        isCreator: false, // Will be updated when in a specific space
        canEdit: false,   // Will be updated when in a specific space
        isActive: true,
        lastActivity: Date.now(),
      };
    } catch (e) {
      console.error("Failed to parse stored user", e);
    }
  }

  // Generate a new user
  const id = uuidv4();
  const username = `user_${id.substring(0, 5)}`;

  // Store for future use
  const newUser = {
    id,
    username,
    isCreator: false,
    canEdit: false,
    isActive: true,
    lastActivity: Date.now(),
  };

  localStorage.setItem("space_current_user", JSON.stringify({
    id: newUser.id,
    username: newUser.username,
  }));

  return newUser;
};

// Create mock data for initial spaces
const createInitialSpaces = (): CodeSpace[] => {
  const storedSpaces = localStorage.getItem("spaces");
  if (storedSpaces) {
    try {
      return JSON.parse(storedSpaces);
    } catch (e) {
      console.error("Failed to parse stored spaces", e);
    }
  }

  // Return empty array if no spaces exist
  return [];
};

// Provider component
export const SpaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [spaces, setSpaces] = useState<CodeSpace[]>([]);
  const [activeSpace, setActiveSpace] = useState<CodeSpace | null>(null);
  const [currentUser, setCurrentUser] = useState<SpaceUser | null>(null);
  const [usersEditingFile, setUsersEditingFile] = useState<Map<string, Set<string>>>(new Map());

  // Initialize state
  useEffect(() => {
    const mockUser = createMockCurrentUser();
    setCurrentUser(mockUser);
    setSpaces(createInitialSpaces());
  }, []);

  // Save spaces to localStorage whenever they change
  useEffect(() => {
    if (spaces.length > 0) {
      localStorage.setItem("spaces", JSON.stringify(spaces));
    }
  }, [spaces]);

  // Helper to find a space by ID
  const findSpace = (spaceId: string): CodeSpace | undefined => {
    return spaces.find(space => space.id === spaceId);
  };

  // Load a specific space
  const loadSpace = async (spaceId: string): Promise<CodeSpace | null> => {
    const space = findSpace(spaceId);
    if (!space) return null;

    // Update this space to mark the current user as active
    const updatedSpace = {
      ...space,
      users: space.users.map(user =>
        user.id === currentUser?.id ? {
          ...user,
          isActive: true,
          lastActivity: Date.now()
        } : user
      )
    };

    // Update spaces list and active space
    setSpaces(prev => prev.map(s => s.id === spaceId ? updatedSpace : s));
    setActiveSpace(updatedSpace);

    // Update current user with space-specific permissions
    if (currentUser) {
      const userInSpace = updatedSpace.users.find(u => u.id === currentUser.id);
      if (userInSpace) {
        setCurrentUser({
          ...currentUser,
          isCreator: userInSpace.isCreator,
          canEdit: userInSpace.canEdit,
          isActive: true,
          lastActivity: Date.now(),
        });
      }
    }

    return updatedSpace;
  };

  // Create a new space
  const createSpace = async (name: string, isPublic: boolean): Promise<CodeSpace> => {
    if (!currentUser) throw new Error("No current user");

    // Create space object
    const newSpace: CodeSpace = {
      id: uuidv4(),
      name,
      joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: Date.now(),
      creatorId: currentUser.id,
      creatorName: currentUser.username,
      users: [{
        id: currentUser.id,
        username: currentUser.username,
        isCreator: true,
        canEdit: true,
        isActive: true,
        lastActivity: Date.now()
      }],
      activeFile: null,
      messages: [],
      editRequests: [],
      isPublic,
      lastActivity: Date.now()
    };

    // Update current user as creator
    setCurrentUser({
      ...currentUser,
      isCreator: true,
      canEdit: true,
    });

    // Save the new space
    setSpaces(prev => [newSpace, ...prev]);
    setActiveSpace(newSpace);

    return newSpace;
  };

  // Join an existing space
  const joinSpace = async (joinCode: string): Promise<CodeSpace | null> => {
    if (!currentUser) throw new Error("No current user");

    // Find space with the join code
    const space = spaces.find(s => s.joinCode === joinCode);
    if (!space) return null;

    // Check if user is already in the space
    if (space.users.some(u => u.id === currentUser.id)) {
      return loadSpace(space.id);
    }

    // Add user to the space
    const updatedSpace = {
      ...space,
      users: [...space.users, {
        id: currentUser.id,
        username: currentUser.username,
        isCreator: false,
        canEdit: false, // Start as viewer only
        isActive: true,
        lastActivity: Date.now()
      }],
      lastActivity: Date.now()
    };

    // Update spaces list
    setSpaces(prev => prev.map(s => s.id === space.id ? updatedSpace : s));
    setActiveSpace(updatedSpace);

    // Update current user
    setCurrentUser({
      ...currentUser,
      isCreator: false,
      canEdit: false,
    });

    return updatedSpace;
  };

  // Send a chat message
  const sendMessage = (message: string) => {
    if (!activeSpace || !currentUser) return;

    const newMessage: ChatMessage = {
      id: uuidv4(),
      userId: currentUser.id,
      username: currentUser.username,
      message,
      timestamp: Date.now()
    };

    const updatedSpace = {
      ...activeSpace,
      messages: [...activeSpace.messages, newMessage],
      lastActivity: Date.now()
    };

    setActiveSpace(updatedSpace);
    setSpaces(prev => prev.map(s => s.id === activeSpace.id ? updatedSpace : s));
  };

  // Request edit access
  const requestEditAccess = () => {
    if (!activeSpace || !currentUser) return;

    // Check if request already exists
    if (activeSpace.editRequests.some(r => r.userId === currentUser.id && r.pending)) {
      return; // Don't create duplicate requests
    }

    const newRequest: EditRequest = {
      id: uuidv4(),
      userId: currentUser.id,
      username: currentUser.username,
      timestamp: Date.now(),
      pending: true
    };

    const updatedSpace = {
      ...activeSpace,
      editRequests: [...activeSpace.editRequests, newRequest]
    };

    setActiveSpace(updatedSpace);
    setSpaces(prev => prev.map(s => s.id === activeSpace.id ? updatedSpace : s));
  };

  // Approve an edit request
  const approveEditRequest = (requestId: string) => {
    if (!activeSpace || !currentUser?.isCreator) return;

    // Find the request
    const request = activeSpace.editRequests.find(r => r.id === requestId);
    if (!request || !request.pending) return;

    // Update request and user permissions
    const updatedRequests = activeSpace.editRequests.map(r =>
      r.id === requestId ? { ...r, pending: false } : r
    );

    const updatedUsers = activeSpace.users.map(u =>
      u.id === request.userId ? { ...u, canEdit: true } : u
    );

    const updatedSpace = {
      ...activeSpace,
      editRequests: updatedRequests,
      users: updatedUsers
    };

    setActiveSpace(updatedSpace);
    setSpaces(prev => prev.map(s => s.id === activeSpace.id ? updatedSpace : s));
  };

  // Deny an edit request
  const denyEditRequest = (requestId: string) => {
    if (!activeSpace || !currentUser?.isCreator) return;

    // Find the request
    const request = activeSpace.editRequests.find(r => r.id === requestId);
    if (!request || !request.pending) return;

    // Update request status
    const updatedRequests = activeSpace.editRequests.map(r =>
      r.id === requestId ? { ...r, pending: false } : r
    );

    const updatedSpace = {
      ...activeSpace,
      editRequests: updatedRequests
    };

    setActiveSpace(updatedSpace);
    setSpaces(prev => prev.map(s => s.id === activeSpace.id ? updatedSpace : s));
  };

  // Update a file in the active space
  const updateFileInSpace = (file: VirtualFile) => {
    if (!activeSpace) return;

    // In a real app, we'd sync this with other users
    // For now, just update the activeFile in the space
    const updatedSpace = {
      ...activeSpace,
      activeFile: file,
      lastActivity: Date.now()
    };

    setActiveSpace(updatedSpace);
    setSpaces(prev => prev.map(s => s.id === activeSpace.id ? updatedSpace : s));
  };

  // Add a file to the active space
  const addFileToSpace = (file: VirtualFile) => {
    if (!activeSpace) return;

    // In a real app, we'd add this to a files array in the space
    // For now, just set it as the active file
    const updatedSpace = {
      ...activeSpace,
      activeFile: file,
      lastActivity: Date.now()
    };

    setActiveSpace(updatedSpace);
    setSpaces(prev => prev.map(s => s.id === activeSpace.id ? updatedSpace : s));
  };

  // Track user editing position
  const registerUserEdit = (userId: string, username: string, fileId: string, position: number) => {
    setUsersEditingFile(prev => {
      // Create a deep copy of the map
      const newMap = new Map(prev);

      // Get or create the set of users for this file
      if (!newMap.has(fileId)) {
        newMap.set(fileId, new Set());
      }

      // Add user to the set
      const userSet = newMap.get(fileId)!;
      userSet.add(`${userId}:${position}:${username}`);

      return newMap;
    });
  };

  // Remove user editing position
  const unregisterUserEdit = (userId: string, fileId: string) => {
    setUsersEditingFile(prev => {
      // Create a deep copy of the map
      const newMap = new Map(prev);

      // Get the set of users for this file
      const userSet = newMap.get(fileId);
      if (userSet) {
        // Remove all entries for this user
        const updatedSet = new Set(
          [...userSet].filter(entry => !entry.startsWith(`${userId}:`))
        );

        if (updatedSet.size === 0) {
          newMap.delete(fileId);
        } else {
          newMap.set(fileId, updatedSet);
        }
      }

      return newMap;
    });
  };

  const value = {
    spaces,
    activeSpace,
    currentUser,
    loadSpace,
    createSpace,
    joinSpace,
    sendMessage,
    requestEditAccess,
    approveEditRequest,
    denyEditRequest,
    updateFileInSpace,
    addFileToSpace,
    usersEditingFile,
    registerUserEdit,
    unregisterUserEdit
  };

  return (
    <SpaceContext.Provider value={value}>
      {children}
    </SpaceContext.Provider>
  );
};

// Custom hook for using the context
export const useSpaces = () => {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpaces must be used within a SpaceProvider');
  }
  return context;
};


