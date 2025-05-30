
import type { Category } from "@/lib/types";
import {
  Utensils,
  Car,
  Home,
  Zap,
  Gamepad2,
  Stethoscope,
  ShoppingBag,
  Landmark,
  Package,
  Briefcase,
  GraduationCap,
  Gift,
  HeartHandshake,
  Film,
  Plane,
  Users
} from "lucide-react";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "income", name: "Income", icon: Landmark, color: "hsl(var(--chart-1))" },
  { id: "food-dining", name: "Food & Dining", icon: Utensils, color: "hsl(var(--chart-2))" },
  { id: "transportation", name: "Transportation", icon: Car, color: "hsl(var(--chart-3))" },
  { id: "housing", name: "Housing", icon: Home, color: "hsl(var(--chart-4))" },
  { id: "utilities", name: "Utilities", icon: Zap, color: "hsl(var(--chart-5))" },
  { id: "entertainment", name: "Entertainment", icon: Gamepad2, color: "hsl(180, 70%, 50%)" },
  { id: "health-wellness", name: "Health & Wellness", icon: Stethoscope, color: "hsl(200, 70%, 50%)" },
  { id: "shopping", name: "Shopping", icon: ShoppingBag, color: "hsl(220, 70%, 50%)" },
  { id: "personal-care", name: "Personal Care", icon: HeartHandshake, color: "hsl(240, 70%, 50%)" },
  { id: "education", name: "Education", icon: GraduationCap, color: "hsl(260, 70%, 50%)" },
  { id: "gifts-donations", name: "Gifts & Donations", icon: Gift, color: "hsl(280, 70%, 50%)" },
  { id: "travel", name: "Travel", icon: Plane, color: "hsl(300, 70%, 50%)" },
  { id: "subscriptions", name: "Subscriptions", icon: Film, color: "hsl(320, 70%, 50%)" },
  { id: "business", name: "Business", icon: Briefcase, color: "hsl(340, 70%, 50%)" },
  { id: "other", name: "Other", icon: Package, color: "hsl(0, 0%, 70%)" },
];

export const APP_NAME = "ZEROBALANCE";

// For SidebarNav - not directly used here but illustrates icons are available
export const NavIcons = {
    UsersIcon: Users
};

