import { useState, useCallback, useEffect } from "react";
import {
  useCreateOrder,
  useGetHeldOrders,
  useUpdateOrderStatus,
  useDeleteOrder,
} from "./useApi";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  category?: string;
}

export interface Order {
  id?: number;
  customer: string;
  type: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  heldAt?: string;
  notes?: string;
  order_status?: string;
  created_at?: string;
}

export interface Notification {
  message: string;
  type: "success" | "error" | "info";
}

export function usePOSOrder() {
  const [currentOrder, setCurrentOrder] = useState<Order>({
    id: undefined,
    customer: "Walk-in Customer",
    type: "Dining",
    items: [],
    subtotal: 0,
    discount: 0,
    vat: 0,
    total: 0,
    notes: "",
  });

  const [heldOrders, setHeldOrders] = useState<Order[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const createOrderApi = useCreateOrder();
  const getHeldOrdersApi = useGetHeldOrders();
  const getDeleteOrderApi = useDeleteOrder;

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const initializeHeldOrders = async () => {
      try {
        console.log("[initializeHeldOrders] Loading held orders...");
        const result = await getHeldOrdersApi.execute();
        console.log("[initializeHeldOrders] Raw API result:", result);

        if (result && Array.isArray(result)) {
          const transformedOrders = result.map((order: any, index: number) => {
            console.log(
              `[initializeHeldOrders] Processing order ${index}:`,
              order
            );
            const transformed = {
              id: order.order_id,
              customer: order.customer_name,
              type: order.order_type,
              items:
                order.order_items?.map((item: any) => ({
                  id: item.order_item_id.toString(),
                  name: item.item_name,
                  price: item.unit_price,
                  quantity: item.quantity,
                  total: item.total_price,
                  category: item.category,
                })) || [],
              subtotal: order.subtotal,
              discount: order.discount,
              vat: order.vat,
              total: order.total_amount,
              notes: order.customer_notes || "",
              heldAt: order.created_at,
              order_status: order.order_status,
            };
            console.log(
              `[initializeHeldOrders] Transformed order ${index}:`,
              transformed
            );
            return transformed;
          });
          console.log(
            "[initializeHeldOrders] All transformed orders:",
            transformedOrders
          );
          setHeldOrders(transformedOrders);
        }
      } catch (error) {
        console.error("Failed to load held orders:", error);
      }
    };

    initializeHeldOrders();
  }, []);

  const showNotification = useCallback(
    (message: string, type: Notification["type"] = "info") => {
      setNotification({ message, type });
    },
    []
  );

  const addItemToOrder = useCallback(
    (item: Omit<OrderItem, "id" | "total">) => {
      setCurrentOrder((prev) => {
        const existingItemIndex = prev.items.findIndex(
          (orderItem) => orderItem.name === item.name
        );

        let newItems;
        if (existingItemIndex >= 0) {
          newItems = prev.items.map((orderItem, index) => {
            if (index === existingItemIndex) {
              const newQuantity = orderItem.quantity + item.quantity;
              return {
                ...orderItem,
                quantity: newQuantity,
                total: newQuantity * orderItem.price,
              };
            }
            return orderItem;
          });
        } else {
          const newItem: OrderItem = {
            ...item,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            total: item.quantity * item.price,
            category: item.category,
          };
          newItems = [...prev.items, newItem];
        }

        const subtotal = newItems.reduce(
          (sum, orderItem) => sum + orderItem.total,
          0
        );
        const vat = subtotal * 0.12;
        const total = subtotal + vat - prev.discount;

        return {
          ...prev,
          items: newItems,
          subtotal,
          vat,
          total,
        };
      });
    },
    []
  );

  const removeItemFromOrder = useCallback((itemId: string) => {
    setCurrentOrder((prev) => {
      const newItems = prev.items.filter((item) => item.id !== itemId);
      const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      const vat = subtotal * 0.12;
      const total = subtotal + vat - prev.discount;

      return {
        ...prev,
        items: newItems,
        subtotal,
        vat,
        total,
      };
    });
  }, []);

  const updateItemQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItemFromOrder(itemId);
        return;
      }

      setCurrentOrder((prev) => {
        const newItems = prev.items.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              quantity,
              total: quantity * item.price,
            };
          }
          return item;
        });

        const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
        const vat = subtotal * 0.12;
        const total = subtotal + vat - prev.discount;

        return {
          ...prev,
          items: newItems,
          subtotal,
          vat,
          total,
        };
      });
    },
    [removeItemFromOrder]
  );

  const applyDiscount = useCallback((discountAmount: number) => {
    setCurrentOrder((prev) => {
      const total = prev.subtotal + prev.vat - discountAmount;
      return {
        ...prev,
        discount: discountAmount,
        total: Math.max(0, total),
      };
    });
  }, []);

  const updateCustomerInfo = useCallback((customer: string, type: string) => {
    setCurrentOrder((prev) => ({
      ...prev,
      customer,
      type,
    }));
  }, []);

  const updateOrderNotes = useCallback((notes: string) => {
    setCurrentOrder((prev) => ({
      ...prev,
      notes,
    }));
  }, []);

  const holdOrder = useCallback(async () => {
    if (currentOrder.items.length === 0) {
      showNotification("Cannot hold empty order", "error");
      return false;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        customer_name: currentOrder.customer,
        order_type: currentOrder.type,
        order_status: "held",
        customer_notes: currentOrder.notes || "",
        subtotal: currentOrder.subtotal,
        discount: currentOrder.discount,
        vat: currentOrder.vat,
        total_amount: currentOrder.total,
        order_items: currentOrder.items.map((item) => ({
          item_name: item.name,
          unit_price: item.price,
          quantity: item.quantity,
          total_price: item.total,
          category: item.category,
        })),
      };

      const result = await createOrderApi.execute(orderData);

      if (result) {
        showNotification("Order held successfully", "success");
        newOrder();
        await loadHeldOrders();
        return true;
      } else {
        showNotification("Failed to hold order", "error");
        return false;
      }
    } catch (error) {
      showNotification("Error holding order", "error");
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [currentOrder, createOrderApi, showNotification]);

  const completeOrder = useCallback(
    async (
      paymentMethod: string,
      reference?: string,
      amountReceived?: number,
      changeAmount?: number,
      receiptEmail?: string
    ) => {
      if (currentOrder.items.length === 0) {
        showNotification("Cannot complete empty order", "error");
        return false;
      }

      setIsProcessing(true);

      try {
        const orderData = {
          customer_name: currentOrder.customer,
          order_type: currentOrder.type,
          order_status: "completed",
          payment_method: paymentMethod,
          payment_reference: reference || "",
          amount_received: amountReceived,
          change_amount: changeAmount,
          receipt_email: receiptEmail,
          customer_notes: currentOrder.notes || "",
          subtotal: currentOrder.subtotal,
          discount: currentOrder.discount,
          vat: currentOrder.vat,
          total_amount: currentOrder.total,
          order_items: currentOrder.items.map((item) => ({
            item_name: item.name,
            unit_price: item.price,
            quantity: item.quantity,
            total_price: item.total,
            category: item.category,
          })),
        };

        const result = await createOrderApi.execute(orderData);

        if (result) {
          showNotification("Order completed successfully", "success");
          const completedOrder = { ...currentOrder, id: result.order_id };
          newOrder();
          return completedOrder;
        } else {
          showNotification("Failed to complete order", "error");
          return null;
        }
      } catch (error) {
        showNotification("Error completing order", "error");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [currentOrder, createOrderApi, showNotification]
  );

  const newOrder = useCallback(() => {
    setCurrentOrder({
      id: undefined,
      customer: "Walk-in Customer",
      type: "Dining",
      items: [],
      subtotal: 0,
      discount: 0,
      vat: 0,
      total: 0,
      notes: "",
    });
  }, []);

  const loadHeldOrders = useCallback(async () => {
    console.log("[loadHeldOrders] Refreshing held orders...");
    const result = await getHeldOrdersApi.execute();
    console.log("[loadHeldOrders] Raw API result:", result);

    if (result) {
      const transformedOrders = result.map((order: any, index: number) => {
        console.log(`[loadHeldOrders] Processing order ${index}:`, order);
        const transformed = {
          id: order.order_id,
          customer: order.customer_name,
          type: order.order_type,
          items:
            order.order_items?.map((item: any) => ({
              id: item.order_item_id.toString(),
              name: item.item_name,
              quantity: item.quantity,
              price: item.unit_price,
              total: item.total_price,
              category: item.category,
            })) || [],
          subtotal: order.subtotal,
          discount: order.discount || 0,
          vat: order.vat,
          total: order.total_amount,
          notes: order.customer_notes || "",
          heldAt: order.created_at,
          order_status: order.order_status,
        };
        console.log(
          `[loadHeldOrders] Transformed order ${index}:`,
          transformed
        );
        return transformed;
      });
      console.log(
        "[loadHeldOrders] All transformed orders:",
        transformedOrders
      );
      setHeldOrders(transformedOrders);
    }
  }, [getHeldOrdersApi]);

  const retrieveHeldOrder = useCallback(
    async (heldOrder: Order) => {
      if (currentOrder.items.length > 0) {
        const confirmed = window.confirm(
          "This will replace your current order. Are you sure you want to continue?"
        );
        if (!confirmed) return false;
      }

      console.log("[retrieveHeldOrder] Input heldOrder:", heldOrder);

      if (!heldOrder.id || heldOrder.id <= 0 || isNaN(Number(heldOrder.id))) {
        console.error("[retrieveHeldOrder] Invalid order ID:", heldOrder.id);
        showNotification("Invalid order ID. Cannot retrieve order.", "error");
        return false;
      }

      try {
        const payload = { order_status: "pending" };
        const url = `${
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
        }/api/orders-async/${heldOrder.id}/status`;

        console.log("[retrieveHeldOrder] URL:", url);
        console.log("[retrieveHeldOrder] Payload:", payload);

        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        console.log("[retrieveHeldOrder] Response status:", response.status);
        console.log("[retrieveHeldOrder] Response ok:", response.ok);

        if (response.ok) {
          const result = await response.json();
          console.log("[retrieveHeldOrder] Success result:", result);
          setCurrentOrder(heldOrder);
          await loadHeldOrders();
          showNotification("Order retrieved successfully", "success");
          return true;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("[retrieveHeldOrder] Error response:", errorData);
          showNotification(
            errorData.detail ||
              `Failed to retrieve order (Status: ${response.status})`,
            "error"
          );
          return false;
        }
      } catch (error) {
        console.error("[retrieveHeldOrder] Network/Parse error:", error);
        showNotification("Error retrieving order", "error");
        return false;
      }
    },
    [currentOrder, loadHeldOrders, showNotification]
  );

  const deleteHeldOrder = useCallback(
    async (orderId: number) => {
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
          }/api/orders-async/${orderId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          await loadHeldOrders();
          showNotification("Held order deleted successfully", "success");
          return true;
        } else {
          showNotification("Failed to delete held order", "error");
          return false;
        }
      } catch (error) {
        showNotification("Error deleting held order", "error");
        return false;
      }
    },
    [getDeleteOrderApi, loadHeldOrders, showNotification]
  );

  const voidOrder = useCallback(async () => {
    const orderId = currentOrder.id;

    console.log("[voidOrder] ================================");
    console.log("[voidOrder] Starting void operation");
    console.log(
      "[voidOrder] Current order full object:",
      JSON.stringify(currentOrder, null, 2)
    );
    console.log("[voidOrder] Order ID:", orderId);
    console.log("[voidOrder] Order ID type:", typeof orderId);
    console.log("[voidOrder] Order status:", currentOrder.order_status);
    console.log("[voidOrder] ================================"); // If this is a retrieved held order (has an ID), mark it as canceled in the database
    if (orderId && orderId > 0) {
      try {
        const url = `${
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
        }/api/orders-async/${orderId}/cancel`;

        console.log("[voidOrder] Making cancel request to:", url);
        console.log(
          "[voidOrder] API Base URL:",
          process.env.NEXT_PUBLIC_API_BASE_URL
        );

        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("[voidOrder] Response status:", response.status);
        console.log("[voidOrder] Response ok:", response.ok);

        if (response.ok) {
          const result = await response.json();
          console.log("[voidOrder] Cancel success:", result);
          showNotification("Order voided", "info");
          await loadHeldOrders(); // Refresh held orders list
        } else {
          const errorText = await response.text();
          console.error("[voidOrder] Error response text:", errorText);

          let errorDetail = "Unknown error";
          try {
            const errorJson = JSON.parse(errorText);
            errorDetail =
              errorJson.detail ||
              errorJson.message ||
              JSON.stringify(errorJson);
          } catch (parseError) {
            errorDetail = errorText || `HTTP ${response.status}`;
          }

          console.error("[voidOrder] Parsed error detail:", errorDetail);

          if (response.status === 400) {
            showNotification(`Cannot cancel order: ${errorDetail}`, "error");
          } else if (response.status === 404) {
            console.error(
              "[voidOrder] ORDER NOT FOUND - This suggests the order ID doesn't exist in the database!"
            );
            console.error("[voidOrder] Attempted to cancel order ID:", orderId);
            console.error("[voidOrder] This could mean:");
            console.error(
              "[voidOrder] 1. The order was already deleted/completed"
            );
            console.error(
              "[voidOrder] 2. There's a mismatch between frontend and backend order IDs"
            );
            console.error(
              "[voidOrder] 3. The backend server is not running or is different"
            );
            showNotification(
              "Order not found in database. Voiding locally.",
              "info"
            );
          } else {
            showNotification(`Error canceling order: ${errorDetail}`, "error");
          }
        }
      } catch (error) {
        console.error("[voidOrder] Network/Exception error:", error);
        showNotification(
          `Network error while canceling order: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          "error"
        );
      }
    } else {
      console.log("[voidOrder] No valid order ID, voiding locally only");
      showNotification("Order voided", "info");
    }

    // Clear the current order regardless of database update result
    console.log("[voidOrder] Clearing current order");
    newOrder();
  }, [currentOrder, newOrder, showNotification, loadHeldOrders]);

  return {
    currentOrder,
    heldOrders,
    notification,
    isProcessing,

    addItemToOrder,
    removeItemFromOrder,
    updateItemQuantity,
    applyDiscount,
    updateCustomerInfo,
    updateOrderNotes,
    holdOrder,
    completeOrder,
    newOrder,
    voidOrder,

    loadHeldOrders,
    retrieveHeldOrder,
    deleteHeldOrder,

    showNotification,

    createOrderLoading: createOrderApi.loading,
    createOrderError: createOrderApi.error,
  };
}
