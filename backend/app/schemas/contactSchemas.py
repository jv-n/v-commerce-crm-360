from pydantic import BaseModel, ConfigDict


class ContactCreate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None


class ContactUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None


class ContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str | None
    email: str | None
    phone: str | None
    lastPurchase: str | None
    purchases: int
    engagement: str
    engagementScore: float
    createdAt: str | None


class ContactsPageOut(BaseModel):
    data: list[ContactOut]
    total: int
    page: int
    pageSize: int
