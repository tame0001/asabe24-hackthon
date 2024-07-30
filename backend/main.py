import random
import geojson
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/shape")
async def root():
    with open("tippecanoe.json", "r") as fp:
        shape = geojson.load(fp)
    for x in shape["features"]:
        color = "#" + "".join(random.sample("0123456789ABCDEF", 6))
        x["properties"].update({"color": color})
    return shape
