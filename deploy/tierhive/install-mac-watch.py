#!/usr/bin/env python3
"""Install off-VPS backup pulls and external HTTPS checks for an awake Mac."""

import argparse
import os
from pathlib import Path
import plistlib
import shutil
import subprocess


def install_agent(home, label, arguments, interval, environment=None):
    agent = home / "Library" / "LaunchAgents" / f"{label}.plist"
    agent.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "Label": label,
        "ProgramArguments": arguments,
        "RunAtLoad": True,
        "StartInterval": interval,
        "StandardOutPath": str(home / "Library" / "Logs" / f"{label}.log"),
        "StandardErrorPath": str(home / "Library" / "Logs" / f"{label}.error.log"),
    }
    if environment:
        payload["EnvironmentVariables"] = environment
    with agent.open("wb") as output:
        plistlib.dump(payload, output)
    agent.chmod(0o600)
    domain = f"gui/{os.getuid()}"
    subprocess.run(["launchctl", "bootout", f"{domain}/{label}"], capture_output=True, check=False)
    subprocess.run(["launchctl", "bootstrap", domain, str(agent)], check=True)
    print(f"Installed {label}: {agent}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ssh_target", help="SSH user and host of the Toluva VPS")
    parser.add_argument("ssh_port", help="SSH port of the Toluva VPS")
    parser.add_argument("--origin", default="https://devnet.toluva.xyz")
    args = parser.parse_args()
    home = Path.home()
    directory = home / "Library" / "Application Support" / "Toluva"
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    directory.chmod(0o700)
    for name in ("data-backup.py", "pull-offsite-backup.sh", "monitor.py", "external-watch.py"):
        destination = directory / name
        shutil.copy2(Path(__file__).with_name(name), destination)
        destination.chmod(0o700)
    backup_dir = directory / "backups"
    backup_dir.mkdir(mode=0o700, exist_ok=True)
    python = shutil.which("python3")
    if not python:
        raise RuntimeError("Python 3 is required for Toluva monitoring.")
    install_agent(home, "com.toluva.offsite-backup", ["/bin/bash", str(directory / "pull-offsite-backup.sh"),
        args.ssh_target, args.ssh_port, str(backup_dir)], 6 * 60 * 60,
        {"PATH": f"{Path(python).parent}:/usr/bin:/bin:/usr/sbin:/sbin"})
    install_agent(home, "com.toluva.external-monitor", [python, str(directory / "external-watch.py")],
        30 * 60, {"TOLUVA_PUBLIC_ORIGIN": args.origin})


if __name__ == "__main__":
    main()
