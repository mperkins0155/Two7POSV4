from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func


class Order_item_modifiers(Base):
    __tablename__ = "order_item_modifiers"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    order_item_id = Column(Integer, nullable=False)
    modifier_option_id = Column(Integer, nullable=True)
    modifier_name = Column(String, nullable=False)
    option_name = Column(String, nullable=False)
    price_adjustment = Column(Float, nullable=True, default=0, server_default='0')
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
