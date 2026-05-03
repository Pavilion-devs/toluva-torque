# Devnet Proof

This records the first full local Toluva integration loop. Runtime registry state stays in ignored local files; this document is the committed proof.

## 2026-05-03 Launch Loop

- Launch created: `TLV741`
- Mint: `HiBfFfYd1DaH1GTVajsF29dynmEYTMKnBhUqwMMgJ6eu`
- Raydium LaunchLab pool: `BdaGxNt6M9taZXdUQoFp6F4swUzmWfUwRCdQyN2v2ScB`
- Devnet transaction signature: `waujzkDajhGUoEgvjMT2Wyka45JX6H1HzjAZMCLx1cAQb15HuNgjxEgjpFZb4aEWUnrjpJMwohyi8kcAZzxBN9W`
- Torque event: `token_launch_created`
- Torque status: `ACCEPTED`
- Torque ingestion ID: `688895dc-c87e-461e-835b-198fa04fe041`

Verified loop:

```text
Raydium devnet launch -> local runtime registry record -> Torque custom event ingestion
```
