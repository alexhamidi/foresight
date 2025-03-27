import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SearchSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  "Bolt.new for deep learning",
  "Project to generate 3D logos",
  "AI-powered video editing tool",
  "Real-time language translation app",
  "Blockchain-based voting system",
  "AI music composition tool",
  "Sustainable energy monitoring"
];

const AUTO_ROTATE_INTERVAL = 2000;

export default function SearchSuggestions({ onSuggestionClick }: SearchSuggestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Create duplicated array for infinite scroll
  const duplicatedSuggestions = [...suggestions, ...suggestions];

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        showNext();
      }
    }, AUTO_ROTATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isPaused]);

  const showNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setCurrentIndex((prev) => {
      // When we reach the end of the first set, quickly reset to the beginning
      // of the duplicated set without animation
      if (prev === suggestions.length - 3) {
        setTimeout(() => {
          setIsAnimating(true);
          setCurrentIndex(0);
          // Use RAF to ensure the transition is disabled before re-enabling
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setIsAnimating(false);
            });
          });
        }, 300);
      }
      return prev + 1;
    });

    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className="relative w-full mt-6 px-12"
         onMouseEnter={() => setIsPaused(true)}
         onMouseLeave={() => setIsPaused(false)}>

      <div className="overflow-hidden">
        <div
          className={`flex gap-4 ${isAnimating ? 'transition-transform duration-300 ease-in-out' : ''}`}
          style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
        >
          {duplicatedSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion}-${index}`}
              onClick={() => onSuggestionClick(suggestion)}
              className="text-center flex-none w-[calc(33.333%-1rem)] px-4 py-3 text-sm text-zinc-600 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors text-left"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
