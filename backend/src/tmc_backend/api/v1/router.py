from fastapi import APIRouter

from . import auth, contractor, specification, tmc, warehouse

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(contractor.router)
api_router.include_router(specification.router)
api_router.include_router(tmc.router)
api_router.include_router(warehouse.router)
