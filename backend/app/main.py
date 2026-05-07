from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import userRouter, contactRouter, productRouter

app = FastAPI(
    title="V-Commerce CRM 360 API",
    description="API for V-Commerce CRM 360, a CRM solution for e-commerce businesses.",
    version="0.0.1",
)

# CORS config to allow requests from any origin (for development purposes)
# On production, restrict to specific origins (i.e. frontend domnains)
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(userRouter.router)
app.include_router(contactRouter.router)
app.include_router(productRouter.router)

@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "running", "message": "API is running!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
