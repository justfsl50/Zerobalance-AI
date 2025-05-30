
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, User as UserIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import type { Budget } from "@/lib/types";
import { useEffect, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

const budgetFormSchema = z.object({
  userId: z.string().min(1, { message: "User is required for the budget." }),
  name: z.string().min(2, { message: "Budget name must be at least 2 characters." }),
  categoryId: z.string().min(1, { message: "Category is required." }), // Added categoryId
  amount: z.coerce.number().positive({ message: "Budget amount must be positive." }),
  period: z.enum(["monthly", "yearly"], { required_error: "Budget period is required." }),
  startDate: z.date({ required_error: "Start date is required." }),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

interface AddBudgetFormProps {
  budgetToEdit?: Budget;
  onFormSubmit?: () => void;
  onCancel?: () => void;
}

export function AddBudgetForm({ budgetToEdit, onFormSubmit, onCancel }: AddBudgetFormProps) {
  const { users, addBudget, updateBudget, categories, getCategoryById } = useAppContext();
  const { toast } = useToast();

  const defaultStartDate = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }, []);

  const defaultValues = useMemo<Partial<BudgetFormValues>>(() => {
    return budgetToEdit
      ? {
          userId: budgetToEdit.userId,
          name: budgetToEdit.name,
          categoryId: budgetToEdit.categoryId, // Use existing categoryId
          amount: budgetToEdit.amount,
          period: budgetToEdit.period,
          startDate: new Date(budgetToEdit.startDate),
        }
      : {
          userId: users.length > 0 ? users[0].id : "",
          name: "", 
          categoryId: categories.length > 0 ? categories[0].id : "", // Default to first category or empty
          amount: "" as unknown as number,
          period: "monthly",
          startDate: defaultStartDate,
        };
  }, [budgetToEdit, defaultStartDate, users, categories]);
  
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);


  function onSubmit(data: BudgetFormValues) {
    const category = getCategoryById(data.categoryId);
    if (!category) {
      toast({ variant: "destructive", title: "Error", description: "Selected category not found." });
      return;
    }

    const budgetData = {
      ...data,
      startDate: data.startDate.toISOString(),
    };
    
    try {
      if (budgetToEdit) {
        updateBudget({ ...budgetData, id: budgetToEdit.id, spent: budgetToEdit.spent });
        toast({ title: "Success", description: "Budget updated successfully." });
      } else {
        addBudget(budgetData);
        toast({ title: "Success", description: "Budget added successfully." });
        form.reset(defaultValues); 
      }
      onFormSubmit?.();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save budget." });
      console.error("Failed to save budget:", error);
    }
  }

  if (users.length === 0 && !budgetToEdit) {
     return (
        <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Roommates Found</AlertTitle>
            <AlertDescription>
            Please <Link href="/roommates" className="font-semibold underline hover:text-destructive/80">add a roommate</Link> before creating budgets.
            </AlertDescription>
        </Alert>
    )
  }
  
  if (categories.length === 0 && !budgetToEdit) {
     return (
        <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Categories Found</AlertTitle>
            <AlertDescription>
            There are no transaction categories defined. Budgets require a category to track spending.
            </AlertDescription>
        </Alert>
    )
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
        <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Budget For</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select user for this budget" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                        <span className="flex items-center">
                            <UserIcon className="mr-2 h-4 w-4" />
                            {user.name}
                        </span>
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Monthly Groceries, Vacation Fund" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category to Track</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category to track spending for" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map(category => ( 
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center">
                        <category.icon className="mr-2 h-4 w-4" />
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} step="0.01" value={field.value === undefined ? '' : field.value} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a start date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" disabled={form.formState.isSubmitting || (users.length === 0 && !budgetToEdit) || (categories.length === 0 && !budgetToEdit)}>
             {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {budgetToEdit ? "Update Budget" : "Add Budget"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
