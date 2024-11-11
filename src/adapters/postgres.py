from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine


class Postgres:
    def __init__(self, url: str):
        self._engine = create_async_engine(url)
        self.session_factory = async_sessionmaker(self._engine, expire_on_commit=False)
