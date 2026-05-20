from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["student", "teacher", "admin"]
NewsStatus = Literal["pending", "approved", "rejected"]


class UserBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    bio: Optional[str] = Field(default=None, max_length=1000)
    avatar_url: Optional[str] = Field(default=None, max_length=500)


class UserPublic(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: Role


class RegisterIn(UserBase):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: Role = "student"


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    user: UserPublic


class GroupCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: Optional[str] = Field(default=None, max_length=2000)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    is_private: bool = False


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    description: Optional[str] = Field(default=None, max_length=2000)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    is_private: Optional[bool] = None


class GroupPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    is_private: bool = False
    owner_id: int
    subscribers_count: int = 0
    last_message_preview: Optional[str] = None
    updated_at: Optional[datetime] = None


class GroupMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


class GroupMessagePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_id: str
    sender: UserPublic
    content: str
    created_at: datetime


class ChatCreate(BaseModel):
    recipient_ids: list[int] = Field(min_length=1)
    content: str = Field(min_length=1, max_length=10000)


class ChatSend(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


class ChatPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    participants: list[UserPublic]
    last_message_preview: Optional[str] = None
    updated_at: datetime


class ChatMessagePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    chat_id: str
    sender: UserPublic
    content: str
    created_at: datetime


class NewsCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=20000)
    group_id: Optional[str] = None


class NewsReviewAction(BaseModel):
    note: Optional[str] = Field(default=None, max_length=1000)


class NewsPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    content: str
    status: NewsStatus
    group: Optional[GroupPublic] = None
    created_by: Optional[UserPublic] = None
    reviewed_by: Optional[UserPublic] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    group_id: Optional[str] = None


class EventPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    group: Optional[GroupPublic] = None
    created_by: Optional[UserPublic] = None
    created_at: datetime


class FeedItem(BaseModel):
    id: str
    kind: Literal["news", "event"]
    title: str
    description: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    group: Optional[GroupPublic] = None
    created_by: Optional[UserPublic] = None
    created_at: datetime
    status: Optional[NewsStatus] = None


class Paginated(BaseModel):
    items: list[Any]
    page: int
    limit: int
    total: int
