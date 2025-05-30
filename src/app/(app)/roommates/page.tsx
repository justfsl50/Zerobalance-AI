
"use client";

import { useState } from "react";
import { AddRoommateForm } from "@/components/roommates/add-roommate-form";
import { RoommateList } from "@/components/roommates/roommate-list";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlusCircle, Users } from "lucide-react";
import type { User } from "@/lib/types";

export default function RoommatesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoommate, setEditingRoommate] = useState<User | undefined>(undefined);

  const handleEditRoommate = (roommate: User) => {
    setEditingRoommate(roommate);
    setIsFormOpen(true);
  };

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setEditingRoommate(undefined);
  };
  
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingRoommate(undefined);
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8" /> Roommates
        </h2>
        <Button onClick={() => { setEditingRoommate(undefined); setIsFormOpen(true); } }>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Roommate
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingRoommate(undefined);
        }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingRoommate ? "Edit Roommate" : "Add New Roommate"}</DialogTitle>
            <DialogDescription>
              {editingRoommate ? "Update the roommate's details." : "Enter the name of the new roommate."}
            </DialogDescription>
          </DialogHeader>
          <AddRoommateForm
            roommateToEdit={editingRoommate}
            onFormSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      <RoommateList onEditRoommate={handleEditRoommate} />
    </div>
  );
}
