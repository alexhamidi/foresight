import { Button } from "@/components/ui/button";
import { Copy, Download, Share } from "lucide-react";
import { Idea } from "@/interfaces";
import TextSection from "@/components/ideas/TextSection";
import DiagramSection from "@/components/ideas/DiagramSection";
interface IdeaContentProps {
  idea: Idea | null;
  isLoading: boolean;
  selectedSection: 'idea' | 'customers' | 'competitors' | 'diagram';
  handleContentChange: (e: string) => void;
  handleCopy: () => void;
  handleDownload: () => void;
  handleShare: () => void;
}

export default function IdeaContent({
  idea,
  isLoading,
  selectedSection,
  handleContentChange,
  handleCopy,
  handleDownload,
  handleShare
}: IdeaContentProps) {
  const getCurrentContent = () => {
    if (!idea) return '';
    switch (selectedSection) {
      case 'customers':
        return idea.customers;
      case 'competitors':
        return idea.competitors;
      default:
        return idea.content;
    }
  };

  return (
    <div className="relative flex-1 z-10">
      {!isLoading ? (
          selectedSection === "diagram" ? (
          <DiagramSection />
        ) : (
          <TextSection
            idea={idea}
            section={selectedSection}
            content={getCurrentContent()}
            onChange={handleContentChange}
            handleCopy={handleCopy}
            handleDownload={handleDownload}
            handleShare={handleShare}
            />
        )
      ) : (
        <div className="flex flex-col h-full">
          <div className="outline-0 text-gray-300 resize-none bg-white/30 border-t border-zinc-300 backdrop-blur-xs w-full flex-1 p-4">
            Loading...
          </div>
        </div>
      )}
    </div>
  );
}
