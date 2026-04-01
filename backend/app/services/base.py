from sqlalchemy.ext.asyncio import AsyncSession

class BaseService:
    """
    Base class for all business services.
    Provides access to the database session and common utilities.
    """
    def __init__(self, db: AsyncSession):
        self.db = db
