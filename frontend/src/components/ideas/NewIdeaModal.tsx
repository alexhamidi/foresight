import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NewIdeaModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateIdea: (name: string) => void;
}

export default function NewIdeaModal({
  isOpen,
  onOpenChange,
  onCreateIdea,
}: NewIdeaModalProps) {
  const [ideaName, setIdeaName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaName.trim()) return;
    onCreateIdea(ideaName.trim());
    setIdeaName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Idea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="ideaName"
              value={ideaName}
              onChange={(e) => setIdeaName(e.target.value)}
              placeholder="Enter idea name..."
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full">
            Create Idea
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
