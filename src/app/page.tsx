
"use client"; // Required for using hooks like useAppContext and useRouter

import { useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation'; // Use useRouter for client-side redirect
import { useAppContext } from '@/contexts/AppContext';

export default function HomePage() {
  const { currentUser, authLoading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (currentUser) {
        router.replace('/dashboard');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [currentUser, authLoading, router]);

  // Render nothing or a loading indicator while checking auth state
  // This component will redirect, so it doesn't need to render significant UI
  return null; 
}
