from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String


class Orders(Base):
    __tablename__ = "orders"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    organization_id = Column(Integer, nullable=False)
    order_number = Column(String, nullable=False)
    cashier_id = Column(Integer, nullable=True)
    customer_name = Column(String, nullable=True)
    customer_email = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, nullable=True, default=0, server_default='0')
    discount_amount = Column(Float, nullable=True, default=0, server_default='0')
    tip_amount = Column(Float, nullable=True, default=0, server_default='0')
    total_amount = Column(Float, nullable=False)
    status = Column(String, nullable=True, default='pending', server_default='pending')
    payment_method = Column(String, nullable=True)
    payment_status = Column(String, nullable=True, default='unpaid', server_default='unpaid')
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)