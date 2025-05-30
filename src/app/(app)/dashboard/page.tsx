
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Target, LayoutDashboard, Sparkles } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddTransactionForm } from "@/components/transactions/add-transaction-form";
import { AddBudgetForm } from "@/components/budgets/add-budget-form";
import { TransactionChatUI } from "@/components/chat/transaction-chat-ui";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { currentUser, chatResetTrigger } = useAppContext();
  const router = useRouter();

  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);

  const welcomeMessage = useMemo(() => {
    if (currentUser?.displayName) {
      return `Welcome back, ${currentUser.displayName}. Let’s talk money!`;
    }
    return "Welcome back. Let’s talk money!";
  }, [currentUser?.displayName]);

  useEffect(() => {
    if (chatResetTrigger > 0) {
      setIsChatActive(false);
    }
  }, [chatResetTrigger]);

  const handleTransactionFormSubmit = () => setIsTransactionFormOpen(false);
  const handleTransactionFormCancel = () => setIsTransactionFormOpen(false);
  const handleBudgetFormSubmit = () => setIsBudgetFormOpen(false);
  const handleBudgetFormCancel = () => setIsBudgetFormOpen(false);

  return (
    <div
      className={cn(
        "flex flex-col p-4",
        isChatActive ? "h-[calc(100vh-4rem)]" : "min-h-[calc(100vh-4rem)]" 
      )}
    >
      {!isChatActive && (
        <div className="w-full max-w-3xl mx-auto text-center pt-8 sm:pt-12">
          <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-foreground mb-1">
            {welcomeMessage}
          </h2>
        </div>
      )}

      <div className={cn(
          "w-full",
          isChatActive 
            ? "flex-grow flex flex-col mx-auto max-w-3xl" 
            : "mx-auto max-w-3xl mb-1" 
        )}>
        <TransactionChatUI
          key={chatResetTrigger}
          onChatActivityChange={setIsChatActive}
          className={cn("w-full", !isChatActive ? "h-auto" : "h-full flex-grow")}
        />
      </div>

      {!isChatActive && (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3 max-w-3xl mx-auto">
          <Button
            variant="outline"
            size="lg"
            className="flex-grow sm:flex-grow-0 min-w-[160px] transition-transform duration-150 ease-in-out hover:scale-105 active:scale-95 hover:bg-background hover:text-foreground"
            onClick={() => router.push('/summary-dashboard')}
          >
            <LayoutDashboard className="mr-2 h-5 w-5" /> View Summary
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-grow sm:flex-grow-0 min-w-[160px] transition-transform duration-150 ease-in-out hover:scale-105 active:scale-95 hover:bg-background hover:text-foreground"
            onClick={() => setIsTransactionFormOpen(true)}
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Add Manually
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-grow sm:flex-grow-0 min-w-[160px] transition-transform duration-150 ease-in-out hover:scale-105 active:scale-95 hover:bg-background hover:text-foreground"
            onClick={() => setIsBudgetFormOpen(true)}
          >
            <Target className="mr-2 h-5 w-5" /> Add Budget
          </Button>
        </div>
      )}

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
