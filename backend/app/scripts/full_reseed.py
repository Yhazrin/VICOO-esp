"""
One-shot full re-seed script for the admin product library cleanup.

Wipes ALL demo data (users / campaigns / artworks / orders / products /
supply chain / donations / audit logs) and re-runs the full seed from
scratch, producing a clean admin product library.

Run once on the server:

    cd /app/backend && python -m app.scripts.full_reseed

After this runs, mark the deployment as seeded so entrypoint.sh skips
auto-seed on every container restart:

    touch /data/.seed_v1

The marker /data/.seed_v1 must be present for entrypoint.sh to skip
auto-seed. To re-run the full reseed:

    rm /data/.seed_v1
    python -m app.scripts.full_reseed
    touch /data/.seed_v1
"""
import asyncio
import sys

from sqlalchemy import text

from app.database import engine, AsyncSessionLocal, Base
from app.seed import _DEMO_TRUNCATE_TABLES, seed


async def full_reseed():
    """Truncate all demo tables then re-seed from scratch.

    Uses TRUNCATE on MySQL (fast, resets auto-increment). Falls back to
    DELETE on SQLite (used in tests; TRUNCATE is not supported there).
    """
    print("=" * 60)
    print("FULL DEMO DATA RE-SEED (admin product library cleanup)")
    print("=" * 60)
    print()
    print("This will ERASE all demo data including:")
    print("  - users, campaigns, artworks, donations")
    print("  - products, supply chain records, orders, donations")
    print("  - audit logs, contact messages, editorial articles")
    print()
    print("Make sure you have a database backup if you need to roll back.")
    print()

    print("Step 1/3: Ensuring schema is up to date (must exist before wipe)...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("  Schema ready.")

    async with AsyncSessionLocal() as session:
        bind = session.get_bind()
        dialect = bind.dialect.name if bind is not None else "unknown"
        is_mysql = dialect == "mysql"

        print(f"Step 2/3: Wiping all demo tables (dialect={dialect})...")
        if is_mysql:
            await session.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        for table in _DEMO_TRUNCATE_TABLES:
            if is_mysql:
                await session.execute(text(f"TRUNCATE TABLE `{table}`"))
            else:
                # SQLite / others: TRUNCATE not supported, use DELETE
                await session.execute(text(f"DELETE FROM `{table}`"))
        if is_mysql:
            await session.execute(text("SET FOREIGN_KEY_CHECKS=1"))
        await session.commit()
        print("  Tables wiped.")

    print("Step 3/3: Running full seed...")
    print()
    await seed()

    # Quick sanity check
    async with AsyncSessionLocal() as session:
        async def _count(table: str) -> int:
            result = await session.execute(text(f"SELECT COUNT(*) FROM `{table}`"))
            return result.scalar() or 0

        product_count = await _count("products")
        user_count = await _count("users")
        campaign_count = await _count("campaigns")
        artwork_count = await _count("artworks")

    print()
    print("=" * 60)
    print("RE-SEED COMPLETE")
    print(f"  users:      {user_count}")
    print(f"  campaigns:  {campaign_count}")
    print(f"  artworks:   {artwork_count}")
    print(f"  products:   {product_count}")
    print("=" * 60)
    print()
    print("Next step: touch /data/.seed_v1 so entrypoint.sh skips auto-seed.")


def main():
    try:
        asyncio.run(full_reseed())
    except KeyboardInterrupt:
        print("\nAborted by user.")
        sys.exit(1)
    finally:
        # Don't leave the global engine open; CLI doesn't need it.
        try:
            asyncio.run(engine.dispose())
        except Exception:
            pass


if __name__ == "__main__":
    main()
