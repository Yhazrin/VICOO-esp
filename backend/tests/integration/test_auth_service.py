import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.auth.service import AuthService
from app.models.user import User
from app.security import hash_password

@pytest.mark.asyncio
async def test_auth_service_register_and_login(app):
    """
    测试 AuthService 的注册与登录全流程。
    """
    from app.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        auth_service = AuthService(db)
        
        email = "integration_test@example.com"
        password = "test_password_123"
        nickname = "TestRunner"
        
        # 1. 测试注册
        user, access, refresh = await auth_service.register_user(email, password, nickname)
        await db.commit()
        
        assert user.email == email
        assert access is not None
        assert refresh is not None
        
        # 2. 测试登录
        login_user, login_access, login_refresh = await auth_service.authenticate_user(email, password)
        assert login_user.id == user.id
        assert login_access is not None
        
        # 3. 测试错误密码
        with pytest.raises(Exception):
            await auth_service.authenticate_user(email, "wrong_pass")

@pytest.mark.asyncio
async def test_auth_service_token_refresh(app):
    """
    测试 Token 刷新逻辑。
    """
    from app.database import AsyncSessionLocal
    from app.security import create_refresh_token
    
    async with AsyncSessionLocal() as db:
        auth_service = AuthService(db)
        
        # 这里的 ID 1 是 app fixture 中 seeded 的用户
        refresh_token = create_refresh_token(subject="1", role="user")
        
        sub, role, new_access, new_refresh = await auth_service.refresh_tokens(refresh_token)
        
        assert sub == "1"
        assert new_access is not None
        assert new_refresh is not None
