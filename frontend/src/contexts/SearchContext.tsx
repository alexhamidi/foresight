"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SearchContextType {
  statusMessages: string[];
  profilingMessage: string | null;
  filtersMessage: string | null;
  addStatusMessage: (message: string) => void;
  setProfilingMessage: (message: string) => void;
  setFiltersMessage: (message: string) => void;
  clearMessages: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [profilingMessage, setProfilingMessage] = useState<string | null>(null);
  const [filtersMessage, setFiltersMessage] = useState<string | null>(null);

  const addStatusMessage = (message: string) => {
    setStatusMessages(prev => [...prev, message]);
  };

  const clearMessages = () => {
    setStatusMessages([]);
    setProfilingMessage(null);
    setFiltersMessage(null);
  };

  return (
    <SearchContext.Provider value={{
      statusMessages,
      profilingMessage,
      filtersMessage,
      addStatusMessage,
      setProfilingMessage,
      setFiltersMessage,
      clearMessages
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
}
