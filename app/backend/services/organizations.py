import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.organizations import Organizations

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class OrganizationsService:
    """Service layer for Organizations operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Optional[Organizations]:
        """Create a new organizations"""
        try:
            obj = Organizations(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created organizations with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating organizations: {str(e)}")
            raise

    async def get_by_id(self, obj_id: int) -> Optional[Organizations]:
        """Get organizations by ID"""
        try:
            query = select(Organizations).where(Organizations.id == obj_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching organizations {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of organizationss"""
        try:
            query = select(Organizations)
            count_query = select(func.count(Organizations.id))
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Organizations, field):
                        query = query.where(getattr(Organizations, field) == value)
                        count_query = count_query.where(getattr(Organizations, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Organizations, field_name):
                        query = query.order_by(getattr(Organizations, field_name).desc())
                else:
                    if hasattr(Organizations, sort):
                        query = query.order_by(getattr(Organizations, sort))
            else:
                query = query.order_by(Organizations.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching organizations list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any]) -> Optional[Organizations]:
        """Update organizations"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Organizations {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated organizations {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating organizations {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int) -> bool:
        """Delete organizations"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Organizations {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted organizations {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting organizations {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Organizations]:
        """Get organizations by any field"""
        try:
            if not hasattr(Organizations, field_name):
                raise ValueError(f"Field {field_name} does not exist on Organizations")
            result = await self.db.execute(
                select(Organizations).where(getattr(Organizations, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching organizations by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Organizations]:
        """Get list of organizationss filtered by field"""
        try:
            if not hasattr(Organizations, field_name):
                raise ValueError(f"Field {field_name} does not exist on Organizations")
            result = await self.db.execute(
                select(Organizations)
                .where(getattr(Organizations, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Organizations.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching organizationss by {field_name}: {str(e)}")
            raise