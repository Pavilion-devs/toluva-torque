# Toluva devnet operations

This protects the live devnet trial. The production hostname is `https://devnet.toluva.xyz`; the API and metadata live on a TierHive VPS, with the mutable registry and content-addressed artwork in `/var/lib/toluva`.

## Checks and backups

- `toluva-monitor.timer` runs every 15 minutes on the VPS. It checks the internal web/API route, nonempty registry, fresh on-chain status for every DBC launch, the published JSON and artwork behind hosted metadata links, and disk usage. A failure makes `toluva-monitor.service` failed and writes a plain problem to the system journal. This internal check does **not** verify external DNS or HTTPS.
- `toluva-backup.timer` runs daily at 02:15 UTC. It creates a restricted archive of `registry/registry.json` and all metadata assets under `/var/backups/toluva`. `data-backup.py` checks the registry JSON, every content-addressed asset's hash, and hosted metadata references before publishing the archive and its SHA-256 manifest. Backups are retained until an operator reviews a retention policy.
- On an awake Mac, `com.toluva.offsite-backup` pulls the latest archive every six hours into `~/Library/Application Support/Toluva/backups` and verifies its checksum. `com.toluva.external-monitor` checks public HTTPS every 30 minutes and gives a desktop notification when health changes. The latter complements the VPS's internal check: it can detect DNS, TLS, or proxy outages. These Mac jobs do not run while the computer is shut down, so they are an extra devnet safeguard, not a 24/7 production monitor.

To reinstall or move the Mac jobs, run `python3 deploy/tierhive/install-mac-watch.py SSH_TARGET SSH_PORT` from the repo. This copies the helpers into `~/Library/Application Support/Toluva` so macOS privacy controls do not block a background job from reading Documents. The standalone `deploy/tierhive/pull-offsite-backup.sh SSH_TARGET SSH_PORT [DESTINATION]` command can also be run manually. A backup stored only on the VPS does not protect against loss of that VPS.

On the VPS, inspect the latest results with `systemctl status toluva-monitor.service toluva-backup.service` and `journalctl -u toluva-monitor.service -u toluva-backup.service --since today`. Verify a downloaded archive with `python3 deploy/tierhive/data-backup.py verify PATH_TO_ARCHIVE`.

On the Mac, inspect `~/Library/Logs/com.toluva.offsite-backup.log` and `~/Library/Logs/com.toluva.external-monitor.log`. The external check reads the public `/api/health`, `/api/registry`, hosted metadata and artwork, and checks that DBC pool reads are fresh. It notifies on a healthy-to-failed or failed-to-healthy change, not on every successful run.

## Recovery drill

Restore to a **new empty directory**, never over the live data:

```bash
python3 deploy/tierhive/data-backup.py restore PATH_TO_ARCHIVE /tmp/toluva-restore-check
```

The command verifies the checksum, launch registry and asset hashes before writing. Inspect the restored tree and compare it with the live service before any cutover. For an actual recovery, stop the API, restore the selected archive to a staging directory on the new host, configure the API and web proxy, point the hostname to the new service, and only then resume writes. Keep existing metadata URLs working because on-chain tokens already reference them. Never put `/etc/toluva/api.env` in this data archive; provision server credentials separately.

## Reliability boundaries

The status API deliberately omits the full server RPC URL so a provider key in its path or query cannot become public. The current shared devnet endpoint can still rate limit requests. A dedicated RPC is needed before higher traffic; its URL belongs only in `/etc/toluva/api.env`, never in `VITE_` variables or public status responses.

This VPS is suitable for a devnet pilot, not the final home for funded or mainnet activity. [TierHive describes its service as Alpha and warns that data loss can occur](https://tierhive.com/acceptable-use.php). Move the state and public metadata to a provider with appropriate durability and independently tested recovery before a funded campaign or mainnet launch. Provider snapshots alone are not a substitute for an off-provider copy.
