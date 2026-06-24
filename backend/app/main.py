from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import auth
from app.api import notes
from app.api import recall

app = FastAPI(title="Noteknock")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
app.include_router(recall.router, prefix="/api")


@app.get("/health")
def health() -> str:
    return "OK"
