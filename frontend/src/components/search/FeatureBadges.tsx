import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Zap, Search, Globe } from "lucide-react";

const features = [
  {
    icon: Globe,
    label: "10,000+ Projects",
  },
  {
    icon: Zap,
    label: "Daily Updates",
  },
  {
    icon: Search,
    label: "Semantic Search",
  },
  {
    icon: CheckCircle,
    label: "Verified Sources",
  },
];

export default function FeatureBadges() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {features.map((feature, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="px-3 py-1.5 text-sm font-medium rounded-full border border-gray-300"
        >
          <feature.icon className={`w-4 h-4 mr-1.5`} />
          {feature.label}
        </Badge>
      ))}
    </div>
  );
}
