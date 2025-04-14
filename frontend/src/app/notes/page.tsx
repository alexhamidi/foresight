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
import { Note } from "@/app/interfaces";

const supabase = createClient();

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
      customers: "",
      competitors: ""
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

  return (
    <div className="relative flex-1 z-10">
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>Select a note from the sidebar or create a new one</p>
        </div>
      </div>
    </div>
  );
}
