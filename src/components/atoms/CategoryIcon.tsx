import {
  Sparkles, Sofa, Shirt, Headphones, Palette, Flower2, Camera, Home, ChefHat, Gem, BookOpen, Dumbbell, Music, Scissors, Wrench, Laptop, Baby, Dog, Car, Leaf, Plane, Brush, GraduationCap, HeartPulse,
  type LucideIcon,
} from "lucide-react";

/** Curated icon set admins can choose from for categories (stored by name). */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Sparkles, Sofa, Shirt, Headphones, Palette, Flower2, Camera, Home, ChefHat, Gem, BookOpen, Dumbbell, Music, Scissors, Wrench, Laptop, Baby, Dog, Car, Leaf, Plane, Brush, GraduationCap, HeartPulse,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICONS[name] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
