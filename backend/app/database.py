from __future__ import annotations

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import DATABASE_URL


class Base(DeclarativeBase):
    pass


engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


@event.listens_for(engine, "connect")
def enable_pragma(dbapi_connection, connection_record):
    if "sqlite" in DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    _run_migrations()


def _run_migrations():
    """Lightweight idempotent migrations for columns added after a table exists.

    SQLAlchemy's create_all does not ALTER existing tables, so add new nullable
    columns by hand when they are missing.
    """
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    try:
        existing_tables = inspector.get_table_names()
    except Exception:
        return

    if "analyses" in existing_tables:
        cols = {c["name"] for c in inspector.get_columns("analyses")}
        if "gender" not in cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE analyses ADD COLUMN gender VARCHAR(10)"))
