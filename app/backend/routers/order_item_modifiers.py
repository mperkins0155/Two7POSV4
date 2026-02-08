import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.order_item_modifiers import Order_item_modifiersService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/order_item_modifiers", tags=["order_item_modifiers"])


# ---------- Pydantic Schemas ----------
class Order_item_modifiersData(BaseModel):
    """Entity data schema (for create/update)"""
    order_item_id: int
    modifier_option_id: int = None
    modifier_name: str
    option_name: str
    price_adjustment: float = None
    created_at: Optional[datetime] = None


class Order_item_modifiersUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    order_item_id: Optional[int] = None
    modifier_option_id: Optional[int] = None
    modifier_name: Optional[str] = None
    option_name: Optional[str] = None
    price_adjustment: Optional[float] = None
    created_at: Optional[datetime] = None


class Order_item_modifiersResponse(BaseModel):
    """Entity response schema"""
    id: int
    order_item_id: int
    modifier_option_id: Optional[int] = None
    modifier_name: str
    option_name: str
    price_adjustment: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Order_item_modifiersListResponse(BaseModel):
    """List response schema"""
    items: List[Order_item_modifiersResponse]
    total: int
    skip: int
    limit: int


class Order_item_modifiersBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Order_item_modifiersData]


class Order_item_modifiersBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Order_item_modifiersUpdateData


class Order_item_modifiersBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Order_item_modifiersBatchUpdateItem]


class Order_item_modifiersBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Order_item_modifiersListResponse)
async def query_order_item_modifierss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query order_item_modifierss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying order_item_modifierss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Order_item_modifiersService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} order_item_modifierss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying order_item_modifierss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Order_item_modifiersListResponse)
async def query_order_item_modifierss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query order_item_modifierss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying order_item_modifierss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Order_item_modifiersService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} order_item_modifierss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying order_item_modifierss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Order_item_modifiersResponse)
async def get_order_item_modifiers(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single order_item_modifiers by ID (user can only see their own records)"""
    logger.debug(f"Fetching order_item_modifiers with id: {id}, fields={fields}")
    
    service = Order_item_modifiersService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Order_item_modifiers with id {id} not found")
            raise HTTPException(status_code=404, detail="Order_item_modifiers not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching order_item_modifiers {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Order_item_modifiersResponse, status_code=201)
async def create_order_item_modifiers(
    data: Order_item_modifiersData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new order_item_modifiers"""
    logger.debug(f"Creating new order_item_modifiers with data: {data}")
    
    service = Order_item_modifiersService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create order_item_modifiers")
        
        logger.info(f"Order_item_modifiers created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating order_item_modifiers: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating order_item_modifiers: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Order_item_modifiersResponse], status_code=201)
async def create_order_item_modifierss_batch(
    request: Order_item_modifiersBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple order_item_modifierss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} order_item_modifierss")
    
    service = Order_item_modifiersService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} order_item_modifierss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Order_item_modifiersResponse])
async def update_order_item_modifierss_batch(
    request: Order_item_modifiersBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple order_item_modifierss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} order_item_modifierss")
    
    service = Order_item_modifiersService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} order_item_modifierss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Order_item_modifiersResponse)
async def update_order_item_modifiers(
    id: int,
    data: Order_item_modifiersUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing order_item_modifiers (requires ownership)"""
    logger.debug(f"Updating order_item_modifiers {id} with data: {data}")

    service = Order_item_modifiersService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Order_item_modifiers with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Order_item_modifiers not found")
        
        logger.info(f"Order_item_modifiers {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating order_item_modifiers {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating order_item_modifiers {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_order_item_modifierss_batch(
    request: Order_item_modifiersBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple order_item_modifierss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} order_item_modifierss")
    
    service = Order_item_modifiersService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} order_item_modifierss successfully")
        return {"message": f"Successfully deleted {deleted_count} order_item_modifierss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_order_item_modifiers(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single order_item_modifiers by ID (requires ownership)"""
    logger.debug(f"Deleting order_item_modifiers with id: {id}")
    
    service = Order_item_modifiersService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Order_item_modifiers with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Order_item_modifiers not found")
        
        logger.info(f"Order_item_modifiers {id} deleted successfully")
        return {"message": "Order_item_modifiers deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting order_item_modifiers {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")