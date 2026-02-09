from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func


class Variants(Base):
    __tablename__ = "variants"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    item_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    price_adjustment = Column(Float, nullable=True, default=0, server_default='0')
    sku = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=True, default=True, server_default='true')
    sort_order = Column(Integer, nullable=True, default=0, server_default='0')
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
