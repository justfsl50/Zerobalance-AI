
"use client";

import type { ReactNode} from 'react';
import { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import type { Transaction, Budget, Category, Roommate } from '@/lib/types';
import { DEFAULT_CATEGORIES, APP_NAME } from '@/lib/constants';
import { parseISO, getYear, getMonth } from 'date-fns';
import { auth, db } from '@/lib/firebase'; // Import Firebase db
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword,
  deleteUser as firebaseDeleteUser
} from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  // where,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


interface AppContextType {
  currentUser: FirebaseUser | null;
  authLoading: boolean;
  dataLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<FirebaseUser | null>;
  logoutUser: () => Promise<void>;
  changeUserPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  deleteUserAccount: (currentPassword: string) => Promise<boolean>;

  users: Roommate[];
  addUser: (user: Omit<Roommate, 'id'>) => Promise<void>;
  updateUser: (user: Roommate) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getUserById: (userId: string) => Roommate | undefined;

  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;

  budgets: Budget[]; // Changed from Omit<Budget, 'spent'>[]
  addBudget: (budget: Omit<Budget, 'id' | 'spent'>) => Promise<void>;
  updateBudget: (budget: Omit<Budget, 'spent'> & { id: string }) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  getBudgetSpentAmount: (
    userId: string,
    categoryIdForBudget: string,
    filterMonth?: number | "all",
    filterYear?: number | "all"
  ) => number;

  categories: Category[];
  getCategoryById: (categoryId:string) => Category | undefined;

  chatResetTrigger: number;
  triggerChatReset: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [chatResetTrigger, setChatResetTrigger] = useState(0);


  const [users, setUsers] = useState<Roommate[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetsFromFirestore, setBudgetsFromFirestore] = useState<Omit<Budget, 'spent'>[]>([]);


  const categories = useMemo(() => DEFAULT_CATEGORIES, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) {
        setUsers([]);
        setTransactions([]);
        setBudgetsFromFirestore([]);
        setDataLoading(true); // Reset to true, will be set to false after data loads or if no user
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setDataLoading(false); // No user, so no data to load
      return;
    }

    setDataLoading(true);
    let unsubscribeUsers: () => void = () => {};
    let unsubscribeTransactions: () => void = () => {};
    let unsubscribeBudgets: () => void = () => {};

    try {
      const usersCollectionRef = collection(db, 'users', currentUser.uid, 'roommates');
      unsubscribeUsers = onSnapshot(query(usersCollectionRef, orderBy('name')), (snapshot) => {
        const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Roommate));
        setUsers(fetchedUsers);
      }, (error) => {
        console.error("Error fetching roommates:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch roommates." });
      });

      const transactionsCollectionRef = collection(db, 'users', currentUser.uid, 'transactions');
      unsubscribeTransactions = onSnapshot(query(transactionsCollectionRef, orderBy('date', 'desc')), (snapshot) => {
        const fetchedTransactions = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: (data.date as Timestamp)?.toDate().toISOString(),
          } as Transaction;
        });
        setTransactions(fetchedTransactions);
      }, (error) => {
        console.error("Error fetching transactions:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch transactions." });
      });

      const budgetsCollectionRef = collection(db, 'users', currentUser.uid, 'budgets');
      unsubscribeBudgets = onSnapshot(query(budgetsCollectionRef, orderBy('startDate', 'desc')), (snapshot) => {
        const fetchedBudgets = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startDate: (data.startDate as Timestamp)?.toDate().toISOString(),
          } as Omit<Budget, 'spent'>;
        });
        setBudgetsFromFirestore(fetchedBudgets);
        setDataLoading(false); // Data loading complete
      }, (error) => {
        console.error("Error fetching budgets:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch budgets." });
        setDataLoading(false); // Error occurred, stop loading
      });
    } catch(error) {
        console.error("Error setting up Firestore listeners:", error);
        toast({ variant: "destructive", title: "Data Sync Error", description: "Could not set up real-time data synchronization." });
        setDataLoading(false); // Error occurred, stop loading
    }

    return () => {
      unsubscribeUsers();
      unsubscribeTransactions();
      unsubscribeBudgets();
    };
  }, [currentUser, toast]);


  const loginWithEmail = useCallback(async (email: string, pass: string): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Login Successful", description: `Welcome back to ${APP_NAME}!` });
      return userCredential.user;
    } catch (error: any) {
      console.error("Login error:", error);
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
      return null;
    }
  }, [toast]);

  const signupWithEmail = useCallback(async (email: string, pass: string, name: string): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });
      await user.reload(); // Reload user to get updated profile
      setCurrentUser(user); // Update context with the reloaded user

      toast({ title: "Signup Successful", description: `Welcome to ${APP_NAME}, ${name}!` });
      return user;
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({ variant: "destructive", title: "Signup Failed", description: error.message });
      return null;
    }
  }, [toast]);

  const logoutUser = useCallback(async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message });
    }
  }, [toast]);

  const reauthenticateUser = useCallback(async (currentPassword_param: string): Promise<boolean> => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toast({ variant: "destructive", title: "Error", description: "No user is currently signed in or email is missing." });
      return false;
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword_param);
    try {
      await reauthenticateWithCredential(auth.currentUser, credential);
      return true;
    } catch (error: any)
 {
      console.error("Reauthentication failed:", error);
      let errorMessage = "Reauthentication failed. Please check your password.";
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect current password. Please try again.";
      } else if (error.code === 'auth/user-mismatch') {
        errorMessage = "User credentials mismatch. This is unexpected.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later.";
      }
      toast({ variant: "destructive", title: "Reauthentication Failed", description: errorMessage });
      return false;
    }
  }, [toast]);

  const changeUserPassword = useCallback(async (currentPassword_param: string, newPassword_param: string): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({ variant: "destructive", title: "Error", description: "No user is currently signed in." });
      return false;
    }
    const reauthSuccess = await reauthenticateUser(currentPassword_param);
    if (!reauthSuccess) {
      return false;
    }
    try {
      await firebaseUpdatePassword(auth.currentUser, newPassword_param);
      toast({ title: "Success", description: "Password updated successfully." });
      return true;
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({ variant: "destructive", title: "Password Update Failed", description: error.message || "Could not update password." });
      return false;
    }
  }, [toast, reauthenticateUser]);

  const deleteUserAccount = useCallback(async (currentPassword_param: string): Promise<boolean> => {
     if (!auth.currentUser) {
      toast({ variant: "destructive", title: "Error", description: "No user is currently signed in." });
      return false;
    }
    const reauthSuccess = await reauthenticateUser(currentPassword_param);
    if (!reauthSuccess) {
      return false;
    }
    try {
      await firebaseDeleteUser(auth.currentUser);
      toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
      return true;
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({ variant: "destructive", title: "Account Deletion Failed", description: error.message || "Could not delete account." });
      return false;
    }
  }, [toast, reauthenticateUser]);


  const addUser = useCallback(async (userData: Omit<Roommate, 'id'>) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to add a roommate." });
      return;
    }
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'roommates'), userData);
    } catch (error) {
      console.error("Error adding roommate:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not add roommate." });
    }
  }, [currentUser, toast]);

  const updateUser = useCallback(async (updatedUserData: Roommate) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid, 'roommates', updatedUserData.id);
      await updateDoc(userDocRef, { name: updatedUserData.name });
    } catch (error) {
      console.error("Error updating roommate:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update roommate." });
    }
  }, [currentUser, toast]);

  const deleteUser = useCallback(async (userId: string) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid, 'roommates', userId);
      await deleteDoc(userDocRef);
    } catch (error) {
      console.error("Error deleting roommate:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete roommate." });
    }
  }, [currentUser, toast]);

  const getUserById = useCallback((userId: string) => users.find(u => u.id === userId), [users]);

  const addTransaction = useCallback(async (transactionData: Omit<Transaction, 'id'>) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to add a transaction." });
      return;
    }
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), {
        ...transactionData,
        date: Timestamp.fromDate(new Date(transactionData.date)),
      });
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not add transaction." });
    }
  }, [currentUser, toast]);

  const updateTransaction = useCallback(async (updatedTransactionData: Transaction) => {
    if (!currentUser) return;
    const { id, ...dataToUpdate } = updatedTransactionData;
    try {
      const transactionDocRef = doc(db, 'users', currentUser.uid, 'transactions', id);
      await updateDoc(transactionDocRef, {
        ...dataToUpdate,
        date: Timestamp.fromDate(new Date(dataToUpdate.date)),
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update transaction." });
    }
  }, [currentUser, toast]);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    if (!currentUser) return;
    try {
      const transactionDocRef = doc(db, 'users', currentUser.uid, 'transactions', transactionId);
      await deleteDoc(transactionDocRef);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete transaction." });
    }
  }, [currentUser, toast]);

  const getCategoryById = useCallback((categoryId: string) => categories.find(c => c.id === categoryId), [categories]);

 const getBudgetSpentAmount = useCallback((
    userId: string,
    categoryIdForBudget: string,
    filterMonth: number | "all" = "all",
    filterYear: number | "all" = "all"
  ): number => {
    const relevantTransactions = transactions.filter(t => {
      if (t.userId !== userId || t.type !== 'expense') {
        return false;
      }
       // Removed categoryIdForBudget filter to sum all expenses by the user for the period
      // if (t.categoryId !== categoryIdForBudget) {
      //   return false;
      // }

      const transactionDate = parseISO(t.date);
      const transactionYear = getYear(transactionDate);
      const transactionMonth = getMonth(transactionDate);

      let yearMatch = (filterYear === "all") || (transactionYear === filterYear);
      if (!yearMatch) return false;

      let monthMatch = (filterMonth === "all") || (transactionMonth === filterMonth);
      return monthMatch;
    });
    return relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);


  const addBudget = useCallback(async (budgetData: Omit<Budget, 'id' | 'spent'>) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to add a budget." });
      return;
    }
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'budgets'), {
        ...budgetData,
        startDate: Timestamp.fromDate(new Date(budgetData.startDate)),
      });
    } catch (error) {
      console.error("Error adding budget:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not add budget." });
    }
  }, [currentUser, toast]);

  const updateBudget = useCallback(async (updatedBudgetData: Omit<Budget, 'spent'> & {id: string}) => {
    if (!currentUser) return;
    const { id, ...dataToUpdate } = updatedBudgetData;
    try {
      const budgetDocRef = doc(db, 'users', currentUser.uid, 'budgets', id);
      await updateDoc(budgetDocRef, {
        ...dataToUpdate,
        startDate: Timestamp.fromDate(new Date(dataToUpdate.startDate)),
      });
    } catch (error) {
      console.error("Error updating budget:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update budget." });
    }
  }, [currentUser, toast]);

  const deleteBudget = useCallback(async (budgetId: string) => {
    if (!currentUser) return;
    try {
      const budgetDocRef = doc(db, 'users', currentUser.uid, 'budgets', budgetId);
      await deleteDoc(budgetDocRef);
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete budget." });
    }
  }, [currentUser, toast]);

  const triggerChatReset = useCallback(() => {
    setChatResetTrigger(prev => prev + 1);
  }, []);

  const budgetsWithCalculatedSpent = useMemo(() => {
    return budgetsFromFirestore.map(budget => ({
      ...budget,
      spent: getBudgetSpentAmount(budget.userId, budget.categoryId, "all", "all")
    }));
  }, [budgetsFromFirestore, getBudgetSpentAmount]);


  const contextValue = useMemo(() => ({
    currentUser,
    authLoading,
    dataLoading,
    loginWithEmail,
    signupWithEmail,
    logoutUser,
    changeUserPassword,
    deleteUserAccount,
    users,
    addUser,
    updateUser,
    deleteUser,
    getUserById,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    budgets: budgetsWithCalculatedSpent, // Provide budgets with calculated total spent
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetSpentAmount,
    categories,
    getCategoryById,
    chatResetTrigger,
    triggerChatReset,
  }), [
    currentUser, authLoading, dataLoading, users,
    transactions, budgetsWithCalculatedSpent, categories, getCategoryById, getUserById,
    getBudgetSpentAmount, loginWithEmail, signupWithEmail, logoutUser,
    changeUserPassword, deleteUserAccount, addUser, updateUser, deleteUser,
    addTransaction, updateTransaction, deleteTransaction, addBudget, updateBudget, deleteBudget,
    chatResetTrigger, triggerChatReset
  ]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppDataProvider');
  }
  return context;
}
