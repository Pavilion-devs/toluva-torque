#!/usr/bin/env python3
"""Check public HTTPS and notify the desktop when Toluva changes health state."""

import json
import os
from pathlib import Path
import subprocess
import sys

from monitor import check


STATE = Path.home() / "Library" / "Application Support" / "Toluva" / "monitor-state.json"
ORIGIN = os.environ.get("TOLUVA_PUBLIC_ORIGIN", "https://devnet.toluva.xyz")


def notify(message):
    script = f'display notification "{message}" with title "Toluva devnet"'
    subprocess.run(["/usr/bin/osascript", "-e", script], check=False, capture_output=True)


def main():
    STATE.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    try:
        previous = json.loads(STATE.read_text())
    except (FileNotFoundError, ValueError):
        previous = None
    try:
        result = check(ORIGIN)
    except Exception as error:
        result = {"ok": False, "problem": str(error)}
    if (previous is None and not result["ok"]) or (previous is not None and previous.get("ok") != result["ok"]):
        notify("Service needs attention. Check the monitor log." if not result["ok"] else "Service is responding again.")
    STATE.write_text(json.dumps(result) + "\n")
    STATE.chmod(0o600)
    print(json.dumps(result))
    if not result["ok"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
