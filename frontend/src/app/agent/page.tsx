"use client";

import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { useState } from "react";
import { Item } from "@/interfaces";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SearchResults from "@/components/search/SearchResults";
import axios from "axios";

export default function AgentPage() {
  const [prompt, setPrompt] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setItems(null);

    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/agent`, {
        params: { prompt }
      });
      setResult(response.data.result);
    //   setItems(response.data.items);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.message : "An error occurred");
      setItems(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="h-[calc(100vh-50px)]">
        <FeedbackButton />
        <div className="relative z-10 overflow-y-auto pt-[6vh]">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold pb-1">Browser Agent</h1>
              <p className="text-lg text-gray-600 mb-8">
                Let AI find the most relevant projects for you.
              </p>
            </div>

            <div className="space-y-6">
              <Card className="w-full border border-zinc-300">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <Input
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe what you're looking for..."
                            className="pl-12 pr-24 py-6 text-lg bg-zinc-50 border-zinc-200 hover:border-zinc-300 focus:border-zinc-900 transition-colors"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-900 hover:bg-zinc-800 transition-colors px-6"
                          disabled={!prompt.trim() || isLoading}
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          ) : (
                            "Search"
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="">
                {/* {!isLoading && items && (
                  <SearchResults
                    items={items}
                    error={error}
                    isLoading={false}
                  />
                )} */}
                {!isLoading && result && (<div className="text-lg">{result}</div>)}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
