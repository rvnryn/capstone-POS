from datetime import datetime


class OrderStatusUpdate(BaseModel):
    order_status: str


@router.put("/{order_id}/status")
async def update_order_status_async(
    order_id: int, status_data: OrderStatusUpdate, db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(select(Order).where(Order.order_id == order_id))
        order = result.scalars().first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        order.order_status = status_data.order_status
        order.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(order)
        return {"order_id": order.order_id, "order_status": order.order_status}
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to update order status: {str(e)}"
        )


from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.models.order import Order, OrderItem
from app.supabase import get_db
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.models.order import Order, OrderItem
from app.supabase import get_db
from typing import List
from datetime import datetime
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/orders-async", tags=["orders-async"])


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
