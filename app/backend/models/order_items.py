from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String


class Order_items(Base):
    __tablename__ = "order_items"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    order_id = Column(Integer, nullable=False)
    item_id = Column(Integer, nullable=True)
    variant_id = Column(Integer, nullable=True)
    item_name = Column(String, nullable=False)
    variant_name = Column(String, nullable=True)
    quantity = Column(Integer, nullable=False, default=1, server_default='1')
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)