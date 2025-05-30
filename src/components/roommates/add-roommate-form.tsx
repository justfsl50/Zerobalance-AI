
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
import { Loader2 } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/types";
import { useEffect, useMemo } from "react";

const roommateFormSchema = z.object({
  name: z.string().min(2, { message: "Roommate name must be at least 2 characters." }),
});

type RoommateFormValues = z.infer<typeof roommateFormSchema>;

interface AddRoommateFormProps {
  roommateToEdit?: User;
  onFormSubmit?: () => void;
  onCancel?: () => void;
}

export function AddRoommateForm({ roommateToEdit, onFormSubmit, onCancel }: AddRoommateFormProps) {
  const { addUser, updateUser } = useAppContext();
  const { toast } = useToast();

  const defaultValues = useMemo<Partial<RoommateFormValues>>(() => {
    return roommateToEdit
      ? { name: roommateToEdit.name }
      : { name: "" };
  }, [roommateToEdit]);
  
  const form = useForm<RoommateFormValues>({
    resolver: zodResolver(roommateFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  function onSubmit(data: RoommateFormValues) {
    try {
      if (roommateToEdit) {
        updateUser({ ...data, id: roommateToEdit.id });
        toast({ title: "Success", description: "Roommate updated successfully." });
      } else {
        addUser(data);
        toast({ title: "Success", description: "Roommate added successfully." });
        form.reset(defaultValues); 
      }
      onFormSubmit?.();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save roommate." });
      console.error("Failed to save roommate:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Roommate Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter roommate's name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" disabled={form.formState.isSubmitting}>
             {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {roommateToEdit ? "Update Roommate" : "Add Roommate"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
