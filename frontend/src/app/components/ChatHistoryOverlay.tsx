import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatHistoryOverlayProps {
  isOpen: boolean;
  chatSessions: ChatSession[];
  currentChat: ChatSession;
  onSelectChat: (chat: ChatSession) => void;
  onNewChat: (title: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onDeleteChat: (chatId: string) => void;
  onClose: () => void;
}

export default function ChatHistoryOverlay({
  isOpen,
  chatSessions,
  currentChat,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onClose,
}: ChatHistoryOverlayProps) {
  const [isNewChatInput, setIsNewChatInput] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [actionMode, setActionMode] = useState<"select" | "rename" | "delete">(
    "select",
  );

  useEffect(() => {
    if (isOpen) {
      const currentIndex = chatSessions.findIndex(
        (chat) => chat.id === currentChat.id,
      );
      setSelectedIndex(currentIndex);
      setActionMode("select");
    }
  }, [isOpen, currentChat.id, chatSessions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "h" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen && (isNewChatInput || editingChatId)) {
          // Cancel any ongoing edits when closing with cmd+h
          setIsNewChatInput(false);
          setNewChatTitle("");
          setEditingChatId(null);
          setEditingTitle("");
        }
        onClose();
      } else if (e.key === "Escape") {
        if (isNewChatInput || editingChatId) {
          e.preventDefault();
          setIsNewChatInput(false);
          setNewChatTitle("");
          setEditingChatId(null);
          setEditingTitle("");
        } else {
          onClose();
        }
      } else if (isOpen && !isNewChatInput && !editingChatId) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, chatSessions.length - 1),
          );
          setActionMode("select");
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => {
            if (prev === -1) return chatSessions.length - 1;
            if (prev === 0) return -1;
            return prev - 1;
          });
          setActionMode("select");
        } else if (e.key === "ArrowRight" && selectedIndex >= 0) {
          e.preventDefault();
          setActionMode((prev) => {
            if (prev === "select") return "rename";
            if (prev === "rename") return "delete";
            return "select";
          });
        } else if (e.key === "ArrowLeft" && selectedIndex >= 0) {
          e.preventDefault();
          setActionMode((prev) => {
            if (prev === "delete") return "rename";
            if (prev === "rename") return "select";
            return "delete";
          });
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (selectedIndex === -1) {
            handleNewChat();
          } else {
            if (actionMode === "select") {
              onSelectChat(chatSessions[selectedIndex]);
            } else if (actionMode === "rename") {
              handleStartRename(chatSessions[selectedIndex]);
            } else if (actionMode === "delete") {
              onDeleteChat(chatSessions[selectedIndex].id);
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    chatSessions,
    isNewChatInput,
    selectedIndex,
    editingChatId,
    actionMode,
    onClose,
    onSelectChat,
    onDeleteChat,
  ]);

  const handleNewChat = () => {
    if (!isNewChatInput) {
      setIsNewChatInput(true);
      return;
    }

    if (!newChatTitle.trim()) {
      setIsNewChatInput(false);
      return;
    }

    onNewChat(newChatTitle.trim());
    setIsNewChatInput(false);
    setNewChatTitle("");
  };

  const handleCancelNewChat = () => {
    setIsNewChatInput(false);
    setNewChatTitle("");
  };

  const handleStartRename = (chat: ChatSession) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleRename = (chatId: string) => {
    if (!editingTitle.trim()) {
      setEditingChatId(null);
      setEditingTitle("");
      return;
    }

    onRenameChat(chatId, editingTitle.trim());
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleNewChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNewChat();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelNewChat();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRename(chatId);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditingChatId(null);
      setEditingTitle("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md z-[200] flex flex-col items-center">
      <div className="w-full max-w-2xl px-4 py-12">
        {isNewChatInput ? (
          <div className="w-full mb-4 flex gap-2">
            <Input
              autoFocus
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              onKeyDown={handleNewChatKeyDown}
              placeholder="Enter chat name..."
              className="flex-1 h-12 rounded-xl border border-zinc-200 bg-transparent text-base transition-all focus-visible:ring-1 focus-visible:ring-zinc-300"
            />
            <Button
              onClick={handleCancelNewChat}
              className="h-12 w-12 rounded-xl bg-transparent hover:bg-zinc-100/50 border border-zinc-200"
              variant="outline"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleNewChat}
            onMouseEnter={() => setSelectedIndex(-1)}
            className={`w-full bg-transparent border hover:bg-transparent border-zinc-200 gap-2 h-12 text-base mb-4 rounded-xl text-zinc-600 transition-colors ${
              selectedIndex === -1 ? "ring-2 ring-zinc-300" : ""
            }`}
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        )}

        <div className="space-y-2">
          {chatSessions.map((chat, index) => (
            <div key={chat.id} className="flex gap-2 items-stretch">
              {editingChatId === chat.id ? (
                <div className="flex-1 flex gap-2">
                  <Input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, chat.id)}
                    className="flex-1 h-12 rounded-xl border border-zinc-200 bg-transparent text-base"
                  />
                  <Button
                    onClick={() => {
                      setEditingChatId(null);
                      setEditingTitle("");
                    }}
                    className="h-12 w-12 rounded-xl bg-transparent hover:bg-transparent border border-zinc-200"
                    variant="outline"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onSelectChat(chat)}
                    onMouseEnter={() => {
                      setSelectedIndex(index);
                      setActionMode("select");
                    }}
                    className={`flex-1 text-left p-3 rounded-xl transition-colors flex items-center gap-4 ${
                      currentChat.id === chat.id ? "bg-zinc-600 text-white" : ""
                    } ${selectedIndex === index && actionMode === "select" ? "ring-2 ring-zinc-300" : ""}`}
                  >
                    <div className="font-medium text-base truncate">
                      {chat.title}
                    </div>
                  </button>
                  <div className="flex gap-2 self-stretch">
                    <Button
                      onClick={() => handleStartRename(chat)}
                      onMouseEnter={() => {
                        setSelectedIndex(index);
                        setActionMode("rename");
                      }}
                      className={`h-auto w-12 rounded-xl bg-transparent hover:bg-transparent border border-zinc-200 ${
                        selectedIndex === index && actionMode === "rename"
                          ? "ring-2 ring-zinc-300"
                          : ""
                      }`}
                      variant="outline"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => onDeleteChat(chat.id)}
                      onMouseEnter={() => {
                        setSelectedIndex(index);
                        setActionMode("delete");
                      }}
                      className={`h-auto w-12 rounded-xl bg-transparent hover:bg-transparent border border-zinc-200 text-red-500 hover:text-red-500 ${
                        selectedIndex === index && actionMode === "delete"
                          ? "ring-2 ring-zinc-300"
                          : ""
                      }`}
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
