from sqlalchemy import Column, Integer, String, Table
from sqlalchemy.orm import registry

from src.domain.iam.user import User

mapper_registry = registry()

user_table = Table(
    "user",
    mapper_registry.metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("name", String),
    Column("email", String, unique=True),
)


def map_imperatively():
    mapper_registry.map_imperatively(User, user_table)
