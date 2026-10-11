#!/usr/bin/env python3
"""Check Toluva's API, chain reads, stored launches, and hosted assets."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import re
import shutil
import sys
from urllib.parse import urlparse
from urllib.request import urlopen


ASSET_PATH = re.compile(r"^/metadata/(?:images|tokens)/([0-9a-f]{64})\.(?:jpg|json)$")


def read(origin, path):
    with urlopen(f"{origin}{path}", timeout=12) as response:
        if response.status != 200:
            raise ValueError(f"{path} returned HTTP {response.status}")
        return response.read()


def check(origin, data_dir=None):
    health = json.loads(read(origin, "/api/health"))
    if health.get("ok") is not True:
        raise ValueError("API health check failed")
    registry = json.loads(read(origin, "/api/registry"))
    launches = registry.get("launches")
    if not isinstance(launches, list) or not launches:
        raise ValueError("Launch registry is empty or invalid")

    now = datetime.now(timezone.utc)
    for launch in launches:
        dbc = launch.get("dbc") or {}
        if not dbc.get("pool"):
            continue
        if dbc.get("liveStale") or not dbc.get("liveStatus"):
            raise ValueError(f"Pool status is unavailable for {launch.get('name', 'a launch')}")
        checked = dbc.get("liveCheckedAt")
        if not checked or (now - datetime.fromisoformat(checked.replace("Z", "+00:00"))).total_seconds() > 180:
            raise ValueError(f"Pool status is too old for {launch.get('name', 'a launch')}")

        metadata_uri = dbc.get("uri")
        if not isinstance(metadata_uri, str):
            continue
        metadata_path = urlparse(metadata_uri).path
        if not ASSET_PATH.fullmatch(metadata_path) or not metadata_path.endswith(".json"):
            continue
        metadata_bytes = read(origin, metadata_path)
        if hashlib.sha256(metadata_bytes).hexdigest() != ASSET_PATH.fullmatch(metadata_path).group(1):
            raise ValueError(f"Hosted metadata changed for {launch.get('name', 'a launch')}")
        metadata = json.loads(metadata_bytes)
        image_path = urlparse(metadata.get("image", "")).path
        if not ASSET_PATH.fullmatch(image_path) or not image_path.endswith(".jpg"):
            raise ValueError(f"Hosted image link is invalid for {launch.get('name', 'a launch')}")
        image = read(origin, image_path)
        if hashlib.sha256(image).hexdigest() != ASSET_PATH.fullmatch(image_path).group(1):
            raise ValueError(f"Hosted image changed for {launch.get('name', 'a launch')}")

    result = {"ok": True, "launches": len(launches)}
    if data_dir:
        disk = shutil.disk_usage(data_dir)
        if disk.used / disk.total > 0.90:
            raise ValueError("Toluva data disk is over 90% full")
        result["diskUsedPercent"] = round(disk.used / disk.total * 100, 1)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--origin", default="http://10.3.245.2:3013")
    parser.add_argument("--data-dir", default="/var/lib/toluva")
    parser.add_argument("--skip-disk", action="store_true", help="For an external HTTPS check from another machine")
    args = parser.parse_args()
    try:
        print(json.dumps(check(args.origin.rstrip("/"), None if args.skip_disk else args.data_dir)))
    except Exception as error:
        print(json.dumps({"ok": False, "problem": str(error)}), file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
