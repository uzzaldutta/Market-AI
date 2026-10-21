"""
Main Application Entry Point for Bharat Market Intelligence Platform API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.endpoints import router as api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-Performance AI-Powered Indian Stock Market Intelligence and Quantitative Analytics Platform.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to Bharat Market Intelligence Platform API",
        "version": settings.VERSION,
        "docs": "/docs",
        "disclaimer": "Statutory Disclaimer: Market analysis and algorithmic signals are provided strictly for educational and simulation purposes and do not constitute SEBI-registered investment advice."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
