"use client";

import { signInAction, signInWithGoogleAction } from "@/app/actions";
import DynamicGrid from "@/components/DynamicGrid";
import { Suspense } from "react";
import SearchForm from "@/components/SearchForm";
import StreamingStatus from "@/components/StreamingStatus";
import SearchResults from "@/components/SearchResults";
import FeatureBadges from "@/components/FeatureBadges";
import { useState } from "react";
import { Item, SearchFilters } from "@/interfaces";
import { Message } from "@/components/ui/form-message";
import { FeedbackButton } from "@/components/FeedbackButton";

export default function Login(props: { searchParams: Message }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);

  const handleSearch = async (
    query: string,
    sources: string[],
    filters: SearchFilters,
  ) => {
    setIsLoading(true);
    setError(null);
    setItems(null);
    setStatusMessages([]);

    try {
      const params = {
        query,
        valid_sources: sources.join(","),
        recency: filters.daysAgo.toString(),
        num_results: filters.resultsPerSource.toString(),
        arxiv_categories: filters.arxivCategories?.join(",") || "",
        reddit_categories: filters.redditCategories?.join(",") || "",
        product_hunt_categories: filters.productHuntCategories?.join(",") || "",
        y_combinator_categories: filters.yCombinatorCategories?.join(",") || "",
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/search?${new URLSearchParams(params)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the chunk to text and add to buffer
        const chunk = new TextDecoder().decode(value);
        buffer += chunk;

        // Split buffer into lines and process complete ones
        const lines = buffer.split("\n");

        // Keep the last line in buffer if it's incomplete
        buffer = lines.pop() || "";

        // Process each complete line
        for (const line of lines) {
          if (line.trim() && line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(5).trim();
              const data = JSON.parse(jsonStr);

              if (data.type === "status") {
                setStatusMessages((prev) => [...prev, data.message]);
              } else if (data.type === "results") {
                setItems(data.items);
                console.log(data.items);
                setIsLoading(false);
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            } catch (parseError) {
              console.error("Error parsing stream data:", parseError);
              // Don't throw here - continue processing other messages
            }
          }
        }
      }

      // Process any remaining data in the buffer
      if (buffer.trim() && buffer.startsWith("data: ")) {
        try {
          const jsonStr = buffer.slice(5).trim();
          const data = JSON.parse(jsonStr);
          if (data.type === "status") {
            setStatusMessages((prev) => [...prev, data.message]);
          } else if (data.type === "results") {
            setItems(data.items);
            console.log(data.items);
            setIsLoading(false);
          }
        } catch (parseError) {
          console.error("Error parsing final buffer:", parseError);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setItems(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="h-[calc(100vh-50px)]">
        <FeedbackButton />
        {/* Background layer */}
        <div className="fixed inset-0 w-full h-full z-0">
          <DynamicGrid />
        </div>

        {/* Content layer */}
        <div className="relative z-10  overflow-y-auto pt-[6vh]">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold pb-1">Forsite</h1>
              <p className="text-lg text-gray-600 mb-8">
                Search for projects, everywhere.
              </p>
              <FeatureBadges />
            </div>

            <div className="">
              <Suspense
                fallback={
                  <div className="animate-pulse h-[200px] bg-zinc-100 rounded-lg"></div>
                }
              >
                <SearchForm onSearch={handleSearch} isLoading={isLoading} />
              </Suspense>

              <div className="">
                {statusMessages.length > 0 && (
                  <StreamingStatus messages={statusMessages} />
                )}

                {!isLoading && items && (
                  <SearchResults
                    items={items}
                    error={error}
                    isLoading={false}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
