"use client";

import { Item } from "@/interfaces";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import LoadingResults from "@/components/search/LoadingResults";
import { ExternalLink, ArrowUpRight, User, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import MessageBox from "@/components/search/MessageBox";
import { formatSourceName, getYCombinatorDate } from "@/utils/formatters";
import { Button } from "@/components/ui/button";

type SortOption = "relevance" | "recency";

type ExpandedDescriptions = {
  [key: number]: boolean;
};

export default function SearchResults({
  items,
  isLoading,
  error,
}: {
  items: Item[] | null;
  isLoading: boolean;
  error: string | null;
}) {
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [expandedDescriptions, setExpandedDescriptions] = useState<ExpandedDescriptions>({});
  const [isExpanded, setIsExpanded] = useState(true);

  const sortedItems = useMemo(() => {
    if (!items) return null;

    return [...items].sort((a, b) => {
      if (sortBy === "recency") {
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      }
      // For relevance, higher similarity score should come first
      return (b.similarity || 0) - (a.similarity || 0);
    });
  }, [items, sortBy]);

  if (isLoading) {
    return <LoadingResults />;
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-100">
        <CardContent className="pt-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!sortedItems?.length) {
    return null;
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">Search Results</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-transparent"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          <Badge variant="secondary" className="text-sm">
            {sortedItems.length} results
          </Badge>
        </div>
        {isExpanded && (
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => setSortBy(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="recency">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {sortedItems.map((item, index) => (
            <Card key={index} className="overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-4 flex-1 min-w-0">
                    {(item.image_url && item.image_url !== "None") ||
                    item.source === "product_hunt" ? (
                      <div className="flex-shrink-0">
                        <img
                          src={
                            item.source === "product_hunt" &&
                            (!item.image_url || item.image_url === "None")
                              ? "https://cdn.freebiesupply.com/logos/large/2x/product-hunt-logo-png-transparent.png"
                              : item.image_url
                          }
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded-md bg-gray-50"
                        />
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <a
                          href={item.source_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                          <Badge variant="secondary" className="text-xs">
                            {item.source.startsWith("r/")
                              ? item.source
                              : formatSourceName(item.source)}
                          </Badge>
                        </a>
                        {item.created_at && (
                          <span className="text-xs text-gray-500">
                            {item.source !== "y_combinator"
                              ? formatDistanceToNow(new Date(item.created_at), {
                                  addSuffix: true,
                                })
                              : getYCombinatorDate(item.created_at)}
                          </span>
                        )}
                      </div>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-medium text-blue-600 hover:text-blue-700 truncate block"
                      >
                        {item.title}
                      </a>
                      <div className="mt-2">
                        <p
                          className={`text-gray-600 ${!expandedDescriptions[index] ? "line-clamp-2" : ""}`}
                        >
                          {item.description}
                        </p>
                        {item.description && item.description.length > 150 && (
                          <button
                            onClick={() =>
                              setExpandedDescriptions((prev) => ({
                                ...prev,
                                [index]: !prev[index],
                              }))
                            }
                            className="text-sm text-gray-500 hover:text-gray-700 mt-1"
                          >
                            {expandedDescriptions[index]
                              ? "Show less"
                              : "Show more"}
                          </button>
                        )}
                      </div>
                      {item.author_name && item.author_name !== "None" && (
                        <div className="flex items-center gap-2 mt-2 mb-1">
                          <User className="w-3 h-3 text-gray-400" />
                          {item.author_profile_url ? (
                            <a
                              href={item.author_profile_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-600 hover:text-gray-800"
                            >
                              {item.author_name}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-600">
                              {item.author_name}
                            </span>
                          )}
                          <div className="" />
                          <MessageBox
                            title={item.title}
                            authorName={item.author_name || ""}
                            source={item.source}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
