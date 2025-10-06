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
    discount: { type: null, isOpen: false },
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "cash" | "gcash"
  >("cash");
  const [gcashReference, setGcashReference] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [receiptType, setReceiptType] = useState<"print" | "email">("print");
  const [tempNotes, setTempNotes] = useState("");

  // Discount modal states
  const [discountType, setDiscountType] = useState("");
  const [discountMethod, setDiscountMethod] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [discountIdNumber, setDiscountIdNumber] = useState("");

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
    if (modalName === "discount") {
      setDiscountType("");
      setDiscountMethod("percentage");
      setDiscountValue("");
      setDiscountReason("");
      setDiscountIdNumber("");
    }
  }, []);

  const closeAllModals = useCallback(() => {
    Object.keys(modals).forEach((modalName) => {
      closeModal(modalName);
    });
  }, [modals, closeModal]);

  const openPaymentModal = useCallback(() => {
    openModal("payment");
  }, [openModal]);

  const closePaymentModal = useCallback(() => {
    closeModal("payment");
  }, [closeModal]);

  const openConfirmationModal = useCallback(
    (confirmationData: ConfirmationData) => {
      openModal("confirmation", confirmationData);
    },
    [openModal]
  );

  const closeConfirmationModal = useCallback(() => {
    closeModal("confirmation");
  }, [closeModal]);

  const openHeldOrdersModal = useCallback(() => {
    openModal("heldOrders");
  }, [openModal]);

  const closeHeldOrdersModal = useCallback(() => {
    closeModal("heldOrders");
  }, [closeModal]);

  const openEmailReceiptModal = useCallback(
    (orderData?: any) => {
      openModal("emailReceipt", orderData);
    },
    [openModal]
  );

  const closeEmailReceiptModal = useCallback(() => {
    closeModal("emailReceipt");
  }, [closeModal]);

  const openReceiptSelectionModal = useCallback(
    (orderData?: any) => {
      openModal("receiptSelection", orderData);
    },
    [openModal]
  );

  const closeReceiptSelectionModal = useCallback(() => {
    closeModal("receiptSelection");
  }, [closeModal]);

  const openGcashReferenceModal = useCallback(() => {
    closePaymentModal();
    openModal("gcashReference");
  }, [openModal, closePaymentModal]);

  const closeGcashReferenceModal = useCallback(() => {
    closeModal("gcashReference");
  }, [closeModal]);

  const openCashPaymentModal = useCallback(() => {
    closePaymentModal();
    openModal("cashPayment");
  }, [openModal, closePaymentModal]);

  const closeCashPaymentModal = useCallback(() => {
    closeModal("cashPayment");
  }, [closeModal]);

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

  const openDiscountModal = useCallback(() => {
    openModal("discount");
  }, [openModal]);

  const closeDiscountModal = useCallback(() => {
    closeModal("discount");
  }, [closeModal]);

  const applyDiscount = useCallback(() => {
    // You may want to call a function to update the order with discount details here
    closeDiscountModal();
  }, [closeDiscountModal]);

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
    modals,

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

    discountType,
    setDiscountType,
    discountMethod,
    setDiscountMethod,
    discountValue,
    setDiscountValue,
    discountReason,
    setDiscountReason,
    discountIdNumber,
    setDiscountIdNumber,

    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    getModalData,
    isAnyModalOpen,

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
    openDiscountModal,
    closeDiscountModal,
    applyDiscount,
  };
}
