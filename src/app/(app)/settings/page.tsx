
"use client";

import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserCircle, Palette, KeyRound, Trash2, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmNewPassword: z.string().min(6, { message: "Please confirm your new password." }),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match.",
  path: ["confirmNewPassword"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

const deleteAccountFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Password is required to confirm deletion." }),
});
type DeleteAccountFormValues = z.infer<typeof deleteAccountFormSchema>;


export default function SettingsPage() {
  const { currentUser, changeUserPassword, deleteUserAccount } = useAppContext();
  const { toast } = useToast();

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const changePasswordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const deleteAccountForm = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountFormSchema),
    defaultValues: {
      currentPassword: "",
    },
  });

  const handleChangePasswordSubmit = async (values: ChangePasswordFormValues) => {
    setIsSubmittingPassword(true);
    const success = await changeUserPassword(values.currentPassword, values.newPassword);
    setIsSubmittingPassword(false);
    if (success) {
      setIsChangePasswordOpen(false);
      changePasswordForm.reset();
    }
  };

  const handleDeleteAccountSubmit = async (values: DeleteAccountFormValues) => {
    setIsSubmittingDelete(true);
    const success = await deleteUserAccount(values.currentPassword);
    setIsSubmittingDelete(false);
    if (success) {
      // AppContext will handle logout and redirect via auth state change
      setIsDeleteAccountOpen(false); 
    }
  };

  return (
    <div className="container mx-auto py-2 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account and application preferences.</p>
      </div>

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-primary" />
            User Profile
          </CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-muted-foreground">{currentUser?.email || "Not available"}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Display Name</p>
            <p className="text-muted-foreground">{currentUser?.displayName || "Not set"}</p>
          </div>
          
          <Separator className="my-4" />

          <div className="space-y-2">
            <h3 className="text-md font-semibold">Account Actions</h3>
            <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <KeyRound className="mr-2 h-4 w-4" /> Change Password
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and a new password.
                  </DialogDescription>
                </DialogHeader>
                <Form {...changePasswordForm}>
                  <form onSubmit={changePasswordForm.handleSubmit(handleChangePasswordSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={changePasswordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={changePasswordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={changePasswordForm.control}
                      name="confirmNewPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsChangePasswordOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={isSubmittingPassword}>
                        {isSubmittingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <p className="text-xs text-muted-foreground">
              Update the password associated with your account.
            </p>
          </div>
          
          <div className="space-y-2 mt-4">
            <AlertDialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove your authentication data.
                    Your data in Firestore (transactions, budgets, roommates) will become inaccessible. 
                    For complete data erasure from the database, further backend processes are typically required.
                    <br/><br/>
                    To confirm, please enter your current password.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                 <Form {...deleteAccountForm}>
                  <form onSubmit={deleteAccountForm.handleSubmit(handleDeleteAccountSubmit)} className="space-y-4">
                     <FormField
                      control={deleteAccountForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder="Enter password to confirm"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => { setIsDeleteAccountOpen(false); deleteAccountForm.reset(); }}>Cancel</AlertDialogCancel>
                      <AlertDialogAction type="submit" disabled={isSubmittingDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        {isSubmittingDelete && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </form>
                </Form>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground">
              Permanently remove your account and associated data.
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">
                Current theme: Dark (Locked)
              </p>
            </div>
            {/* Theme toggle button removed */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
