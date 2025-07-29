import { VirtualFile } from ".";

/**
 * Represents a user in a code space
 */
export interface SpaceUser {
  id: string;
  username: string;
  isCreator: boolean;
  canEdit: boolean;
  isActive: boolean;
  lastActivity: number; // timestamp
}

/**
 * Represents a chat message in a space
 */
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number; // timestamp
}

/**
 * Represents an edit request from a user
 */
export interface EditRequest {
  id: string;
  userId: string;
  username: string;
  timestamp: number; // timestamp
  pending: boolean;
}

/**
 * Represents a collaborative code space
 */
export interface CodeSpace {
  id: string;
  name: string;
  joinCode: string;
  createdAt: number; // timestamp
  creatorId: string;
  creatorName: string;
  users: SpaceUser[];
  activeFile: VirtualFile | null;
  messages: ChatMessage[];
  editRequests: EditRequest[];
  isPublic: boolean;
  lastActivity: number; // timestamp
}
