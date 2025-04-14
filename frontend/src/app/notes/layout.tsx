"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "../../../utils/supabase/client";
import { isAxiosError } from "axios";
import DynamicGrid from "@/components/DynamicGrid";
import { Note } from "@/app/interfaces";
import IdeaSidebar from "@/components/ideas/IdeaSidebar";

const supabase = createClient();

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState("");
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<{[key: string]: boolean}>({});
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const currentNoteId = pathname.split("/").pop();

  useEffect(() => {
    getNotes();
  }, []);

  useEffect(() => {
    const handleSectionChange = (event: CustomEvent<{ section: string, noteId: string }>) => {
      setSelectedSection(event.detail.section);
    };

    window.addEventListener('sectionChange', handleSectionChange as EventListener);
    return () => {
      window.removeEventListener('sectionChange', handleSectionChange as EventListener);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsLoading(false);
    router.push("/sign-in");
  };

  const getNotes = async () => {
    try {
      const response = await api.get("/api/notes");
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

  const createNewNote = async () => {
    const name = prompt("Enter note name:", "Untitled Note");
    if (!name) return;

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
      router.push(`/notes/${response.data.id}`);
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
      await api.delete(`/api/notes/${noteId}`);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      if (currentNoteId === noteId) {
        router.push("/notes");
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleSignOut();
        return;
      }
      console.error("Error deleting note:", error);
    }
  };

  const handleRename = async (noteId: string) => {
    if (!tempName.trim()) return;
    setIsRenaming(false);
    setRenamingNoteId(null);

    const updatedNote = notes.find(n => n.id === noteId);
    if (!updatedNote) return;

    const newNote = { ...updatedNote, name: tempName };
    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? newNote : note))
    );

    try {
      await api.put(`/api/notes/${noteId}`, newNote);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleSignOut();
        return;
      }
      console.error("Error renaming note:", error);
    }
  };

  const startRenaming = (note: Note) => {
    setTempName(note.name);
    setIsRenaming(true);
    setRenamingNoteId(note.id);
  };

  return (
    <main className="flex-1 w-full flex overflow-hidden">
      {/* Background layer */}

      <IdeaSidebar
        notes={notes}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        currentNoteId={currentNoteId || null}
        selectedSection={selectedSection}
        expandedNotes={expandedNotes}
        setExpandedNotes={setExpandedNotes}
        createNewNote={createNewNote}
        deleteNote={deleteNote}
        handleRename={handleRename}
        isRenaming={isRenaming}
        renamingNoteId={renamingNoteId}
        tempName={tempName}
        setTempName={setTempName}
        startRenaming={startRenaming}
      />

      {/* Main content */}
      {children}
    </main>
  );
}
