import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import userRouter, contactRouter, agentRouter, productRouter, saleRouter, ticketRouter, contactDetailRouter
from app.routes import conversationRouter, mentionRouter, reviewRouter, authRouter, dashboardRouter

# Injeta a GEMINI_API_KEY no ambiente para o PydanticAI/Google SDK
# (lida do .env via pydantic-settings no config.py)
from app.config import settings
if settings.GEMINI_API_KEY:
    os.environ.setdefault("GEMINI_API_KEY", settings.GEMINI_API_KEY)

# Garante que a tabela de conversas existe no banco (cria se necessário)
from database.database import engine
from app.models.conversationModel import Conversation  # noqa: F401 — importar registra o model no metadata
from app.models.productModel import ProductActivity    # noqa: F401 — registra ft_product_activities no metadata
from app.models.saleModel import SaleActivity          # noqa: F401 — registra ft_sale_activities no metadata
from database.database import Base
Base.metadata.create_all(bind=engine, checkfirst=True)

app = FastAPI(
    title="V-Commerce CRM 360 API",
    description=(
        "API do V-Commerce CRM 360 — plataforma de gestão de clientes "
        "com agente de IA conversacional (Text-to-SQL) integrado."
    ),
    version="0.1.0",
)

# CORS config to allow requests from any origin (for development purposes)
# On production, restrict to specific origins (i.e. frontend domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(userRouter.router)
app.include_router(contactRouter.router)
app.include_router(contactDetailRouter.router)
app.include_router(agentRouter.router)
app.include_router(saleRouter.router)
app.include_router(productRouter.router)
app.include_router(conversationRouter.router)
app.include_router(mentionRouter.router)
app.include_router(reviewRouter.router)
app.include_router(authRouter.router)
app.include_router(ticketRouter.router)
app.include_router(dashboardRouter.router)

@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "running", "message": "V-Commerce CRM 360 API is running!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
