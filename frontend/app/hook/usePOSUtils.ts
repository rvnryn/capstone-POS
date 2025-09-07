import { useState, useEffect, useCallback } from "react";

export interface ClockState {
  currentTime: Date;
  formattedTime: string;
  formattedDate: string;
}

export function useClock(updateInterval: number = 60000) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, updateInterval);

    return () => clearInterval(timer);
  }, [updateInterval]);

  const formatTime = useCallback((date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  const formatDate = useCallback((date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  return {
    currentTime,
    formattedTime: formatTime(currentTime),
    formattedDate: formatDate(currentTime),
  };
}

export function useCustomerInput() {
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState("");

  const startEditing = useCallback((currentName: string) => {
    setCustomerNameInput(currentName);
    setIsEditingCustomer(true);
  }, []);

  const cancelEditing = useCallback(() => {
    setIsEditingCustomer(false);
    setCustomerNameInput("");
  }, []);

  const saveCustomerName = useCallback((): string => {
    const name = customerNameInput.trim() || "Walk-in Customer";
    setIsEditingCustomer(false);
    setCustomerNameInput("");
    return name;
  }, [customerNameInput]);

  return {
    isEditingCustomer,
    customerNameInput,
    setCustomerNameInput,
    startEditing,
    cancelEditing,
    saveCustomerName,
  };
}

export function useKeyboardShortcuts(callbacks: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        if (callbacks[key]) {
          event.preventDefault();
          callbacks[key]();
        }
      }

      
      if (event.key.startsWith("F") && callbacks[event.key]) {
        event.preventDefault();
        callbacks[event.key]();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [callbacks]);
}

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue] as const;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((prev) => !prev), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, toggle, setTrue, setFalse] as const;
}

export function usePrevious<T>(value: T): T | undefined {
  const [current, setCurrent] = useState<T>(value);
  const [previous, setPrevious] = useState<T | undefined>(undefined);

  if (value !== current) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
}
