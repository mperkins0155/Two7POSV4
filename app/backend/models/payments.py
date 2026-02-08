from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String


class Payments(Base):
    __tablename__ = "payments"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    organization_id = Column(Integer, nullable=False)
    order_id = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)
    helcim_transaction_id = Column(String, nullable=True)
    helcim_card_token = Column(String, nullable=True)
    card_last_four = Column(String, nullable=True)
    card_brand = Column(String, nullable=True)
    status = Column(String, nullable=True, default='pending', server_default='pending')
    error_message = Column(String, nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)