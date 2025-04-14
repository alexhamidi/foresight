import { Idea } from "@/interfaces";
import { Button } from "@/components/ui/button";
import { Copy, Download, Share, Eye, Edit2 } from "lucide-react";
import { useState } from "react";
import MarkdownMessage from "@/components/chat/MarkdownMessage";

interface IdeaSectionProps {
  idea: Idea | null;
  section: 'idea' | 'customers' | 'competitors' | 'diagram';
  content: string;
  onChange: (value: string) => void;
  handleCopy: () => void;
  handleDownload: () => void;
  handleShare: () => void;
}

export default function TextSection({ idea, section, content, onChange, handleCopy, handleDownload, handleShare }: IdeaSectionProps) {
  const [isPreview, setIsPreview] = useState(false);

  const getPlaceholder = () => {
    switch (section) {
      case 'customers':
        return "Write about your customers...";
      case 'competitors':
        return "Write about your competitors...";
      default:
        return "Start writing...";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {isPreview ? (
        <div className="flex-1 p-4 overflow-y-auto bg-white/30 border-t border-zinc-300 backdrop-blur-xs">
          <MarkdownMessage content={content} />
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="outline-0 resize-none bg-white/30 border-t border-zinc-300 backdrop-blur-xs w-full flex-1 p-4"
          placeholder={getPlaceholder()}
        />
      )}
      <div className="flex justify-start gap-2 p-2 bg-white/30 backdrop-blur-xs">
        <Button onClick={() => setIsPreview(!isPreview)} size="icon" variant="ghost">
          {isPreview ? <Edit2 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
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
  );
}
