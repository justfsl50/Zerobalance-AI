
"use client";

import { useState, useMemo, useEffect } from "react";
import { Coins, Scale, Target, PlusCircle, LayoutDashboard, TrendingDown, Wallet } from "lucide-react"; // Added Wallet
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { MonthYearControls } from "@/components/ui/month-year-controls";
import { getYear, getMonth, parseISO } from "date-fns";
import type { Transaction } from "@/lib/types";
import { AddTransactionForm } from "@/components/transactions/add-transaction-form";
import { AddBudgetForm } from "@/components/budgets/add-budget-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function SummaryDashboardPage() {
  const { transactions, budgets: rawBudgets, users, getBudgetSpentAmount } = useAppContext(); // Renamed budgets to rawBudgets

  const [selectedMonth, setSelectedMonth] = useState<number | "all">(getMonth(new Date()));
  const [selectedYear, setSelectedYear] = useState<number | "all">(getYear(new Date()));

  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedYear === "all" && selectedMonth === "all") return true;
      const transactionDate = parseISO(t.date);
      const transactionYear = getYear(transactionDate);
      const transactionMonth = getMonth(transactionDate);

      const yearMatch = selectedYear === "all" || transactionYear === selectedYear;
      if (!yearMatch) return false;

      const monthMatch = selectedMonth === "all" || transactionMonth === selectedMonth;
      return monthMatch;
    });
  }, [transactions, selectedMonth, selectedYear]);

  const summaryData = useMemo(() => {
    const relevantTransactions = filteredTransactions;
    // Use rawBudgets here as AppContext provides raw budget definitions
    const relevantBudgets = rawBudgets.filter(b => {
        const budgetStartDate = parseISO(b.startDate);
        const budgetStartYear = getYear(budgetStartDate);
        const budgetStartMonth = getMonth(budgetStartDate);

        if (selectedYear === "all" && selectedMonth === "all") return true;

        if (b.period === "monthly") {
            if (selectedYear === "all") return budgetStartMonth === selectedMonth;
            if (selectedMonth === "all") return budgetStartYear === selectedYear;
            return budgetStartYear === selectedYear && budgetStartMonth === selectedMonth;
        }
        if (b.period === "yearly") {
            if (selectedYear === "all") return true; 
            return budgetStartYear === selectedYear;
        }
        return false;
    });

    const totalExpenses = relevantTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalBudgetAmount = relevantBudgets.reduce((sum, b) => sum + b.amount, 0);
    const netRemaining = totalBudgetAmount - totalExpenses;
    
    const avgRoommateExpense = users.length > 0 ? totalExpenses / users.length : 0;

    return { totalExpenses, totalBudgetAmount, netRemaining, avgRoommateExpense };
  }, [filteredTransactions, rawBudgets, users, selectedMonth, selectedYear]);

  const handleTransactionFormSubmit = () => setIsTransactionFormOpen(false);
  const handleTransactionFormCancel = () => setIsTransactionFormOpen(false);
  const handleBudgetFormSubmit = () => setIsBudgetFormOpen(false);
  const handleBudgetFormCancel = () => setIsBudgetFormOpen(false);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Summary Dashboard</h2>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <MonthYearControls
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            monthLabel="For Month"
            yearLabel="For Year"
            allowAllMonths={true}
            allowAllYears={true}
          />
           <Button onClick={() => setIsTransactionFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
          <Button onClick={() => setIsBudgetFormOpen(true)}>
            <Target className="mr-2 h-4 w-4" /> Add Budget
          </Button>
        </div>
      </div>

      {/* Summary Cards: 2x2 grid on medium screens and up */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard
          title="Total Budget"
          value={summaryData.totalBudgetAmount}
          icon={Wallet}
        />
        <SummaryCard
          title="Total Expenses"
          value={summaryData.totalExpenses}
          icon={TrendingDown}
          valueClassName="text-destructive"
        />
        <SummaryCard
          title="Avg. Roommate Expense"
          value={summaryData.avgRoommateExpense}
          icon={Scale}
        />
        <SummaryCard
          title="Net Remaining"
          value={summaryData.netRemaining}
          icon={Coins}
          valueClassName={summaryData.netRemaining >= 0 ? "text-green-600" : "text-destructive"}
        />
      </div>

      {/* Main Content: Recent Transactions (2/3) and Budget Overview (1/3) on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={filteredTransactions} />
        </div>
        <div className="lg:col-span-1">
          <BudgetOverview selectedMonth={selectedMonth} selectedYear={selectedYear} />
        </div>
      </div>

      <Dialog open={isTransactionFormOpen} onOpenChange={setIsTransactionFormOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>Enter the details of your new transaction.</DialogDescription>
          </DialogHeader>
          <AddTransactionForm
            onFormSubmit={handleTransactionFormSubmit}
            onCancel={handleTransactionFormCancel}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isBudgetFormOpen} onOpenChange={setIsBudgetFormOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
            <DialogDescription>Set up a new budget to track your spending.</DialogDescription>
          </DialogHeader>
          <AddBudgetForm
            onFormSubmit={handleBudgetFormSubmit}
            onCancel={handleBudgetFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
