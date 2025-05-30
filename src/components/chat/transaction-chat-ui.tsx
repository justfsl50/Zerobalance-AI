
"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area"; // Restored
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User as UserIcon, SendHorizonal, Loader2, AlertTriangle, Sparkles, Plus, SlidersHorizontal, Mic } from "lucide-react";
import { manageTransactionChat, type ChatAction, type ManageTransactionChatInput } from "@/ai/flows/manage-transaction-chat-flow";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  action?: ChatAction;
}

interface TransactionChatUIProps {
  onChatActivityChange: (isActive: boolean) => void;
  // isChatActive prop removed as it's not used internally
  className?: string;
}

export function TransactionChatUI({ onChatActivityChange, className }: TransactionChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null); // Ref for ScrollArea viewport

  const { addTransaction, users: roommates, currentUser, categories } = useAppContext();
  const { toast } = useToast();

  // Internal state to track if chat is active to prevent redundant calls to onChatActivityChange
  const [internalIsChatActive, setInternalIsChatActive] = useState(false);

  useEffect(() => {
    // This log is crucial for debugging
    console.log("[TransactionChatUI] messages state updated:", JSON.stringify(messages, null, 2));

    const newIsActive = messages.some(m => m.sender === 'user');
    if (newIsActive !== internalIsChatActive) {
      setInternalIsChatActive(newIsActive);
      onChatActivityChange(newIsActive);
    }

    // Scroll to bottom
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
    } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, internalIsChatActive]); // onChatActivityChange removed from deps to rely on internalIsChatActive

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) {
        toast({variant: "destructive", title: "Not Logged In", description: "Please log in to use the chat."})
        return;
    }
    if (!inputValue.trim() || isLoading) {
      return;
    }

    const userMessageText = inputValue.trim();
    const userMessage: Message = { id: uuidv4(), sender: "user", text: userMessageText };

    setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, userMessage];
        console.log("[TransactionChatUI] User message added, updated messages state:", JSON.stringify(updatedMessages, null, 2));
        return updatedMessages;
    });

    setInputValue("");
    setIsLoading(true);

    try {
      const chatInput: ManageTransactionChatInput = {
        userInput: userMessageText,
        categories: categories.map(c => ({ id: c.id, name: c.name })),
        users: roommates.map(r => ({ id: r.id, name: r.name })),
        currentDate: new Date().toISOString().split('T')[0],
      };

      console.log("[TransactionChatUI] Sending to manageTransactionChat:", JSON.stringify(chatInput, null, 2));
      const aiResponseAction = await manageTransactionChat(chatInput);
      console.log("[TransactionChatUI] Received from manageTransactionChat:", JSON.stringify(aiResponseAction, null, 2));

      let aiTextResponse = "An error occurred, or the AI response was unclear.";

      if (aiResponseAction) {
        switch (aiResponseAction.action) {
          case "ADD_TRANSACTION":
            const userToAssign = roommates.find(r => r.id === aiResponseAction.params.userId);
            if (!userToAssign && roommates.length > 0 && !aiResponseAction.params.userId) {
                aiTextResponse = `I need to know who paid for this. For example, 'paid by ${roommates[0].name}'.`;
            } else if (!userToAssign && roommates.length === 0 && !currentUser?.uid) {
                aiTextResponse = "Please add a roommate first before adding transactions via chat.";
            } else {
                const categoryUsed = categories.find(c=>c.id === aiResponseAction.params.categoryId)?.name || "Other";
                await addTransaction(aiResponseAction.params);
                aiTextResponse = `Okay, I've added a transaction: ${aiResponseAction.params.description} for ₹${aiResponseAction.params.amount} (Category: ${categoryUsed}).`;
                toast({ title: "Transaction Added!", description: `${aiResponseAction.params.description} for ₹${aiResponseAction.params.amount} (Category: ${categoryUsed})` });
            }
            break;
          case "LIST_TRANSACTIONS":
            aiTextResponse = aiResponseAction.params.aiResponse || "To see your transactions, please use the filters on the Transactions page or click 'View Summary'.";
            break;
          case "CLARIFY":
            aiTextResponse = aiResponseAction.params.clarificationNeeded;
            break;
          case "INFO":
            aiTextResponse = aiResponseAction.params.aiResponse;
            break;
          case "ERROR":
            aiTextResponse = `I'm sorry, I ran into a problem: ${aiResponseAction.params.errorMessage}`;
            // toast({ variant: "destructive", title: "AI Error", description: aiResponseAction.params.errorMessage }); // Toasting already handled by the catch block potentially
            break;
          default:
            const exhaustiveCheck: never = aiResponseAction;
            aiTextResponse = `I'm not sure how to handle that action: ${(aiResponseAction as any)?.action}.`;
            console.warn("[TransactionChatUI] Unhandled AI action:", aiResponseAction);
        }
      } else {
        console.error("[TransactionChatUI] Received null or undefined response from manageTransactionChat.");
        aiTextResponse = "The AI didn't provide a response. Please try again.";
      }

      console.log("[TransactionChatUI] AI Text Response to be displayed:", aiTextResponse);
      setMessages((prevMessages) => {
        const newAiMessage = { id: uuidv4(), sender: "ai" as const, text: aiTextResponse, action: aiResponseAction || undefined };
        const updatedMessages = [...prevMessages, newAiMessage];
        console.log("[TransactionChatUI] AI message added, updated messages state:", JSON.stringify(updatedMessages, null, 2));
        return updatedMessages;
      });

    } catch (error: any) {
      console.error("[TransactionChatUI] Error processing chat in handleSendMessage:", error);
      const errorMessage = error.message || "An unexpected error occurred while processing your request.";

      setMessages((prevMessages) => {
          const errorAiMessage = { id: uuidv4(), sender: "ai" as const, text: `Error: ${errorMessage}` };
          const updatedMessages = [...prevMessages, errorAiMessage];
          console.log("[TransactionChatUI] Error message added (catch block), updated messages state:", JSON.stringify(updatedMessages, null, 2));
          return updatedMessages;
      });
      toast({ variant: "destructive", title: "Chat Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={cn(
        "flex flex-col bg-background w-full",
        className
      )}
    >
      <ScrollArea className="flex-grow p-4 sm:p-6" viewportRef={scrollAreaViewportRef}>
        <div className="space-y-4"> {/* Added space-y-4 for message separation */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3 w-full",
              )}
            >
              <Avatar className={cn("h-8 w-8 border", message.sender === 'user' ? "bg-primary/20 text-primary" : "bg-accent text-accent-foreground" )}>
                <AvatarFallback>
                  {message.sender === 'user' ? (
                    currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : <UserIcon className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                  "max-w-[75%] rounded-lg p-3 text-sm",
                  message.sender === 'user' ? "bg-card text-card-foreground shadow-sm" : "bg-transparent text-foreground", // AI messages on page bg
                  message.action?.action === "ERROR" && "bg-destructive/10 border border-destructive/30 text-destructive"
                )}
              >
                <p className="font-semibold mb-0.5">
                  {message.sender === 'user' ? (currentUser?.displayName || 'You') : 'ZEROBALANCE AI'}
                  {message.action?.action === "ERROR" && <AlertTriangle className="inline ml-2 h-4 w-4" />}
                </p>
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 w-full">
               <Avatar className="h-8 w-8 border bg-accent text-accent-foreground">
                <AvatarFallback>
                    <Sparkles className="h-4 w-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[75%] rounded-lg p-3 text-sm bg-transparent text-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className={cn("p-3 sm:p-4 w-full mt-auto")}>
         <form
            onSubmit={handleSendMessage}
            className={cn(
                "relative flex flex-col gap-2 bg-card p-3 rounded-2xl w-full border border-border max-w-2xl mx-auto",
            )}
            >
          <Textarea
            placeholder="Ask anything"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !currentUser}
            className={cn(
                "flex-grow resize-none bg-transparent p-3 text-sm min-h-[52px] max-h-[250px]",
                "placeholder:text-muted-foreground placeholder:opacity-40 pr-12 rounded-md",
                "border-0 focus-visible:ring-0 focus-visible:outline-none shadow-none"
            )}
            rows={1}
            autoComplete="off"
          />
            <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8" disabled={isLoading || !currentUser}>
                    <Plus className="h-5 w-5" />
                    <span className="sr-only">Add Attachment</span>
                </Button>
                <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8" disabled={isLoading || !currentUser}>
                    <SlidersHorizontal className="h-5 w-5" />
                    <span className="sr-only">Tools</span>
                </Button>
                </div>
                <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8" disabled={isLoading || !currentUser}>
                    <Mic className="h-5 w-5" />
                    <span className="sr-only">Use Microphone</span>
                </Button>
                <Button
                    type="submit"
                    variant="default"
                    size="icon"
                    disabled={isLoading || !inputValue.trim() || !currentUser}
                    className="h-9 w-9 rounded-lg flex-shrink-0 bg-primary hover:bg-primary/90"
                    aria-label="Send message"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : <SendHorizonal className="h-4 w-4 text-primary-foreground" />}
                </Button>
                </div>
            </div>
            </form>
      </div>
    </div>
  );
}

    