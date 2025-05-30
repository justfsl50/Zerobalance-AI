
"use client";

import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ListChecks, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface RecentTransactionsProps {
  transactions: Transaction[]; // Accept filtered transactions as a prop
}

export function RecentTransactions({ transactions: filteredTransactions }: RecentTransactionsProps) {
  const { getCategoryById, getUserById } = useAppContext();

  // Sort a shallow copy of the array to avoid mutating the prop
  const recentTransactions = [...filteredTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  if (recentTransactions.length === 0) {
    return (
      <Card className="shadow-lg h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" />
            Recent Transactions
          </CardTitle>
          <CardDescription>No transactions recorded for the selected period.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-full pb-10">
            <ListChecks className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">Add transactions or adjust the filter.</p>
        </CardContent>
      </Card>
    );
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };

  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" />
            Recent Transactions
        </CardTitle>
        <CardDescription>Your latest financial activities for the selected period.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-3"> {/* Added pr-3 for scrollbar spacing */}
          <div className="space-y-4">
            {recentTransactions.map((transaction: Transaction) => {
              const category = getCategoryById(transaction.categoryId);
              const user = getUserById(transaction.userId);
              const CategoryIcon = category?.icon;
              return (
                <div key={transaction.id} className="flex items-center p-3 rounded-lg hover:bg-secondary/20 transition-colors duration-200 ease-in-out">
                  <Avatar className="h-9 w-9 mr-3">
                    <AvatarFallback className={cn(transaction.type === 'income' ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700')}>
                      {CategoryIcon ? <CategoryIcon className="h-5 w-5" /> : transaction.description.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UserIcon className="h-3 w-3"/> {user?.name || "Unknown"}
                      </span>
                       &bull; {category?.name} &bull; {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={cn(
                    "font-medium text-sm",
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
