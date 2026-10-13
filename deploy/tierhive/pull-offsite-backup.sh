#!/usr/bin/env bash
set -euo pipefail
umask 077

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Usage: pull-offsite-backup.sh SSH_TARGET SSH_PORT [DESTINATION]" >&2
  exit 2
fi

ssh_target="$1"
ssh_port="$2"
destination="${3:-$HOME/Documents/toluva-backups}"
mkdir -p -m 700 "$destination"

latest="$(ssh -o BatchMode=yes -p "$ssh_port" "$ssh_target" \
  "find /var/backups/toluva -maxdepth 1 -type f -name 'toluva-*.tar.gz' -printf '%f\\n' | sort | tail -n 1")"
if [[ ! "$latest" =~ ^toluva-[0-9]{8}T[0-9]{6}Z-[0-9a-f]{8}\.tar\.gz$ ]]; then
  echo "No valid Toluva backup found on the VPS." >&2
  exit 1
fi

if [[ -f "$destination/$latest" && -f "$destination/$latest.sha256" ]]; then
  if python3 "$(dirname "$0")/data-backup.py" verify "$destination/$latest" >/dev/null; then
    echo "Latest offsite backup is already verified: $destination/$latest"
    exit 0
  fi
fi

scp -q -o BatchMode=yes -P "$ssh_port" \
  "$ssh_target:/var/backups/toluva/$latest" "$destination/$latest"
scp -q -o BatchMode=yes -P "$ssh_port" \
  "$ssh_target:/var/backups/toluva/$latest.sha256" "$destination/$latest.sha256"
python3 "$(dirname "$0")/data-backup.py" verify "$destination/$latest"
