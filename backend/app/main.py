from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

# Import the route modules
from .routes import order_router, order_item_router
from app.routes.order_routes_async import router as order_router_async

app = FastAPI()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("Validation error:", exc.errors())
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )


# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://capstone-pos.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(order_router)
app.include_router(order_item_router)
app.include_router(order_router_async)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
