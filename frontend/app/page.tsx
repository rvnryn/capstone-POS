"use client";
import { useState, useEffect } from "react";
import { usePOS, OrderItem, Order } from "./hook";

export default function POS() {
  // State for managing order numbers (hydration-safe)
  const [orderNumbers, setOrderNumbers] = useState<Record<number, string>>({});
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    // Load existing order mappings from localStorage
    if (typeof window !== "undefined") {
      const orderMapping = JSON.parse(
        localStorage.getItem("orderMapping") || "{}"
      );
      setOrderNumbers(orderMapping);
    }
  }, []);

  // Function to check and reset daily order counter at 7 AM
  const checkDailyReset = () => {
    if (typeof window === "undefined") return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentDateString = now.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Get last reset date from localStorage
    const lastResetDate = localStorage.getItem("lastOrderResetDate");

    // Check if we need to reset (different date and current time is 7 AM or later)
    const needsReset = lastResetDate !== currentDateString && currentHour >= 7;

    if (needsReset) {
      // Reset order counter to 0 (so next order will be 001)
      localStorage.setItem("orderCounter", "0");
      localStorage.setItem("orderMapping", "{}");
      localStorage.setItem("lastOrderResetDate", currentDateString);

      // Clear the order numbers state
      setOrderNumbers({});

      console.log(
        `Order counter reset at ${now.toLocaleString()} - Starting fresh with order #001`
      );
    }
  };

  // Check for daily reset on component mount and periodically
  useEffect(() => {
    if (isClient) {
      // Check immediately when component mounts
      checkDailyReset();

      // Set up interval to check every 30 minutes for the daily reset
      const resetInterval = setInterval(checkDailyReset, 30 * 60 * 1000);

      return () => clearInterval(resetInterval);
    }
  }, [isClient]);

  // Utility function to generate sequential order numbers (hydration-safe)
  const getSequentialOrderNumber = (orderId?: number) => {
    // For current orders in progress, show the next available order number
    if (!orderId) {
      if (!isClient) {
        return "001"; // Default during SSR
      }
      // Check for daily reset before showing order number
      checkDailyReset();

      // Show what the next order number would be
      const currentCounter = parseInt(
        localStorage.getItem("orderCounter") || "0",
        10
      );
      const nextCounter = currentCounter + 1;
      return String(nextCounter).padStart(3, "0");
    }

    // During server-side rendering or before client hydration
    if (!isClient) {
      return "001";
    }

    // Check for daily reset before assigning new order numbers
    checkDailyReset();

    // If this order ID already has a sequential number, return it
    if (orderNumbers[orderId]) {
      return orderNumbers[orderId];
    }

    // Generate new sequential number
    const currentCounter = parseInt(
      localStorage.getItem("orderCounter") || "0",
      10
    );
    const nextCounter = currentCounter + 1;
    const sequentialNumber = String(nextCounter).padStart(3, "0");

    // Store the mapping and update counter
    const newOrderNumbers = { ...orderNumbers, [orderId]: sequentialNumber };
    setOrderNumbers(newOrderNumbers);
    localStorage.setItem("orderMapping", JSON.stringify(newOrderNumbers));
    localStorage.setItem("orderCounter", nextCounter.toString());

    return sequentialNumber;
  };

  // Initialize the POS system with hooks
  const pos = usePOS({
    emailConfig: {
      serviceId: "service_7m4ex1k",
      templateId: "template_g6hu7bb",
      publicKey: "UBJFFO4Xb6aSN41Tm",
    },
  });

  // Local state for menu and category selection (since we're keeping menu hardcoded)
  const [selectedCategory, setSelectedCategory] = useState("Rice Toppings");

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: null as (() => void) | null,
    type: "default" as "default" | "danger" | "warning",
  });

  const categories = [
    "Rice Toppings",
    "Sizzlers",
    "Soup & Noodles",
    "Beverages",
    "Desserts",
    "Extras",
  ];

  const menuItems = {
    "Rice Toppings": [
      {
        id: "1",
        name: "BagnetSilog",
        price: 170,
        description: "Crispy bagnet with rice and egg",
      },
      {
        id: "2",
        name: "Bagnet Bagoong Rice",
        price: 175,
        description: "Bagnet with bagoong rice",
      },
      {
        id: "3",
        name: "TapaLangit Nawa (Angus Beef w/ Tendon)",
        price: 250,
        description: "Premium Angus beef tapa with tendon",
      },
      {
        id: "4",
        name: "KKB (Kare-Kareng Bagnet)",
        price: 185,
        description: "Bagnet in rich kare-kare sauce",
      },
      {
        id: "5",
        name: "Triple Bypass (Bagnet, Chicken Skin, Chicharon)",
        price: 190,
        description: "Ultimate crispy combo platter",
      },
      {
        id: "6",
        name: "High Blood (Crispy Dinuguan)",
        price: 175,
        description: "Crispy version of the classic dinuguan",
      },
      {
        id: "7",
        name: "T.B. (Talong at Binagoongan)",
        price: 270,
        description: "Eggplant and binagoongan rice bowl",
      },
      {
        id: "8",
        name: "CPR (Crispy Pata Rice)",
        price: 630,
        description: "Crispy pork leg with rice",
      },
      {
        id: "9",
        name: "Code Red (Crispy Bicol Express)",
        price: 185,
        description: "Crispy take on spicy Bicol Express",
      },
    ],
    Sizzlers: [
      {
        id: "10",
        name: "Bagnet Sisig",
        price: 190,
        description: "Sizzling bagnet sisig on hot plate",
      },
      {
        id: "11",
        name: "Beef Pares",
        price: 190,
        description: "Sweet and savory braised beef",
      },
      {
        id: "12",
        name: "Mild Stroke (Pares w/ Bone Marrow + Unli Rice)",
        price: 290,
        description: "Beef pares with bone marrow and unlimited rice",
      },
      {
        id: "13",
        name: "Brain Damage (Sizzling Bulalo Steak + Unli Rice)",
        price: 300,
        description: "Sizzling bulalo steak with unlimited rice",
      },
      {
        id: "14",
        name: "Last Supper (Bulalo Steak w/ Tendon + Unli Rice)",
        price: 315,
        description: "Bulalo steak with tendon and unlimited rice",
      },
      {
        id: "15",
        name: "Sizzling Garlic Rice",
        price: 195,
        description: "Fragrant garlic rice on sizzling plate",
      },
      {
        id: "16",
        name: "Liemposuction (Liempo, Java Rice, and Kimchi)",
        price: 210,
        description: "Grilled liempo with java rice and kimchi",
      },
      {
        id: "17",
        name: "Liemphoma (Sizzling Breaded Liempo)",
        price: 210,
        description: "Crispy breaded liempo on sizzling plate",
      },
    ],
    "Soup & Noodles": [
      {
        id: "18",
        name: "Final Destination (Bulalo)",
        price: 270,
        description: "Rich and hearty bone marrow soup",
      },
      {
        id: "19",
        name: "Asim-Tomatic (Sinigang na Baka w/ Tendon)",
        price: 280,
        description: "Sour beef soup with tender tendon",
      },
      {
        id: "20",
        name: "The Goutfather (Papaitan w/ Bone Marrow)",
        price: 200,
        description: "Traditional bitter soup with bone marrow",
      },
      {
        id: "21",
        name: "PetmaLOMI (7 Toppings)",
        price: 160,
        description: "Thick noodle soup with seven toppings",
      },
      {
        id: "22",
        name: "For Long Life (Pansit Patong)",
        price: 230,
        description: "Layered noodles for good fortune",
      },
      {
        id: "23",
        name: "Palabok Overlog (Pansit Luglog)",
        price: 200,
        description: "Rice noodles with thick shrimp sauce",
      },
    ],
    Beverages: [
      {
        id: "37",
        name: "Coke",
        price: 30,
        description: "Classic Coca-Cola",
      },
      {
        id: "38",
        name: "Coke Zero",
        price: 60,
        description: "Zero sugar Coca-Cola",
      },
      {
        id: "39",
        name: "Royal",
        price: 30,
        description: "Orange-flavored soft drink",
      },
      {
        id: "40",
        name: "Sprite",
        price: 30,
        description: "Lemon-lime soda",
      },
      {
        id: "41",
        name: "Mountain Dew",
        price: 30,
        description: "Citrus-flavored energy drink",
      },
      {
        id: "42",
        name: "Pineapple Juice",
        price: 50,
        description: "Fresh tropical pineapple juice",
      },
      {
        id: "43",
        name: "House Blend Iced Tea",
        price: 60,
        description: "Signature refreshing iced tea",
      },
      {
        id: "44",
        name: "Cucumber Iced Tea",
        price: 60,
        description: "Cooling cucumber-infused iced tea",
      },
      {
        id: "45",
        name: "Bottled Water",
        price: 25,
        description: "Pure drinking water",
      },
    ],
    Desserts: [
      {
        id: "24",
        name: "Lecheng Saging (Saba, Leche Flan, and Saging Con Yelo)",
        price: 140,
        description: "Banana and leche flan dessert combo",
      },
      {
        id: "25",
        name: "Lecheng Mais (Leche Flan & Mais Con Yelo)",
        price: 120,
        description: "Corn and leche flan sweet treat",
      },
      {
        id: "26",
        name: "Lecheng Coffee Jelly (Coffee Jelly, Leche Flan, & Sago Con Yelo)",
        price: 130,
        description: "Coffee jelly with leche flan and sago",
      },
      {
        id: "27",
        name: "Nagkanda Leche-Leche (Saba, Mais, Coffee Jelly, Leche Flan, & Mais Con Yelo)",
        price: 180,
        description: "Ultimate dessert combo with all the fixings",
      },
    ],
    Extras: [
      {
        id: "28",
        name: "Longpia (Jumbo Lumpiang Gulay)",
        price: 60,
        description: "Large vegetable spring rolls",
      },
      {
        id: "29",
        name: "Rest in Fish (Crispy Tawilis)",
        price: 100,
        description: "Crispy fried small fish delicacy",
      },
      {
        id: "30",
        name: "Plain Rice",
        price: 30,
        description: "Steamed white rice",
      },
      {
        id: "31",
        name: "Garlic Rice",
        price: 35,
        description: "Fragrant garlic fried rice",
      },
      {
        id: "32",
        name: "Bagoong Rice",
        price: 40,
        description: "Rice with savory shrimp paste",
      },
      {
        id: "33",
        name: "Java Rice",
        price: 40,
        description: "Turmeric-colored seasoned rice",
      },
      {
        id: "34",
        name: "Ensalada",
        price: 10,
        description: "Fresh vegetable salad",
      },
      {
        id: "35",
        name: "Kare Kare Sauce",
        price: 30,
        description: "Rich peanut sauce",
      },
      {
        id: "36",
        name: "Chili Sauce",
        price: 10,
        description: "Spicy chili condiment",
      },
    ],
  };

  // Helper functions using hooks
  const addToOrder = (item: { id: string; name: string; price: number }) => {
    console.log("Adding item to order:", item);
    pos.order.addItemToOrder({
      name: item.name,
      quantity: 1,
      price: item.price,
    });
  };

  // Confirmation helpers
  const showConfirmation = (
    title: string,
    message: string,
    action: () => void,
    type: "default" | "danger" | "warning" = "default"
  ) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      action,
      type,
    });
  };

  const closeConfirmation = () => {
    setConfirmationModal({
      isOpen: false,
      title: "",
      message: "",
      action: null,
      type: "default",
    });
  };

  const handleConfirmAction = () => {
    if (confirmationModal.action) {
      confirmationModal.action();
    }
    closeConfirmation();
  };

  const removeFromOrder = (id: string) => {
    pos.order.removeItemFromOrder(id);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Find the item to get its name for confirmation
      const item = pos.order.currentOrder.items.find((item) => item.id === id);
      if (item) {
        showConfirmation(
          "REMOVE ITEM",
          `Remove "${item.name}" from the order?`,
          () => pos.order.updateItemQuantity(id, 0),
          "warning"
        );
        return;
      }
    }
    pos.order.updateItemQuantity(id, newQuantity);
  };

  const showPaymentOptions = () => {
    if (pos.order.currentOrder.items.length === 0) {
      pos.order.showNotification(
        "Please add items to the order before processing payment",
        "error"
      );
      return;
    }
    showConfirmation(
      "PROCESS PAYMENT",
      `Process payment for ₱${pos.order.currentOrder.total.toFixed(2)} with ${
        pos.order.currentOrder.items.length
      } items?`,
      () => pos.modals.openPaymentModal(),
      "default"
    );
  };

  const confirmPayment = async (paymentMethod: "cash" | "gcash") => {
    pos.modals.setSelectedPaymentMethod(paymentMethod);
    pos.modals.closePaymentModal();

    if (paymentMethod === "gcash") {
      pos.modals.openGcashReferenceModal();
      return;
    }

    if (paymentMethod === "cash") {
      pos.modals.openCashPaymentModal();
      return;
    }

    // For other payment methods, process immediately
    await processPayment(paymentMethod);
  };

  const processPayment = async (
    paymentMethod: string,
    reference?: string,
    amountReceived?: number,
    changeAmount?: number,
    receiptEmail?: string
  ) => {
    const completedOrder = await pos.order.completeOrder(
      paymentMethod,
      reference,
      amountReceived,
      changeAmount,
      receiptEmail
    );

    if (completedOrder) {
      // Order was successfully completed
      console.log("Order completed:", completedOrder);

      // Open receipt selection modal after successful payment
      pos.modals.openReceiptSelectionModal(completedOrder);
    }
  };

  const handleGcashConfirm = async () => {
    if (!pos.modals.gcashReference.trim()) {
      pos.order.showNotification(
        "Please enter GCash reference number",
        "error"
      );
      return;
    }

    pos.modals.closeGcashReferenceModal();
    await processPayment("gcash", pos.modals.gcashReference.trim());
  };

  const handleCashConfirm = async () => {
    const amount = parseFloat(pos.modals.cashAmount);
    const total = pos.order.currentOrder.total;

    if (isNaN(amount) || amount <= 0) {
      pos.order.showNotification("Please enter a valid amount", "error");
      return;
    }

    if (amount < total) {
      pos.order.showNotification("Insufficient amount received", "error");
      return;
    }

    const change = amount - total;
    if (change > 0) {
      pos.order.showNotification(`Change: ₱${change.toFixed(2)}`, "success");
    }

    pos.modals.closeCashPaymentModal();
    await processPayment(
      "cash",
      `₱${amount.toFixed(2)} received`,
      amount,
      change
    );
  };

  const handleHoldOrder = async () => {
    if (pos.order.currentOrder.items.length === 0) {
      pos.order.showNotification("No items to hold", "error");
      return;
    }
    showConfirmation(
      "HOLD ORDER",
      `Hold current order (${pos.order.currentOrder.customer}) with ${pos.order.currentOrder.items.length} items?`,
      async () => await pos.order.holdOrder(),
      "default"
    );
  };

  const sendEmailReceipt = async () => {
    if (!pos.modals.customerEmail.trim()) {
      pos.order.showNotification("Please enter customer email", "error");
      return;
    }

    const receiptData = pos.receipt.generateReceiptData(
      pos.modals.getModalData("emailReceipt") || pos.order.currentOrder,
      pos.modals.customerEmail,
      pos.modals.selectedPaymentMethod
    );

    const success = await pos.receipt.sendEmailReceipt(receiptData);

    if (success) {
      pos.order.showNotification("Receipt sent successfully!", "success");
      pos.modals.closeEmailReceiptModal();
    } else {
      // Show the specific error from the email service
      const errorMessage = pos.receipt.sendError || "Failed to send email";
      pos.order.showNotification(errorMessage, "error");
    }
  };

  const handlePrintReceipt = (orderData: any) => {
    pos.modals.openModal("printReceipt", orderData); // Open the correct print receipt modal
  };

  if (pos.modals.isModalOpen("printReceipt")) {
    const orderData = pos.modals.getModalData("printReceipt");
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 max-w-xs sm:max-w-md w-full border-2 border-gray-300 font-mono">
          <div className="text-center mb-2">
            <div className="text-black font-bold text-lg">🖨️ RECEIPT</div>
            <div className="text-xs text-black">Cardiac Delights POS</div>
            <div className="text-xs text-black mb-2">
              {new Date().toLocaleString()}
            </div>
            <div className="border-b border-gray-400 my-2" />
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold">Order #</span>
              <span className="text-black">
                {getSequentialOrderNumber(orderData?.id)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold text-black">Customer</span>
              <span className="text-black">{orderData?.customer}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold text-black">Type</span>
              <span className="text-black">{orderData?.type}</span>
            </div>
          </div>
          <div className="border-b border-gray-400 my-2" />
          <div className="mb-2">
            <div className="font-bold text-xs mb-1 text-black">Items:</div>
            <div className="space-y-1 text-black">
              {orderData?.items?.map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="flex justify-between text-xs text-black"
                >
                  <span className="text-black">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-black">₱{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-b border-gray-400 my-2" />
          <div className="mb-2 text-xs">
            <div className="flex justify-between">
              <span className="text-black">Subtotal</span>
              <span className="text-black">
                ₱{orderData?.subtotal?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>VAT (incl.)</span>
              <span className="text-black">₱{orderData?.vat?.toFixed(2)}</span>
            </div>
            {orderData?.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span className="text-black">
                  -₱{orderData?.discount?.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-gray-400 mt-2 pt-1 text-base text-black">
              <span>Total</span>
              <span className="text-black">
                ₱{orderData?.total?.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="border-b border-gray-400 my-2" />
          <div className="text-center text-xs text-black mb-2">
            Thank you for dining with us!
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                pos.order.showNotification(
                  "Receipt sent to printer",
                  "success"
                );
                pos.modals.closeModal("printReceipt");
              }}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded"
            >
              Print
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showNotesModal = () => {
    pos.modals.openNotesModal(pos.order.currentOrder.notes || "");
  };

  const saveNotes = () => {
    pos.order.updateOrderNotes(pos.modals.tempNotes);
    pos.modals.closeNotesModal();
  };

  const startEditingCustomer = () => {
    pos.customerInput.startEditing(pos.order.currentOrder.customer);
  };

  const saveCustomerName = () => {
    const newName = pos.customerInput.saveCustomerName();
    pos.order.updateCustomerInfo(newName, pos.order.currentOrder.type);
  };

  const cancelEditingCustomer = () => {
    pos.customerInput.cancelEditing();
  };

  const handleVoidOrder = () => {
    if (pos.order.currentOrder.items.length === 0) {
      pos.order.showNotification("No items to void", "error");
      return;
    }
    showConfirmation(
      "VOID ORDER",
      `Are you sure you want to void this order with ${pos.order.currentOrder.items.length} items? This action cannot be undone.`,
      () => pos.order.voidOrder(),
      "danger"
    );
  };

  const handleTakeoutOrder = () => {
    if (pos.order.currentOrder.items.length === 0) {
      pos.order.showNotification("No items for takeout", "error");
      return;
    }
    showConfirmation(
      "TAKEOUT ORDER",
      `Mark this order as TAKEOUT and proceed to payment?`,
      () => {
        pos.order.updateCustomerInfo(
          pos.order.currentOrder.customer,
          "Takeout"
        );
        pos.order.showNotification("Order marked as TAKEOUT", "success");
        setTimeout(() => showPaymentOptions(), 1000);
      },
      "default"
    );
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    showConfirmation(
      "REMOVE ITEM",
      `Remove "${itemName}" from the order?`,
      () => removeFromOrder(itemId),
      "warning"
    );
  };

  const handleRetrieveHeldOrder = (order: Order, index: number) => {
    if (pos.order.currentOrder.items.length > 0) {
      showConfirmation(
        "RETRIEVE HELD ORDER",
        `Current order has ${pos.order.currentOrder.items.length} items. Retrieving Order #${order.id} (${order.customer}) will replace the current order. Continue?`,
        () => {
          pos.order.retrieveHeldOrder(order);
          pos.modals.closeHeldOrdersModal();
        },
        "warning"
      );
    } else {
      pos.order.retrieveHeldOrder(order);
      pos.modals.closeHeldOrdersModal();
    }
  };

  const handleDeleteHeldOrder = (order: Order, index: number) => {
    showConfirmation(
      "DELETE HELD ORDER",
      `Permanently delete Order #${order.id} (${order.customer}) with ${order.items.length} items? This cannot be undone.`,
      () => pos.order.deleteHeldOrder(order.id!), // Pass the actual order ID, not the array index
      "danger"
    );
  };

  // Get menu items for selected category
  const filteredMenuItems =
    menuItems[selectedCategory as keyof typeof menuItems] || [];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col xl:flex-row min-h-screen bg-gradient-to-br from-black/95 to-slate-800 text-yellow-400 font-mono relative overflow-hidden">
      {/* Elegant Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, rgba(250, 204, 21, 0.15) 1px, transparent 0)",
            backgroundSize: "1.875rem 1.875rem",
          }}
        />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg shadow-yellow-400/20 pointer-events-none z-30"></div>

      {/* Notification System */}
      {pos.order.notification && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2">
          <div
            className={`px-8 py-4 rounded-xl shadow-xl text-white flex items-center gap-3 min-w-[300px] ${
              pos.order.notification.type === "success"
                ? "bg-green-600"
                : pos.order.notification.type === "error"
                ? "bg-red-600"
                : "bg-blue-600"
            }`}
          >
            <div className="flex items-center gap-3 xs:gap-4">
              <div className="w-7 xs:w-8 h-7 xs:h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                {pos.order.notification.type === "success" && (
                  <span className="text-white text-sm font-bold">✓</span>
                )}
                {pos.order.notification.type === "error" && (
                  <span className="text-white text-sm font-bold">✗</span>
                )}
                {pos.order.notification.type === "info" && (
                  <span className="text-white text-sm font-bold">●</span>
                )}
              </div>
              <span className="font-semibold text-sm xs:text-base sm:text-lg leading-tight">
                {pos.order.notification.message}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Left Panel - Terminal Order Display */}
      <div className="w-full xl:w-1/3 bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-sm border-r-0 xl:border-r-2 border-b-2 xl:border-b-0 border-yellow-400/20 flex flex-col font-mono relative z-10 min-h-0 flex-1">
        {/* Terminal Status Bar */}
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-black px-2 sm:px-4 py-1 sm:py-2 font-bold uppercase tracking-wider text-xs sm:text-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="hidden sm:inline">◆ CASHIER TERMINAL ◆</span>
            <span className="sm:hidden">◆ POS ◆</span>
            <span className="hidden md:inline">READY</span>
            <span className="text-xs sm:text-sm">
              {formatTime(pos.clock.currentTime)}
            </span>
          </div>
        </div>

        {/* Order Header */}
        <div className="p-2 sm:p-4 border-b-2 border-yellow-400/30 bg-slate-800/50 backdrop-blur-sm flex-shrink-0">
          <div className="text-center mb-2 sm:mb-8 relative">
            <div className="text-yellow-400 font-bold text-sm sm:text-lg border-2 border-yellow-400 bg-slate-900/50 px-2 sm:px-4 py-1 sm:py-2 shadow-lg inline-block">
              <span className="hidden sm:inline">
                ═══ ORDER #{getSequentialOrderNumber(pos.order.currentOrder.id)}{" "}
                ═══
              </span>
              <span className="sm:hidden">
                ORDER #{getSequentialOrderNumber(pos.order.currentOrder.id)}
              </span>
            </div>
          </div>

          <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-yellow-400">CASHIER:</span>
              <span className="text-yellow-400 font-bold">SYSTEM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">CUSTOMER:</span>
              {pos.customerInput.isEditingCustomer ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    value={pos.customerInput.customerNameInput}
                    onChange={(e) =>
                      pos.customerInput.setCustomerNameInput(e.target.value)
                    }
                    onFocus={() => pos.customerInput.setCustomerNameInput("")}
                    className="bg-slate-900/90 border border-yellow-400/50 text-yellow-400 font-mono px-1 sm:px-2 py-0 text-xs w-20 sm:w-32 focus:outline-none focus:border-yellow-400 focus:bg-slate-800/90"
                    placeholder="Name..."
                    autoFocus
                  />
                  <button
                    onClick={saveCustomerName}
                    className="text-yellow-400 hover:text-yellow-300 text-xs font-bold"
                  >
                    ✓
                  </button>
                  <button
                    onClick={cancelEditingCustomer}
                    className="text-red-400 hover:text-red-300 text-xs font-bold"
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <span
                  className="text-yellow-400 font-bold cursor-pointer hover:text-yellow-300 border-b border-dotted border-yellow-400/50 truncate max-w-24 sm:max-w-32"
                  onClick={startEditingCustomer}
                  title="Click to edit customer name"
                >
                  {pos.order.currentOrder.customer}
                </span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-400">TYPE:</span>
              <span className="text-yellow-400 font-bold">
                {pos.order.currentOrder.type}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-400">TIME:</span>
              <span className="text-yellow-400 font-bold">
                {formatTime(pos.clock.currentTime)}
              </span>
            </div>
            {pos.order.currentOrder.notes && (
              <div className="flex flex-col">
                <span className="text-yellow-400">NOTES:</span>
                <span className="text-yellow-400/80 text-xs mt-1 break-words">
                  {pos.order.currentOrder.notes}
                </span>
              </div>
            )}
          </div>

          {/* Terminal Stats */}
          <div className="mt-2 sm:mt-4 grid grid-cols-3 gap-1 sm:gap-2 text-center text-xs">
            <div className="border border-yellow-400/30 bg-slate-800/30 p-1 sm:p-2">
              <div className="text-yellow-400 font-bold text-sm sm:text-lg">
                {pos.order.currentOrder.items.length}
              </div>
              <div className="text-yellow-400/80 text-xs">ITEMS</div>
            </div>
            <div className="border border-yellow-400/30 bg-slate-800/30 p-1 sm:p-2">
              <div className="text-yellow-400 font-bold text-sm sm:text-lg">
                ₱{pos.order.currentOrder.subtotal.toFixed(0)}
              </div>
              <div className="text-yellow-400/80 text-xs">SUB</div>
            </div>
            <div className="border border-yellow-400/30 bg-slate-800/30 p-1 sm:p-2">
              <div className="text-yellow-400 font-bold text-sm sm:text-lg">
                ₱{pos.order.currentOrder.total.toFixed(0)}
              </div>
              <div className="text-yellow-400/80 text-xs">TOTAL</div>
            </div>
          </div>
        </div>

        {/* Terminal Order Items Display */}
        <div className="flex-1 p-2 sm:p-4 overflow-y-auto bg-slate-900/30 backdrop-blur-sm min-h-0">
          {/* Terminal Header */}
          <div className="text-center mb-2 sm:mb-4 p-2 sm:p-8 text-yellow-400 font-bold border-b border-yellow-400/30 pb-2 text-xs sm:text-base">
            │ ORDER DETAILS │
          </div>

          {pos.order.currentOrder.items.length === 0 ? (
            <div className="text-center text-yellow-400/80 py-4 sm:py-8">
              <div className="border border-yellow-400/30 bg-slate-800/30 p-4 sm:p-8 mb-4">
                <div className="text-xl sm:text-2xl mb-2 sm:mb-4">╳</div>
                <div className="text-xs sm:text-sm font-bold mb-1 sm:mb-2">
                  NO ITEMS ADDED
                </div>
                <div className="text-xs text-yellow-400/60">
                  SELECT ITEMS FROM MENU TO START ORDER
                </div>
              </div>
              <div className="text-xs text-yellow-400 blinking">
                ► READY TO TAKE ORDER ◄
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Terminal Table Header */}
              <div className="text-xs text-yellow-400/80 border-b border-yellow-400/30 pb-1 mb-2 font-bold">
                # ITEM NAME QTY UNIT TOTAL ACTION
              </div>

              {pos.order.currentOrder.items.map((item, index) => (
                <div
                  key={item.id}
                  className="text-sm font-mono bg-slate-800/50 border border-yellow-400/30 hover:bg-slate-700/50 transition-all text-yellow-400"
                >
                  <div className="flex items-center justify-between p-2 space-x-2">
                    {/* Item Number */}
                    <div className="text-yellow-400 font-bold w-6 text-center">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    {/* Item Name */}
                    <div className="text-yellow-400 truncate flex-1 text-left min-w-0">
                      {item.name}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-0.5 gap-3">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-3 h-3 bg-red-600/80 text-yellow-400 text-xs font-bold hover:bg-red-500 active:bg-red-700 border border-red-400 touch-manipulation cursor-pointer select-none active:scale-90 transition-all"
                      >
                        -
                      </button>
                      <span className="text-yellow-400 font-bold w-6 text-center bg-slate-900/50 border border-yellow-400/30 px-10 text-xs">
                        {String(item.quantity).padStart(2, "0")}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-3 h-3 bg-green-600/80 text-yellow-400 text-xs font-bold hover:bg-green-500 active:bg-green-700 border border-green-400 touch-manipulation cursor-pointer select-none active:scale-90 transition-all"
                      >
                        +
                      </button>
                    </div>

                    {/* Unit Price */}
                    <div className="text-yellow-400 text-xs w-12 text-center">
                      ₱{item.price.toFixed(0)}
                    </div>

                    {/* Total Price */}
                    <div className="text-yellow-400 font-bold text-sm w-16 text-center">
                      ₱{item.total.toFixed(2)}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="text-yellow-400 bg-red-600/80 hover:bg-red-600 active:bg-red-700 active:text-yellow-300 text-xs font-bold px-2 py-1 border border-red-400 touch-manipulation cursor-pointer select-none active:scale-90 transition-all ml-2"
                    >
                      DEL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Terminal Footer - Order Summary */}
        <div className="p-4 border-t-2 border-yellow-400/30 bg-slate-800/50 backdrop-blur-sm">
          {/* Terminal Receipt Style */}
          <div className="border border-yellow-400/30 bg-slate-900/50 p-3 text-sm font-mono">
            <div className="text-center text-yellow-400 font-bold border-b border-yellow-400/30 pb-2 mb-3">
              ═══ RECEIPT PREVIEW ═══
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-yellow-400">SUBTOTAL:</span>
                <span className="text-yellow-400 font-bold">
                  ₱{pos.order.currentOrder.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-400">VAT (Included):</span>
                <span className="text-yellow-400 font-bold">
                  ₱{pos.order.currentOrder.vat.toFixed(2)}
                </span>
              </div>
              {pos.order.currentOrder.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-yellow-400">DISCOUNT:</span>
                  <span className="text-red-400 font-bold">
                    -₱{pos.order.currentOrder.discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-yellow-400/30 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-yellow-400 font-bold">TOTAL DUE:</span>
                  <span className="text-yellow-400 font-bold text-lg">
                    ₱{pos.order.currentOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal Action Buttons */}
          <div className="mt-2 sm:mt-4 space-y-1 sm:space-y-2 flex-shrink-0">
            <div
              className={`grid gap-1 sm:gap-2 ${
                pos.order.heldOrders.length > 0
                  ? "grid-cols-2 sm:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-3"
              }`}
            >
              <button
                onClick={handleVoidOrder}
                disabled={pos.order.currentOrder.items.length === 0}
                className="bg-gradient-to-br from-red-700/90 to-red-800/90 hover:from-red-600/90 hover:to-red-700/90 active:from-red-800/90 active:to-red-900/90 disabled:from-slate-700/50 disabled:to-slate-800/50 text-yellow-400 disabled:text-slate-500 px-2 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-bold border border-red-400/70 disabled:border-slate-600/50 transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95 min-h-[40px] sm:min-h-[50px]"
              >
                VOID
              </button>
              <button
                onClick={handleHoldOrder}
                disabled={pos.order.currentOrder.items.length === 0}
                className="bg-gradient-to-br from-slate-600/90 to-slate-700/90 hover:from-slate-500/90 hover:to-slate-600/90 active:from-slate-700/90 active:to-slate-800/90 disabled:from-slate-700/50 disabled:to-slate-800/50 text-yellow-400 disabled:text-slate-500 px-2 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-bold border border-slate-400/70 disabled:border-slate-600/50 transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95 min-h-[40px] sm:min-h-[50px]"
              >
                HOLD
              </button>
              <button
                onClick={showNotesModal}
                disabled={pos.order.currentOrder.items.length === 0}
                className="bg-gradient-to-br from-purple-600/90 to-purple-700/90 hover:from-purple-500/90 hover:to-purple-600/90 active:from-purple-700/90 active:to-purple-800/90 disabled:from-slate-700/50 disabled:to-slate-800/50 text-yellow-400 disabled:text-slate-500 px-2 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-bold border border-purple-400/70 disabled:border-slate-600/50 transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95 min-h-[40px] sm:min-h-[50px] relative"
                title="Add customer notes or special requests"
              >
                📝 NOTES
                {pos.order.currentOrder.notes && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
                )}
              </button>
              {/* Show HELD button only if there are held orders */}
              {pos.order.heldOrders.length > 0 && (
                <button
                  onClick={() => pos.modals.openHeldOrdersModal()}
                  className="bg-gradient-to-br from-blue-600/90 to-blue-700/90 hover:from-blue-500/90 hover:to-blue-600/90 active:from-blue-700/90 active:to-blue-800/90 text-yellow-400 px-2 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-bold border border-blue-400/70 transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95 min-h-[40px] sm:min-h-[50px] col-span-2 sm:col-span-1"
                  title="View held orders"
                >
                  <span className="hidden sm:inline">
                    HELD ({pos.order.heldOrders.length})
                  </span>
                  <span className="sm:hidden">HELD</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1 sm:gap-2">
              <button
                onClick={handleTakeoutOrder}
                disabled={pos.order.currentOrder.items.length === 0}
                className="bg-gradient-to-br from-orange-600/90 to-orange-700/90 hover:from-orange-500/90 hover:to-orange-600/90 active:from-orange-700/90 active:to-orange-800/90 disabled:from-slate-700/50 disabled:to-slate-800/50 text-yellow-400 disabled:text-slate-500 px-3 sm:px-6 py-3 sm:py-6 text-sm sm:text-base font-bold border border-orange-400/70 disabled:border-slate-600/50 transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95 min-h-[50px] sm:min-h-[60px]"
              >
                TAKEOUT
              </button>
              <button
                onClick={showPaymentOptions}
                disabled={
                  pos.order.isProcessing ||
                  pos.order.currentOrder.items.length === 0
                }
                className="bg-gradient-to-br from-green-600/90 to-green-700/90 hover:from-green-500/90 hover:to-green-600/90 active:from-green-700/90 active:to-green-800/90 disabled:from-slate-700/50 disabled:to-slate-800/50 text-yellow-400 disabled:text-slate-500 px-3 sm:px-6 py-3 sm:py-6 text-sm sm:text-base font-bold border border-green-400/70 disabled:border-slate-600/50 transition-all uppercase tracking-wider relative touch-manipulation cursor-pointer select-none active:scale-95 min-h-[50px] sm:min-h-[60px]"
              >
                {pos.order.isProcessing ? (
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border border-yellow-400 border-t-transparent animate-spin rounded-full"></div>
                    <span className="text-xs sm:text-base">
                      [PROCESSING...]
                    </span>
                  </div>
                ) : (
                  "PAY"
                )}
              </button>
            </div>
          </div>

          {/* Terminal Status */}
          <div className="mt-4 text-center text-xs bg-stone-50 text-black border border-black p-2">
            <div className="blinking">TERMINAL READY</div>
          </div>
        </div>
      </div>

      {/* Right Panel - Terminal Menu Interface */}
      <div className="w-full xl:w-2/3 bg-slate-900/70 backdrop-blur-sm flex flex-col font-mono relative z-10 min-h-0 flex-1">
        {/* Terminal Menu Header */}
        <div className="border-b-2 border-yellow-400/30 bg-slate-800/50 backdrop-blur-sm relative z-20 flex-shrink-0">
          {/* Terminal Title Bar */}
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-black px-2 sm:px-4 py-1 font-bold text-center uppercase tracking-wider text-xs sm:text-sm">
            <span className="hidden md:inline">
              ◆◆◆ MENU SELECTION TERMINAL ◆◆◆
            </span>
            <span className="md:hidden">◆ MENU ◆</span>
          </div>

          <div className="p-2 sm:p-6">
            <div className="text-center text-yellow-400 font-bold mb-3 sm:mb-6 text-2xl hidden sm:block">
              ◆ MENU ◆
            </div>

            {/* Category Selection */}
            <div className="mb-3 sm:mb-6">
              <div className="text-yellow-400 font-bold mb-2 sm:mb-4 text-center border border-yellow-400/50 bg-slate-900/50 p-1 sm:p-2 text-xs sm:text-sm">
                <span className="hidden sm:inline">
                  ═══ SELECT CATEGORY ═══ ({categories.length} AVAILABLE) ═══
                </span>
                <span className="sm:hidden">
                  CATEGORIES ({categories.length})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 overflow-hidden">
                {categories.map((category, index) => (
                  <button
                    key={category}
                    onClick={() => {
                      console.log("Category clicked:", category);
                      setSelectedCategory(category);
                    }}
                    className={`p-3 sm:p-6 text-xs sm:text-base font-bold border-2 transition-all uppercase tracking-wider min-h-[80px] sm:min-h-[120px] touch-manipulation cursor-pointer select-none active:scale-95 ${
                      selectedCategory === category
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-400/30 border-4"
                        : "bg-gradient-to-br from-slate-700/90 to-slate-800/90 text-yellow-400 border-yellow-400/30 hover:from-slate-600/90 hover:to-slate-700/90 hover:text-yellow-300 active:from-slate-800/90 active:to-slate-900/90"
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-bold text-sm sm:text-lg leading-tight">
                        {category}
                      </div>
                      <div className="text-sm mt-2 opacity-80">
                        {menuItems[category as keyof typeof menuItems]
                          ?.length || 0}{" "}
                        ITEMS
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Menu Items */}
        <div className="flex-1 overflow-y-auto bg-slate-900/70 backdrop-blur-sm relative z-10 min-h-0">
          <div className="p-2 sm:p-6 relative z-20">
            {/* Current Category Header */}
            <div className="mb-3 sm:mb-6">
              <div className="text-center text-yellow-400 font-bold border border-yellow-400/50 bg-slate-900/50 backdrop-blur-sm p-2 sm:p-3 text-xs sm:text-sm">
                <span className="hidden sm:block">
                  ◆ {selectedCategory.toUpperCase()} MENU ITEMS ◆
                </span>
                <span className="sm:hidden">
                  {selectedCategory.toUpperCase()}
                </span>
                <div className="text-xs mt-1 sm:mt-2 text-yellow-400/80">
                  {filteredMenuItems.length} ITEMS • CLICK TO ORDER
                </div>
              </div>
            </div>

            {filteredMenuItems.length === 0 ? (
              <div className="text-center text-yellow-400/80 py-12">
                <div className="border border-yellow-400/30 bg-slate-800/50 p-8">
                  <div className="text-4xl mb-4">⚠</div>
                  <div className="text-lg font-bold mb-2">NO ITEMS FOUND</div>
                  <div className="text-sm text-yellow-400/60">
                    CATEGORY "{selectedCategory.toUpperCase()}" IS EMPTY
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                {filteredMenuItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => addToOrder(item)}
                    className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-2 border-yellow-400/30 hover:from-slate-700/90 hover:to-slate-800/90 hover:border-yellow-400 active:from-yellow-600 active:to-yellow-700 transition-all p-2 sm:p-4 md:p-6 text-left group touch-manipulation cursor-pointer select-none active:scale-95 min-h-[120px] sm:min-h-[160px] md:min-h-[200px]"
                  >
                    <div className="space-y-1 sm:space-y-2 md:space-y-3">
                      {/* Item Number & Name */}
                      <div className="flex justify-between items-start">
                        <div className="text-xs sm:text-sm md:text-md bg-slate-900 text-yellow-400 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 font-bold rounded border border-yellow-400/30">
                          #{String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="text-xs sm:text-sm text-yellow-400 font-bold">
                          [ADD]
                        </div>
                      </div>

                      <div className="text-sm sm:text-base md:text-lg font-bold text-yellow-400 uppercase leading-tight min-h-[2rem] sm:min-h-[2.5rem] md:min-h-[3rem] flex items-center">
                        {item.name}
                      </div>

                      <div className="text-xs sm:text-sm text-yellow-400/80 leading-tight min-h-[1.5rem] sm:min-h-[2rem] md:min-h-[3rem] flex items-start overflow-hidden">
                        <span className="line-clamp-2 md:line-clamp-3">
                          {(item as any).description}
                        </span>
                      </div>

                      {/* Price Display */}
                      <div className="border-t border-yellow-400/30 pt-1 sm:pt-2 md:pt-3 mt-1 sm:mt-2 md:mt-3">
                        <div className="text-center">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400">
                            ₱{item.price.toFixed(2)}
                          </div>
                          <div className="text-xs sm:text-sm text-yellow-400/80">
                            UNIT PRICE
                          </div>
                        </div>
                      </div>

                      {/* Terminal Action Indicator */}
                      <div className="text-xs sm:text-sm text-center text-yellow-400 border border-yellow-400/50 bg-slate-900/30 py-1 sm:py-2 font-bold">
                        CLICK TO ADD TO ORDER
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Terminal Footer */}
          <div className=" bg-stone-50 p-4">
            <div className="text-center text-xs text-black">
              <div className="blinking">
                ◆ CLICK ITEMS TO ADD TO ORDER ◆ USE CATEGORIES TO BROWSE ◆
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Notification */}
      {pos.order.notification && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2">
          <div
            className={`px-8 py-4 rounded-xl shadow-xl text-white flex items-center gap-3 min-w-[300px] ${
              pos.order.notification.type === "success"
                ? "bg-green-600"
                : pos.order.notification.type === "error"
                ? "bg-red-600"
                : "bg-blue-600"
            }`}
          >
            <div className="flex items-center gap-3 xs:gap-4">
              <div className="w-7 xs:w-8 h-7 xs:h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                {pos.order.notification.type === "success" && (
                  <span className="text-white text-sm font-bold">✓</span>
                )}
                {pos.order.notification.type === "error" && (
                  <span className="text-white text-sm font-bold">✗</span>
                )}
                {pos.order.notification.type === "info" && (
                  <span className="text-white text-sm font-bold">●</span>
                )}
              </div>
              <span className="font-semibold text-sm xs:text-base sm:text-lg leading-tight">
                {pos.order.notification.message}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Selection Modal */}
      {pos.modals.isModalOpen("payment") && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm border-2 border-green-400 p-4 sm:p-8 md:p-16 max-w-xs sm:max-w-md w-full">
            <div className="text-center mb-4 sm:mb-6 md:mb-8">
              <div className="text-white font-bold text-sm sm:text-lg md:text-xl px-2 sm:px-4 py-1 sm:py-2 mb-2 sm:mb-4">
                ═══ SELECT PAYMENT METHOD ═══
              </div>
              <div className="text-white">
                <div className="text-sm sm:text-base">TOTAL AMOUNT DUE:</div>
                <div className="text-white font-bold text-lg sm:text-xl md:text-2xl">
                  ₱{pos.order.currentOrder.total.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={() => confirmPayment("cash")}
                className="w-full bg-green-800 hover:bg-green-700 active:bg-green-900 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-bold border border-green-400 transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95"
              >
                💵 CASH PAYMENT
              </button>

              <button
                onClick={() => confirmPayment("gcash")}
                className="w-full bg-blue-800 hover:bg-blue-700 active:bg-blue-900 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-bold border border-blue-400 transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95"
              >
                📱 GCASH PAYMENT
              </button>

              <button
                onClick={pos.modals.closePaymentModal}
                className="w-full bg-red-800 hover:bg-red-700 active:bg-red-900 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-bold border border-red-400 transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95"
              >
                ❌ CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GCash Reference Modal */}
      {pos.modals.isModalOpen("gcashReference") && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-gray-900 border-2 border-green-400 p-3 sm:p-4 md:p-6 rounded-lg shadow-xl max-w-xs sm:max-w-md w-full">
            <h3 className="text-green-400 text-sm sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 md:mb-4 text-center uppercase tracking-wide">
              📱 GCASH REFERENCE REQUIRED
            </h3>

            <p className="text-gray-300 mb-2 sm:mb-3 md:mb-4 text-center text-xs sm:text-sm">
              Enter the GCash reference number from the customer's transaction:
            </p>

            <input
              type="text"
              value={pos.modals.gcashReference}
              onChange={(e) => pos.modals.setGcashReference(e.target.value)}
              placeholder="Enter GCash Reference Number"
              className="w-full p-2 sm:p-3 mb-2 sm:mb-3 md:mb-4 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-400 text-xs sm:text-sm"
              autoFocus
            />

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={pos.modals.closeGcashReferenceModal}
                className="flex-1 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold border border-red-500 transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95"
              >
                ❌ CANCEL
              </button>
              <button
                onClick={handleGcashConfirm}
                disabled={!pos.modals.gcashReference.trim()}
                className={`flex-1 px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold border transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95 ${
                  pos.modals.gcashReference.trim()
                    ? "bg-green-700 hover:bg-green-600 active:bg-green-800 text-white border-green-500"
                    : "bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed"
                }`}
              >
                ✅ CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Payment Modal is handled by pos.modals and handleCashConfirm. */}
      {pos.modals.isModalOpen("cashPayment") && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 md:p-8">
          <div className="bg-gray-800 rounded-lg sm:rounded-xl md:rounded-2xl border border-green-700 p-4 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 text-green-400 text-center leading-tight">
              Cash Payment
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-300 mb-4 sm:mb-6 text-center leading-relaxed">
              Enter the amount received from customer:
            </p>

            {/* Order Total Display */}
            <div className="mb-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-300">Total Amount:</span>
                <span className="text-green-400 font-bold">
                  ₱{pos.order.currentOrder.total.toFixed(2)}
                </span>
              </div>
            </div>

            <input
              type="number"
              step="0.01"
              min="0"
              value={pos.modals.cashAmount}
              onChange={(e) => pos.modals.setCashAmount(e.target.value)}
              className="w-full p-3 sm:p-4 md:p-5 mb-4 bg-gray-700 border border-gray-600 rounded-lg sm:rounded-xl text-white text-sm sm:text-base md:text-lg leading-tight text-center"
              placeholder="0.00"
              autoFocus
            />

            {/* Change Calculation Display */}
            {pos.modals.cashAmount && (
              <div className="mb-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center text-sm sm:text-base mb-2">
                  <span className="text-gray-300">Amount Received:</span>
                  <span className="text-blue-400 font-bold">
                    ₱{parseFloat(pos.modals.cashAmount || "0").toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="text-gray-300">Change:</span>
                  <span
                    className={`font-bold ${
                      parseFloat(pos.modals.cashAmount || "0") >=
                      pos.order.currentOrder.total
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    ₱
                    {Math.max(
                      0,
                      parseFloat(pos.modals.cashAmount || "0") -
                        pos.order.currentOrder.total
                    ).toFixed(2)}
                  </span>
                </div>
                {parseFloat(pos.modals.cashAmount || "0") <
                  pos.order.currentOrder.total && (
                  <div className="mt-2 text-xs text-red-400 text-center">
                    Insufficient amount (₱
                    {(
                      pos.order.currentOrder.total -
                      parseFloat(pos.modals.cashAmount || "0")
                    ).toFixed(2)}{" "}
                    short)
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={pos.modals.closeCashPaymentModal}
                className="flex-1 p-3 sm:p-4 md:p-5 bg-red-700 hover:bg-red-600 rounded-lg sm:rounded-xl text-white font-medium text-sm sm:text-base md:text-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCashConfirm}
                className="flex-1 p-3 sm:p-4 md:p-5 bg-green-700 hover:bg-green-600 rounded-lg sm:rounded-xl text-white font-medium text-sm sm:text-base md:text-lg transition-all duration-200"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {pos.modals.isModalOpen("notes") && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-gray-900 border-2 border-purple-400 p-3 sm:p-4 md:p-6 rounded-lg shadow-xl max-w-xs sm:max-w-md w-full">
            <h3 className="text-purple-400 text-sm sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 md:mb-4 text-center uppercase tracking-wide">
              📝 CUSTOMER NOTES
            </h3>

            <p className="text-gray-300 mb-2 sm:mb-3 md:mb-4 text-center text-xs sm:text-sm">
              Add special requests or customer notes:
            </p>

            <textarea
              value={pos.modals.tempNotes}
              onChange={(e) => pos.modals.setTempNotes(e.target.value)}
              placeholder="Enter customer notes or special requests..."
              maxLength={200}
              rows={4}
              className="w-full p-2 sm:p-3 mb-2 sm:mb-3 md:mb-4 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 text-xs sm:text-sm resize-none"
              autoFocus
            />

            <div className="text-right mb-2 sm:mb-3 md:mb-4">
              <span className="text-gray-400 text-xs">
                {pos.modals.tempNotes.length}/200 characters
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={pos.modals.closeNotesModal}
                className="flex-1 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold border border-red-500 transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95"
              >
                ❌ CANCEL
              </button>
              <button
                onClick={saveNotes}
                className="flex-1 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold border border-purple-500 transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95"
              >
                ✅ SAVE NOTES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Selection Modal */}
      {pos.modals.isModalOpen("receiptSelection") && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 md:p-8">
          <div className="bg-gray-800 rounded-lg sm:rounded-xl md:rounded-2xl border border-green-700 p-4 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 text-green-400 text-center leading-tight">
              Receipt Options
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-300 mb-4 sm:mb-6 text-center leading-relaxed">
              How would you like to receive your receipt?
            </p>

            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Print Receipt Option */}
              <button
                onClick={() => {
                  const orderData = pos.modals.getModalData("receiptSelection");
                  pos.modals.closeReceiptSelectionModal();
                  handlePrintReceipt(orderData);
                }}
                className="w-full p-4 sm:p-5 md:p-6 bg-blue-700 hover:bg-blue-600 rounded-lg sm:rounded-xl text-white font-medium text-sm sm:text-base md:text-lg transition-all duration-200 flex items-center justify-center gap-3"
              >
                <span>🖨️</span>
                Print Receipt
              </button>

              {/* Email Receipt Option */}
              <button
                onClick={() => {
                  const orderData = pos.modals.getModalData("receiptSelection");
                  pos.modals.closeReceiptSelectionModal();
                  pos.modals.openEmailReceiptModal(orderData);
                }}
                className="w-full p-4 sm:p-5 md:p-6 bg-green-700 hover:bg-green-600 rounded-lg sm:rounded-xl text-white font-medium text-sm sm:text-base md:text-lg transition-all duration-200 flex items-center justify-center gap-3"
              >
                <span>📧</span>
                Email Receipt
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={pos.modals.closeReceiptSelectionModal}
                className="flex-1 p-3 sm:p-4 md:p-5 bg-gray-700 hover:bg-gray-600 rounded-lg sm:rounded-xl text-white font-medium text-sm sm:text-base md:text-lg transition-all duration-200"
              >
                Skip Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Receipt Modal - Fully Responsive */}
      {pos.modals.isModalOpen("emailReceipt") && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 md:p-8">
          <div className="bg-gray-800 rounded-lg sm:rounded-xl md:rounded-2xl border border-gray-700 p-4 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 text-white text-center leading-tight">
              Send E-Receipt
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-300 mb-4 sm:mb-6 text-center leading-relaxed">
              Enter customer email to send digital receipt:
            </p>
            <input
              type="email"
              value={pos.modals.customerEmail}
              onChange={(e) => pos.modals.setCustomerEmail(e.target.value)}
              className="w-full p-3 sm:p-4 md:p-5 mb-4 sm:mb-6 bg-gray-700 border border-gray-600 rounded-lg sm:rounded-xl text-white text-sm sm:text-base md:text-lg leading-tight"
              placeholder="customer@example.com"
              autoFocus
            />
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={sendEmailReceipt}
                disabled={pos.receipt.isSending}
                className="flex-1 p-3 sm:p-4 md:p-5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-lg sm:rounded-xl text-white font-medium text-sm sm:text-base md:text-lg transition-all duration-200 hover:scale-102"
              >
                {pos.receipt.isSending ? "Sending..." : "Send"}
              </button>
              <button
                onClick={pos.modals.closeEmailReceiptModal}
                className="flex-1 p-3 sm:p-4 md:p-5 bg-gray-600 hover:bg-gray-500 rounded-lg sm:rounded-xl text-white font-medium text-sm sm:text-base md:text-lg transition-all duration-200 hover:scale-102"
              >
                Cancel
              </button>
            </div>
            {pos.receipt.sendError && (
              <p className="text-red-400 text-xs sm:text-sm md:text-base mt-3 sm:mt-4 text-center leading-relaxed">
                {pos.receipt.sendError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Held Orders Modal */}
      {pos.modals.isModalOpen("heldOrders") && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm border-2 border-blue-400 p-3 sm:p-4 md:p-6 max-w-xs sm:max-w-xl md:max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-3 sm:mb-4 md:mb-6">
              <div className="text-blue-400 font-bold text-sm sm:text-lg md:text-xl border border-blue-400 px-2 sm:px-3 md:px-4 py-1 sm:py-2 mb-2 sm:mb-3 md:mb-4">
                📋 HELD ORDERS ({pos.order.heldOrders.length})
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {pos.order.heldOrders.map((order: Order, index: number) => (
                <div
                  key={`held-${order.id}-${index}`}
                  className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm border border-blue-400 p-2 sm:p-3 md:p-4 rounded"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-2 sm:mb-3">
                    <div className="mb-2 sm:mb-0">
                      <div className="text-white font-bold text-sm sm:text-base">
                        ORDER #{getSequentialOrderNumber(order.id)}
                      </div>
                      <div className="text-white text-xs sm:text-sm">
                        Customer: {order.customer}
                      </div>
                      <div className="text-white text-xs sm:text-sm">
                        Held at: {order.heldAt}
                      </div>
                      <div className="text-white text-xs sm:text-sm">
                        Items: {order.items.length} | Total: ₱
                        {order.total.toFixed(2)}
                      </div>
                      {order.notes && (
                        <div className="text-yellow-400/80 text-xs mt-1">
                          📝 Notes: {order.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() =>
                          handleRetrieveHeldOrder(
                            pos.order.heldOrders[index],
                            index
                          )
                        }
                        className="bg-green-800 hover:bg-green-700 active:bg-green-900 text-white px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold border border-green-400 transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95 w-full sm:w-auto"
                      >
                        📤 RETRIEVE
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteHeldOrder(
                            pos.order.heldOrders[index],
                            index
                          )
                        }
                        className="bg-red-800 hover:bg-red-700 active:bg-red-900 text-white px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold border border-red-400 transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95 w-full sm:w-auto"
                      >
                        🗑️ DELETE
                      </button>
                    </div>
                  </div>

                  {/* Show held order items */}
                  <div className="border-t border-gray-600 pt-1 sm:pt-2 mt-1 sm:mt-2">
                    <div className="text-white text-xs font-bold mb-1">
                      ITEMS:
                    </div>
                    <div className="space-y-1">
                      {order.items.map((item: OrderItem, itemIndex: number) => (
                        <div
                          key={`held-item-${item.id}-${itemIndex}`}
                          className="flex justify-between text-xs"
                        >
                          <span className="text-white">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-white">
                            ₱{item.total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 sm:mt-4 md:mt-6">
              <button
                onClick={pos.modals.closeHeldOrdersModal}
                className="w-full bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm hover:bg-gray-700 active:bg-gray-900 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-bold border border-gray-400 transition-all uppercase tracking-wider touch-manipulation cursor-pointer select-none active:scale-95"
              >
                ❌ CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className={`bg-gradient-to-br from-gray-900 to-black border-2 shadow-lg font-mono p-6 max-w-md w-full mx-4 ${
              confirmationModal.type === "danger"
                ? "border-red-400 shadow-red-400/30"
                : confirmationModal.type === "warning"
                ? "border-yellow-400 shadow-yellow-400/30"
                : "border-blue-400 shadow-blue-400/30"
            }`}
          >
            <div
              className={`px-4 py-2 text-sm font-bold mb-4 ${
                confirmationModal.type === "danger"
                  ? "bg-gradient-to-br from-red-600 to-red-700 text-white"
                  : confirmationModal.type === "warning"
                  ? "bg-gradient-to-br from-yellow-600 to-yellow-700 text-black"
                  : "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
              }`}
            >
              [{confirmationModal.title}]
            </div>
            <div className="mb-6 space-y-2">
              <div
                className={`text-lg font-bold ${
                  confirmationModal.type === "danger"
                    ? "text-red-400"
                    : confirmationModal.type === "warning"
                    ? "text-yellow-400"
                    : "text-blue-400"
                }`}
              >
                {confirmationModal.type === "danger" && "⚠ DANGER ⚠"}
                {confirmationModal.type === "warning" && "⚡ WARNING ⚡"}
                {confirmationModal.type === "default" && "● CONFIRM ●"}
              </div>
              <div className="text-yellow-400 text-sm">
                {confirmationModal.message}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleConfirmAction}
                className={`flex-1 px-4 py-3 text-sm font-bold border transition-all ${
                  confirmationModal.type === "danger"
                    ? "bg-gradient-to-br from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-yellow-400 border-red-400"
                    : confirmationModal.type === "warning"
                    ? "bg-gradient-to-br from-yellow-700 to-yellow-800 hover:from-yellow-600 hover:to-yellow-700 text-black border-yellow-400"
                    : "bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-yellow-400 border-blue-400"
                }`}
              >
                ✓ CONFIRM
              </button>
              <button
                onClick={closeConfirmation}
                className="flex-1 bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-yellow-400 px-4 py-3 text-sm font-bold border border-slate-400 transition-all"
              >
                ✗ CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
