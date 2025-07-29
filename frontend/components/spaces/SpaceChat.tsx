"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpaces } from "@/contexts/SpaceContext";
import { SendHorizonal } from "lucide-react";

export function SpaceChat() {
  const { currentSpace, currentUser, sendMessage } = useSpaces();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSpace?.messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const success = await sendMessage(message);
    if (success) {
      setMessage("");
    }
  };
  
  if (!currentSpace || !currentUser) return null;

  return (
    <div className="flex flex-col h-full border rounded-md">
      <div className="p-3 border-b bg-muted/50">
        <h3 className="font-medium">Chat</h3>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="flex flex-col gap-3">
          {currentSpace.messages && currentSpace.messages.length > 0 ? (
            currentSpace.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex max-w-[80%] ${
                  msg.userId === currentUser.id
                    ? "self-end flex-row-reverse"
                    : "self-start"
                }`}
              >
                <div
                  className={`rounded-lg p-3 ${
                    msg.userId === currentUser.id
                      ? "bg-blue-500 text-white ml-2"
                      : "bg-gray-200 dark:bg-gray-700 mr-2"
                  }`}
                >
                  {msg.userId !== currentUser.id && (
                    <div className="text-xs font-medium mb-1">
                      {msg.username}
                    </div>
                  )}
                  <p className="break-words">{msg.message}</p>
                  <div
                    className={`text-xs mt-1 ${
                      msg.userId === currentUser.id
                        ? "text-blue-100"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!message.trim()}>
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
