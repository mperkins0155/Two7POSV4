import os

from core.config import settings
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["runtime-config"])


class RuntimeConfig(BaseModel):
    API_BASE_URL: str


@router.get("/api/config", response_model=RuntimeConfig)
@router.get("/api/v1/config", response_model=RuntimeConfig)
async def get_runtime_config() -> RuntimeConfig:
    """Return runtime configuration for frontend bootstrapping."""
    api_base_url = os.getenv("VITE_API_BASE_URL", settings.backend_url)
    return RuntimeConfig(API_BASE_URL=api_base_url)
