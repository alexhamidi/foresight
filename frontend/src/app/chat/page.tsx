"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp, ChevronRight, ChevronDown } from "lucide-react";
import DynamicGrid from "@/components/background/DynamicGrid";
import Link from "next/link";
import ChatHistoryOverlay from "@/app/components/ChatHistoryOverlay";
import axios from "axios";
import MarkdownMessage from "@/components/chat/MarkdownMessage";
import { Item } from "@/interfaces";
import { v4 as uuidv4 } from "uuid";

interface Message {
  role: "user" | "assistant";
  content: string;
  items: Item[] | null;
  isSourcesExpanded?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

const MAX_FREE_MESSAGES = 15;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState<string>("");
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: currentChat,
      title: "AI-Generated Forms Project",
      lastMessage: "Who are my competitors?",
      timestamp: new Date(),
      messageCount: 0,
    },
    {
      id: uuidv4(),
      title: "Machine Learning Models",
      lastMessage: "What's the best approach for...",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      messageCount: 0,
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper function to get current chat session
  const getCurrentChatSession = () =>
    chatSessions.find((chat) => chat.id === currentChat);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "h" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsHistoryOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentChatSession = getCurrentChatSession();
    if (
      !currentChatSession ||
      currentChatSession.messageCount >= MAX_FREE_MESSAGES
    ) {
      alert(
        "You've reached the limit of 15 free messages. Please upgrade for unlimited messages.",
      );
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      items: null,
    };

    // If this is the first message, create a new chat with the first 10 characters as title
    if (messages.length === 0) {
      const newTitle =
        input.trim().slice(0, 20) + (input.trim().length > 20 ? "..." : "");
      const newChatId = uuidv4();
      const newChat: ChatSession = {
        id: newChatId,
        title: newTitle,
        lastMessage: input.trim(),
        timestamp: new Date(),
        messageCount: 0,
      };
      setChatSessions((prev) => [newChat, ...prev]);
      setCurrentChat(newChatId);
    }

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Update message count
    setChatSessions((prev) =>
      prev.map((chat) =>
        chat.id === currentChat
          ? { ...chat, messageCount: chat.messageCount + 1 }
          : chat,
      ),
    );

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`,
        {
          message: userMessage,
        },
      );
      console.log(response.data);
      const aiMessage: Message = {
        role: "assistant",
        content: response.data.message,
        items: response.data.items,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
      return;
    }
  };

  const handleNewChat = (title: string) => {
    const newChatId = uuidv4();
    const newChat: ChatSession = {
      id: newChatId,
      title: title,
      lastMessage: "",
      timestamp: new Date(),
      messageCount: 0,
    };
    setChatSessions((prev) => [newChat, ...prev]);
    setCurrentChat(newChatId);
    setMessages([]);
  };

  const handleRename = (chatId: string, newTitle: string) => {
    setChatSessions((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat,
      ),
    );
  };

  const handleDelete = (chatId: string) => {
    setChatSessions((prev) => prev.filter((chat) => chat.id !== chatId));
    if (currentChat === chatId) {
      const remainingChats = chatSessions.filter((chat) => chat.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChat(remainingChats[0].id);
      } else {
        // Create a new default chat if no chats remain
        const newChatId = uuidv4();
        const defaultChat: ChatSession = {
          id: newChatId,
          title: "New Chat",
          lastMessage: "",
          timestamp: new Date(),
          messageCount: 0,
        };
        setChatSessions([defaultChat]);
        setCurrentChat(newChatId);
      }
    }
  };

  const handleSelectChat = (chat: ChatSession) => {
    setCurrentChat(chat.id);
    setIsHistoryOpen(false);
    setMessages([]);
  };

  // Get current chat for display
  const currentChatSession = getCurrentChatSession();

  return (
    <main className="min-h-screen flex flex-col w-full">
      <div className="fixed inset-0 w-full h-full z-0">
        <DynamicGrid />
      </div>

      {/* Title bar */}
      <div className="fixed top-2 left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-center rounded-lg px-4 py-2">
        <h1 className="text-lg font-medium text-zinc-900">
          {currentChatSession?.title}
        </h1>
        <Button
          onClick={() => setIsHistoryOpen(true)}
          variant="ghost"
          className="text-zinc-600 hover:bg-transparent hover:text-zinc-900"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-[2]"
          >
            <path
              d="M3 5L19 5"
              stroke="currentColor"
              strokeLinecap="square"
              strokeLinejoin="round"
            ></path>
            <path
              d="M3 12H7"
              stroke="currentColor"
              strokeLinecap="square"
              strokeLinejoin="round"
            ></path>
            <circle cx="16" cy="15" r="4" stroke="currentColor"></circle>
            <path
              d="M19 18L21 20"
              stroke="currentColor"
              strokeLinecap="square"
            ></path>
            <path
              d="M3 19H7"
              stroke="currentColor"
              strokeLinecap="square"
              strokeLinejoin="round"
            ></path>
          </svg>
        </Button>
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-screen pt-[72px]">
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto px-4 pb-[150px]">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-6 py-3 ${
                    message.role === "user"
                      ? "bg-zinc-800 text-white"
                      : "bg-zinc-100/90 text-zinc-900"
                  }`}
                >
                  <MarkdownMessage
                    content={message.content}
                    isUser={message.role === "user"}
                  />
                  {message.items && message.items.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          const newMessages = [...messages];
                          const messageIndex = newMessages.findIndex(
                            (m) => m === message,
                          );
                          if (messageIndex !== -1) {
                            newMessages[messageIndex] = {
                              ...message,
                              isSourcesExpanded: !message.isSourcesExpanded,
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
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
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

        {/* Fixed input bar */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 mx-auto w-[60%] mb-4 fixed bottom-0 left-0 right-0"
        >
          <div className="flex justify-between items-center px-2 text-sm text-zinc-500">
            <div className="inline-flex flex-col gap-2 p-2 bg-white/50 backdrop-blur-lg rounded-sm">
              <span>
                Free Messages Remaining: &nbsp;
                <span
                  className={`${(currentChatSession?.messageCount ?? 0) >= MAX_FREE_MESSAGES ? "text-red-500 font-medium" : ""} font-mono bg-zinc-100/90 px-2 py-1 rounded-full`}
                >
                  {MAX_FREE_MESSAGES - (currentChatSession?.messageCount ?? 0)}/
                  {MAX_FREE_MESSAGES}
                </span>
              </span>
              <span className="text-zinc-500">
                <Link
                  href="/pricing"
                  className="text-zinc-500 hover:text-zinc-700 underline"
                >
                  {" "}
                  Upgrade
                </Link>{" "}
                for unlimited messages
              </span>
            </div>
          </div>
          <div className="flex-1 bg-white/50 backdrop-blur-lg border-zinc-200 rounded-full items-center flex border border-zinc-200 p-1 ">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter questions about projects, products, or potential ideas"
              className="bg-transparent border-none shadow-none p-6 rounded-full"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-zinc-900 hover:bg-zinc-800 rounded-full m-0 py-6 ml-1"
            >
              <ArrowUp className="h-4 w-4 m-0 p-0" />
            </Button>
          </div>
        </form>
      </div>

      <ChatHistoryOverlay
        isOpen={isHistoryOpen}
        chatSessions={chatSessions}
        currentChat={currentChatSession ?? chatSessions[0]}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onRenameChat={handleRename}
        onDeleteChat={handleDelete}
        onClose={() => setIsHistoryOpen(false)}
      />
    </main>
  );
}
