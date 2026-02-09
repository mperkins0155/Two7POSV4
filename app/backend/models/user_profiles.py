from models.base import BaseModel
from sqlalchemy import Boolean, Column, Integer, String


class User_profiles(BaseModel):
    __tablename__ = "user_profiles"
    __table_args__ = {"extend_existing": True}

    user_id = Column(String, nullable=False)
    organization_id = Column(Integer, nullable=False)
    role = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    pin_code = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=True, default=True, server_default='true')
