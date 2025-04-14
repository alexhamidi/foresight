"use client";

import { useState, useEffect, useRef } from "react";
import DynamicGrid from "@/components/background/DynamicGrid";
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
import { Idea } from "@/interfaces";

const supabase = createClient();

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatbarOpen, setIsChatbarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState("");
  const [input, setInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch ideas on component mount
  useEffect(() => {
    getIdeas();
  }, []);

  // Auto-save functionality with debounce
  useEffect(() => {
    if (!selectedIdea) return;

    const timeoutId = setTimeout(() => {
      saveIdea(selectedIdea);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [selectedIdea?.content]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedIdea?.chats]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsLoading(false);
    router.push("/sign-in");
  };

  const getIdeas = async () => {
    try {
      const response = await api.get("/api/ideas");
      console.log(response.data);
      setIdeas(response.data.ideas);
      setIsLoading(false);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleSignOut();
        return;
      }
      console.error("Error fetching ideas:", error);
      setIsLoading(false);
    }
  };

  const saveIdea = async (idea: Idea) => {
    try {
      await api.put(`/api/ideas/${idea.id}`, idea);
    } catch (error) {
      console.error("Error saving idea:", error);
    }
  };

  const createNewIdea = async () => {
    const name = prompt("Enter idea name:", "Untitled Idea");
    if (!name) return; // If user cancels, don't create idea

    const newIdea: Idea = {
      id: uuidv4(),
      name: name,
      content: "",
      created_at: new Date().toISOString(),
      chats: [],
      customers: "",
      competitors: ""
    };
    try {
      const response = await api.post("/api/ideas", newIdea);

      setIdeas((prev) => [...prev, response.data]);
      setSelectedIdea(response.data);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleSignOut();
        return;
      }
      console.error("Error creating idea:", error);
    }
  };

  const deleteIdea = async (ideaId: string) => {
    try {
      const response = await api.delete(`/api/ideas/${ideaId}`);

      setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
      if (selectedIdea?.id === ideaId) {
        setSelectedIdea(null);
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleSignOut();
        return;
      }
      console.error("Error deleting idea:", error);
    }
  };

  const handleRename = async () => {
    if (!selectedIdea || !tempName.trim()) return;
    setIsRenaming(false);
    const updatedIdea = { ...selectedIdea, name: tempName };
    setSelectedIdea(updatedIdea);
    setIdeas((prev) =>
      prev.map((idea) => (idea.id === selectedIdea.id ? updatedIdea : idea)),
    );
    try {
      await api.put(`/api/ideas/${selectedIdea.id}`, updatedIdea);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleSignOut();
        return;
      }
      console.error("Error renaming idea:", error);
    }
  };

  const startRenaming = () => {
    if (!selectedIdea) return;
    setTempName(selectedIdea.name);
    setIsRenaming(true);
  };

  return (
    <div className="relative flex-1 z-10">
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>Select a idea from the sidebar or create a new one</p>
        </div>
      </div>
    </div>
  );
}
