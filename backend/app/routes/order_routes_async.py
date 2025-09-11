from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.models.order import Order, OrderItem
from app.supabase import get_db
from typing import List

router = APIRouter(prefix="/api/orders-async", tags=["orders-async"])


class OrderStatusUpdate(BaseModel):
    order_status: str


class OrderItemCreate(BaseModel):
    item_name: str
    unit_price: float
    quantity: int
    total_price: float


class OrderCreate(BaseModel):
    customer_name: str = "Walk-in Customer"
    order_type: str = "Dining"
    discount: float = 0.0
    vat: float
    subtotal: float
    total_amount: float
    payment_method: str = None
    payment_reference: str = None
    amount_received: float = None
    change_amount: float = None
    order_status: str = "completed"
    customer_notes: str = None
    receipt_email: str = None
    order_items: List[OrderItemCreate]


@router.put("/{order_id}/status", response_model=dict)
async def update_order_status_async(
    order_id: int, status_data: OrderStatusUpdate, db: AsyncSession = Depends(get_db)
):
    try:
        print(f"[DEBUG] Updating order status for order_id: {order_id}")
        print(f"[DEBUG] Status data: {status_data}")

        # Validate order_id
        if order_id <= 0:
            raise HTTPException(status_code=400, detail=f"Invalid order ID: {order_id}")

        result = await db.execute(select(Order).where(Order.order_id == order_id))
        order = result.scalars().first()

        if not order:
            print(f"[DEBUG] Order with ID {order_id} not found in database")
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        print(
            f"[DEBUG] Found order: {order.order_id}, current status: {order.order_status}"
        )

        old_status = order.order_status
        order.order_status = status_data.order_status
        order.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(order)

        print(
            f"[DEBUG] Successfully updated order {order.order_id} status from '{old_status}' to '{order.order_status}'"
        )

        return {"order_id": order.order_id, "order_status": order.order_status}
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        print(f"[DEBUG] Error updating order status: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to update order status: {str(e)}"
        )


@router.post("/", response_model=dict)
async def create_order_async(
    order_data: OrderCreate, db: AsyncSession = Depends(get_db)
):
    try:
        order = Order(
            customer_name=order_data.customer_name,
            order_type=order_data.order_type,
            subtotal=order_data.subtotal,
            discount=order_data.discount,
            vat=order_data.vat,
            total_amount=order_data.total_amount,
            payment_method=order_data.payment_method,
            payment_reference=order_data.payment_reference,
            amount_received=order_data.amount_received,
            change_amount=order_data.change_amount,
            order_status=order_data.order_status,
            payment_status=(
                "Paid" if order_data.order_status == "completed" else "Unpaid"
            ),
            customer_notes=order_data.customer_notes,
            receipt_email=order_data.receipt_email,
        )
        db.add(order)
        await db.flush()  # get order_id
        # Save order items for all orders except those with status 'canceled' or 'cancelled'
        if order_data.order_status.lower() not in ["canceled", "cancelled"]:
            items = [
                OrderItem(
                    order_id=order.order_id,
                    item_name=item.item_name,
                    price=item.unit_price,
                    unit_price=item.unit_price,
                    quantity=item.quantity,
                    total_price=item.total_price,
                )
                for item in order_data.order_items
            ]
            db.add_all(items)
        await db.commit()
        await db.refresh(order)
        return {"order_id": order.order_id}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


@router.get("/status/held", response_model=List[dict])
async def get_held_orders_async(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(Order)
            .where(Order.order_status == "held")
            .order_by(Order.created_at.desc())
        )
        orders = result.scalars().all()
        held_orders = []
        for order in orders:
            # Fetch order items for each order
            items_result = await db.execute(
                select(OrderItem).where(OrderItem.order_id == order.order_id)
            )
            items = items_result.scalars().all()
            order_dict = order.__dict__.copy()
            order_dict["order_items"] = [item.__dict__.copy() for item in items]
            # Remove SQLAlchemy state from dicts
            order_dict.pop("_sa_instance_state", None)
            for item in order_dict["order_items"]:
                item.pop("_sa_instance_state", None)
            held_orders.append(order_dict)
        return held_orders
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch held orders: {str(e)}"
        )


# Cancel an order (set status to canceled) - MOVED BEFORE generic get route
@router.put("/{order_id}/cancel")
async def cancel_order_async(order_id: int, db: AsyncSession = Depends(get_db)):
    try:
        print(f"[DEBUG] Cancel request for order_id: {order_id}")

        # Validate order_id
        if order_id <= 0:
            print(f"[DEBUG] Invalid order ID: {order_id}")
            raise HTTPException(status_code=400, detail=f"Invalid order ID: {order_id}")

        result = await db.execute(select(Order).where(Order.order_id == order_id))
        order = result.scalars().first()

        if not order:
            print(f"[DEBUG] Order with ID {order_id} not found in database")
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )

        print(
            f"[DEBUG] Found order: {order.order_id}, current status: '{order.order_status}'"
        )

        # Only allow canceling held or pending orders
        if order.order_status not in ["held", "pending"]:
            error_msg = f"Cannot cancel order with status '{order.order_status}'. Only 'held' or 'pending' orders can be canceled."
            print(f"[DEBUG] {error_msg}")
            raise HTTPException(
                status_code=400,
                detail=error_msg,
            )

        old_status = order.order_status
        order.order_status = "canceled"
        order.updated_at = datetime.utcnow()
        # Delete all order items for this order
        await db.execute(
            OrderItem.__table__.delete().where(OrderItem.order_id == order.order_id)
        )
        await db.commit()
        await db.refresh(order)

        print(
            f"[DEBUG] Successfully canceled order {order.order_id}, status changed from '{old_status}' to 'canceled' and order items deleted"
        )

        return {
            "order_id": order.order_id,
            "order_status": order.order_status,
            "message": "Order canceled successfully and items deleted",
        }
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        error_msg = f"Failed to cancel order: {str(e)}"
        print(f"[DEBUG] Exception in cancel_order_async: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/{order_id}")
async def get_order_async(order_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Order).where(Order.order_id == order_id))
        order = result.scalars().first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        items_result = await db.execute(
            select(OrderItem).where(OrderItem.order_id == order.order_id)
        )
        items = items_result.scalars().all()
        order_dict = order.__dict__.copy()
        order_dict["order_items"] = [item.__dict__.copy() for item in items]
        order_dict.pop("_sa_instance_state", None)
        for item in order_dict["order_items"]:
            item.pop("_sa_instance_state", None)
        return order_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch order: {str(e)}")


@router.get("/", response_model=List[dict])
async def get_orders_async(
    status: str = None,
    limit: int = 50,
    offset: int = 0,
    date_from: str = None,
    date_to: str = None,
    db: AsyncSession = Depends(get_db),
):
    try:
        query = select(Order)
        if status:
            query = query.where(Order.order_status == status)
        if date_from:
            query = query.where(Order.created_at >= date_from)
        if date_to:
            query = query.where(Order.created_at <= date_to)
        query = query.order_by(Order.created_at.desc())
        result = await db.execute(query.offset(offset).limit(limit))
        orders = result.scalars().all()
        order_dicts = []
        for order in orders:
            items_result = await db.execute(
                select(OrderItem).where(OrderItem.order_id == order.order_id)
            )
            items = items_result.scalars().all()
            order_dict = order.__dict__.copy()
            order_dict["order_items"] = [item.__dict__.copy() for item in items]
            order_dict.pop("_sa_instance_state", None)
            for item in order_dict["order_items"]:
                item.pop("_sa_instance_state", None)
            order_dicts.append(order_dict)
        return order_dicts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch orders: {str(e)}")


@router.get("/today/summary")
async def get_today_summary_async(db: AsyncSession = Depends(get_db)):
    try:
        today = datetime.now().date()
        result = await db.execute(select(Order).where(Order.created_at >= today))
        orders = result.scalars().all()
        summary = {
            "total_orders": len(orders),
            "total_revenue": sum(
                order.total_amount
                for order in orders
                if order.order_status != "canceled"
            ),
            "completed_orders": len(
                [o for o in orders if o.order_status == "completed"]
            ),
            "pending_orders": len([o for o in orders if o.order_status == "pending"]),
            "held_orders": len([o for o in orders if o.order_status == "held"]),
            "canceled_orders": len([o for o in orders if o.order_status == "canceled"]),
            "cash_orders": len(
                [
                    o
                    for o in orders
                    if o.payment_method == "cash" and o.order_status != "canceled"
                ]
            ),
            "gcash_orders": len(
                [
                    o
                    for o in orders
                    if o.payment_method == "gcash" and o.order_status != "canceled"
                ]
            ),
            "dining_orders": len(
                [
                    o
                    for o in orders
                    if o.order_type == "Dining" and o.order_status != "canceled"
                ]
            ),
            "takeout_orders": len(
                [
                    o
                    for o in orders
                    if o.order_type == "Takeout" and o.order_status != "canceled"
                ]
            ),
        }
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")


@router.delete("/{order_id}")
async def delete_order_async(order_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Order).where(Order.order_id == order_id))
        order = result.scalars().first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        order.order_status = "cancelled"
        order.updated_at = datetime.utcnow()
        await db.commit()
        return {"message": "Order cancelled successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to cancel order: {str(e)}")
