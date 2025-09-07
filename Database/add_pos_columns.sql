-- Migration script to add missing columns for POS system
-- Run this in your Supabase SQL editor

-- Add missing columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR DEFAULT 'Walk-in Customer',
ADD COLUMN IF NOT EXISTS order_type VARCHAR DEFAULT 'Dining',
ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_received NUMERIC,
ADD COLUMN IF NOT EXISTS change_amount NUMERIC,
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS receipt_email VARCHAR,
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR;

-- Update existing orders to have default payment_status as 'Paid' if they are completed
UPDATE public.orders 
SET payment_status = 'Paid' 
WHERE order_status = 'completed' AND payment_status = 'Unpaid';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON public.orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_item_name ON public.order_items(item_name);

COMMENT ON COLUMN public.orders.customer_name IS 'Customer name for the order';
COMMENT ON COLUMN public.orders.order_type IS 'Dining or Takeout';
COMMENT ON COLUMN public.orders.subtotal IS 'Subtotal before tax and discounts';
COMMENT ON COLUMN public.orders.discount IS 'Discount amount';
COMMENT ON COLUMN public.orders.vat IS 'VAT/Tax amount';
COMMENT ON COLUMN public.orders.amount_received IS 'Amount received from customer';
COMMENT ON COLUMN public.orders.change_amount IS 'Change given to customer';
COMMENT ON COLUMN public.orders.customer_notes IS 'Special instructions or notes';
COMMENT ON COLUMN public.orders.receipt_email IS 'Email address for receipt';
COMMENT ON COLUMN public.orders.payment_reference IS 'Reference number for digital payments';