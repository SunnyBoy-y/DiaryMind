from fastapi import APIRouter, HTTPException, Depends, Response, Cookie
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional, Union
from . import excel_auth
import os
import secrets

router = APIRouter()

# 配置
ENV = os.getenv("ENV", "").lower()
IS_PRODUCTION = os.getenv("IS_PRODUCTION", "0") in {"1", "true", "True"}
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    # 开发环境使用临时密钥，避免将默认密钥暴露
    SECRET_KEY = secrets.token_urlsafe(64)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 密码加密上下文
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# OAuth2密码承载令牌 (保留用于Swagger UI支持，但在代码中优先使用Cookie)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# 数据模型
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class User(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: Union[str, datetime]

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# 密码验证
async def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# 获取密码哈希值
async def get_password_hash(password):
    return pwd_context.hash(password)

# 验证用户并获取用户
async def authenticate_user(username: str, password: str):
    user = excel_auth.get_user_by_username(username)
    if not user:
        return False
    if not await verify_password(password, user["password"]):
        return False
    return user

# 创建访问令牌
async def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 获取当前用户
# 优先从Cookie获取Token，如果Cookie中没有，尝试从Header获取（兼容性）
async def get_current_user(
    response: Response,
    access_token: Optional[str] = Cookie(None),
    token_header: Optional[str] = Depends(oauth2_scheme)
):
    token = access_token or token_header
    
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
        
    user = excel_auth.get_user_by_username(username=token_data.username)
    if user is None:
        raise credentials_exception
        
    return user

# 用户注册
@router.post("/register", response_model=User)
async def register(user_create: UserCreate):
    # 检查用户名是否已存在
    existing_user = excel_auth.get_user_by_username(user_create.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # 检查邮箱是否已存在
    existing_email = excel_auth.get_user_by_email(user_create.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 创建新用户
    hashed_password = await get_password_hash(user_create.password)
    new_user = excel_auth.create_user(user_create.username, user_create.email, hashed_password)
    
    return new_user

# 用户登录
@router.post("/login", response_model=Token)
async def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    # 验证用户
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = await create_access_token(
        data={"sub": user["username"]},
        expires_delta=access_token_expires
    )
    
    # 设置HttpOnly Cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=IS_PRODUCTION or ENV == "production"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# 获取当前用户信息
@router.get("/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "created_at": current_user["created_at"]
    }

# 用户登出
@router.post("/logout")
async def logout(response: Response):
    # 清除Cookie
    response.delete_cookie("access_token")
    return {"status": "success", "message": "Logged out successfully"}

# 生成日记前言
@router.post("/diary/generate-intro")
async def generate_diary_intro(
    user_id: int,
    date: str,
    mood: str = None,
    tags: str = None,
    current_user: dict = Depends(get_current_user)
):
    """
    AI生成日记前言功能
    """
    try:
        # 这里可以添加更复杂的逻辑，比如基于用户历史日记生成个性化前言
        from ..llm.qwen import LLM
        llm = LLM()
        
        # 构建prompt
        prompt = f"""
        请为用户生成一篇日记前言，基于以下信息：
        日期：{date}
        心情：{mood if mood else '未知'}
        标签：{tags if tags else '无'}
        
        要求：
        1. 前言要简洁、温馨，符合日记的风格
        2. 可以结合日期、季节、天气等元素
        3. 语言要自然流畅，有亲和力
        4. 长度控制在50-100字左右
        5. 不要添加任何额外的内容，只返回前言
        """
        
        # 调用LLM生成前言
        intro = await llm.chat(prompt, "你是一位专业的日记前言撰写助手")
        
        return {"generated_intro": intro}
    except Exception as e:
        raise HTTPException(status_code=500, detail="生成前言失败")
