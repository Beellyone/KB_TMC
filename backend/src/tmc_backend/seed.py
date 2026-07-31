"""Создаёт суперпользователя admin при первом запуске."""
import asyncio

import bcrypt
from sqlalchemy import select

from .database import async_session_factory
from .models.user import User, UserRole


async def seed():
    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.username == "admin"))
        if result.scalar_one_or_none() is not None:
            return
        admin = User(
            username="admin",
            password_hash=bcrypt.hashpw(b"admin", bcrypt.gensalt()).decode(),
            fio="Администратор",
            role=UserRole.ADMIN,
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print("✅ Создан пользователь: admin / admin")


if __name__ == "__main__":
    asyncio.run(seed())
