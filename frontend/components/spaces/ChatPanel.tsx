"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useSpaces } from "@/contexts/SpaceContext";
import { cn } from "@/lib/utils";

export function ChatPanel() {
  const { activeSpace, currentUser, sendMessage } = useSpaces();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [activeSpace?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!message.trim() || !activeSpace) return;

    sendMessage(message);
    setMessage("");
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!activeSpace) {
    return (
      <div className="flex items-center justify-center h-full border rounded-md p-4">
        <div className="text-center text-gray-500">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-md">
      <div className="p-3 border-b bg-muted/50">
        <h3 className="font-medium">Chat</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {activeSpace.messages.length === 0 ? (
            <div className="text-center text-gray-500 my-8">
              <p>No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          ) : (
            activeSpace.messages.map((message) => {
              const isCurrentUser = message.userId === currentUser?.id;
              return (
                <div key={message.id} className={cn(
                  "flex",
                  isCurrentUser ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    isCurrentUser
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800"
                  )}>
                    {!isCurrentUser && (
                      <div className="font-medium text-xs mb-1">{message.username}</div>
                    )}
                    <div>{message.message}</div>
                    <div className="text-xs mt-1 opacity-70 text-right">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t mt-auto">
        <div className="flex w-full items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
          />
          <Button size="sm" onClick={handleSendMessage} disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
