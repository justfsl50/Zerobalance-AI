
"use client";

import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Target, User as UserIcon } from "lucide-react";
import type { Budget as BudgetType } from "@/lib/types"; // Renamed to avoid conflict
import { format, parseISO, getYear, getMonth, isWithinInterval, addMonths, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { useMemo } from "react";

interface BudgetListProps {
  onEditBudget: (budget: BudgetType) => void;
  selectedMonth: number | "all";
  selectedYear: number | "all";
}

// Refined filter logic
function isBudgetActiveForFilter(
  budget: BudgetType,
  filterMonth: number | "all",
  filterYear: number | "all"
): boolean {
  const budgetStartDate = parseISO(budget.startDate);

  if (filterYear === "all") {
    if (filterMonth === "all") {
      return true; 
    }
    // Specific month, all years
    if (budget.period === "monthly") {
      return getMonth(budgetStartDate) === filterMonth;
    }
    if (budget.period === "yearly") {
      // For a yearly budget, if a specific month is chosen (across all years),
      // it's active if that month falls within its 12-month cycle.
      const budgetStartMonth = getMonth(budgetStartDate);
      const budgetEndMonth = getMonth(subDays(addMonths(budgetStartDate, 12),1));
      
      if (budgetStartMonth <= budgetEndMonth) { // e.g. Jan - Dec
        return filterMonth >= budgetStartMonth && filterMonth <= budgetEndMonth;
      } else { // e.g. Oct - Sep (spans across year end)
        return filterMonth >= budgetStartMonth || filterMonth <= budgetEndMonth;
      }
    }
  }

  // Specific year selected
  if (budget.period === "monthly") {
    if (filterMonth === "all") { 
      return getYear(budgetStartDate) === filterYear;
    }
    return getYear(budgetStartDate) === filterYear && getMonth(budgetStartDate) === filterMonth;
  }

  if (budget.period === "yearly") {
    const budgetActivePeriodStart = budgetStartDate;
    const budgetActivePeriodEnd = subDays(addMonths(budgetStartDate, 12), 1); 

    if (filterMonth === "all") { 
      const filterYearDateStart = startOfYear(new Date(filterYear as number, 0, 1));
      const filterYearDateEnd = endOfYear(new Date(filterYear as number, 11, 31));
      return budgetActivePeriodStart <= filterYearDateEnd && budgetActivePeriodEnd >= filterYearDateStart;
    }
    // Specific month and year for yearly budget
    const filterPeriodDateForCheck = startOfMonth(new Date(filterYear as number, filterMonth as number, 1));
    return isWithinInterval(filterPeriodDateForCheck, { start: budgetActivePeriodStart, end: budgetActivePeriodEnd });
  }
  return false;
}


export function BudgetList({ onEditBudget, selectedMonth, selectedYear }: BudgetListProps) {
  const { budgets: rawBudgets, deleteBudget, getUserById, getCategoryById, getBudgetSpentAmount } = useAppContext(); 

  const filteredBudgets = useMemo(() => {
    return rawBudgets.filter(budget => isBudgetActiveForFilter(budget, selectedMonth, selectedYear));
  }, [rawBudgets, selectedMonth, selectedYear]);


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };

  if (filteredBudgets.length === 0) {
    return (
      <div className="text-center py-10">
        <Target className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium">No Budgets Found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No budgets match the selected month/year, or no budgets have been created yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredBudgets.map((budget) => {
        const category = getCategoryById(budget.categoryId); 
        const user = getUserById(budget.userId);
        // Calculate total spent for this budget's lifetime for display on this page
        const totalSpentForBudget = getBudgetSpentAmount(budget.userId, budget.categoryId, "all", "all");
        const progress = budget.amount > 0 ? (totalSpentForBudget / budget.amount) * 100 : 0;
        const remaining = budget.amount - totalSpentForBudget;
        const CategoryIcon = category?.icon;

        // Prepare budget data with calculated spent for editing
        const budgetWithSpentForEditing: BudgetType = {
            ...budget,
            spent: totalSpentForBudget 
        };


        return (
          <Card key={budget.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {budget.name} 
                  </CardTitle>
                  {category && (
                     <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
                        {CategoryIcon && <CategoryIcon className="h-3 w-3" />} {category.name}
                     </CardDescription>
                  )}
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <UserIcon className="h-3 w-3 text-muted-foreground" />
                    {user?.name || "Unknown User"} &bull; {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
                  </CardDescription>
                   <CardDescription className="text-xs">
                    Active: {format(new Date(budget.startDate), "MMM yyyy")}
                    {budget.period === 'yearly' && ` - ${format(addMonths(new Date(budget.startDate), 11), "MMM yyyy")}`}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditBudget(budgetWithSpentForEditing)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteBudget(budget.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <div>
                <div className="mb-1 text-sm text-muted-foreground">
                  Target: {formatCurrency(budget.amount)}
                </div>
                <div className="mb-2 text-sm">
                  Spent (total for budget period): <span className="font-semibold">{formatCurrency(totalSpentForBudget)}</span>
                </div>
                <Progress value={progress} aria-label={`${budget.name} budget progress for ${user?.name}`} className="h-3 mb-2" />
                <p className={`text-xs font-medium ${remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {remaining >= 0 ? `${formatCurrency(remaining)} remaining` : `${formatCurrency(Math.abs(remaining))} overspent`}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

