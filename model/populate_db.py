import random
import json
import requests
import geojson
import argparse
from datetime import datetime, timedelta
from tqdm import tqdm
from pathlib import Path


def create_user(n_user: int):
    path = Path("../backend")
    with open(path / "tippecanoe.json", "r") as fp:
        shape = geojson.load(fp)
    fid = [feature.properties["fid"] for feature in shape.features]
    fid = random.choices(fid, k=n_user)
    for geo in tqdm(fid):
        res = requests.get("https://randomuser.me/api/")
        if res.status_code == 200:
            info = res.json()["results"][0]
            payload = {
                "name": f"{info['name']['first']}  {info['name']['last']}",
                "email": info["email"],
                "geo_group": geo,
            }
            res = requests.post(
                "http://192.168.0.101:8000/users/", data=json.dumps(payload)
            )
            if res.status_code != 200:
                print(res.json())


def create_log(n_log: int):
    res = requests.get("http://192.168.0.101:8000/users/", params={"limit": 10000})
    if res.status_code != 200:
        print("Something is wrong")

    users = res.json()
    users = random.choices(users, k=n_log)
    for user in tqdm(users):
        time = datetime.now() - timedelta(
            days=random.randint(0, 365),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
            seconds=random.randint(0, 59),
        )
        payload = {
            "user_id": user["id"],
            "weight_grams": random.randrange(10, 1500),
            "contamination": random.choices([0, 1], [0.8, 0.2])[0],
            "time": time.replace(microsecond=0).isoformat(),
        }
        res = requests.post(
            "http://192.168.0.101:8000/log_entries/", data=json.dumps(payload)
        )
        if res.status_code != 200:
            print(res.json())


def main():
    parser = argparse.ArgumentParser("simple_example")
    parser.add_argument(
        "--user",
        help="Number of users that will be created.",
        type=int,
        default=0,
    )
    parser.add_argument(
        "--log", help="Number of logs that will be created.", type=int, default=0
    )
    args = parser.parse_args()
    if args.user > 0:
        create_user(args.user)
    if args.log > 0:
        create_log(args.log)


if __name__ == "__main__":
    main()
