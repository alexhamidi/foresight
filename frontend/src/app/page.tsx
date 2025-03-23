"use client";

import FeatureBadges from "@/components/FeatureBadges";
import SearchForm from "@/components/SearchForm";
import SearchResults from "@/components/SearchResults";
import StreamingStatus from '@/components/StreamingStatus';
import { useState, useEffect, Suspense } from "react";
import { Item, StreamMessage, SearchFilters  } from "@/interfaces";
import DynamicGrid from "@/components/DynamicGrid";


export default function Home() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamMessages, setStreamMessages] = useState<StreamMessage[]>([]);



  const handleSearch = async (query: string, sources: string[], filters: SearchFilters) => {
    setIsLoading(true);
    setError(null);
    setItems(null);
    setStreamMessages([]);

    try {
      const params = {
        query,
        valid_sources: sources.join(','),
        recency: filters.daysAgo.toString(),
        num_results: filters.resultsPerSource.toString(),
        arxiv_categories: filters.arxivCategories?.join(',') || '',
        reddit_categories: filters.redditCategories?.join(',') || '',
        product_hunt_categories: filters.productHuntCategories?.join(',') || '',
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/search?${new URLSearchParams(params)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        // Process each line
        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5));

              setStreamMessages(prev => [...prev, data]);

              if (data.type === 'results') {
                setItems(data.items);
                setIsLoading(false);
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }

            } catch (parseError) {
              console.error('Error parsing stream data:', parseError);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setItems(null);
    } finally {
      // Only set loading to false if we haven't already done so
      setIsLoading(prev => {
        if (prev) console.log('Search completed or errored');
        return false;
      });
    }
  };

  return (
    <main className="min-h-screen">
      {/* Background layer */}
      <div className="fixed inset-0 w-full h-full z-0">
        <DynamicGrid />
      </div>

      {/* Content layer */}
      <div className="relative z-10 min-h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold pb-1">Foresight</h1>
            <p className="text-lg text-gray-600 mb-8">Search for projects, everywhere.</p>
            <FeatureBadges />
          </div>

          <div className="">
            <Suspense fallback={<div className="animate-pulse h-[200px] bg-zinc-100 rounded-lg"></div>}>
              <SearchForm onSearch={handleSearch} isLoading={isLoading} />
            </Suspense>

            <div className="">
              {streamMessages.length > 0 && (
                <StreamingStatus messages={streamMessages} />
              )}

              {!isLoading && items && <SearchResults items={items} error={error} isLoading={false} />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
