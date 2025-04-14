"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "../../../utils/supabase/client";
import { isAxiosError } from "axios";
import DynamicGrid from "@/components/background/DynamicGrid";
import { Idea } from "@/interfaces";
import IdeaSidebar from "@/components/ideas/IdeaSidebar";
import NewIdeaModal from "@/components/ideas/NewIdeaModal";

const supabase = createClient();

export default function IdeasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState("");
  const [renamingIdeaId, setRenamingIdeaId] = useState<string | null>(null);
  const [expandedIdeas, setExpandedIdeas] = useState<{[key: string]: boolean}>({});
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isNewIdeaModalOpen, setIsNewIdeaModalOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const currentIdeaId = pathname.split("/").pop();

  useEffect(() => {
    getIdeas();
  }, []);

  useEffect(() => {
    const handleSectionChange = (event: CustomEvent<{ section: string, ideaId: string }>) => {
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

  const getIdeas = async () => {
    try {
      const response = await api.get("/api/ideas");
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

  const createNewIdea = async () => {
    setIsNewIdeaModalOpen(true);
  };

  const handleCreateIdea = async (name: string) => {
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
      router.push(`/ideas/${response.data.id}`);
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
      await api.delete(`/api/ideas/${ideaId}`);
      setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
      if (currentIdeaId === ideaId) {
        router.push("/ideas");
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleSignOut();
        return;
      }
      console.error("Error deleting idea:", error);
    }
  };

  const handleRename = async (ideaId: string) => {
    if (!tempName.trim()) return;
    setIsRenaming(false);
    setRenamingIdeaId(null);

    const updatedIdea = ideas.find(n => n.id === ideaId);
    if (!updatedIdea) return;

    const newIdea = { ...updatedIdea, name: tempName };
    setIdeas((prev) =>
      prev.map((idea) => (idea.id === ideaId ? newIdea : idea))
    );

    try {
      await api.put(`/api/ideas/${ideaId}`, newIdea);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleSignOut();
        return;
      }
      console.error("Error renaming idea:", error);
    }
  };

  const startRenaming = (idea: Idea) => {
    setTempName(idea.name);
    setIsRenaming(true);
    setRenamingIdeaId(idea.id);
  };

  return (
    <main className="flex-1 w-full flex overflow-hidden">
      {/* Background layer */}

      <IdeaSidebar
        ideas={ideas}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        currentIdeaId={currentIdeaId || null}
        selectedSection={selectedSection}
        expandedIdeas={expandedIdeas}
        setExpandedIdeas={setExpandedIdeas}
        createNewIdea={createNewIdea}
        deleteIdea={deleteIdea}
        handleRename={handleRename}
        isRenaming={isRenaming}
        renamingIdeaId={renamingIdeaId}
        tempName={tempName}
        setTempName={setTempName}
        startRenaming={startRenaming}
      />

      {/* Main content */}
      {children}

      <NewIdeaModal
        isOpen={isNewIdeaModalOpen}
        onOpenChange={setIsNewIdeaModalOpen}
        onCreateIdea={handleCreateIdea}
      />
    </main>
  );
}
