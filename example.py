from tkinter import scrolledtext
import requests
from bs4 import BeautifulSoup
import tkinter as tk






import requests
import concurrent.futures
import itertools
import threading

# ---------------------------------------------------
# 0 — Store ALL available API keys
# ---------------------------------------------------
API_KEYS = [


"e4e02dce98mshf88079242c695ffp103df9jsn8b26ca6fc8b7",
"80a98f7c5bmsh65608779c6603cbp100541jsn07d6226cd3e3",
"7d7a1c516emsh12ffdc7876881b7p13aa7ajsne8965e70cf2f",
"82beaef021msh5f8e00de42853b9p116d92jsnf1bb4106d583",
"f5f2e5eddfmsh5f94ce61f983dfap1f8901jsnf2605e691dbb",
"331c114fc5msh1892e1b83bef3f1p1e92c3jsn5fa1e1547ee7",
"52d0d447e1msh9d98058b77f903fp14a799jsn66e9056c359f","79ead7deb5msh1606ef261a06940p1a8e88jsn4b6536df0f01","ce88e140a0mshdc69ceb629931adp12dcf6jsne7b5f9f8f529","4ac635efdcmsh95a31076083d6b8p14564ejsnde4b8ae4464a",


]

# Thread-safe iterator for round-robin key selection
_key_lock = threading.Lock()
_key_cycle = itertools.cycle(API_KEYS)

def get_next_key():
    with _key_lock:
        return next(_key_cycle)


# ---------------------------------------------------
# Step 1 — Load full series JSON (uses rotating key)
# ---------------------------------------------------
def load_series_json():
    key = get_next_key()
    headers = {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com"
    }
    url = "https://cricbuzz-cricket.p.rapidapi.com/series/v1/11253"
    return requests.get(url, headers=headers).json()

series = load_series_json()

completed_ids = []

def extract_completed(obj):
    if isinstance(obj, dict):
        if obj.get("state") == "Complete" and "matchId" in obj:
            completed_ids.append(obj["matchId"])
        for v in obj.values():
            extract_completed(v)
    elif isinstance(obj, list):
        for item in obj:
            extract_completed(item)

extract_completed(series)
completed_ids = list(set(completed_ids))



# -------------------------------print--------------------
# Step 2 — Rotating keys for each match fetch
# ---------------------------------------------------
player_runs = {}

def process_scorecard(score):
    for innings in score.get("scorecard", []):
        for b in innings.get("batsman", []):
            name = b["name"]
            runs = b.get("runs", 0)
            player_runs[name] = player_runs.get(name, 0) + runs


def fetch(mid):
    url = f"https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/{mid}/hscard"

    for _ in range(len(API_KEYS)):      # retry using different key if needed
        key = get_next_key()
        headers = {
            "x-rapidapi-key": key,
            "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com"
        }
        try:
            res = requests.get(url, headers=headers, timeout=5)
            if res.status_code == 200:
                return res.json()
        except:
            pass   # try next key

    return None


# Thread pool
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as exe:
    all_results = list(exe.map(fetch, completed_ids))

for sc in all_results:
    if sc:
        process_scorecard(sc)


# ---------------------------------------------------
# Step 3 — Print sorted runs
# ---------------------------------------------------
sorted_runs = sorted(player_runs.items(), key=lambda x: x[1], reverse=True)


# ---------------------------------------------------
# Step 3 — Print sorted runs
# ---------------------------------------------------
sorted_runs = sorted(player_runs.items(), key=lambda x: x[1], reverse=True)


playersName=[]
playerRuns=[]

for name, runs in sorted_runs:
    playersName.append(name)
    playerRuns.append(runs)
    print("{")
    print(f"'{name}':'{runs}',")




