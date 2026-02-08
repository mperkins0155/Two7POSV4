from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Modifier_groups(Base):
    __tablename__ = "modifier_groups"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    organization_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    selection_type = Column(String, nullable=False)
    min_selections = Column(Integer, nullable=True, default=0, server_default='0')
    max_selections = Column(Integer, nullable=True)
    is_required = Column(Boolean, nullable=True, default=False, server_default='false')
    sort_order = Column(Integer, nullable=True, default=0, server_default='0')
    created_at = Column(DateTime(timezone=True), nullable=True)