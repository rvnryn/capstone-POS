// Main POS Hook - Combines all functionality
export { usePOSOrder } from "./usePOSOrder";
export type { OrderItem, Order, Notification } from "./usePOSOrder";

// Modal Management Hook
export { usePOSModals } from "./usePOSModals";
export type { Modal, ConfirmationData } from "./usePOSModals";

// API Hooks
export {
  useApi,
  useCreateOrder,
  useGetOrders,
  useGetHeldOrders,
  useUpdateOrderStatus,
  useDeleteOrder,
  useOrdersSummary,
} from "./useApi";

// Email Receipt Hook
export { useEmailReceipt } from "./useEmailReceipt";
export type { EmailConfig, ReceiptData } from "./useEmailReceipt";

// Utility Hooks
export {
  useClock,
  useCustomerInput,
  useKeyboardShortcuts,
  useLocalStorage,
  useDebounce,
  useToggle,
  usePrevious,
} from "./usePOSUtils";
export type { ClockState } from "./usePOSUtils";

// Combined POS Hook for easy integration
import { usePOSOrder } from "./usePOSOrder";
import { usePOSModals } from "./usePOSModals";
import { useEmailReceipt } from "./useEmailReceipt";
import { useClock, useCustomerInput } from "./usePOSUtils";

export interface POSConfig {
  emailConfig: {
    serviceId: string;
    templateId: string;
    publicKey: string;
  };
}

export function usePOS(config: POSConfig) {
  // Core functionality hooks
  const orderManager = usePOSOrder();
  const modalManager = usePOSModals();
  const emailReceipt = useEmailReceipt(config.emailConfig);
  const clock = useClock();
  const customerInput = useCustomerInput();

  return {
    // Order management
    order: orderManager,

    // Modal management
    modals: modalManager,

    // Email receipt
    receipt: emailReceipt,

    // Utilities
    clock,
    customerInput,
  };
}
