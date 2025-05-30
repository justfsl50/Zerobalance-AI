
"use client";

import { useState, useEffect } from "react";
import { AddTransactionForm } from "@/components/transactions/add-transaction-form";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";

export default function TransactionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setEditingTransaction(undefined); 
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


  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setEditingTransaction(undefined);
  };
  
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingTransaction(undefined);
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
        <Button onClick={() => { setEditingTransaction(undefined); setIsFormOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingTransaction(undefined);
            // Also clear query param if dialog is closed manually
            if (searchParams.get("action") === "add") {
               const newPath = pathnameOnly(router.toString());
               router.replace(newPath, undefined);
            }
          }
        }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
            <DialogDescription>
              {editingTransaction ? "Update the details of your transaction." : "Enter the details of your new transaction."}
            </DialogDescription>
          </DialogHeader>
          <AddTransactionForm
            transactionToEdit={editingTransaction}
            onFormSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View and manage all your financial transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionTable onEditTransaction={handleEditTransaction} />
        </CardContent>
      </Card>
    </div>
  );
}
