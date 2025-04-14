import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface StreamingStatusProps {
  messages: string[];
}

export default function StreamingStatus({ messages }: StreamingStatusProps) {
  const [displayedMessages, setDisplayedMessages] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  // When collapsed, immediately show all messages
  useEffect(() => {
    if (isCollapsed) {
      setDisplayedMessages(messages);
      setCurrentMessageIndex(messages.length);
      setCurrentCharIndex(0);
    }
  }, [isCollapsed, messages]);

  useEffect(() => {
    if (!messages.length || currentMessageIndex >= messages.length) return;
    if (isCollapsed) return;

    const currentMessage = messages[currentMessageIndex];

    if (currentCharIndex >= currentMessage.length) {
      // Move to next message after a short delay
      const timer = setTimeout(() => {
        setCurrentMessageIndex((prev) => prev + 1);
        setCurrentCharIndex(0);
      }, 50);
      return () => clearTimeout(timer);
    }

    // Type out current message character by character
    const timer = setTimeout(() => {
      setDisplayedMessages((prev) => {
        const newMessages = [...prev];
        if (currentMessageIndex >= newMessages.length) {
          newMessages.push("");
        }
        newMessages[currentMessageIndex] = messages[currentMessageIndex].slice(
          0,
          currentCharIndex + 1,
        );
        return newMessages;
      });
      setCurrentCharIndex((prev) => prev + 1);
    }, 20);

    return () => clearTimeout(timer);
  }, [messages, currentMessageIndex, currentCharIndex, isCollapsed]);

  return (
    <div className="rounded-lg p-4 relative">
      <button
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="rounded-full transition-colors flex items-center mb-2"
      >
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
        <span className="ml-2">
          {messages.some((m) => m.includes("Found"))
            ? "Finished"
            : "Searching..."}
        </span>
      </button>

      {!isCollapsed && (
        <div className="space-y-2 transition-all duration-200 max-h-96 overflow-hidden">
          {displayedMessages.map((text, index) => (
            <p key={index} className="text-sm text-gray-600">
              {text}
              {!isCollapsed &&
                index === currentMessageIndex &&
                currentCharIndex < messages[currentMessageIndex]?.length && (
                  <span className="animate-pulse ml-0.5">▋</span>
                )}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
