"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SpaceProvider } from "@/contexts/SpaceContext";
import { ActiveSpacesList } from "@/components/spaces/ActiveSpacesList";
import { CreateSpaceDialog } from "@/components/spaces/CreateSpaceDialog";
import { JoinSpaceDialog } from "@/components/spaces/JoinSpaceDialog";
import { Plus, Search } from "lucide-react";

export default function SpacesPage() {
  const [user, setUser] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  // This mimics what we do in dashboard/page.tsx to get the user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sensei-2keb.onrender.com";
        const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <SpaceProvider>
      <DashboardLayout user={user}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Live Code Spaces</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Collaborate on code in real-time with others
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowJoinDialog(true)} variant="outline">
                Join Space
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Space
              </Button>
            </div>
          </div>

          {/* Active Spaces */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Public Spaces</h2>
            <ActiveSpacesList limit={0} showViewAll={false} />
          </div>
        </div>

        {/* Dialogs */}
        <CreateSpaceDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />

        <JoinSpaceDialog
          open={showJoinDialog}
          onOpenChange={setShowJoinDialog}
        />
      </DashboardLayout>
    </SpaceProvider>
  );
}
