"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Globe, Lock, ArrowLeft, UserPlus } from "lucide-react";

import { DashboardLayout } from "@/components/dashboard-layout";
import { LiveCodeEditor } from "@/components/spaces/LiveCodeEditor";
import { ChatPanel } from "@/components/spaces/ChatPanel";
import { ParticipantsList } from "@/components/spaces/ParticipantsList";
import { useSpaces } from "@/contexts/SpaceContext";
import { toast } from "@/components/ui/use-toast";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function SpacePage({ params }: { params: { spaceId: string } }) {
  const router = useRouter();
  const { spaceId } = params;

  const { currentSpace, currentUser, joinSpaceById } = useSpaces();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock user - in real app this would come from auth context
  const [user] = useState<User>({
    id: "user-1",
    username: "John Doe",
    email: "john@example.com",
    role: "user"
  });

  // Initialize the page
  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      try {
        // Load the space
        await joinSpaceById(spaceId);
      } catch (error) {
        console.error("Failed to load space", error);
        toast({
          title: "Error",
          description: "Failed to load the space. Please try again later.",
          variant: "destructive"
        });
        router.push("/dashboard/spaces");
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [spaceId, joinSpaceById, router]);

  const handleInviteUser = () => {
    if (!inviteEmail.trim() || !currentSpace) return;

    setInviting(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Invitation sent",
        description: `An invite has been sent to ${inviteEmail}`,
      });

      setInviteEmail("");
      setShowInviteDialog(false);
      setInviting(false);
    }, 1000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentSpace) {
    return (
      <DashboardLayout user={user}>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-2">Space not found</h2>
          <p className="text-gray-500 mb-6">The space you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => router.push("/dashboard/spaces")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Spaces
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Determine if the current user is the creator
  const isCreator = currentUser?.isCreator || false;

  return (
    <DashboardLayout user={user}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/spaces")}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentSpace.name}
                </h1>
                {currentSpace.isPublic ? (
                  <Badge variant="secondary">
                    <Globe className="w-3 h-3 mr-1" />
                    Public
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Lock className="w-3 h-3 mr-1" />
                    Private
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Created by {currentSpace.creatorName} • {formatDate(currentSpace.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCreator && (
              <Button onClick={() => setShowInviteDialog(true)} variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Users
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
          {/* Code Editor - Takes up most space */}
          <div className="lg:col-span-3">
            <LiveCodeEditor />
          </div>

          {/* Side Panel - Chat and Participants */}
          <div className="lg:col-span-1 space-y-4">
            <ParticipantsList />
            <ChatPanel />
          </div>
        </div>

        {/* Invite Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite users to the space</DialogTitle>
              <DialogDescription>
                Send invitations to collaborate in this space
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="copy-link" className="text-sm">Share link:</Label>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 py-1 px-2 rounded flex-1 overflow-x-auto">
                  {`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${currentSpace.joinCode}`}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="px-2"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(`${window.location.origin}/invite/${currentSpace.joinCode}`);
                      toast({
                        title: "Link copied",
                        description: "The invite link has been copied to your clipboard",
                      });
                    }
                  }}
                >
                  <span className="sr-only">Copy</span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67158 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67158 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                disabled={inviting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInviteUser}
                disabled={!inviteEmail.trim() || inviting}
              >
                {inviting ? "Inviting..." : "Send Invite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
