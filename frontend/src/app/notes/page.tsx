"use client";

import { useState, useEffect, useRef } from "react";
import DynamicGrid from "@/components/DynamicGrid";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash,
  Copy,
  Download,
  Share,
  Pencil,
  ChevronDown,
  ArrowUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { createClient } from "../../../utils/supabase/client";
import { isAxiosError } from "axios";
import Link from "next/link";
import { Item } from "@/interfaces";
import MarkdownMessage from "@/components/MarkdownMessage";

const supabase = createClient();

interface Note {
  id: string;
  name: string;
  content: string;
  created_at: string;
  chats: Message[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatbarOpen, setIsChatbarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState("");
  const [input, setInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notes on component mount
  useEffect(() => {
    getNotes();
  }, []);

  // Auto-save functionality with debounce
  useEffect(() => {
    if (!selectedNote) return;

    const timeoutId = setTimeout(() => {
      saveNote(selectedNote);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [selectedNote?.content]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedNote?.chats]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsLoading(false);
    router.push("/sign-in");
  };

  const getNotes = async () => {
    try {
      const response = await api.get("/api/notes");
      console.log(response.data);
      setNotes(response.data.notes);
      setIsLoading(false);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleSignOut();
        return;
      }
      console.error("Error fetching notes:", error);
      setIsLoading(false);
    }
  };

  const saveNote = async (note: Note) => {
    try {
      await api.put(`/api/notes/${note.id}`, note);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const createNewNote = async () => {
    const name = prompt("Enter note name:", "Untitled Note");
    if (!name) return; // If user cancels, don't create note

    const newNote: Note = {
      id: uuidv4(),
      name: name,
      content: "",
      created_at: new Date().toISOString(),
      chats: [],
    };
    try {
      const response = await api.post("/api/notes", newNote);

      setNotes((prev) => [...prev, response.data]);
      setSelectedNote(response.data);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleSignOut();
        return;
      }
      console.error("Error creating note:", error);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const response = await api.delete(`/api/notes/${noteId}`);

      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleSignOut();
        return;
      }
      console.error("Error deleting note:", error);
    }
  };

  const handleRename = async () => {
    if (!selectedNote || !tempName.trim()) return;
    setIsRenaming(false);
    const updatedNote = { ...selectedNote, name: tempName };
    setSelectedNote(updatedNote);
    setNotes((prev) =>
      prev.map((note) => (note.id === selectedNote.id ? updatedNote : note)),
    );
    try {
      await api.put(`/api/notes/${selectedNote.id}`, updatedNote);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleSignOut();
        return;
      }
      console.error("Error renaming note:", error);
    }
  };

  const startRenaming = () => {
    if (!selectedNote) return;
    setTempName(selectedNote.name);
    setIsRenaming(true);
  };

  const handleCopy = () => {
    if (selectedNote?.content) {
      navigator.clipboard.writeText(selectedNote.content);
    }
  };

  const handleDownload = () => {
    if (selectedNote) {
      const blob = new Blob([selectedNote.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedNote.name}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleShare = async () => {
    if (selectedNote) {
      try {
        await navigator.share({
          title: selectedNote.name,
          text: selectedNote.content,
        });
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          handleSignOut();
          return;
        }
        console.error("Error sharing:", error);
      }
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading || !selectedNote) return;
    const prevInput = input;
    setInput("");

    const userMessage: Message = { role: "user", content: input.trim() };
    setSelectedNote((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        id: prev.id,
        name: prev.name,
        content: prev.content,
        created_at: prev.created_at,
        chats: [...prev.chats, userMessage],
      };
    });
    setIsChatLoading(true);

    try {
      const response = await api.post(`/api/chat`, {
        prompt: userMessage.content,
        idea: `TITLE: ${selectedNote.name} \n CONTENT: ${selectedNote.content}`,
        note_id: selectedNote.id,
        chat_context: selectedNote.chats.slice(-10, -1),
      });

      const aiMessage: Message = {
        role: "assistant",
        content: response.data.message,
      };

      setSelectedNote((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          id: prev.id,
          name: prev.name,
          content: prev.content,
          created_at: prev.created_at,
          chats: [...prev.chats, aiMessage],
        };
      });
      setIsChatLoading(false);
    } catch (error) {
      setSelectedNote((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          id: prev.id,
          name: prev.name,
          content: prev.content,
          created_at: prev.created_at,
          chats: prev.chats.slice(0, -1),
        };
      });
      console.error("Error in chat:", error);
      setInput(prevInput);
      setIsChatLoading(false);
    }
  };

  return (
    <main className="flex-1 w-full flex overflow-hidden">
      {/* Background layer */}
      <div className="fixed inset-0 w-full h-full z-0">
        <DynamicGrid />
      </div>

      {/* Sidebar */}
      <div
        className={`relative z-10 bg-white/30 border-t border-r border-zinc-300 backdrop-blur-xs transition-all duration-300  ${
          !isSidebarOpen
            ? "w-0"
            : ` w-64
          ${!selectedNote ? "rounded-tr-xl" : ""}
          `
        }`}
      >
        {isSidebarOpen && (
          <div className=" h-full flex flex-col">
            <div className="flex items-center justify-between m-4">
              <h2 className="text-lg font-semibold">Ideas</h2>
              <Button
                onClick={createNewNote}
                size="icon"
                variant="ghost"
                className="hover:bg-transparent text-zinc-500 hover:text-zinc-900"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`flex items-center justify-between px-4 py-2 m-1 mt-0 font-bold text-sm rounded-lg cursor-pointer hover:bg-zinc-200 ${
                    selectedNote?.id === note.id ? "bg-zinc-200" : ""
                  }`}
                  onClick={() => setSelectedNote(note)}
                >
                  {isRenaming && selectedNote?.id === note.id ? (
                    <input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={handleRename}
                      onKeyDown={(e) => e.key === "Enter" && handleRename()}
                      className="p-0 bg-transparent border-none shadow-none outline-none"
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className="truncate">{note.name}</span>
                      <div className="flex ">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRenaming();
                          }}
                          className="opacity-60 pr-1 hover:opacity-100 hover:bg-transparent"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="opacity-60 px-2 hover:opacity-100 hover:bg-transparent pr-0"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toggle sidebar button */}
      <Button
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        size="icon"
        variant="ghost"
        className="fixed left-0 top-1/2 transform -translate-y-1/2 z-20"
      >
        {isSidebarOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Main content */}
      <div className="relative flex-1 z-10">
        {selectedNote ? (
          <div className="flex flex-col h-full">
            <textarea
              value={selectedNote.content}
              onChange={(e) =>
                setSelectedNote((prev) =>
                  prev ? { ...prev, content: e.target.value } : null,
                )
              }
              className="outline-0 resize-none bg-white/30 border-t border-zinc-300 backdrop-blur-xs w-full flex-1 p-4"
              placeholder="Start writing..."
            />
            <div className="flex justify-start gap-2 p-2 bg-white/30 backdrop-blur-xs ">
              <Button onClick={handleCopy} size="icon" variant="ghost">
                <Copy className="h-4 w-4" />
              </Button>
              <Button onClick={handleDownload} size="icon" variant="ghost">
                <Download className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => selectedNote && deleteNote(selectedNote.id)}
                size="icon"
                variant="ghost"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            {isLoading ? (
              "Loading..."
            ) : (
              <div className="text-center">
                <p>Select a note or create a new one</p>
                <Button
                  onClick={createNewNote}
                  variant="outline"
                  className="mt-4"
                >
                  Create New Note
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div
        className={`relative z-10 bg-white/30 border-t border-l border-zinc-300 backdrop-blur-xs transition-all duration-300 flex flex-col h-[calc(100vh-50px)] ${
          isChatbarOpen && selectedNote ? "w-[500px]" : "w-0"
        }`}
      >
        {isChatbarOpen && selectedNote && (
          <>
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-semibold">Chat</h2>
            </div>

            {/* Messages container */}
            <div className="flex-1 overflow-y-auto px-4">
              <div className="space-y-6 pb-4">
                {selectedNote.chats.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-3 text-sm  ${
                        message.role === "user"
                          ? "bg-emerald-100/90 text-zinc-900"
                          : "bg-zinc-200/90 text-zinc-900"
                      }`}
                    >
                      <MarkdownMessage
                        content={message.content}
                        isUser={message.role === "user"}
                      />
                      {/* {message.items && message.items.length > 0 && (
                        <div className="mt-4">
                          <button
                            onClick={() => {
                              const newMessages = [...messages];
                              const messageIndex = newMessages.findIndex(m => m === message);
                              if (messageIndex !== -1) {
                                newMessages[messageIndex] = {
                                  ...message,
                                  isSourcesExpanded: !message.isSourcesExpanded
                                };
                                setMessages(newMessages);
                              }
                            }}
                            className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
                          >
                            {message.isSourcesExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            Sources ({message.items.length})
                          </button>
                          {message.isSourcesExpanded && (
                            <div className="mt-2 pl-4 space-y-2">
                              {message.items.map((item, index) => (
                                <Link
                                  key={index}
                                  href={item.link}
                                  className="block text-sm text-zinc-500 hover:text-zinc-700 hover:underline transition-colors"
                                >
                                  {index + 1}. {item.title}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )} */}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[90%] rounded-2xl px-6 py-3 bg-zinc-100/90">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat input */}

            <form onSubmit={handleChatSubmit} className="p-3 border-zinc-200 ">
              <div className="flex-1 bg-white/50 backdrop-blur-lg border-zinc-200 rounded-xl items-center flex border border-zinc-200 p-1 ">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about this idea"
                  className="bg-transparent border-none shadow-none py-6 px-3 rounded-xl"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-zinc-900 hover:bg-zinc-800 rounded-xl m-0 py-6 ml-1"
                >
                  <ArrowUp className="h-4 w-4 m-0 p-0" />
                </Button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Toggle chatbar button */}
      {selectedNote && (
        <Button
          onClick={() => setIsChatbarOpen((prev) => !prev)}
          size="icon"
          variant="ghost"
          className="fixed right-0 top-1/2 transform -translate-y-1/2 z-20"
        >
          {isChatbarOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      )}
    </main>
  );
}
