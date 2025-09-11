from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.supabase import supabase

router = APIRouter(prefix="/api/order-items", tags=["order-items"])


class OrderItemCreate(BaseModel):
    order_id: int
    item_name: str
    unit_price: float
    quantity: int
    total_price: float
    category: Optional[str] = None


class OrderItemUpdate(BaseModel):
    quantity: Optional[int] = None
    total_price: Optional[float] = None


class OrderItemResponse(BaseModel):
    order_item_id: int
    order_id: int
    item_name: str
    price: float
    unit_price: float
    quantity: int
    total_price: float
    created_at: datetime
    category: Optional[str] = None


@router.post("/", response_model=OrderItemResponse)
async def create_order_item(item_data: OrderItemCreate):
    try:
        item_insert = {
            "order_id": item_data.order_id,
            "item_name": item_data.item_name,
            "price": item_data.unit_price,
            "unit_price": item_data.unit_price,
            "quantity": item_data.quantity,
            "total_price": item_data.total_price,
            "category": item_data.category,
        }

        result = supabase.table("order_items").insert(item_insert).execute()

        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create order item")

        return result.data[0]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create order item: {str(e)}"
        )


@router.get("/order/{order_id}", response_model=List[OrderItemResponse])
async def get_order_items(order_id: int):
    """Get all items for a specific order"""
    try:
        result = (
            supabase.table("order_items").select("*").eq("order_id", order_id).execute()
        )

        return result.data or []

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch order items: {str(e)}"
        )


@router.get("/{item_id}", response_model=OrderItemResponse)
async def get_order_item(item_id: int):
    """Get a specific order item by ID"""
    try:
        result = (
            supabase.table("order_items")
            .select("*")
            .eq("order_item_id", item_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Order item not found")

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch order item: {str(e)}"
        )


@router.put("/{item_id}", response_model=OrderItemResponse)
async def update_order_item(item_id: int, item_data: OrderItemUpdate):
    """Update an order item (typically quantity and total)"""
    try:
        # Prepare update data
        update_data = {}
        if item_data.quantity is not None:
            update_data["quantity"] = item_data.quantity
        if item_data.total_price is not None:
            update_data["total_price"] = item_data.total_price

        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")

        # Update order item
        result = (
            supabase.table("order_items")
            .update(update_data)
            .eq("order_item_id", item_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Order item not found")

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update order item: {str(e)}"
        )


@router.delete("/{item_id}")
async def delete_order_item(item_id: int):
    try:
        # Check if item exists
        check_result = (
            supabase.table("order_items")
            .select("*")
            .eq("order_item_id", item_id)
            .execute()
        )

        if not check_result.data:
            raise HTTPException(status_code=404, detail="Order item not found")

        # Delete the item
        result = (
            supabase.table("order_items")
            .delete()
            .eq("order_item_id", item_id)
            .execute()
        )

        return {"message": "Order item deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete order item: {str(e)}"
        )


@router.get("/popular/items")
async def get_popular_items(
    limit: int = 10, date_from: Optional[str] = None, date_to: Optional[str] = None
):
    try:
        query = supabase.table("order_items").select("*, orders(created_at)")

        if date_from:
            query = query.gte("orders.created_at", date_from)

        if date_to:
            query = query.lte("orders.created_at", date_to)

        result = query.execute()

        items = result.data or []

        # Group by item_name and calculate totals, include category
        item_stats = {}
        for item in items:
            item_name = item["item_name"]
            category = item.get("category")
            if item_name not in item_stats:
                item_stats[item_name] = {
                    "item_name": item["item_name"],
                    "category": category,
                    "total_quantity": 0,
                    "total_revenue": 0.0,
                    "order_count": 0,
                }

            item_stats[item_name]["total_quantity"] += item["quantity"]
            item_stats[item_name]["total_revenue"] += item["total_price"]
            item_stats[item_name]["order_count"] += 1

        # Sort by total quantity and limit results
        popular_items = sorted(
            item_stats.values(), key=lambda x: x["total_quantity"], reverse=True
        )[:limit]

        return popular_items

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get popular items: {str(e)}"
        )


@router.get("/revenue/summary")
async def get_revenue_summary(
    date_from: Optional[str] = None, date_to: Optional[str] = None
):
    """Get revenue summary from order items"""
    try:
        query = supabase.table("order_items").select(
            "*, orders(created_at, order_status)"
        )

        if date_from:
            query = query.gte("orders.created_at", date_from)

        if date_to:
            query = query.lte("orders.created_at", date_to)

        result = query.execute()

        items = result.data or []

        # Calculate summary
        total_revenue = 0
        completed_revenue = 0
        total_items_sold = 0

        for item in items:
            order_status = item.get("orders", {}).get("order_status", "")

            total_items_sold += item["quantity"]

            if order_status == "completed":
                completed_revenue += item["total_price"]

            total_revenue += item["total_price"]

        return {
            "total_revenue": total_revenue,
            "completed_revenue": completed_revenue,
            "pending_revenue": total_revenue - completed_revenue,
            "total_items_sold": total_items_sold,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get revenue summary: {str(e)}"
        )
