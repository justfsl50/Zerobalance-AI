
"use client";

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = (value: T | ((val: T) => T)) => void;

export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  // Initialize state with initialValue. This ensures server and initial client render are consistent.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // useEffect to load the value from localStorage on the client side after initial hydration.
  useEffect(() => {
    // Check if window is defined to ensure this runs only on the client.
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item) as T);
        }
        // If no item is found, storedValue remains initialValue, which is correct.
      } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
        // If there's an error reading, it defaults to initialValue.
      }
    }
  }, [key]); // Rerun this effect if the key changes.

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue: SetValue<T> = useCallback(
    (value) => {
      if (typeof window === 'undefined') {
        console.warn(
          `Tried setting localStorage key “${key}” even though environment is not a client`
        );
        return; // Do nothing on the server
      }

      try {
        // Allow value to be a function so we have same API as useState
        const newValue = value instanceof Function ? value(storedValue) : value;
        // Save to local storage
        window.localStorage.setItem(key, JSON.stringify(newValue));
        // Save state
        setStoredValue(newValue);
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue] // Include storedValue in dependencies as it's used in the setter function logic
  );

  return [storedValue, setValue];
}
