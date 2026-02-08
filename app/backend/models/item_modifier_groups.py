from core.database import Base
from sqlalchemy import Column, DateTime, Integer


class Item_modifier_groups(Base):
    __tablename__ = "item_modifier_groups"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    item_id = Column(Integer, nullable=False)
    modifier_group_id = Column(Integer, nullable=False)
    sort_order = Column(Integer, nullable=True, default=0, server_default='0')
    created_at = Column(DateTime(timezone=True), nullable=True)