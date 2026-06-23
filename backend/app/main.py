from fastapi import FastAPI

app = FastAPI(title="Noteknock")


@app.get("/health")
def health() -> str:
    return "OK"