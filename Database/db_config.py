"""
HAIRGURU - PostgreSQL Database Configuration
---------------------------------------------
Update the values below to match your local PostgreSQL setup.
"""

DB_CONFIG = {
    "host":     "localhost",
    "port":     5432,
    "database": "hairguru_db",
    "user":     "postgres",
    "password": "2007",
}

# Connection string for use with psycopg2 / SQLAlchemy
def get_connection_string():
    """Return a PostgreSQL connection string."""
    c = DB_CONFIG
    return f"postgresql://{c['user']}:{c['password']}@{c['host']}:{c['port']}/{c['database']}"
