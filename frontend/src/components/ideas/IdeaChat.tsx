import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ArrowUp, MoreHorizontal } from "lucide-react";
import { Note, Message } from "@/app/interfaces";
import MarkdownMessage from "@/components/MarkdownMessage";
import { useRef, Dispatch, SetStateAction, useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { LIMITS } from "@/constants/limits";

type ChatMode = 'normal' | 'search' | 'agent';

interface UsageLimits {
  used_normal_chats: number;
  used_agent_chats: number;
  used_searches: number;
  payment_plan: string;
}

interface IdeaChatProps {
  note: Note | null;
  isLoading: boolean;
  isChatbarOpen: boolean;
  isChatLoading: boolean;
  input: string;
  setInput: (input: string) => void;
  handleChatSubmit: (e: React.FormEvent, chatMode: ChatMode) => void;
  setIsChatbarOpen: Dispatch<SetStateAction<boolean>>;
  handleClearChat: (note_id: string) => void;
}

export default function IdeaChat({
  note,
  isLoading,
  isChatbarOpen,
  isChatLoading,
  input,
  setInput,
  handleChatSubmit,
  setIsChatbarOpen,
  handleClearChat,
}: IdeaChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('normal');
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);

  useEffect(() => {
    const fetchUsageLimits = async () => {
      try {
        const response = await api.get('api/user/plan');
        setUsageLimits(response.data.plan_info);
      } catch (error) {
        console.error('Error fetching usage limits:', error);
      }
    };

    fetchUsageLimits();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleChatSubmit(e, chatMode);
  };

  const getRemainingUses = (mode: ChatMode) => {
    if (!usageLimits) return '...';
    const planLimits = LIMITS[usageLimits.payment_plan as keyof typeof LIMITS];

    switch (mode) {
      case 'normal':
        return `${planLimits.normal_chats - usageLimits.used_normal_chats} left`;
      case 'search':
        return `${planLimits.searches - usageLimits.used_searches} left`;
      case 'agent':
        return `${planLimits.agent_chats - usageLimits.used_agent_chats} left`;
    }
  };

  return (
    <>
      <div
        className={`relative z-10 bg-white/30  border-zinc-300 backdrop-blur-xs transition-all duration-300 flex flex-col h-[calc(100vh-50px)] ${
          isChatbarOpen ? "w-[500px] border-l border-t" : "w-0"
        }`}
      >
        {isChatbarOpen && !isLoading && (
          <>
            {/* Messages container */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className=" pb-4">
                {note?.chats.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-start" : "justify-start"
                    }`}
                  >
                    <div
                      className={`w-[100%] rounded-md mb-2 p-2 text-sm ${
                        message.role === "user"
                          ? "bg-emerald-100/50 text-zinc-900"
                          : "bg-zinc-200/90 text-zinc-900"
                      }`}
                    >
                      <MarkdownMessage
                        content={message.content}
                        isUser={message.role === "user"}
                      />
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex w-full justify-center items-center pt-4">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
                      </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat input */}
            <form onSubmit={handleSubmit} className="p-3 border-zinc-200">
              <div className="flex-1 bg-white/50 backdrop-blur-lg border-zinc-200 rounded-xl items-center flex border border-zinc-200 p-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="bg-transparent hover:bg-transparent m-0 mr-1"
                    >
                      <MoreHorizontal className="h-4 w-4 m-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={() => handleClearChat(note!.id)} className="cursor-pointer text-red-500 hover:text-red-600 ">
                      Clear Chat
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Chat Mode</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={chatMode} onValueChange={(value) => setChatMode(value as ChatMode)}>
                      <DropdownMenuRadioItem value="normal" className="flex justify-between">
                        <span>Normal</span>
                        <span className="text-xs text-muted-foreground">{getRemainingUses('normal')}</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="search" className="flex justify-between">
                        <span>Search</span>
                        <span className="text-xs text-muted-foreground">{getRemainingUses('search')}</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="agent" className="flex justify-between">
                        <span>Agent</span>
                        <span className="text-xs text-muted-foreground">{getRemainingUses('agent')}</span>
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
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
    </>
  );
}
