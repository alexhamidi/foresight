import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Trash, Pencil, Lightbulb } from "lucide-react";
import { Note } from "@/app/interfaces";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

interface IdeaSidebarProps {
  notes: Note[];
  isSidebarOpen: boolean;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  currentNoteId: string | null;
  selectedSection: string | null;
  expandedNotes: { [key: string]: boolean };
  setExpandedNotes: Dispatch<SetStateAction<{ [key: string]: boolean }>>;
  createNewNote: () => void;
  deleteNote: (noteId: string) => void;
  handleRename: (noteId: string) => void;
  isRenaming: boolean;
  renamingNoteId: string | null;
  tempName: string;
  setTempName: Dispatch<SetStateAction<string>>;
  startRenaming: (note: Note) => void;
}

export default function IdeaSidebar({
  notes,
  isSidebarOpen,
  setIsSidebarOpen,
  currentNoteId,
  selectedSection,
  expandedNotes,
  setExpandedNotes,
  createNewNote,
  deleteNote,
  handleRename,
  isRenaming,
  renamingNoteId,
  tempName,
  setTempName,
  startRenaming,
}: IdeaSidebarProps) {
  const router = useRouter();

  return (
    <>
      <div
        className={`relative z-10 bg-white/30 border-t border-r border-zinc-300 backdrop-blur-xs transition-all duration-300 ${
          !isSidebarOpen ? "w-0" : `w-64 ${currentNoteId === "notes" ? "rounded-tr-xl" : ""}`
        }`}
      >
        {isSidebarOpen && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between m-4">
              <h2 className="text-lg font-semibold">Ideas</h2>
              <Button
                onClick={createNewNote}
                size="icon"
                variant="ghost"
                className="hover:bg-transparent text-zinc-500 hover:text-zinc-900"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id}>
                  <Link
                    href={`/notes/${note.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/notes/${note.id}`);

                      const event = new CustomEvent('sectionChange', {
                        detail: { section: 'idea', noteId: note.id }
                      });
                      window.dispatchEvent(event);
                    }}
                    className={`flex items-center justify-between px-3 py-1.5 m-1  hover:bg-zinc-200/60  text-sm rounded-lg cursor-pointer  ${
                      currentNoteId === note.id
                        ? ` mb-0 ${selectedSection === 'idea' ? 'font-bold mb-0' : ''}`
                        : ""
                    }`}
                  >
                    {isRenaming && renamingNoteId === note.id ? (
                      <input
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={() => handleRename(note.id)}
                        onKeyDown={(e) => e.key === "Enter" && handleRename(note.id)}
                        className="p-0 bg-transparent border-none shadow-none outline-none"
                        autoFocus
                        onClick={(e) => e.preventDefault()}
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <Lightbulb className="h-4 w-4 opacity-60" />
                          <span className="truncate">{note.name}</span>
                        </div>

                        <div className="flex">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              startRenaming(note);
                            }}
                            className="opacity-60 pr-1 hover:opacity-100 hover:bg-transparent"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteNote(note.id);
                            }}
                            className="opacity-60 px-2 hover:opacity-100 hover:bg-transparent pr-0"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpandedNotes((prev) => {
                                const newState: Record<string, boolean> = {};
                                Object.keys(prev).forEach(
                                  (key) => (newState[key] = false)
                                );
                                newState[note.id] = !prev[note.id];
                                return newState;
                              });
                            }}
                            className="opacity-60 px-2 hover:opacity-100 hover:bg-transparent"
                          >
                            <ChevronRight
                              className={`h-4 w-4 transform transition-transform ${
                                expandedNotes[note.id] ? "rotate-90" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </>
                    )}
                  </Link>
                  {expandedNotes[note.id] && (
                    <div className="text-sm m-1 mt-0 ">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/notes/${note.id}`);
                          const event = new CustomEvent('sectionChange', {
                            detail: { section: 'customers', noteId: note.id }
                          });
                          window.dispatchEvent(event);
                        }}
                        className={`flex items-center pr-3 pl-8 py-1.5  w-full text-left rounded-lg cursor-pointer hover:bg-zinc-200/60 ${
                          currentNoteId === note.id && selectedSection === 'customers'
                            ? "font-bold"
                            : ""
                        }`}
                      >
                        customers
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/notes/${note.id}`);
                          const event = new CustomEvent('sectionChange', {
                            detail: { section: 'competitors', noteId: note.id }
                          });
                          window.dispatchEvent(event);
                        }}
                        className={`flex items-center pr-3 pl-8  py-1.5 w-full text-left rounded-lg cursor-pointer hover:bg-zinc-200/60 ${
                          currentNoteId === note.id && selectedSection === 'competitors'
                            ? "font-bold"
                            : ""
                        }`}
                      >
                        competitors
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/notes/${note.id}`);
                          const event = new CustomEvent('sectionChange', {
                            detail: { section: 'diagram', noteId: note.id }
                          });
                          window.dispatchEvent(event);
                        }}
                        className={`flex items-center pr-3 pl-8  py-1.5 w-full text-left rounded-lg cursor-pointer hover:bg-zinc-200/60 ${
                          currentNoteId === note.id && selectedSection === 'diagram'
                            ? "font-bold"
                            : ""
                        }`}
                      >
                        diagram
                      </button>
                    </div>
                  )}
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
