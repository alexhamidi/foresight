import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Trash, Pencil, Lightbulb } from "lucide-react";
import { Idea } from "@/interfaces";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import IdeaSectionNav from "./IdeaSectionNav";

interface IdeaSidebarProps {
  ideas: Idea[];
  isSidebarOpen: boolean;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  currentIdeaId: string | null;
  selectedSection: string | null;
  expandedIdeas: { [key: string]: boolean };
  setExpandedIdeas: Dispatch<SetStateAction<{ [key: string]: boolean }>>;
  createNewIdea: () => void;
  deleteIdea: (ideaId: string) => void;
  handleRename: (ideaId: string) => void;
  isRenaming: boolean;
  renamingIdeaId: string | null;
  tempName: string;
  setTempName: Dispatch<SetStateAction<string>>;
  startRenaming: (idea: Idea) => void;
}

export default function IdeaSidebar({
  ideas,
  isSidebarOpen,
  setIsSidebarOpen,
  currentIdeaId,
  selectedSection,
  expandedIdeas,
  setExpandedIdeas,
  createNewIdea,
  deleteIdea,
  handleRename,
  isRenaming,
  renamingIdeaId,
  tempName,
  setTempName,
  startRenaming,
}: IdeaSidebarProps) {
  const router = useRouter();

  const handleIdeaClick = (ideaId: string) => {
    router.push(`/ideas/${ideaId}`);
    const event = new CustomEvent('sectionChange', {
      detail: { section: 'idea', ideaId }
    });
    window.dispatchEvent(event);
  };

  return (
    <>
      <div
        className={`relative z-10 bg-white/30 border-t border-r border-zinc-300 backdrop-blur-xs transition-all duration-300 ${
          !isSidebarOpen ? "w-0" : `w-64 ${currentIdeaId === "ideas" ? "rounded-tr-xl" : ""}`
        }`}
      >
        {isSidebarOpen && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mx-4 my-2">
              <h2 className="text-lg font-semibold">Ideas</h2>
              <Button
                onClick={createNewIdea}
                size="icon"
                variant="ghost"
                className="hover:bg-transparent text-zinc-500 hover:text-zinc-900"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto border-t">
              {ideas.map((idea) => (
                <div key={idea.id}>
                  <div
                    className={`flex items-center justify-between px-3 py-2 m-1 hover:bg-zinc-300/40 text-sm rounded-lg cursor-pointer`}
                    onClick={(e) => {
                      e.preventDefault();
                      setExpandedIdeas((prev) => {
                        const newState: Record<string, boolean> = {};
                        Object.keys(prev).forEach(
                          (key) => (newState[key] = false)
                        );
                        newState[idea.id] = !prev[idea.id];
                        return newState;
                      });
                    }}
                  >
                    {isRenaming && renamingIdeaId === idea.id ? (
                      <input
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={() => handleRename(idea.id)}
                        onKeyDown={(e) => e.key === "Enter" && handleRename(idea.id)}
                        className="pl-5 bg-transparent border-none shadow-none outline-none"
                        autoFocus
                        onClick={(e) => e.preventDefault()}
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <Lightbulb className="h-4 w-4 opacity-60" />
                          <span className="truncate">{idea.name}</span>
                        </div>

                        <div className="flex">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              startRenaming(idea);
                            }}
                            className="opacity-60 pr-1 hover:opacity-100 hover:bg-transparent"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteIdea(idea.id);
                            }}
                            className="opacity-60 px-2 hover:opacity-100 hover:bg-transparent pr-0"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                          <ChevronRight
                            className={`h-4 w-4 transform transition-transform opacity-60 duration-300 ${
                              expandedIdeas[idea.id] ? "rotate-90" : ""
                            }`}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: expandedIdeas[idea.id] ? '1fr' : '0fr' }}>
                    <div className="overflow-hidden">
                      <IdeaSectionNav
                        ideaId={idea.id}
                        currentIdeaId={currentIdeaId}
                        selectedSection={selectedSection}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toggle sidebar button */}
      <Button
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        size="icon"
        variant="ghost"
        className="fixed left-0 top-1/2 transform -translate-y-1/2 z-20"
      >
        {isSidebarOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </>
  );
}
