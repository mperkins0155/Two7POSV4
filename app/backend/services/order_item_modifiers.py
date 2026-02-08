import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.order_item_modifiers import Order_item_modifiers

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Order_item_modifiersService:
    """Service layer for Order_item_modifiers operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Order_item_modifiers]:
        """Create a new order_item_modifiers"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Order_item_modifiers(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created order_item_modifiers with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating order_item_modifiers: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for order_item_modifiers {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Order_item_modifiers]:
        """Get order_item_modifiers by ID (user can only see their own records)"""
        try:
            query = select(Order_item_modifiers).where(Order_item_modifiers.id == obj_id)
            if user_id:
                query = query.where(Order_item_modifiers.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching order_item_modifiers {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of order_item_modifierss (user can only see their own records)"""
        try:
            query = select(Order_item_modifiers)
            count_query = select(func.count(Order_item_modifiers.id))
            
            if user_id:
                query = query.where(Order_item_modifiers.user_id == user_id)
                count_query = count_query.where(Order_item_modifiers.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Order_item_modifiers, field):
                        query = query.where(getattr(Order_item_modifiers, field) == value)
                        count_query = count_query.where(getattr(Order_item_modifiers, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Order_item_modifiers, field_name):
                        query = query.order_by(getattr(Order_item_modifiers, field_name).desc())
                else:
                    if hasattr(Order_item_modifiers, sort):
                        query = query.order_by(getattr(Order_item_modifiers, sort))
            else:
                query = query.order_by(Order_item_modifiers.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching order_item_modifiers list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Order_item_modifiers]:
        """Update order_item_modifiers (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Order_item_modifiers {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated order_item_modifiers {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating order_item_modifiers {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete order_item_modifiers (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Order_item_modifiers {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted order_item_modifiers {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting order_item_modifiers {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Order_item_modifiers]:
        """Get order_item_modifiers by any field"""
        try:
            if not hasattr(Order_item_modifiers, field_name):
                raise ValueError(f"Field {field_name} does not exist on Order_item_modifiers")
            result = await self.db.execute(
                select(Order_item_modifiers).where(getattr(Order_item_modifiers, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching order_item_modifiers by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Order_item_modifiers]:
        """Get list of order_item_modifierss filtered by field"""
        try:
            if not hasattr(Order_item_modifiers, field_name):
                raise ValueError(f"Field {field_name} does not exist on Order_item_modifiers")
            result = await self.db.execute(
                select(Order_item_modifiers)
                .where(getattr(Order_item_modifiers, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Order_item_modifiers.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching order_item_modifierss by {field_name}: {str(e)}")
            raise