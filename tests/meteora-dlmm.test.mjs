import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";
import { PublicKey } from "@solana/web3.js";
import {
  dammSpotPriceRaw, dlmmLinkMessage, parseDlmmAmount, verifyDlmmLinkSignature,
} from "../server/services/meteora-dlmm.js";

const launch = {
  creator: null,
  dbc: {
    pool: "DFxmgj3i6rRsf1p13FxuvKELZ3Ktk5MVGLNcKPu8Kbaa",
    mint: "4eRL2sk1EUdAi3YuBDfqT2xx46X5WFpN7N3xmN9QSDtj",
  },
};

test("DAMM v2 sqrt price gives the raw DLMM token/SOL ratio in both mint orientations", () => {
  const raw = dammSpotPriceRaw("41248173712355948", true);
  assert.match(raw, /^0\.00000499/);
  const inverse = dammSpotPriceRaw("41248173712355948", false);
  assert.ok(Number(raw) * Number(inverse) > 0.999);
  assert.ok(Number(raw) * Number(inverse) < 1.001);
});

test("DLMM deposit amounts preserve units and reject invalid precision", () => {
  assert.equal(parseDlmmAmount("12.345678", 6, "Token amount").toString(), "12345678");
  assert.equal(parseDlmmAmount("0.001", 9, "SOL amount").toString(), "1000000");
  assert.throws(() => parseDlmmAmount("0.0000001", 6, "Token amount"), /decimal places/);
  assert.throws(() => parseDlmmAmount("1e6", 6, "Token amount"), /positive number/);
  assert.throws(() => parseDlmmAmount("-1", 9, "SOL amount"), /positive number/);
});

test("creator-signed DLMM link binds network, DBC pool, mint, DLMM pool and expiry", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const wallet = new PublicKey(publicKey.export({ format: "der", type: "spki" }).subarray(-32)).toBase58();
  const selected = { ...launch, creator: wallet };
  const now = Date.parse("2026-10-12T12:00:00Z");
  const plan = { exists: true, address: "28fcUFiSqtMJxgwRGQw4G8dyUZGjnSXqmzq6KQxeE4U3" };
  const input = { wallet, pool: plan.address, expiresAt: Math.floor(now / 1000) + 120 };
  input.message = dlmmLinkMessage({ launch: selected, ...input });
  input.signature = sign(null, Buffer.from(input.message), privateKey).toString("base64");
  assert.equal(verifyDlmmLinkSignature(selected, input, plan, now), plan);
  assert.throws(() => verifyDlmmLinkSignature(selected, input, { ...plan, exists: false }, now), /not yet on chain/);
  assert.throws(() => verifyDlmmLinkSignature(selected, input, plan, now + 121_000), /expired/);
  assert.throws(() => verifyDlmmLinkSignature(selected, { ...input, message: input.message.replace(selected.dbc.pool, "other") }, plan, now), /differs/);
  assert.throws(() => verifyDlmmLinkSignature(selected, { ...input, signature: Buffer.alloc(64).toString("base64") }, plan, now), /did not approve/);
  assert.throws(() => verifyDlmmLinkSignature({ ...selected, creator: plan.address }, input, plan, now), /Only the launch creator/);
});
