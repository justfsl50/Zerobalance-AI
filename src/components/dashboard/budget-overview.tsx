
"use client";

import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Budget } from "@/lib/types";
import { Target, User as UserIcon } from "lucide-react";
import { useMemo } from "react";
import { parseISO, getYear, getMonth, isWithinInterval, addMonths, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, format as formatDateFns } from "date-fns";

interface BudgetOverviewProps {
  selectedMonth: number | "all";
  selectedYear: number | "all";
}

function isBudgetActiveForFilter(
  budget: Omit<Budget, 'spent'>, // Use Omit<Budget, 'spent'> as raw budgets from context don't have 'spent'
  filterMonth: number | "all",
  filterYear: number | "all"
): boolean {
  if (filterYear === "all" && filterMonth === "all") return true; 

  const budgetStartDate = parseISO(budget.startDate);

  if (filterYear === "all" && typeof filterMonth === 'number') {
    if (budget.period === "monthly") {
      return getMonth(budgetStartDate) === filterMonth;
    }
    if (budget.period === "yearly") {
      const budgetStartMonth = getMonth(budgetStartDate);
      const budgetEndMonth = getMonth(subDays(addMonths(budgetStartDate, 12),1));
      if (budgetStartMonth <= budgetEndMonth) { 
        return filterMonth >= budgetStartMonth && filterMonth <= budgetEndMonth;
      } else { 
        return filterMonth >= budgetStartMonth || filterMonth <= budgetEndMonth;
      }
    }
  }

  if (typeof filterYear === 'number') {
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
        const filterPeriodDateStart = startOfYear(new Date(filterYear, 0, 1));
        const filterPeriodDateEnd = endOfYear(new Date(filterYear, 0, 1)); 
        return budgetActivePeriodStart <= filterPeriodDateEnd && budgetActivePeriodEnd >= filterPeriodDateStart;
      }
      const filterPeriodDateForCheck = startOfMonth(new Date(filterYear, filterMonth as number, 1));
      return isWithinInterval(filterPeriodDateForCheck, { start: budgetActivePeriodStart, end: budgetActivePeriodEnd });
    }
  }
  return false;
}


export function BudgetOverview({ selectedMonth, selectedYear }: BudgetOverviewProps) {
  // Use raw budgets from context, which don't have 'spent' pre-calculated
  const { budgets: rawBudgets, getUserById, getCategoryById, getBudgetSpentAmount } = useAppContext();

  const filteredBudgets = useMemo(() => {
    return rawBudgets.filter(budget =>
      isBudgetActiveForFilter(budget, selectedMonth, selectedYear)
    );
  }, [rawBudgets, selectedMonth, selectedYear]); 

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };

  const monthName = useMemo(() => {
    if (selectedMonth === "all") return "All Months";
    if (typeof selectedMonth === 'number' && selectedMonth >= 0 && selectedMonth <= 11) {
      return formatDateFns(new Date(2000, selectedMonth), 'MMMM');
    }
    return "";
  }, [selectedMonth]);

  const yearName = useMemo(() => {
    if (selectedYear === "all") return "All Time";
    return String(selectedYear);
  }, [selectedYear]);

  const cardDescription = useMemo(() => {
    let periodString = "";
    if (selectedYear === "all") {
      periodString = selectedMonth === "all" ? "for all time" : `for ${monthName} (all years)`;
    } else {
      periodString = selectedMonth === "all" ? `for ${yearName}` : `for ${monthName}, ${yearName}`;
    }
    return `Spending progress for active budgets ${periodString}.`;
  }, [monthName, yearName, selectedMonth, selectedYear]);


  if (filteredBudgets.length === 0) {
    return (
      <Card className="shadow-lg h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Budget Overview
          </CardTitle>
          <CardDescription>
            No active budgets for {monthName}, {yearName === "All Time" && selectedMonth !== "all" ? "across all years" : yearName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-full pb-10">
          <Target className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground">Create budgets or adjust the filter.</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Budget Overview
        </CardTitle>
        <CardDescription>
            {cardDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          <div className="space-y-6">
            {filteredBudgets.map((budget: Omit<Budget, 'spent'>) => { // Iterate over raw budgets
              const user = getUserById(budget.userId);
              const category = getCategoryById(budget.categoryId);
              const CategoryIcon = category?.icon;
              
              // Dynamically calculate spent amount for the dashboard's selected period
              const spentForSelectedPeriod = getBudgetSpentAmount(
                budget.userId,
                budget.categoryId,
                selectedMonth, 
                selectedYear  
              );
              const progress = budget.amount > 0 ? Math.min(100, (spentForSelectedPeriod / budget.amount) * 100) : 0;
              const remaining = budget.amount - spentForSelectedPeriod;

              return (
                <div key={budget.id} className="space-y-2 p-3 rounded-lg hover:bg-secondary/20 transition-colors duration-200 ease-in-out">
                  <div className="flex justify-between items-center">
                    <div className="font-medium flex flex-col">
                        <span className="flex items-center gap-2 text-base">
                           {CategoryIcon && <CategoryIcon className="h-4 w-4 text-muted-foreground" />} {budget.name}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <UserIcon className="h-3 w-3"/> {user?.name || "Unknown"} ({budget.period.charAt(0).toUpperCase() + budget.period.slice(1)})
                        </span>
                         {category && (
                            <span className="text-xs text-muted-foreground/80">
                                Tracking: {category.name}
                            </span>
                        )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(spentForSelectedPeriod)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <Progress value={progress} aria-label={`${budget.name} budget progress for ${user?.name || 'Unknown User'}`} className="h-3" />
                  <p className={`text-xs font-medium ${remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {remaining >= 0 ? `${formatCurrency(remaining)} remaining` : `${formatCurrency(Math.abs(remaining))} overspent`}
                  </p>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

