"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { emailTemplates } from "@/constants/emailtemplates";
import { MessageSquare, Copy, RefreshCw, Check } from "lucide-react";
import { formatSourceName } from '@/utils/formatters';
import { useToast } from "@/hooks/use-toast";

interface MessageBoxProps {
  title: string;
  authorName: string;
  source: string;
}

export default function MessageBox({ title, authorName, source }: MessageBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(
    Math.floor(Math.random() * emailTemplates.length)
  );

  const currentTemplate = emailTemplates[currentTemplateIndex];

  const getFormattedTemplate = () => {
    return currentTemplate
      .replace(/{{author_name}}/g, authorName.split(' ')[0])
      .replace(/{{title}}/g, title)
      .replace(/{{source}}/g, source.startsWith('r/') ? source : formatSourceName(source));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getFormattedTemplate());
      setIsCopied(true);
      toast({
        description: "Message copied to clipboard",
        duration: 2000,
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        variant: "destructive",
        description: "Failed to copy message",
      });
    }
  };

  const handleReroll = () => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * emailTemplates.length);
    } while (newIndex === currentTemplateIndex);
    setCurrentTemplateIndex(newIndex);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="hover:bg-transparent text-gray-500"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-zinc-50 border font-mono text-sm p-2 rounded-lg whitespace-pre-wrap">
              {getFormattedTemplate()}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReroll}>
                <RefreshCw className="h-4 w-4 " />
              </Button>
              <Button onClick={handleCopy}>
                {isCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
