import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { categories, CategoryType } from "@/constants/categories";
import { useRef, useState, MouseEvent as ReactMouseEvent } from "react";

interface CategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  type: CategoryType;
}

export default function CategoriesModal({
  open,
  onOpenChange,
  selectedCategories,
  onCategoriesChange,
  type,
}: CategoriesModalProps) {
  const titles = {
    arxiv: "Select arXiv Categories",
    reddit: "Select Subreddits",
    product_hunt: "Select Product Hunt Categories",
    y_combinator: "Select Y Combinator Categories",
  };

  const currentCategories = categories[type];
  const [lastCheckedIndex, setLastCheckedIndex] = useState<number | null>(null);

  const handleCheckboxChange = (
    index: number,
    checked: boolean,
    shiftKey: boolean,
  ) => {
    if (shiftKey && lastCheckedIndex !== null) {
      const start = Math.min(lastCheckedIndex, index);
      const end = Math.max(lastCheckedIndex, index);
      const newSelectedCategories = new Set(selectedCategories);

      for (let i = start; i <= end; i++) {
        if (checked) {
          newSelectedCategories.add(currentCategories[i].value);
        } else {
          newSelectedCategories.delete(currentCategories[i].value);
        }
      }

      onCategoriesChange(Array.from(newSelectedCategories));
    } else {
      if (checked) {
        onCategoriesChange([
          ...selectedCategories,
          currentCategories[index].value,
        ]);
      } else {
        onCategoriesChange(
          selectedCategories.filter(
            (c) => c !== currentCategories[index].value,
          ),
        );
      }
    }
    setLastCheckedIndex(index);
  };

  const handleClearAll = () => {
    onCategoriesChange([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] select-none">
        <div className="flex flex-col justify-center items-start ">
          <DialogTitle className="text-lg font-semibold">
            {titles[type]}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground p-0 hover:bg-transparent hover:text-foreground"
          >
            Clear All
          </Button>
        </div>
        <div className="grid gap-4">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-1">
              {currentCategories.map((category, index) => (
                <div
                  key={category.value}
                  className="flex items-center space-x-2 pl-2 rounded"
                >
                  <Checkbox
                    id={category.value}
                    checked={selectedCategories.includes(category.value)}
                    onCheckedChange={(checked) => {
                      handleCheckboxChange(
                        index,
                        checked as boolean,
                        (window.event as MouseEvent | undefined)?.shiftKey ??
                          false,
                      );
                    }}
                  />
                  <Label
                    htmlFor={category.value}
                    className="cursor-pointer py-2 flex-grow"
                  >
                    {type === "arxiv"
                      ? `${category.value} (${category.label})`
                      : category.label}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
