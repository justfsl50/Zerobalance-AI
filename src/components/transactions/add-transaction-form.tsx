
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Calendar as CalendarIconUI } from "@/components/ui/calendar";
import { CalendarIcon, Wand2, Loader2, User as UserIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAppContext } from "@/contexts/AppContext";
import { categorizeTransaction } from "@/ai/flows/categorize-transaction";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

const transactionFormSchema = z.object({
  userId: z.string().min(1, { message: "User is required." }),
  description: z.string().min(2, { message: "Description must be at least 2 characters." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  date: z.date({ required_error: "A date is required." }),
  type: z.enum(["income", "expense"], { required_error: "Transaction type is required." }),
  categoryId: z.string().min(1, { message: "Category is required." }),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface AddTransactionFormProps {
  transactionToEdit?: Transaction;
  onFormSubmit?: () => void;
  onCancel?: () => void;
}

export function AddTransactionForm({ transactionToEdit, onFormSubmit, onCancel }: AddTransactionFormProps) {
  const { users, addTransaction, updateTransaction, categories, getUserById } = useAppContext();
  const { toast } = useToast();
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);

  const defaultDate = useMemo(() => new Date(), []);

  const defaultValues = useMemo<Partial<TransactionFormValues>>(() => {
    return transactionToEdit
      ? {
          userId: transactionToEdit.userId,
          description: transactionToEdit.description,
          amount: transactionToEdit.amount,
          date: new Date(transactionToEdit.date),
          type: transactionToEdit.type,
          categoryId: transactionToEdit.categoryId,
          notes: transactionToEdit.notes || '',
        }
      : {
          userId: users.length > 0 ? users[0].id : "",
          description: "",
          amount: '' as unknown as number, 
          date: defaultDate,
          type: "expense",
          categoryId: categories.length > 0 ? categories[0].id : "",
          notes: "",
        };
  }, [transactionToEdit, defaultDate, users, categories]);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues,
  });

 useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);


  async function onSubmit(data: TransactionFormValues) {
    const transactionData = {
      ...data,
      date: data.date.toISOString(),
      amount: parseFloat(data.amount.toFixed(2)) 
    };

    try {
      if (transactionToEdit) {
        updateTransaction({ ...transactionData, id: transactionToEdit.id });
        toast({ title: "Success", description: "Transaction updated successfully." });
      } else {
        addTransaction(transactionData);
        toast({ title: "Success", description: "Transaction added successfully." });
        form.reset(defaultValues);
      }
      onFormSubmit?.();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save transaction." });
      console.error("Failed to save transaction:", error);
    }
  }

  const handleSuggestCategory = async () => {
    const description = form.getValues("description");
    if (!description) {
      toast({ variant: "destructive", title: "Input Needed", description: "Please enter a description to suggest a category." });
      return;
    }
    setIsSuggestingCategory(true);
    try {
      const result = await categorizeTransaction({ description });
      const matchedCategory = categories.find(c => c.name.toLowerCase() === result.category.toLowerCase());
      if (matchedCategory) {
        form.setValue("categoryId", matchedCategory.id);
        toast({ title: "Category Suggested!", description: `Suggested: ${result.category} (Confidence: ${Math.round(result.confidence * 100)}%)` });
      } else {
        toast({ title: "Suggestion Made", description: `AI suggested: ${result.category}. Please select a similar existing category or add it manually.` });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not suggest a category." });
      console.error("AI categorization error:", error);
    } finally {
      setIsSuggestingCategory(false);
    }
  };

  const evaluateFormula = (formulaWithEquals: string): number | null => {
    if (!formulaWithEquals.startsWith("=")) return null; 
    const expression = formulaWithEquals.substring(1);
    
    const sanitizedExpression = expression.replace(/[^-()\d/*+.\s]/g, '');

    if (sanitizedExpression.trim() === '') return null;

    // Basic safety checks for common invalid patterns
    if (/[+\-*/.]{2,}/.test(sanitizedExpression.replace(/\s+/g, '')) || // multiple operators
        /[+\-*/.]$/.test(sanitizedExpression.trim()) || // trailing operator
        /^[+\-*/.]/.test(sanitizedExpression.trim()) // leading operator in expression part
    ) {
      return null;
    }

    try {
      // Using new Function for safer evaluation than eval()
      const result = new Function('return ' + sanitizedExpression)();
      if (typeof result === 'number' && isFinite(result)) {
        return parseFloat(result.toFixed(2)); // Ensure two decimal places
      }
      return null;
    } catch (e) {
      console.error("Formula evaluation error:", e);
      return null;
    }
  };


  if (users.length === 0 && !transactionToEdit) {
    return (
        <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Roommates Found</AlertTitle>
            <AlertDescription>
            Please <Link href="/roommates" className="font-semibold underline hover:text-destructive/80">add a roommate</Link> before adding transactions.
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
                <FormLabel>Paid By</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select who paid for this" />
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Coffee at Starbucks" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                 <FormControl>
                    <Input
                      type="text"
                      placeholder="0.00 or =10+5"
                      ref={field.ref}
                      name={field.name}
                      value={field.value === undefined || field.value === null || (typeof field.value === 'number' && isNaN(field.value)) ? '' : String(field.value)}
                      onChange={e => {
                        field.onChange(e.target.value); // Update RHF with string value
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const currentInputValue = (e.target as HTMLInputElement).value;
                          const trimmedValue = currentInputValue.trim();

                          if (trimmedValue.startsWith("=")) {
                            const result = evaluateFormula(trimmedValue);
                            if (result !== null) {
                              form.setValue("amount", result, { shouldValidate: true });
                            } else {
                              toast({ variant: "destructive", title: "Invalid Formula", description: "The formula entered could not be calculated." });
                              form.setValue("amount", currentInputValue as any, { shouldValidate: true });
                            }
                          } else {
                            form.setValue("amount", currentInputValue as any, { shouldValidate: true });
                          }
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      onBlur={() => {
                        // Get current value from RHF state, as it might have been updated by onKeyDown
                        const currentRHFValue = form.getValues("amount");
                        const valueAsString = String(currentRHFValue ?? '').trim();

                        if (valueAsString.startsWith("=")) {
                          const result = evaluateFormula(valueAsString);
                          if (result !== null) {
                            // Only update if RHF state is not already the number (e.g. if Enter didn't run or failed)
                            if (currentRHFValue !== result) {
                               form.setValue("amount", result, { shouldValidate: true });
                            }
                          } else {
                            // If valueAsString is an invalid formula, toast (if not already string like "abc")
                            // Zod will catch if it becomes NaN. If it's still a string formula, toast.
                            if (typeof currentRHFValue === 'string' && currentRHFValue.startsWith("=")) {
                               toast({ variant: "destructive", title: "Invalid Formula", description: "The formula entered could not be calculated." });
                            }
                             // Ensure validation is triggered on the (potentially invalid formula) string
                            form.trigger("amount");
                          }
                        } else {
                           // For non-formulas, ensure RHF runs validation which includes coercion
                           form.trigger("amount");
                        }
                        field.onBlur(); // Call RHF's original onBlur
                      }}
                    />
                  </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
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
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarIconUI
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                 <div className="flex gap-2 items-center">
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
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
                  {form.getValues("type") === "expense" && (
                    <Button type="button" variant="outline" size="icon" onClick={handleSuggestCategory} disabled={isSuggestingCategory} aria-label="Suggest Category" className="shrink-0">
                        {isSuggestingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Add any relevant notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" disabled={form.formState.isSubmitting || isSuggestingCategory || (users.length === 0 && !transactionToEdit) }>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {transactionToEdit ? "Update Transaction" : "Add Transaction"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
    
