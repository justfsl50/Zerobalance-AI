
"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, TrendingUp, TrendingDown, User as UserIcon } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import type { Transaction } from "@/lib/types";
import { format, getMonth, getYear, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonthYearControls } from "@/components/ui/month-year-controls";

interface TransactionTableProps {
  onEditTransaction: (transaction: Transaction) => void;
}

export function TransactionTable({ onEditTransaction }: TransactionTableProps) {
  const { transactions, deleteTransaction, getCategoryById, categories, users, getUserById } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all"); // Default to "all" months
  const [selectedYear, setSelectedYear] = useState<number | "all">(getYear(new Date())); // Default to current year

  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | 'categoryName' | 'userName'; direction: 'ascending' | 'descending' } | null>({ key: 'date', direction: 'descending' });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by selected month and year
    if (selectedYear !== "all") {
      filtered = filtered.filter(t => {
        const transactionDate = parseISO(t.date);
        const transactionYear = getYear(transactionDate);
        if (transactionYear !== selectedYear) return false;
        if (selectedMonth !== "all") {
          const transactionMonth = getMonth(transactionDate);
          return transactionMonth === selectedMonth;
        }
        return true; // Year matches, and all months selected for that year
      });
    } else if (selectedMonth !== "all") {
        // If all years is selected, but a specific month, filter by that month across all years
        // This case might be less common, usually year is picked first.
         filtered = filtered.filter(t => getMonth(parseISO(t.date)) === selectedMonth);
    }


    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (getCategoryById(t.categoryId)?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (getUserById(t.userId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter(t => t.categoryId === filterCategory);
    }
    
    if (filterType !== "all") {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (filterUser !== "all") {
      filtered = filtered.filter(t => t.userId === filterUser);
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key === 'categoryName') {
          aValue = getCategoryById(a.categoryId)?.name || '';
          bValue = getCategoryById(b.categoryId)?.name || '';
        } else if (sortConfig.key === 'userName') {
          aValue = getUserById(a.userId)?.name || '';
          bValue = getUserById(b.userId)?.name || '';
        }
         else {
          aValue = a[sortConfig.key as keyof Transaction];
          bValue = b[sortConfig.key as keyof Transaction];
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
           return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (sortConfig.key === 'date') { 
             return sortConfig.direction === 'ascending' ? new Date(aValue).getTime() - new Date(bValue).getTime() : new Date(bValue).getTime() - new Date(aValue).getTime();
          }
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }
    return filtered;
  }, [transactions, searchTerm, filterCategory, filterType, filterUser, selectedMonth, selectedYear, sortConfig, getCategoryById, getUserById]);

  const requestSort = (key: keyof Transaction | 'categoryName' | 'userName') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: keyof Transaction | 'categoryName' | 'userName') => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="lg:col-span-1"
        />
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | "income" | "expense")}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <MonthYearControls
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        allowAllMonths={true}
        allowAllYears={true}
        monthLabel="Filter Month"
        yearLabel="Filter Year"
      />
      <div className="rounded-md border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => requestSort('date')}>Date{getSortIndicator('date')}</TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('description')}>Description{getSortIndicator('description')}</TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('userName')}>User{getSortIndicator('userName')}</TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('categoryName')}>Category{getSortIndicator('categoryName')}</TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => requestSort('amount')}>Amount{getSortIndicator('amount')}</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTransactions.length > 0 ? (
              filteredAndSortedTransactions.map((transaction) => {
                const category = getCategoryById(transaction.categoryId);
                const user = getUserById(transaction.userId);
                const CategoryIcon = category?.icon;
                return (
                  <TableRow key={transaction.id} className="hover:bg-muted/50">
                    <TableCell>{format(new Date(transaction.date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center w-fit gap-1 text-xs">
                        <UserIcon className="h-3 w-3" />
                        {user?.name || "Unknown User"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center w-fit gap-1 text-xs">
                        {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
                        {category?.name || "Uncategorized"}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                        {transaction.type === 'income' ? 
                            <TrendingUp className="h-5 w-5 text-green-500"/> : 
                            <TrendingDown className="h-5 w-5 text-red-500"/>
                        }
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditTransaction(transaction)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteTransaction(transaction.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No transactions found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {filteredAndSortedTransactions.length > 10 && (
        <div className="text-sm text-muted-foreground text-center mt-4">
          Displaying {filteredAndSortedTransactions.length} transactions.
        </div>
      )}
    </div>
  );
}
