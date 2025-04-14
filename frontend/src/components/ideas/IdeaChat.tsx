import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, X, ChevronRight, ArrowUp, MoreHorizontal } from "lucide-react";
import { Idea, Message, SearchFilters } from "@/interfaces";
import MarkdownMessage from "@/components/chat/MarkdownMessage";
import { useRef, Dispatch, SetStateAction, useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { LIMITS } from "@/constants/limits";
import { categories } from "@/constants/categories";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchResults from "@/components/search/SearchResults";
type ChatMode = 'normal' | 'search' | 'ai search' | 'agent';
type SourceOption = "reddit" | "product_hunt" | "y_combinator" | "arxiv" | "hacker_news";

interface UsageLimits {
  used_normal_chats: number;
  used_agent_chats: number;
  used_searches: number;
  payment_plan: string;
}

interface IdeaChatProps {
  idea: Idea | null;
  isLoading: boolean;
  isChatbarOpen: boolean;
  isChatLoading: boolean;
  input: string;
  setInput: (input: string) => void;
  handleChatSubmit: (e: React.FormEvent, chatMode: ChatMode, editingActive: boolean, filters: SearchFilters) => void;
  setIsChatbarOpen: Dispatch<SetStateAction<boolean>>;
  handleClearChat: (idea_id: string) => void;
}

const sourceOptions = [
  { value: "reddit", label: "Reddit" },
  { value: "product_hunt", label: "Product Hunt" },
  { value: "y_combinator", label: "Y Combinator" },
  { value: "arxiv", label: "arXiv" },
  { value: "hacker_news", label: "Hacker News" },
] as const;

const dateRangeOptions = [
  { value: "1", label: "Last 24 hours" },
  { value: "30", label: "Last 30 days" },
  { value: "365", label: "Last year" },
  { value: "20000", label: "Any time" },
] as const;

const resultCountOptions = [
  { value: "10", label: "10 results" },
  { value: "25", label: "25 results" },
  { value: "50", label: "50 results" },
  { value: "100", label: "100 results" },
] as const;

export default function IdeaChat({
  idea,
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
  const [editingActive, setEditingActive] = useState<boolean>(false);
  const [selectedSources, setSelectedSources] = useState<SourceOption[]>([]);
  const [showAtMentionDropdown, setShowAtMentionDropdown] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [atMentionOptions] = useState([
    { value: 'search', label: '@search' },
    { value: 'agent', label: '@agent' },
  ]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({
    daysAgo: 20000,
    resultsPerSource: 25,
    selectedSources: [],
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [idea?.chats, isChatLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showAtMentionDropdown) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedOptionIndex(prev => (prev + 1) % atMentionOptions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedOptionIndex(prev =>
            prev - 1 < 0 ? atMentionOptions.length - 1 : prev - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (showAtMentionDropdown) {
            handleAtMentionSelect(atMentionOptions[selectedOptionIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowAtMentionDropdown(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAtMentionDropdown, selectedOptionIndex, atMentionOptions]);

  useEffect(() => {
    if (showAtMentionDropdown) {
      setSelectedOptionIndex(0);
    }
  }, [showAtMentionDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAtMentionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleChatSubmit(e, chatMode, editingActive, filters);
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

  const handleSourceToggle = (source: SourceOption) => {
    setSelectedSources((prev) => {
      const newSources = prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source];

      // Update filters with new sources
      setFilters(prevFilters => ({
        ...prevFilters,
        selectedSources: newSources,
      }));

      return newSources;
    });
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const lastChar = text[text.length - 1];
    const lastAtIndex = text.lastIndexOf('@');

    // Show dropdown when @ is typed at the start or after a space
    if (lastChar === '@' && (text.length === 1 || text[text.length - 2] === ' ')) {
      setShowAtMentionDropdown(true);
      setSelectedOptionIndex(0);
    } else if (lastAtIndex !== -1) {
      // Keep dropdown open and filter options based on what's typed after @
      const query = text.slice(lastAtIndex + 1).toLowerCase();
      const filteredOptions = atMentionOptions.filter(option =>
        option.value.toLowerCase().startsWith(query)
      );

      if (filteredOptions.length > 0) {
        setShowAtMentionDropdown(true);
        setSelectedOptionIndex(0);
      } else {
        setShowAtMentionDropdown(false);
      }
    } else {
      setShowAtMentionDropdown(false);
    }

    // Handle backspace on special modes
    if (text.length < input.length && (chatMode !== 'normal')) {
      const currentPrefix = `@${chatMode}`
      if (input.startsWith(currentPrefix) && text.length <= currentPrefix.length) {
        setChatMode('normal');
        return;
      }
    }

    setInput(text);
  };

  const handleAtMentionSelect = (value: string) => {
    setChatMode(value as ChatMode);
    setInput('');
    setShowAtMentionDropdown(false);
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
                {idea?.chats.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-start" : "justify-start"
                    }`}
                  >
                    <div
                      className={`w-[100%] rounded-md mb-2 p-2 text-sm ${
                        message.role === "user"
                          ? "bg-purple-900/60 text-zinc-50"
                          : "bg-zinc-200/90 text-zinc-900"
                      }`}
                    >
                      <MarkdownMessage
                        content={message.content}
                        isUser={message.role === "user"}
                      />
                      {message.items && message.items.length > 0 && (
                        <SearchResults items={message.items} isLoading={false} error={null} />
                      )}
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
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="bg-transparent hover:bg-transparent m-0 mr-1"
                    >
                      <MoreHorizontal className="h-4 w-4 m-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={(e) => {
                      e.preventDefault();
                      handleClearChat(idea!.id);
                    }} className="cursor-pointer text-red-500 hover:text-red-600 ">
                      Clear Chat
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Editing Active</DropdownMenuLabel>
                    <div className="flex items-center space-x-2 px-2 py-1.5">
                      <Switch
                        id="editing-mode"
                        checked={editingActive}
                        onCheckedChange={(checked) => {
                          setEditingActive(checked);
                        }}
                      />
                      <label htmlFor="editing-mode" className="text-sm">
                        {editingActive ? "Yes" : "No"}
                      </label>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Chat Mode</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={chatMode} onValueChange={(value) => {
                      setChatMode(value as ChatMode);
                    }}>
                      <DropdownMenuRadioItem value="normal" className="flex justify-between" onSelect={(e) => e.preventDefault()}>
                        <span>Normal</span>
                        <span className="text-xs text-muted-foreground">{getRemainingUses('normal')}</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="search" className="flex justify-between" onSelect={(e) => e.preventDefault()}>
                        <span>Search</span>
                        <span className="text-xs text-muted-foreground">{getRemainingUses('search')}</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="ai search" className="flex justify-between" onSelect={(e) => e.preventDefault()}>
                        <span>AI Search</span>
                        <span className="text-xs text-muted-foreground">{getRemainingUses('ai search')}</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="agent" className="flex justify-between" onSelect={(e) => e.preventDefault()}>
                        <span>Agent</span>
                        <span className="text-xs text-muted-foreground">{getRemainingUses('agent')}</span>
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    {chatMode === 'search' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Search Settings</DropdownMenuLabel>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Sources</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
                            {sourceOptions.map((source) => (
                              <DropdownMenuCheckboxItem
                                key={source.value}
                                checked={selectedSources.includes(source.value as SourceOption)}
                                onCheckedChange={(checked) => {
                                  handleSourceToggle(source.value as SourceOption);
                                }}
                                onSelect={(e) => e.preventDefault()}
                              >
                                {source.label}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Time Range</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
                            <DropdownMenuRadioGroup
                              value={filters.daysAgo.toString()}
                              onValueChange={(value) => setFilters((prev: SearchFilters) => ({ ...prev, daysAgo: parseInt(value) }))}
                            >
                              {dateRangeOptions.map((option) => (
                                <DropdownMenuRadioItem
                                  key={option.value}
                                  value={option.value}
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  {option.label}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Results Per Source</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
                            <DropdownMenuRadioGroup
                              value={filters.resultsPerSource.toString()}
                              onValueChange={(value) => setFilters((prev: SearchFilters) => ({ ...prev, resultsPerSource: parseInt(value) }))}
                            >
                              {resultCountOptions.map((option) => (
                                <DropdownMenuRadioItem
                                  key={option.value}
                                  value={option.value}
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  {option.label}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="relative flex-1">
                  <div className="relative bg-transparent w-full">
                    {(chatMode === 'search' || chatMode === 'agent') && (
                        <div className="absolute flex items-center gap-0.5 left-[-55px] bottom-10 -translate-y-1/2 bg-blue-200/60 px-1.5 py-0.5 rounded-sm ">
                        <span className="text-blue-700 px-1.5 py-0.5 pb-1  text-sm font-medium"
                        >@{chatMode}</span>
                        <span className="cursor-pointer" onClick={() => setChatMode('normal')}><X width={12}/></span>
                      </div>
                    )}
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder=""
                      className={`bg-transparent border-none shadow-none py-6 px-3 rounded-xl`}
                    />
                  </div>
                  {showAtMentionDropdown && (
                    <div ref={dropdownRef} className="absolute left-0 bottom-full mb-1 w-48 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-50">
                      {atMentionOptions
                        .filter(option => {
                          const lastAtIndex = input.lastIndexOf('@');
                          if (lastAtIndex === -1) return true;
                          const query = input.slice(lastAtIndex + 1).toLowerCase();
                          return option.value.toLowerCase().startsWith(query);
                        })
                        .map((option, index) => (
                          <button
                            key={option.value}
                            onClick={() => handleAtMentionSelect(option.value)}
                            onMouseEnter={() => setSelectedOptionIndex(index)}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                              index === selectedOptionIndex
                                ? 'bg-zinc-100 text-zinc-900'
                                : 'hover:bg-zinc-50 text-zinc-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
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
