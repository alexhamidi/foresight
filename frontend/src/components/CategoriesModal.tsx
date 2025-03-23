import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { categories, CategoryType } from "@/constants/categories";

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
    arxiv: 'Select arXiv Categories',
    reddit: 'Select Subreddits',
    product_hunt: 'Select Product Hunt Categories'
  };

  const currentCategories = categories[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle className="text-lg font-semibold">
          {titles[type]}
        </DialogTitle>
        <div className="grid gap-4">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-1">
              {currentCategories.map((category) => (
                <div
                  key={category.value}
                  className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 pl-2 rounded cursor-pointer"
                >
                  <Checkbox
                    id={category.value}
                    checked={selectedCategories.includes(category.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onCategoriesChange([...selectedCategories, category.value]);
                      } else {
                        onCategoriesChange(
                          selectedCategories.filter((c) => c !== category.value)
                        );
                      }
                    }}
                    className=""
                  />
                  <Label htmlFor={category.value} className="cursor-pointer py-2 flex-grow">
                    {type === 'arxiv' ? `${category.value} (${category.label})` : category.label}
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
