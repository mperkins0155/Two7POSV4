from models.base import BaseModel
from sqlalchemy import Column, DateTime, String


class Organizations(BaseModel):
    __tablename__ = "organizations"
    __table_args__ = {"extend_existing": True}

    name = Column(String, nullable=False)
    slug = Column(String, nullable=False)
    business_type = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address_line1 = Column(String, nullable=True)
    address_line2 = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    country = Column(String, nullable=True, default='US', server_default='US')
    timezone = Column(String, nullable=True, default='America/New_York', server_default='America/New_York')
    currency = Column(String, nullable=True, default='USD', server_default='USD')
    helcim_merchant_id = Column(String, nullable=True)
    helcim_api_token = Column(String, nullable=True)
    helcim_connected_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=True, default='active', server_default='active')
