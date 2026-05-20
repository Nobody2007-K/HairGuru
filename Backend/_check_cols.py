import os, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'hairguru.settings'
django.setup()
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position")
print([r[0] for r in cursor.fetchall()])
