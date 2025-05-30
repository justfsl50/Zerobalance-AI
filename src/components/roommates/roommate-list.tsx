
"use client";

import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, User as UserIcon, Users } from "lucide-react";
import type { User } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface RoommateListProps {
  onEditRoommate: (roommate: User) => void;
}

export function RoommateList({ onEditRoommate }: RoommateListProps) {
  const { users, deleteUser } = useAppContext();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleDeleteConfirmation = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  if (users.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Roommate List</CardTitle>
            <CardDescription>Manage your roommates here.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-10">
            <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-medium">No Roommates Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Add roommates to start managing shared finances.
            </p>
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Roommate List</CardTitle>
          <CardDescription>Manage your roommates here. Deleting a roommate does not delete their transactions or budgets.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg shadow-sm hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-6 w-6 text-primary" />
                  <span className="font-medium text-lg">{user.name}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditRoommate(user)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit Name
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteConfirmation(user)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {userToDelete && (
        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete {userToDelete.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will remove the roommate from the list.
                Existing transactions and budgets associated with this roommate will remain but may appear as "Unknown User".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
