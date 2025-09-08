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
  // Always call hooks at the top level, use as functions for specific IDs
  // Use a single updateOrderStatusApi instance with a dynamic orderId
  const [updateOrderId, setUpdateOrderId] = useState<number | null>(null);
  const updateOrderStatusApi = useUpdateOrderStatus(updateOrderId ?? 0);
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
        const result = await getHeldOrdersApi.execute();
        if (result && Array.isArray(result)) {
          const transformedOrders = result.map((order: any) => ({
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
              })) || [],
            subtotal: order.subtotal,
            discount: order.discount,
            vat: order.vat,
            total: order.total_amount,
            notes: order.customer_notes || "",
            heldAt: order.created_at,
            order_status: order.order_status,
          }));
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
    const result = await getHeldOrdersApi.execute();
    if (result) {
      const transformedOrders = result.map((order: any) => ({
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
          })) || [],
        subtotal: order.subtotal,
        discount: order.discount || 0,
        vat: order.vat,
        total: order.total,
        notes: order.notes || "",
        heldAt: order.created_at,
        order_status: order.order_status,
      }));
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

      if (!heldOrder.id || heldOrder.id <= 0 || isNaN(Number(heldOrder.id))) {
        showNotification("No valid held order to retrieve.", "error");
        return false;
      }
      setUpdateOrderId(heldOrder.id);
      try {
        const payload = { order_status: "pending" };
        console.log(
          "[retrieveHeldOrder] Calling: /api/orders-async/" +
            heldOrder.id +
            "/status",
          "Payload:",
          payload
        );
        const result = await updateOrderStatusApi.execute(payload);
        console.log("[retrieveHeldOrder] Result:", result);
        if (result) {
          setCurrentOrder(heldOrder);
          await loadHeldOrders();
          showNotification("Order retrieved successfully", "success");
          return true;
        } else {
          showNotification("Failed to retrieve order", "error");
          return false;
        }
      } catch (error) {
        console.error("[retrieveHeldOrder] Error:", error);
        showNotification("Error retrieving order", "error");
        return false;
      }
    },
    [currentOrder, loadHeldOrders, showNotification, updateOrderStatusApi]
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

  const voidOrder = useCallback(() => {
    newOrder();
    showNotification("Order voided", "info");
  }, [newOrder, showNotification]);

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
