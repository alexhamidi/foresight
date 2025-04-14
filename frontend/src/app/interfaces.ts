export interface Note {
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
}

export interface ChatRequest {
  prompt: string;
  idea: string;
  note_id: string;
  chat_context: Message[];
  agent_mode: number;
}
