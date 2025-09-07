from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.supabase import supabase

router = APIRouter(prefix="/api/orders", tags=["orders"])


class OrderItemCreate(BaseModel):
    item_name: str
    unit_price: float
    quantity: int
    total_price: float


class OrderItemResponse(BaseModel):
    order_item_id: Optional[int] = None
    order_id: Optional[int] = None
    item_name: str
    price: float
    unit_price: float
    quantity: int
    total_price: float
    created_at: Optional[datetime] = None


class OrderCreate(BaseModel):
    customer_name: str = "Walk-in Customer"
    order_type: str = "Dining"
    discount: float = 0.0
    vat: float
    total_amount: float
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    amount_received: Optional[float] = None
    change_amount: Optional[float] = None
    order_status: str = "completed"
    customer_notes: Optional[str] = None
    receipt_email: Optional[str] = None
    order_items: List[OrderItemCreate]


class OrderResponse(BaseModel):
    order_id: int
    customer_name: str
    order_type: str
    subtotal: float
    discount: float
    vat: float
    total_amount: float
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    amount_received: Optional[float] = None
    change_amount: Optional[float] = None
    order_status: str
    payment_status: Optional[str] = "Unpaid"
    customer_notes: Optional[str] = None
    receipt_email: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    order_items: Optional[List[OrderItemResponse]] = None


class OrderStatusUpdate(BaseModel):
    order_status: str


@router.post("/", response_model=OrderResponse)
async def create_order(order_data: OrderCreate):
    try:
        print(f"Creating order with data: {order_data}")

        order_insert = {
            "customer_name": order_data.customer_name,
            "order_type": order_data.order_type,
            "subtotal": order_data.subtotal,
            "discount": order_data.discount,
            "vat": order_data.vat,
            "total_amount": order_data.total_amount,
            "payment_method": order_data.payment_method,
            "payment_reference": order_data.payment_reference,
            "amount_received": order_data.amount_received,
            "change_amount": order_data.change_amount,
            "order_status": order_data.order_status,
            "customer_notes": order_data.customer_notes,
            "receipt_email": order_data.receipt_email,
            "payment_status": (
                "Paid" if order_data.order_status == "completed" else "Unpaid"
            ),
        }

        print(f"Inserting order: {order_insert}")
        order_result = supabase.table("orders").insert(order_insert).execute()
        print(f"Order result: {order_result}")

        if not order_result.data:
            raise HTTPException(status_code=400, detail="Failed to create order")

        order_id = order_result.data[0]["order_id"]

        order_items_insert = []
        for item in order_data.order_items:
            order_items_insert.append(
                {
                    "order_id": order_id,
                    "item_name": item.item_name,
                    "price": item.unit_price,
                    "unit_price": item.unit_price,
                    "quantity": item.quantity,
                    "total_price": item.total_price,
                }
            )

        if order_items_insert:
            items_result = (
                supabase.table("order_items").insert(order_items_insert).execute()
            )

            if not items_result.data:
                supabase.table("orders").delete().eq("order_id", order_id).execute()
                raise HTTPException(
                    status_code=400, detail="Failed to create order items"
                )

        return await get_order(order_id)

    except Exception as e:
        print(f"Error creating order: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int):
    try:
        # Get order details
        order_result = (
            supabase.table("orders").select("*").eq("order_id", order_id).execute()
        )

        if not order_result.data:
            raise HTTPException(status_code=404, detail="Order not found")

        order = order_result.data[0]

        # Get order items
        items_result = (
            supabase.table("order_items").select("*").eq("order_id", order_id).execute()
        )

        # Combine order and items
        order["order_items"] = items_result.data or []

        return order

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch order: {str(e)}")


@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    try:
        query = supabase.table("orders").select("*")

        if status:
            query = query.eq("order_status", status)

        if date_from:
            query = query.gte("created_at", date_from)

        if date_to:
            query = query.lte("created_at", date_to)

        orders_result = (
            query.order("created_at", desc=True).limit(limit).offset(offset).execute()
        )

        orders = orders_result.data or []

        # Get order items for each order
        for order in orders:
            items_result = (
                supabase.table("order_items")
                .select("*")
                .eq("order_id", order["order_id"])
                .execute()
            )
            order["order_items"] = items_result.data or []

        return orders

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch orders: {str(e)}")


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(order_id: int, status_data: OrderStatusUpdate):
    try:
        # Update order status
        update_result = (
            supabase.table("orders")
            .update(
                {
                    "order_status": status_data.order_status,
                    "updated_at": datetime.now().isoformat(),
                }
            )
            .eq("order_id", order_id)
            .execute()
        )

        if not update_result.data:
            raise HTTPException(status_code=404, detail="Order not found")

        # Return updated order
        return await get_order(order_id)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update order status: {str(e)}"
        )


@router.get("/status/held", response_model=List[OrderResponse])
async def get_held_orders():
    return await get_orders(status="held")


@router.get("/today/summary")
async def get_today_summary():
    try:
        today = datetime.now().date().isoformat()

        # Get today's orders
        orders_result = (
            supabase.table("orders").select("*").gte("created_at", today).execute()
        )

        orders = orders_result.data or []

        summary = {
            "total_orders": len(orders),
            "total_revenue": sum(order["total_amount"] for order in orders),
            "completed_orders": len(
                [o for o in orders if o["order_status"] == "completed"]
            ),
            "pending_orders": len(
                [o for o in orders if o["order_status"] == "pending"]
            ),
            "held_orders": len([o for o in orders if o["order_status"] == "held"]),
            "cash_orders": len([o for o in orders if o["payment_method"] == "cash"]),
            "gcash_orders": len([o for o in orders if o["payment_method"] == "gcash"]),
            "dining_orders": len([o for o in orders if o["order_type"] == "Dining"]),
            "takeout_orders": len([o for o in orders if o["order_type"] == "Takeout"]),
        }

        return summary

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")


@router.delete("/{order_id}")
async def delete_order(order_id: int):
    try:
        # Update order status to cancelled instead of hard delete
        update_result = (
            supabase.table("orders")
            .update(
                {"order_status": "cancelled", "updated_at": datetime.now().isoformat()}
            )
            .eq("order_id", order_id)
            .execute()
        )

        if not update_result.data:
            raise HTTPException(status_code=404, detail="Order not found")

        return {"message": "Order cancelled successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel order: {str(e)}")
