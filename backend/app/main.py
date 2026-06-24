from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import auth
from app.api import notes
from app.api import quiz
from app.api import activity
from app.api import recall
from app.api import attachments
from app.config import settings
from app.services.storage import StorageService


def ensure_attachment_bucket() -> None:
    if settings.storage_ensure_bucket_on_startup:
        StorageService().ensure_bucket()


@asynccontextmanager
async def lifespan(app: FastAPI):
    del app
    ensure_attachment_bucket()
    yield


app = FastAPI(title="Noteknock", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    errors = exc.errors()
    msg = "Invalid request."
    if errors:
        msg = errors[0].get("msg", msg)
        if msg.startswith("Value error, "):
            msg = msg[len("Value error, ") :]
    return JSONResponse(status_code=400, content={"detail": msg})


app.include_router(auth.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(activity.router, prefix="/api")
app.include_router(recall.router, prefix="/api")
app.include_router(attachments.router, prefix="/api")


@app.get("/health")
def health() -> str:
    return "OK"
