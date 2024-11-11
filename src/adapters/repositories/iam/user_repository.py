from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.iam.user import User


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def add(self, user):
        self.session.add(user)

    async def get(self, id: int) -> User | None:
        query = select(User).where(User.id == id)
        result = await self.session.execute(query)
        return result.first()
