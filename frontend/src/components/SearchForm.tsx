"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormEvent, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CategoriesModal from "./CategoriesModal";
import SearchSuggestions from "./SearchSuggestions";
import { SearchFilters } from "@/interfaces";

type SourceOption = 'reddit' | 'product_hunt' | 'y_combinator' | 'arxiv' | 'hacker_news';

interface SearchFormProps {
  onSearch: (query: string, sources: string[], filters: SearchFilters) => Promise<void>;
  isLoading: boolean;
}


const sourceOptions = [
  { value: 'reddit', label: 'Reddit' },
  { value: 'product_hunt', label: 'Product Hunt' },
  { value: 'y_combinator', label: 'Y Combinator' },
  { value: 'arxiv', label: 'Arxiv' },
  { value: 'hacker_news', label: 'Hacker News' },
] as const;

const resultCountOptions = [
  { value: '10', label: '10 results' },
  { value: '25', label: '25 results' },
  { value: '50', label: '50 results' },
  { value: '100', label: '100 results' },
] as const;

const dateRangeOptions = [
  { value: '1', label: 'Last 24 hours' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' },
  { value: '1825', label: 'Last 5 years' },
  { value: '20000', label: 'Any time' },
] as const;

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("s") || "");
  const [selectedSources, setSelectedSources] = useState<SourceOption[]>([]);
  const [arxivModalOpen, setArxivModalOpen] = useState(false);
  const [redditModalOpen, setRedditModalOpen] = useState(false);
  const [productHuntModalOpen, setProductHuntModalOpen] = useState(false);
  const [yCombinatorModalOpen, setYCombinatorModalOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    daysAgo: 20000,
    resultsPerSource: 25,
    arxivCategories: [],
    redditCategories: [],
    productHuntCategories: [],
    yCombinatorCategories: [],
  });

  const handleSourceChange = (source: SourceOption) => {
    setSelectedSources(prev => {
      if (prev.includes(source)) {
        setFilters(prevFilters => ({
          ...prevFilters,
          arxivCategories: source === 'arxiv' ? [] : prevFilters.arxivCategories,
          redditCategories: source === 'reddit' ? [] : prevFilters.redditCategories,
          productHuntCategories: source === 'product_hunt' ? [] : prevFilters.productHuntCategories,
          yCombinatorCategories: source === 'y_combinator' ? [] : prevFilters.yCombinatorCategories,
        }));
        return prev.filter(s => s !== source);
      } else {
        return [...prev, source];
      }
    });
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>, source: SourceOption) => {
    e.preventDefault();
    if (source === 'arxiv') {
      setArxivModalOpen(true);
    } else if (source === 'reddit') {
      setRedditModalOpen(true);
    } else if (source === 'product_hunt') {
      setProductHuntModalOpen(true);
    } else if (source === 'y_combinator') {
      setYCombinatorModalOpen(true);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim() || selectedSources.length === 0) return;
    await onSearch(searchValue, selectedSources, filters);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchValue(suggestion);
    if (selectedSources.length > 0) {
      onSearch(suggestion, selectedSources, filters);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full border border-zinc-300df">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    disabled={process.env.NEXT_PUBLIC_SEARCH_DISABLED === 'true'}
                    placeholder={process.env.NEXT_PUBLIC_SEARCH_DISABLED === 'true' ? "Backend is currently under maintenance... Check back tomorrow!" : "Search for projects..."}
                    className="pl-12 pr-24 py-6 text-lg bg-zinc-50 border-zinc-200 hover:border-zinc-300 focus:border-zinc-900 transition-colors"
                  />

                </div>
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-900 hover:bg-zinc-800 transition-colors px-6"
                  disabled={!searchValue.trim() || selectedSources.length === 0 || isLoading || process.env.NEXT_PUBLIC_SEARCH_DISABLED === 'true'}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {sourceOptions.map(({ value, label }) => (
                  <div key={value}
                    className={`group flex items-center transition-colors duration-0
                      ${selectedSources.includes(value)
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      } rounded-lg`}
                  >
                    <button
                      className="px-4 py-2 text-sm font-medium"
                      type="button"
                      onClick={() => handleSourceChange(value)}
                    >
                      {label}
                    </button>
                    {value !== "hacker_news" && (
                      <div className="pr-2 pl-1">
                        <button
                          className={`rounded-md p-1.5 transition-colors
                            ${selectedSources.includes(value)
                              ? 'hover:bg-zinc-800'
                              : 'hover:bg-zinc-200'
                            }`}
                          disabled={!selectedSources.includes(value)}
                          onClick={(e) => handleMenuOpen(e, value)}
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Select
                  value={filters.daysAgo.toString()}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, daysAgo: parseInt(value) }))}
                >
                  <SelectTrigger className="w-[180px] bg-zinc-50 border-zinc-200">
                    <SelectValue placeholder="Time range" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRangeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.resultsPerSource.toString()}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, resultsPerSource: parseInt(value) }))}
                >
                  <SelectTrigger className="w-[180px] bg-zinc-50 border-zinc-200">
                    <SelectValue placeholder="Results per source" />
                  </SelectTrigger>
                  <SelectContent>
                    {resultCountOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>

          <CategoriesModal
            type="arxiv"
            open={arxivModalOpen}
            onOpenChange={setArxivModalOpen}
            selectedCategories={filters.arxivCategories || []}
            onCategoriesChange={(categories) =>
              setFilters(prev => ({ ...prev, arxivCategories: categories }))
            }
          />

          <CategoriesModal
            type="reddit"
            open={redditModalOpen}
            onOpenChange={setRedditModalOpen}
            selectedCategories={filters.redditCategories || []}
            onCategoriesChange={(categories) =>
              setFilters(prev => ({ ...prev, redditCategories: categories }))
            }
          />

          <CategoriesModal
            type="product_hunt"
            open={productHuntModalOpen}
            onOpenChange={setProductHuntModalOpen}
            selectedCategories={filters.productHuntCategories || []}
            onCategoriesChange={(categories) =>
              setFilters(prev => ({ ...prev, productHuntCategories: categories }))
            }
          />

          <CategoriesModal
            type="y_combinator"
            open={yCombinatorModalOpen}
            onOpenChange={setYCombinatorModalOpen}
            selectedCategories={filters.yCombinatorCategories || []}
            onCategoriesChange={(categories) =>
              setFilters(prev => ({ ...prev, yCombinatorCategories: categories }))
            }
          />
        </CardContent>
      </Card>

      <SearchSuggestions onSuggestionClick={handleSuggestionClick} />
    </div>
  );
}
