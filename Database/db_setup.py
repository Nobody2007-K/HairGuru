"""
HAIRGURU - Database Setup Script
---------------------------------
Creates the 'hairguru_db' database, applies schema.sql, and seeds data.

Usage:
    python db_setup.py          # create DB + schema + seed
    python db_setup.py --reset  # drop & recreate everything
"""

import sys
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from db_config import DB_CONFIG


def _read_sql_file(filename: str) -> str:
    """Read a .sql file from the same directory as this script."""
    filepath = os.path.join(os.path.dirname(__file__), filename)
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


def _connect_postgres(dbname: str = "postgres"):
    """Connect to PostgreSQL (defaults to the 'postgres' maintenance DB)."""
    conn = psycopg2.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        database=dbname,
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
    )
    return conn


def create_database(reset: bool = False):
    """Create the hairguru_db database (optionally drop it first)."""
    db_name = DB_CONFIG["database"]
    conn = _connect_postgres("postgres")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    if reset:
        # Terminate existing connections
        cur.execute(f"""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '{db_name}' AND pid <> pg_backend_pid();
        """)
        cur.execute(f"DROP DATABASE IF EXISTS {db_name};")
        print(f"[OK] Dropped database '{db_name}'")

    # Check if DB already exists
    cur.execute(
        "SELECT 1 FROM pg_database WHERE datname = %s;", (db_name,)
    )
    exists = cur.fetchone()

    if not exists:
        cur.execute(f"CREATE DATABASE {db_name};")
        print(f"[OK] Created database '{db_name}'")
    else:
        print(f"[i] Database '{db_name}' already exists")

    cur.close()
    conn.close()


def apply_schema():
    """Run schema.sql on the hairguru_db database."""
    sql = _read_sql_file("schema.sql")
    conn = _connect_postgres(DB_CONFIG["database"])
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    cur.close()
    conn.close()
    print("[OK] Schema applied successfully")


def seed_data():
    """Run seed_data.sql on the hairguru_db database."""
    sql = _read_sql_file("seed_data.sql")
    conn = _connect_postgres(DB_CONFIG["database"])
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    cur.close()
    conn.close()
    print("[OK] Seed data inserted successfully")


def verify():
    """Quick verification: print row counts for each table."""
    tables = [
        "face_shapes",
        "hairstyles",
        "face_shape_recommendations",
        "face_shape_avoid",
        "users",
        "user_analyses",
        "user_favorites",
        "user_feedback",
    ]
    conn = _connect_postgres(DB_CONFIG["database"])
    cur = conn.cursor()
    print("\n--- Table Row Counts ---")
    for table in tables:
        cur.execute(f"SELECT COUNT(*) FROM {table};")
        count = cur.fetchone()[0]
        print(f"  {table:.<35} {count}")
    cur.close()
    conn.close()
    print("")


def main():
    reset = "--reset" in sys.argv

    if reset:
        print("\n[!] RESET mode: dropping and recreating everything!\n")

    try:
        create_database(reset=reset)
        apply_schema()
        seed_data()
        verify()
        print("[OK] HAIRGURU database setup complete!\n")
    except psycopg2.Error as e:
        print(f"\n[ERROR] PostgreSQL error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
