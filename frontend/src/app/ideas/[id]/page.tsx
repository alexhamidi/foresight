"use client";

import { useState, useEffect, use, useRef } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../utils/supabase/client";
import { isAxiosError } from "axios";
import { Idea, Message, SearchFilters } from "@/interfaces";
import IdeaContent, { IdeaContentRef } from "@/components/ideas/IdeaContent";
import IdeaChat, { IdeaChatRef } from "@/components/ideas/IdeaChat";

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
  const [selectedSection, setSelectedSection] = useState<'main' | 'customers' | 'competitors' | 'diagram'>('main');
  const router = useRouter();
  const contentRef = useRef<IdeaContentRef>(null);
  const chatRef = useRef<IdeaChatRef>(null);

  // Fetch idea on component mount
  useEffect(() => {
    getIdea();
  }, [id]);

  // Listen for section changes
  useEffect(() => {
    const handleSectionChange = (event: CustomEvent<{ section: 'main' | 'customers' | 'competitors' | 'diagram', ideaId: string }>) => {
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

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (!isChatbarOpen) {
          setIsChatbarOpen(true);
          setTimeout(() => chatRef.current?.focus(), 100);
        } else {
          const activeElement = document.activeElement;
          const isInChat = activeElement?.closest('form') !== null;

          if (isInChat) {
            contentRef.current?.focus();
          } else {
            chatRef.current?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatbarOpen]);

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
      switch (selectedSection) {
        case 'customers':
          return { ...prev, customers: value };
        case 'competitors':
          return { ...prev, competitors: value };
        case 'main':
          return { ...prev, content: value };
        default:
          return prev;
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
      const fileName = selectedSection !== 'main' ? `${idea.name}_${selectedSection}` : idea.name;
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
      const fileName = selectedSection !== 'main' ? `${idea.name}_${selectedSection}` : idea.name;
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
    chat_mode: 'normal' | 'search' | 'agent';
    editing_active: boolean;
    recency?: number;
    num_results?: number;
    valid_sources?: string[];
    selected_section?: 'main' | 'customers' | 'competitors' | 'diagram';
    section_content?: string;
  }

  const handleChatSubmit = async (e: React.FormEvent, chatMode: 'normal' | 'search' | 'agent', editingActive: boolean, filters: SearchFilters) => {
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
      selected_section: selectedSection,
      section_content: selectedSection === 'customers' ? idea.customers : selectedSection === 'competitors' ? idea.competitors : undefined,
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
      if (response.data.updated_content) {
        if (selectedSection === 'customers') {
          setIdea((prev) => {
            if (!prev) return null;
            return { ...prev, customers: response.data.updated_content };
          });
        } else if (selectedSection === 'competitors') {
          setIdea((prev) => {
            if (!prev) return null;
            return { ...prev, competitors: response.data.updated_content };
          });
        } else {
          setIdea((prev) => {
            if (!prev) return null;
            return { ...prev, content: response.data.updated_content };
          });
        }
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
    switch (selectedSection) {
      case 'customers':
        return idea.customers;
      case 'competitors':
        return idea.competitors;
      case 'main':
        return idea.content;
      default:
        return '';
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
        ref={contentRef}
        idea={idea}
        isLoading={isLoading}
        selectedSection={selectedSection}
        handleContentChange={handleContentChange}
        handleCopy={handleCopy}
        handleDownload={handleDownload}
        handleShare={handleShare}
      />
      <IdeaChat
        ref={chatRef}
        idea={idea}
        isLoading={isLoading}
        isChatbarOpen={isChatbarOpen}
        isChatLoading={isChatLoading}
        input={input}
        setInput={setInput}
        handleChatSubmit={handleChatSubmit}
        setIsChatbarOpen={setIsChatbarOpen}
        handleClearChat={handleClearChat}
        selectedSection={selectedSection}
      />
    </>
  );
}
