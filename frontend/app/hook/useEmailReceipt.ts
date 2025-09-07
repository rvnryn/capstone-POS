import { useState, useCallback, useEffect } from "react";
import emailjs from "@emailjs/browser";

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export interface ReceiptData {
  order: any;
  customerEmail: string;
  customerName: string;
  orderType: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  vat: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  timestamp: string;
}

export function useEmailReceipt(config: EmailConfig) {
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastSentReceipt, setLastSentReceipt] = useState<ReceiptData | null>(
    null
  );

  // Initialize EmailJS
  useEffect(() => {
    const initEmailJS = () => {
      if (config.publicKey) {
        try {
          console.log(
            "Initializing EmailJS with public key:",
            config.publicKey.substring(0, 10) + "..."
          );

          // Check if EmailJS is loaded
          if (typeof window !== "undefined" && typeof emailjs !== "undefined") {
            emailjs.init(config.publicKey);
            console.log("EmailJS initialized successfully");
          } else if (typeof window !== "undefined") {
            console.warn("EmailJS not yet loaded, retrying in 1 second...");
            setTimeout(initEmailJS, 1000);
          }
        } catch (error) {
          console.error("Error initializing EmailJS:", error);
        }
      } else {
        console.warn("No EmailJS public key provided");
      }
    };

    initEmailJS();
  }, [config.publicKey]);

  const sendEmailReceipt = useCallback(
    async (receiptData: ReceiptData): Promise<boolean> => {
      console.log("EmailJS Configuration:", {
        serviceId: config.serviceId,
        templateId: config.templateId,
        publicKey: config.publicKey ? "***configured***" : "missing",
      });

      if (!config.serviceId || !config.templateId) {
        setSendError("Email configuration is missing");
        return false;
      }

      if (!config.publicKey) {
        setSendError("Email service public key is missing");
        return false;
      }

      if (
        !receiptData.customerEmail ||
        !receiptData.customerEmail.includes("@")
      ) {
        setSendError("Valid email address is required");
        return false;
      }

      setIsSending(true);
      setSendError(null);

      try {
        // Format items for email template
        const itemsText = receiptData.items
          .map(
            (item) =>
              `${item.name} x${item.quantity} - ₱${item.total.toFixed(2)}`
          )
          .join("\n");

        // Prepare template parameters
        const templateParams = {
          to_email: receiptData.customerEmail,
          user_email: receiptData.customerEmail,
          recipient_email: receiptData.customerEmail,
          email: receiptData.customerEmail,
          to_name: receiptData.customerName,
          reply_to: receiptData.customerEmail,
          customer_name: receiptData.customerName,
          order_type: receiptData.orderType,
          order_items: itemsText,
          items: itemsText, // Make sure items field is properly set
          subtotal: receiptData.subtotal.toFixed(2),
          vat: receiptData.vat.toFixed(2),
          discount: receiptData.discount.toFixed(2),
          total: receiptData.total.toFixed(2),
          payment_method: receiptData.paymentMethod || "Cash",
          payment_reference: receiptData.reference || "N/A",
          notes: receiptData.notes || "No special notes",
          order_date: receiptData.timestamp,
          store_name: "Cardiac Delights",
          store_address: "Your Store Address Here",
          store_contact: "Your Contact Information",
          // Add order number and date/time fields that your template expects
          order_number: `#${(() => {
            // For completed orders, use consistent sequential numbering
            if (receiptData.order?.id) {
              // Use localStorage to maintain order mapping for consistency
              const orderMapping = JSON.parse(
                localStorage.getItem("orderMapping") || "{}"
              );

              // If this order ID already has a sequential number, return it
              if (orderMapping[receiptData.order.id]) {
                return orderMapping[receiptData.order.id];
              }

              // Generate new sequential number
              const currentCounter = parseInt(
                localStorage.getItem("orderCounter") || "0",
                10
              );
              const nextCounter = currentCounter + 1;
              const sequentialNumber = String(nextCounter).padStart(3, "0");

              // Store the mapping and update counter
              orderMapping[receiptData.order.id] = sequentialNumber;
              localStorage.setItem(
                "orderMapping",
                JSON.stringify(orderMapping)
              );
              localStorage.setItem("orderCounter", nextCounter.toString());

              return sequentialNumber;
            }

            // For orders without ID, generate a new sequential number
            const currentCounter = parseInt(
              localStorage.getItem("orderCounter") || "0",
              10
            );
            const nextCounter = currentCounter + 1;
            localStorage.setItem("orderCounter", nextCounter.toString());
            return String(nextCounter).padStart(3, "0");
          })()}`,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          customer: receiptData.customerName,
          customer_email: receiptData.customerEmail,
        };

        console.log("Sending email with parameters:", {
          serviceId: config.serviceId,
          templateId: config.templateId,
          customerEmail: receiptData.customerEmail,
          customerName: receiptData.customerName,
          emailJSLoaded: typeof emailjs !== "undefined",
          emailJSSendAvailable: typeof emailjs?.send === "function",
        });

        console.log("Template parameters:", templateParams);
        console.log("Customer email value:", receiptData.customerEmail);
        console.log("Customer email type:", typeof receiptData.customerEmail);
        console.log(
          "Customer email length:",
          receiptData.customerEmail?.length
        );

        // Check if EmailJS is properly loaded
        if (typeof emailjs === "undefined") {
          throw new Error(
            "EmailJS library not loaded - please ensure the script is included in your HTML"
          );
        }

        if (typeof emailjs.send !== "function") {
          throw new Error(
            "EmailJS send method not available - library may not be fully loaded"
          );
        }

        // Additional check for EmailJS initialization
        console.log("EmailJS object:", emailjs);
        console.log("EmailJS send method type:", typeof emailjs.send);

        const response = await emailjs.send(
          config.serviceId,
          config.templateId,
          templateParams
        );

        console.log("EmailJS response:", response);

        if (response.status === 200) {
          setLastSentReceipt(receiptData);
          return true;
        } else {
          setSendError(`Failed to send email: ${response.text}`);
          return false;
        }
      } catch (error) {
        console.error("Email send error:", error);
        console.error("Error type:", typeof error);
        console.error("Error constructor:", error?.constructor?.name);
        console.error("Error keys:", Object.keys(error || {}));

        // Log EmailJS specific error properties
        if (error && typeof error === "object") {
          const errorObj = error as any;
          console.error("EmailJS Status:", errorObj.status);
          console.error("EmailJS Text:", errorObj.text);

          // Common EmailJS status codes:
          // 200 = Success
          // 400 = Bad Request (invalid template ID, service ID, or parameters)
          // 401 = Unauthorized (invalid public key)
          // 404 = Not Found (service or template not found)
          // 422 = Unprocessable Entity (validation errors)
        }

        let errorMessage = "Unknown error occurred";

        // Handle different types of errors
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error && typeof error === "object") {
          // Handle EmailJS error objects
          const errorObj = error as any;

          // Handle EmailJSResponseStatus errors specifically
          if (errorObj.constructor?.name === "EmailJSResponseStatus") {
            const status = errorObj.status;
            const text = errorObj.text || "No error details provided";

            switch (status) {
              case 400:
                errorMessage = `Bad Request: ${text} - Check your template parameters and service configuration`;
                break;
              case 401:
                errorMessage = `Unauthorized: ${text} - Check your EmailJS public key`;
                break;
              case 404:
                errorMessage = `Not Found: ${text} - Check your service ID and template ID`;
                break;
              case 422:
                errorMessage = `Validation Error: ${text} - Check your template parameters`;
                break;
              default:
                errorMessage = `EmailJS Error (${status}): ${text}`;
            }
          } else if ("text" in errorObj && typeof errorObj.text === "string") {
            errorMessage = errorObj.text;
          } else if (
            "message" in errorObj &&
            typeof errorObj.message === "string"
          ) {
            errorMessage = errorObj.message;
          } else if ("status" in errorObj) {
            errorMessage = `Email service error (Status: ${errorObj.status})`;
          } else {
            errorMessage = JSON.stringify(error);
          }
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        // Provide more specific error messages for common issues
        if (typeof errorMessage === "string") {
          if (
            errorMessage.includes("Invalid 'to' address") ||
            errorMessage.includes("invalid_to")
          ) {
            errorMessage = "Invalid email address format";
          } else if (
            errorMessage.includes("Service ID") ||
            errorMessage.includes("service_id")
          ) {
            errorMessage = "Email service configuration error";
          } else if (
            errorMessage.includes("Template ID") ||
            errorMessage.includes("template_id")
          ) {
            errorMessage = "Email template configuration error";
          } else if (
            errorMessage.includes("Public Key") ||
            errorMessage.includes("public_key")
          ) {
            errorMessage = "Email service authentication error";
          } else if (
            errorMessage.includes("network") ||
            errorMessage.includes("fetch")
          ) {
            errorMessage =
              "Network connection error. Please check your internet connection";
          } else if (errorMessage.includes("Failed to fetch")) {
            errorMessage =
              "Unable to connect to email service. Please try again";
          } else if (
            errorMessage === "{}" ||
            errorMessage === "[object Object]"
          ) {
            errorMessage =
              "Email service temporarily unavailable. Please try again";
          }
        }

        setSendError(`Email send failed: ${errorMessage}`);
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [config]
  );

  const generateReceiptData = useCallback(
    (
      order: any,
      customerEmail: string,
      paymentMethod?: string,
      reference?: string
    ): ReceiptData => {
      return {
        order,
        customerEmail,
        customerName: order.customer || "Walk-in Customer",
        orderType: order.type || "Dining",
        items: order.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        subtotal: order.subtotal,
        vat: order.vat,
        discount: order.discount,
        total: order.total,
        paymentMethod,
        reference,
        notes: order.notes,
        timestamp: new Date().toLocaleString(),
      };
    },
    []
  );

  const generateReceiptHTML = useCallback(
    (receiptData: ReceiptData): string => {
      return `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #2c3e50;">Cardiac Delights</h2>
          <p style="margin: 5px 0; font-size: 14px; color: #666;">Digital Receipt</p>
        </div>
        
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #ccc;">
          <p><strong>Customer:</strong> ${receiptData.customerName}</p>
          <p><strong>Order Type:</strong> ${receiptData.orderType}</p>
          <p><strong>Date:</strong> ${receiptData.timestamp}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h3 style="margin: 0 0 10px 0;">Order Items:</h3>
          ${receiptData.items
            .map(
              (item) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>${item.name} x${item.quantity}</span>
              <span>₱${item.total.toFixed(2)}</span>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div style="margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span>₱${receiptData.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>VAT (12%):</span>
            <span>₱${receiptData.vat.toFixed(2)}</span>
          </div>
          ${
            receiptData.discount > 0
              ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Discount:</span>
              <span>-₱${receiptData.discount.toFixed(2)}</span>
            </div>
          `
              : ""
          }
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; padding-top: 10px; border-top: 1px solid #ccc;">
            <span>Total:</span>
            <span>₱${receiptData.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div style="margin-bottom: 15px; font-size: 14px;">
          <p><strong>Payment Method:</strong> ${receiptData.paymentMethod}</p>
          ${
            receiptData.reference
              ? `<p><strong>Reference:</strong> ${receiptData.reference}</p>`
              : ""
          }
          ${
            receiptData.notes
              ? `<p><strong>Notes:</strong> ${receiptData.notes}</p>`
              : ""
          }
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #666; margin-top: 20px;">
          <p>Thank you for dining with us!</p>
          <p>This is a digital receipt.</p>
        </div>
      </div>
    `;
    },
    []
  );

  const printReceipt = useCallback(
    (receiptData: ReceiptData) => {
      const receiptHTML = generateReceiptHTML(receiptData);

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${receiptData.customerName}</title>
            <style>
              body { margin: 0; padding: 20px; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${receiptHTML}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
        printWindow.document.close();
      }
    },
    [generateReceiptHTML]
  );

  const resetEmailState = useCallback(() => {
    setSendError(null);
    setLastSentReceipt(null);
  }, []);

  return {
    // State
    isSending,
    sendError,
    lastSentReceipt,

    // Functions
    sendEmailReceipt,
    generateReceiptData,
    generateReceiptHTML,
    printReceipt,
    resetEmailState,
  };
}
