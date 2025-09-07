import { useState, useCallback } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
  } = {}
): ApiResponse<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const url = `${API_BASE_URL}${endpoint}`;
        const config: RequestInit = {
          method: options.method || "GET",
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        };

        // Handle dynamic body (for parameterized requests)
        if (options.body) {
          config.body = JSON.stringify(
            typeof options.body === "function"
              ? options.body(...args)
              : options.body
          );
        } else if (
          args.length > 0 &&
          (options.method === "POST" || options.method === "PUT")
        ) {
          config.body = JSON.stringify(args[0]);
        }

        const response = await fetch(url, config);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail || `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        setState({ data: null, loading: false, error: errorMessage });
        return null;
      }
    },
    [endpoint, options]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specific API hooks for orders only
export function useCreateOrder() {
  return useApi("/api/orders/", { method: "POST" });
}

export function useGetOrders(filters?: {
  date_from?: string;
  date_to?: string;
  status?: string;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.date_from) queryParams.append("date_from", filters.date_from);
  if (filters?.date_to) queryParams.append("date_to", filters.date_to);
  if (filters?.status) queryParams.append("status", filters.status);

  const endpoint = `/api/orders/?${queryParams.toString()}`;
  return useApi(endpoint, { method: "GET" });
}

export function useGetHeldOrders() {
  return useApi("/api/orders/status/held", { method: "GET" });
}

export function useUpdateOrderStatus(orderId: number) {
  return useApi(`/api/orders/${orderId}/status`, { method: "PUT" });
}

export function useDeleteOrder(orderId: number) {
  return useApi(`/api/orders/${orderId}`, { method: "DELETE" });
}

export function useOrdersSummary(filters?: {
  date_from?: string;
  date_to?: string;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.date_from) queryParams.append("date_from", filters.date_from);
  if (filters?.date_to) queryParams.append("date_to", filters.date_to);

  const endpoint = `/api/orders/summary?${queryParams.toString()}`;
  return useApi(endpoint, { method: "GET" });
}
