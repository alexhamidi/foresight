"use client";

import { useState, useEffect, use } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../utils/supabase/client";
import { isAxiosError } from "axios";
import { Idea, Message, SearchFilters } from "@/interfaces";
import IdeaContent from "@/components/ideas/IdeaContent";
import IdeaChat from "@/components/ideas/IdeaChat";

const supabase = createClient();

type PageParams = {
  params: Promise<{ id: string }>;
};

export default function IdeaPage({ params }: PageParams) {
  const { id } = use(params);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [isChatbarOpen, setIsChatbarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'idea' | 'customers' | 'competitors'>('idea');
  const router = useRouter();

  // Fetch idea on component mount
  useEffect(() => {
    getIdea();
  }, [id]);

  // Listen for section changes
  useEffect(() => {
    const handleSectionChange = (event: CustomEvent<{ section: 'idea' | 'customers' | 'competitors', ideaId: string }>) => {
      if (event.detail.ideaId === id) {
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
    if (!idea) return;

    const timeoutId = setTimeout(() => {
      saveIdea(idea);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [idea?.content, idea?.customers, idea?.competitors]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsLoading(false);
    router.push("/sign-in");
  };

  const handleNoAccess = () => {
    console.log("No access to this idea");
    setIsLoading(false);
    router.push("/ideas");
  };

  const getIdea = async () => {
    try {
      const response = await api.get(`/api/ideas/${id}`);
      setIdea(response.data.idea);
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
        router.push("/ideas");
        console.log("Idea not found");
        return;
      }
      console.error("Error fetching idea:", error);
      setIsLoading(false);
      router.push("/ideas");
    }
  };

  const saveIdea = async (ideaToSave: Idea) => {
    try {
      console.log(ideaToSave);
      await api.put(`/api/ideas/${ideaToSave.id}`, ideaToSave);
    } catch (error) {
      console.error("Error saving idea:", error);
    }
  };

  const handleContentChange = (value: string) => {
    setIdea((prev) => {
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
    if (idea) {
      const content = getCurrentContent();
      const fileName = selectedSection !== 'idea' ? `${idea.name}_${selectedSection}` : idea.name;
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
    if (idea) {
      const content = getCurrentContent();
      const fileName = selectedSection !== 'idea' ? `${idea.name}_${selectedSection}` : idea.name;
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

  const handleApplyEdits = (edits: { start_line: number, end_line: number, updated_text: string }[]) => {
    if (!idea) return;
    console.log(edits);

    // Get the current content based on selected section
    let content = getCurrentContent();
    if (!content) content = ''; // Initialize empty content instead of returning

    // Split content into lines, ensuring at least one empty line exists
    let lines = content ? content.split('\n') : [''];

    // Sort edits by line number in descending order to avoid offset issues
    const sortedEdits = edits.sort((a, b) => b.start_line - a.start_line);

    // Apply each edit
    for (const { start_line, end_line, updated_text } of sortedEdits) {
      // Ensure we have enough lines to reach the target line
      while (lines.length <= end_line) {
        lines.push('');
      }

      // Handle line numbers starting from 0
      const startIndex = Math.max(0, start_line);
      const endIndex = Math.min(lines.length - 1, end_line);

      // Replace the lines with the updated text
      lines.splice(startIndex, endIndex - startIndex + 1, updated_text);
    }

    // Join the lines back together and trim any trailing empty lines
    const updatedContent = lines.join('\n').replace(/\n+$/, '');

    // Update the appropriate section in the idea
    setIdea(prev => {
      if (!prev) return null;
      if (selectedSection === 'customers') {
        return { ...prev, customers: updatedContent };
      } else if (selectedSection === 'competitors') {
        return { ...prev, competitors: updatedContent };
      } else {
        return { ...prev, content: updatedContent };
      }
    });
  };

  // interface Edit {
  //     start_line: number;
  //     end_line: number;
  //     updated_text: string;
  // }

  interface ChatRequestParams {
    prompt: string;
    idea_name: string;
    idea_content: string;
    idea_id: string;
    chat_context: Message[];
    chat_mode: 'normal' | 'search' | 'ai search' | 'agent';
    editing_active: boolean;
    recency?: number;
    num_results?: number;
    valid_sources?: string[];
  }

  const handleChatSubmit = async (e: React.FormEvent, chatMode: 'normal' | 'search' | 'ai search'| 'agent', editingActive: boolean, filters: SearchFilters) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading || !idea) return;
    const prevInput = input;
    setInput("");

    const userMessage: Message = { role: "user", content: input.trim() };
    setIdea((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        chats: [...prev.chats, userMessage],
      };
    });
    setIsChatLoading(true);

    const chatContext = idea.chats.slice(-6);

    const params: ChatRequestParams = {
      prompt: userMessage.content,
      idea_name: idea.name,
      idea_content: idea.content,
      idea_id: idea.id,
      chat_context: chatContext,
      chat_mode: chatMode,
      editing_active: editingActive,
    }

    if (chatMode === "search") {
      params["recency"] = filters.daysAgo;
      params["num_results"] = filters.resultsPerSource;
      params["valid_sources"] = filters.selectedSources;
    }

    console.log(params);

    try {
      console.log(editingActive);
      const response = await api.post(`/api/chat`, params);

      console.log(response.data);

      const aiMessage: Message = {
        role: "assistant",
        content: response.data.message,
        items: response.data.items || [],
      };

      setIdea((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          chats: [...prev.chats, aiMessage],
        };
      });
      if (response.data.edits) {
        handleApplyEdits(response.data.edits);
      }
      setIsChatLoading(false);

    } catch (error) {
      setIdea((prev) => {
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
    if (!idea) return '';
    if (selectedSection === 'customers') {
      return idea.customers;
    } else if (selectedSection === 'competitors') {
      return idea.competitors;
    } else {
      return idea.content;
    }
  };

  const handleClearChat = async(idea_id: string) => {
    const prevIdea = idea;
    try {
      setIdea((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          chats: [],
        };
      });
      const response = await api.delete(`/api/chat/${idea_id}`);

    } catch (error) {
      setIdea(prevIdea);
      console.error("Error clearing chat:", error);
    }
  };

  return (
    <>
      <IdeaContent
        idea={idea}
        isLoading={isLoading}
        selectedSection={selectedSection}
        handleContentChange={handleContentChange}
        handleCopy={handleCopy}
        handleDownload={handleDownload}
        handleShare={handleShare}
      />
      <IdeaChat
        idea={idea}
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
