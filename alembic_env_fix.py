import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

# First, define a base class that models will use
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# Monkey-patch the database module to use our Base
import app.database
app.database.Base = Base

# Import models
from app.models import *

# Now set up alembic
from alembic import context
from sqlalchemy import create_engine, pool
from sqlalchemy.engine import Connection

# Load config
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./tonghua.db"

    class Config:
        env_file = "../.env"
        env_file_encoding = "utf-8"

settings = Settings()

async_url = settings.DATABASE_URL
sync_url = async_url.replace("+asyncpg", "+psycopg2").replace("+aiomysql", "+pymysql").replace("+aiosqlite", "")
if sync_url.startswith("sqlite+"):
    sync_url = "sqlite:///" + async_url.split("://")[1]

config = context.config
config.set_main_option("sqlalchemy.url", sync_url)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = create_engine(
        sync_url,
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        do_run_migrations(connection)

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
