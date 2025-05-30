
import type { LucideIcon } from "lucide-react";

// Renamed User to Roommate to avoid conflict with Firebase User type
export interface Roommate { 
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color?: string; 
}

export interface Transaction {
  id: string;
  userId: string; // ID of the Roommate (from localStorage list) who made the transaction
  date: string; 
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string; 
  notes?: string;
}

export interface Budget {
  id:string;
  userId: string; // ID of the Roommate (from localStorage list) this budget belongs to
  categoryId: string; // Explicitly link budget to a category for spending tracking
  name: string; // User-defined name for the budget
  amount: number; 
  spent?: number; // Made optional: Calculated by components as needed
  period: "monthly" | "yearly"; 
  startDate: string; 
}

export interface AppData {
  users: Roommate[]; // Roommates
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
}

// No changes needed for Firebase User type here, it's imported directly from 'firebase/auth' where needed.

