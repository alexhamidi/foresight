import { useRouter } from "next/navigation";

interface IdeaSectionNavProps {
  ideaId: string;
  currentIdeaId: string | null;
  selectedSection: string | null;
}

export default function IdeaSectionNav({ ideaId, currentIdeaId, selectedSection }: IdeaSectionNavProps) {
  const router = useRouter();

  const sections = [
    { id: 'customers', label: 'customers' },
    { id: 'competitors', label: 'competitors' },
    { id: 'diagram', label: 'diagram' }
  ];

  const handleSectionClick = (sectionId: string) => {
    router.push(`/ideas/${ideaId}`);
    const event = new CustomEvent('sectionChange', {
      detail: { section: sectionId, ideaId }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="text-sm m-1 mt-0">
      {sections.map(section => (
        <button
          key={section.id}
          onClick={(e) => {
            e.preventDefault();
            handleSectionClick(section.id);
          }}
          className={`flex items-center pr-3 pl-8 py-2 w-full text-left rounded-lg cursor-pointer hover:bg-zinc-300/40 ${
            currentIdeaId === ideaId && selectedSection === section.id
              ? "font-bold"
              : ""
          }`}
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}
