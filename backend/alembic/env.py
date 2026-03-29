from logging.config import fileConfig
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import engine_from_config, pool
from sqlalchemy import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context
from app.config import settings
from app.database import Base

# Import all models to register them with Base.metadata
from app.models.user import User, ChildParticipant
from app.models.artwork import Artwork
from app.models.campaign import Campaign
from app.models.donation import Donation
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.supply_chain import SupplyChainRecord
from app.models.payment import PaymentTransaction
from app.models.audit import AuditLog
from app.models.circular_commerce import ClothingIntake, ProductReview, AfterSaleTicket

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    # Convert async driver to sync driver for offline mode
    url = url.replace("+aiomysql", "+pymysql").replace("+aiosqlite", "+sqlite3")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def get_url():
    """Get database URL from settings."""
    db_url = settings.DATABASE_URL
    # Convert sync driver to async driver for Alembic
    if "mysql+pymysql" in db_url:
        db_url = db_url.replace("mysql+pymysql", "mysql+aiomysql")
    elif "mysql" in db_url and "aiomysql" not in db_url:
        db_url = db_url.replace("mysql", "mysql+aiomysql")
    return db_url


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # Get URL from settings instead of alembic.ini
    url = get_url()
    print(f"Using database URL: {url}")

    # Create synchronous engine for migration
    # Replace async driver with sync driver for Alembic
    sync_url = url.replace("+aiomysql", "+pymysql").replace("+aiosqlite", "+sqlite3")

    connectable = engine_from_config(
        {"sqlalchemy.url": sync_url},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
