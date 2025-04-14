"use client";

import { useState, useEffect, use } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../utils/supabase/client";
import { isAxiosError } from "axios";
import { Note, Message, ChatRequest } from "@/app/interfaces";
import IdeaContent from "@/components/ideas/IdeaContent";
import IdeaChat from "@/components/ideas/IdeaChat";

const supabase = createClient();

type PageParams = {
  params: Promise<{ id: string }>;
};

export default function NotePage({ params }: PageParams) {
  const { id } = use(params);
  const [note, setNote] = useState<Note | null>(null);
  const [isChatbarOpen, setIsChatbarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'idea' | 'customers' | 'competitors'>('idea');
  const router = useRouter();

  // Fetch note on component mount
  useEffect(() => {
    getNote();
  }, [id]);

  // Listen for section changes
  useEffect(() => {
    const handleSectionChange = (event: CustomEvent<{ section: 'idea' | 'customers' | 'competitors', noteId: string }>) => {
      if (event.detail.noteId === id) {
        setSelectedSection(event.detail.section);
      }
    };

    window.addEventListener('sectionChange', handleSectionChange as EventListener);
    return () => {
      window.removeEventListener('sectionChange', handleSectionChange as EventListener);
    };
  }, [id]);

  // Auto-save functionality with debounce
  useEffect(() => {
    if (!note) return;

    const timeoutId = setTimeout(() => {
      saveNote(note);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [note?.content, note?.customers, note?.competitors]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsLoading(false);
    router.push("/sign-in");
  };

  const handleNoAccess = () => {
    console.log("No access to this note");
    setIsLoading(false);
    router.push("/notes");
  };

  const getNote = async () => {
    try {
      const response = await api.get(`/api/notes/${id}`);
      setNote(response.data.note);
      setIsLoading(false);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        if (error.response?.data.detail === "Invalid authentication credentials") {
          handleSignOut();
          return;
        } else {
          handleNoAccess();
          return;
        }
      } else if (isAxiosError(error) && error.response?.status === 404) {
        router.push("/notes");
        console.log("Note not found");
        return;
      }
      console.error("Error fetching note:", error);
      setIsLoading(false);
      router.push("/notes");
    }
  };

  const saveNote = async (noteToSave: Note) => {
    try {
      console.log(noteToSave);
      await api.put(`/api/notes/${noteToSave.id}`, noteToSave);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setNote((prev) => {
      if (!prev) return null;
      if (selectedSection === 'customers') {
        return { ...prev, customers: value };
      } else if (selectedSection === 'competitors') {
        return { ...prev, competitors: value };
      } else {
        return { ...prev, content: value };
      }
    });
  };

  const handleCopy = () => {
    const content = getCurrentContent();
    if (content) {
      navigator.clipboard.writeText(content);
    }
  };

  const handleDownload = () => {
    if (note) {
      const content = getCurrentContent();
      const fileName = selectedSection !== 'idea' ? `${note.name}_${selectedSection}` : note.name;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleShare = () => {
    if (note) {
      const content = getCurrentContent();
      const fileName = selectedSection !== 'idea' ? `${note.name}_${selectedSection}` : note.name;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent, chatMode: 'normal' | 'search' | 'agent') => {
    e.preventDefault();
    if (!input.trim() || isChatLoading || !note) return;
    const prevInput = input;
    setInput("");

    const userMessage: Message = { role: "user", content: input.trim() };
    setNote((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        chats: [...prev.chats, userMessage],
      };
    });
    setIsChatLoading(true);

    try {
      const chatContext = note.chats.slice(-6);
      console.log(chatContext);

      const response = await api.post(`/api/chat`, {
        prompt: userMessage.content,
        idea: `TITLE: ${note.name} \n CONTENT: ${note.content}`,
        note_id: note.id,
        chat_context: chatContext,
        chat_mode: chatMode,
      });

      const aiMessage: Message = {
        role: "assistant",
        content: response.data.message,
      };

      setNote((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          chats: [...prev.chats, aiMessage],
        };
      });
      setIsChatLoading(false);
    } catch (error) {
      setNote((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          chats: prev.chats.slice(0, -1),
        };
      });
      console.error("Error in chat:", error);
      setInput(prevInput);
      setIsChatLoading(false);
    }
  };

  const getCurrentContent = () => {
    if (!note) return '';
    if (selectedSection === 'customers') {
      return note.customers;
    } else if (selectedSection === 'competitors') {
      return note.competitors;
    } else {
      return note.content;
    }
  };

  const handleClearChat = async(note_id: string) => {
    const prevNote = note;
    try {
      setNote((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          chats: [],
        };
      });
      const response = await api.delete(`/api/chat/${note_id}`);

    } catch (error) {
      setNote(prevNote);
      console.error("Error clearing chat:", error);
    }
  };

  return (
    <>
      <IdeaContent
        note={note}
        isLoading={isLoading}
        selectedSection={selectedSection}
        handleContentChange={handleContentChange}
        handleCopy={handleCopy}
        handleDownload={handleDownload}
        handleShare={handleShare}
      />
      <IdeaChat
        note={note}
        isLoading={isLoading}
        isChatbarOpen={isChatbarOpen}
        isChatLoading={isChatLoading}
        input={input}
        setInput={setInput}
        handleChatSubmit={handleChatSubmit}
        setIsChatbarOpen={setIsChatbarOpen}
        handleClearChat={handleClearChat}
      />
    </>
  );
}
