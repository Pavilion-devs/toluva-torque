#!/usr/bin/env python3
"""Create and verify portable backups of Toluva's public devnet data."""

import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import tarfile
import tempfile
from datetime import datetime, timezone
from urllib.parse import urlparse
from uuid import uuid4


HASHED_ASSET = re.compile(r"^metadata/(?:images|tokens)/([0-9a-f]{64})\.(?:jpg|json)$")


def archive_files(data_dir):
    registry = data_dir / "registry" / "registry.json"
    metadata = data_dir / "metadata"
    if not registry.is_file() or not metadata.is_dir():
        raise ValueError("Registry and metadata directories must both be present.")
    files = [("registry/registry.json", registry)]
    for file in sorted(metadata.rglob("*")):
        if file.is_symlink():
            raise ValueError(f"Refusing metadata symlink: {file}")
        if file.is_file():
            files.append((file.relative_to(data_dir).as_posix(), file))
    return files


def check_contents(contents):
    if "registry/registry.json" not in contents:
        raise ValueError("Backup is missing the launch registry.")
    registry = json.loads(contents["registry/registry.json"])
    if not isinstance(registry, dict) or not isinstance(registry.get("launches"), list):
        raise ValueError("Backup registry has an invalid launch list.")
    assets = 0
    for name, data in contents.items():
        if not name.startswith("metadata/"):
            continue
        match = HASHED_ASSET.fullmatch(name)
        if not match or hashlib.sha256(data).hexdigest() != match.group(1):
            raise ValueError(f"Metadata filename does not match its content: {name}")
        if name.endswith(".json"):
            json.loads(data)
        assets += 1
    for launch in registry["launches"]:
        for url in (launch.get("image"), (launch.get("dbc") or {}).get("uri")):
            if not isinstance(url, str):
                continue
            path = urlparse(url).path.lstrip("/")
            if path.startswith("metadata/") and path not in contents:
                raise ValueError(f"Hosted launch asset is missing: {path}")
    return {"launches": len(registry["launches"]), "assets": assets}


def verify(archive):
    contents = {}
    with tarfile.open(archive, "r:gz") as bundle:
        for member in bundle:
            name = PurePosixPath(member.name)
            if not member.isfile() or name.is_absolute() or ".." in name.parts:
                raise ValueError(f"Unsafe backup member: {member.name}")
            if member.name in contents:
                raise ValueError(f"Duplicate backup member: {member.name}")
            contents[member.name] = bundle.extractfile(member).read()
    result = check_contents(contents)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    manifest = Path(f"{archive}.sha256")
    if manifest.exists() and manifest.read_text().split()[0] != digest:
        raise ValueError("Backup checksum does not match its manifest.")
    return contents, result, digest


def create(data_dir, backup_dir):
    backup_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(backup_dir, 0o700)
    handle, temporary = tempfile.mkstemp(prefix=".toluva-", suffix=".tar.gz", dir=backup_dir)
    archive = Path(temporary)
    try:
        with os.fdopen(handle, "wb") as output:
            with tarfile.open(fileobj=output, mode="w:gz") as bundle:
                for name, file in archive_files(data_dir):
                    data = file.read_bytes()
                    info = tarfile.TarInfo(name)
                    info.size = len(data)
                    info.mode = 0o600
                    bundle.addfile(info, io.BytesIO(data))
        _, result, digest = verify(archive)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        destination = backup_dir / f"toluva-{stamp}-{uuid4().hex[:8]}.tar.gz"
        archive.replace(destination)
        manifest = Path(f"{destination}.sha256")
        manifest.write_text(f"{digest}  {destination.name}\n")
        os.chmod(manifest, 0o600)
        print(json.dumps({"archive": str(destination), "sha256": digest, **result}))
    finally:
        archive.unlink(missing_ok=True)


def restore(archive, target):
    contents, result, _ = verify(archive)
    target.mkdir(mode=0o700, parents=True, exist_ok=False)
    for name, data in contents.items():
        destination = target.joinpath(*PurePosixPath(name).parts)
        destination.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        destination.write_bytes(data)
        os.chmod(destination, 0o600)
    print(json.dumps({"restoredTo": str(target), **result}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    creation = commands.add_parser("create")
    creation.add_argument("--data-dir", type=Path, default=Path("/var/lib/toluva"))
    creation.add_argument("--backup-dir", type=Path, default=Path("/var/backups/toluva"))
    for name in ("verify", "restore"):
        command = commands.add_parser(name)
        command.add_argument("archive", type=Path)
        if name == "restore":
            command.add_argument("target", type=Path)
    args = parser.parse_args()
    os.umask(0o077)
    if args.command == "create":
        create(args.data_dir, args.backup_dir)
    elif args.command == "verify":
        _, result, digest = verify(args.archive)
        print(json.dumps({"archive": str(args.archive), "sha256": digest, **result}))
    else:
        restore(args.archive, args.target)


if __name__ == "__main__":
    main()
