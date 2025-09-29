from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()


class Order(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String)
    order_type = Column(String)
    subtotal = Column(Float)
    discount = Column(Float)
    discount_type = Column(String, nullable=True)
    discount_value = Column(Float, nullable=True)
    discount_reason = Column(Text, nullable=True)
    discount_id_number = Column(String, nullable=True)
    vat = Column(Float)
    total_amount = Column(Float)
    payment_method = Column(String)
    payment_reference = Column(String)
    amount_received = Column(Float)
    change_amount = Column(Float)
    order_status = Column(String)
    payment_status = Column(String)
    customer_notes = Column(Text)
    receipt_email = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    order_items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"
    order_item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    item_name = Column(String)
    price = Column(Float)
    unit_price = Column(Float)
    quantity = Column(Integer)
    total_price = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    category = Column(String)  # <-- Add this line
    order = relationship("Order", back_populates="order_items")
