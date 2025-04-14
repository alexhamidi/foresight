import { Button } from "@/components/ui/button";
import { Copy, Download, Share } from "lucide-react";
import Image from "next/image";
import { Note } from "@/app/interfaces";

interface IdeaContentProps {
  note: Note | null;
  isLoading: boolean;
  selectedSection: 'idea' | 'customers' | 'competitors';
  handleContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleCopy: () => void;
  handleDownload: () => void;
  handleShare: () => void;
}

export default function IdeaContent({
  note,
  isLoading,
  selectedSection,
  handleContentChange,
  handleCopy,
  handleDownload,
  handleShare
}: IdeaContentProps) {
  const getCurrentContent = () => {
    if (!note) return '';
    if (selectedSection === 'customers') {
      return note.customers;
    } else if (selectedSection === 'competitors') {
      return note.competitors;
    } else {
      return note.content;
    }
  };

  const getPlaceholder = () => {
    if (selectedSection === 'customers') {
      return "Write about your customers...";
    } else if (selectedSection === 'competitors') {
      return "Write about your competitors...";
    } else {
      return "Start writing...";
    }
  };

  return (
    <div className="relative flex-1 z-10">
      {!isLoading ? (
        <div className="flex flex-col h-full">
          <textarea
            value={getCurrentContent()}
            onChange={handleContentChange}
            className="outline-0 resize-none bg-white/30 border-t border-zinc-300 backdrop-blur-xs w-full flex-1 p-4"
            placeholder={getPlaceholder()}
          />
          <div className="flex justify-start gap-2 p-2 bg-white/30 backdrop-blur-xs">
            <Button onClick={handleCopy} size="icon" variant="ghost">
              <Copy className="h-4 w-4" />
            </Button>
            <Button onClick={handleDownload} size="icon" variant="ghost">
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={handleShare} size="icon" variant="ghost">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
