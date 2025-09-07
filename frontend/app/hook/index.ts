export { usePOSOrder } from "./usePOSOrder";
export type { OrderItem, Order, Notification } from "./usePOSOrder";
export { usePOSModals } from "./usePOSModals";
export type { Modal, ConfirmationData } from "./usePOSModals";

export {
  useApi,
  useCreateOrder,
  useGetOrders,
  useGetHeldOrders,
  useUpdateOrderStatus,
  useDeleteOrder,
  useOrdersSummary,
} from "./useApi";

export { useEmailReceipt } from "./useEmailReceipt";
export type { EmailConfig, ReceiptData } from "./useEmailReceipt";

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
  const orderManager = usePOSOrder();
  const modalManager = usePOSModals();
  const emailReceipt = useEmailReceipt(config.emailConfig);
  const clock = useClock();
  const customerInput = useCustomerInput();

  return {
    order: orderManager,
    modals: modalManager,

    receipt: emailReceipt,
    clock,
    customerInput,
  };
}
