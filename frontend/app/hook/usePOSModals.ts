import { useState, useCallback } from "react";

export interface Modal {
  type:
    | "payment"
    | "confirmation"
    | "held-orders"
    | "email-receipt"
    | "receipt-selection"
    | "gcash-reference"
    | "cash-payment"
    | "notes"
    | null;
  isOpen: boolean;
  data?: any;
}

export interface ConfirmationData {
  title: string;
  message: string;
  type:
    | "void"
    | "newOrder"
    | "hold"
    | "takeout"
    | "deleteItem"
    | "deleteHeldOrder";
  onConfirm: () => void;
  onCancel?: () => void;
  itemId?: string;
  orderId?: number;
}

export function usePOSModals() {
  const [modals, setModals] = useState<Record<string, Modal>>({
    payment: { type: null, isOpen: false },
    confirmation: { type: null, isOpen: false },
    heldOrders: { type: null, isOpen: false },
    emailReceipt: { type: null, isOpen: false },
    receiptSelection: { type: null, isOpen: false },
    gcashReference: { type: null, isOpen: false },
    cashPayment: { type: null, isOpen: false },
    notes: { type: null, isOpen: false },
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "cash" | "gcash"
  >("cash");
  const [gcashReference, setGcashReference] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [receiptType, setReceiptType] = useState<"print" | "email">("print");
  const [tempNotes, setTempNotes] = useState("");

  const openModal = useCallback((modalName: string, data?: any) => {
    setModals((prev) => ({
      ...prev,
      [modalName]: {
        type: modalName as Modal["type"],
        isOpen: true,
        data,
      },
    }));
  }, []);

  const closeModal = useCallback((modalName: string) => {
    setModals((prev) => ({
      ...prev,
      [modalName]: {
        type: null,
        isOpen: false,
        data: undefined,
      },
    }));

    // Reset related state when closing modals
    if (modalName === "gcashReference") {
      setGcashReference("");
    }
    if (modalName === "cashPayment") {
      setCashAmount("");
    }
    if (modalName === "emailReceipt") {
      setCustomerEmail("");
    }
    if (modalName === "notes") {
      setTempNotes("");
    }
  }, []);

  const closeAllModals = useCallback(() => {
    Object.keys(modals).forEach((modalName) => {
      closeModal(modalName);
    });
  }, [modals, closeModal]);

  // Payment Modal
  const openPaymentModal = useCallback(() => {
    openModal("payment");
  }, [openModal]);

  const closePaymentModal = useCallback(() => {
    closeModal("payment");
  }, [closeModal]);

  // Confirmation Modal
  const openConfirmationModal = useCallback(
    (confirmationData: ConfirmationData) => {
      openModal("confirmation", confirmationData);
    },
    [openModal]
  );

  const closeConfirmationModal = useCallback(() => {
    closeModal("confirmation");
  }, [closeModal]);

  // Held Orders Modal
  const openHeldOrdersModal = useCallback(() => {
    openModal("heldOrders");
  }, [openModal]);

  const closeHeldOrdersModal = useCallback(() => {
    closeModal("heldOrders");
  }, [closeModal]);

  // Email Receipt Modal
  const openEmailReceiptModal = useCallback(
    (orderData?: any) => {
      openModal("emailReceipt", orderData);
    },
    [openModal]
  );

  const closeEmailReceiptModal = useCallback(() => {
    closeModal("emailReceipt");
  }, [closeModal]);

  // Receipt Selection Modal
  const openReceiptSelectionModal = useCallback(
    (orderData?: any) => {
      openModal("receiptSelection", orderData);
    },
    [openModal]
  );

  const closeReceiptSelectionModal = useCallback(() => {
    closeModal("receiptSelection");
  }, [closeModal]);

  // GCash Reference Modal
  const openGcashReferenceModal = useCallback(() => {
    closePaymentModal();
    openModal("gcashReference");
  }, [openModal, closePaymentModal]);

  const closeGcashReferenceModal = useCallback(() => {
    closeModal("gcashReference");
  }, [closeModal]);

  // Cash Payment Modal
  const openCashPaymentModal = useCallback(() => {
    closePaymentModal();
    openModal("cashPayment");
  }, [openModal, closePaymentModal]);

  const closeCashPaymentModal = useCallback(() => {
    closeModal("cashPayment");
  }, [closeModal]);

  // Notes Modal
  const openNotesModal = useCallback(
    (currentNotes: string = "") => {
      setTempNotes(currentNotes);
      openModal("notes");
    },
    [openModal]
  );

  const closeNotesModal = useCallback(() => {
    closeModal("notes");
  }, [closeModal]);

  // Utility functions
  const isAnyModalOpen = useCallback((): boolean => {
    return Object.values(modals).some((modal) => modal.isOpen);
  }, [modals]);

  const getModalData = useCallback(
    (modalName: string): any => {
      return modals[modalName]?.data;
    },
    [modals]
  );

  const isModalOpen = useCallback(
    (modalName: string): boolean => {
      return modals[modalName]?.isOpen || false;
    },
    [modals]
  );

  return {
    // Modal states
    modals,

    // Payment-related state
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    gcashReference,
    setGcashReference,
    cashAmount,
    setCashAmount,
    customerEmail,
    setCustomerEmail,
    receiptType,
    setReceiptType,
    tempNotes,
    setTempNotes,

    // Generic modal functions
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    getModalData,
    isAnyModalOpen,

    // Specific modal functions
    openPaymentModal,
    closePaymentModal,
    openConfirmationModal,
    closeConfirmationModal,
    openHeldOrdersModal,
    closeHeldOrdersModal,
    openEmailReceiptModal,
    closeEmailReceiptModal,
    openReceiptSelectionModal,
    closeReceiptSelectionModal,
    openGcashReferenceModal,
    closeGcashReferenceModal,
    openCashPaymentModal,
    closeCashPaymentModal,
    openNotesModal,
    closeNotesModal,
  };
}
