export interface Idea {
    id: string;
    name: string;
    content: string;
    created_at: string;
    chats: Message[];
    customers: string;
    competitors: string;
  }

export interface Message {
  role: "user" | "assistant";
  content: string;
  items?: Item[]
}

export interface ChatRequest {
  prompt: string;
  idea: string;
  idea_id: string;
  chat_context: Message[];
  agent_mode: number;
}

export interface Item {
  link: string;
  title: string;
  description: string;
  source: string;
  source_link: string;
  image_url: string;
  created_at?: string;
  author_name: string;
  author_profile_url: string;
  similarity?: number;
}

export interface SearchFilters {
  daysAgo: number;
  resultsPerSource: number;
  selectedSources?: string[];
}
export interface SearchFiltersMain {
  daysAgo: number;
  resultsPerSource: number;
  selectedSources?: string[];
  arxivCategories?: string[];
  redditCategories?: string[];
  productHuntCategories?: string[];
  yCombinatorCategories?: string[];
}

export interface StreamMessage {
  type: string;
  message: string;
  items?: Item[];
}
