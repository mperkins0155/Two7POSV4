from models.base import BaseModel
from sqlalchemy import Boolean, Column, Float, Integer, String


class Items(BaseModel):
    __tablename__ = "items"
    __table_args__ = {"extend_existing": True}

    organization_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    item_type = Column(String, nullable=False)
    sku = Column(String, nullable=True)
    base_price = Column(Float, nullable=False)
    cost = Column(Float, nullable=True)
    tax_rate = Column(Float, nullable=True, default=0, server_default='0')
    category = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=True, default=True, server_default='true')
    track_inventory = Column(Boolean, nullable=True, default=False, server_default='false')
    current_stock = Column(Integer, nullable=True, default=0, server_default='0')
    low_stock_alert = Column(Integer, nullable=True)
