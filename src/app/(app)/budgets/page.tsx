
"use client";

import { useState, useEffect, useMemo } from "react";
import { AddBudgetForm } from "@/components/budgets/add-budget-form";
import { BudgetList } from "@/components/budgets/budget-list";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import type { Budget } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import { MonthYearControls } from "@/components/ui/month-year-controls";


export default function BudgetsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all"); 
  const [selectedYear, setSelectedYear] = useState<number | "all">("all"); 


  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setEditingBudget(undefined);
      setIsFormOpen(true);
      // Clean the URL query parameter after opening the dialog
      const newPath = pathnameOnly(router.toString());
      router.replace(newPath, undefined);
    }
  }, [searchParams, router]);

  // Helper to get pathname without query string
  const pathnameOnly = (url: string) => {
    const urlObj = new URL(url, 'http://localhost'); // Base URL doesn't matter here
    return urlObj.pathname;
  }


  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setEditingBudget(undefined);
  };
  
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingBudget(undefined);
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Budgets</h2>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <MonthYearControls
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            allowAllMonths={true} 
            allowAllYears={true}  
            monthLabel="Show for Month"
            yearLabel="Show for Year"
          />
          <Button onClick={() => { setEditingBudget(undefined); setIsFormOpen(true); } }>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Budget
          </Button>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingBudget(undefined);
             // Also clear query param if dialog is closed manually
            if (searchParams.get("action") === "add") {
               const newPath = pathnameOnly(router.toString());
               router.replace(newPath, undefined);
            }
          }
        }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Edit Budget" : "Create New Budget"}</DialogTitle>
            <DialogDescription>
              {editingBudget ? "Update the details of your budget goal." : "Set up a new budget to track your spending."}
            </DialogDescription>
          </DialogHeader>
          <AddBudgetForm
            budgetToEdit={editingBudget}
            onFormSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      <BudgetList onEditBudget={handleEditBudget} selectedMonth={selectedMonth} selectedYear={selectedYear} />
    </div>
  );
}
