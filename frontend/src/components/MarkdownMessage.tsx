import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { ComponentProps } from "react";

interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
}

type CodeProps = ComponentProps<"code"> & {
  inline?: boolean;
};

export default function MarkdownMessage({
  content,
  isUser = false,
}: MarkdownMessageProps) {
  // Convert single newlines to <br/> tags while preserving markdown
  const processedContent = content
    .split("\n")
    .map((line) => line.trim())
    .join("  \n");

  return (
    <div
      className={`prose prose-sm max-w-none ${
        isUser
          ? "prose-invert marker:text-white"
          : "prose-zinc marker:text-zinc-500"
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Override default styling for certain elements
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 whitespace-pre-line">{children}</p>
          ),
          ul: ({ children }) => <ul className="mb-2 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 last:mb-0">{children}</ol>,
          pre: ({ children }) => (
            <pre className="rounded-md p-4 bg-zinc-800 overflow-auto mb-2 last:mb-0">
              {children}
            </pre>
          ),
          code: ({ inline, className, children, ...props }: CodeProps) => {
            if (inline) {
              return (
                <code
                  className={`${
                    isUser ? "bg-zinc-700" : "bg-zinc-200"
                  } rounded px-1 py-0.5`}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
