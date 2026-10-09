import assert from "node:assert/strict";
import { createPrivateKey, sign } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Keypair } from "@solana/web3.js";
import {
  createMetadataChallenge,
  metadataHostingStatus,
  publishTokenMetadata,
  readHostedTokenMetadata,
  readLocalMetadataAsset,
  verifyMetadataAuthorization,
} from "../server/services/meteora-metadata.js";

const PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");
const NOW = 1_790_000_000_000;

function signChallenge(challenge, keypair) {
  const privateKey = createPrivateKey({
    key: Buffer.concat([PKCS8_PREFIX, Buffer.from(keypair.secretKey.slice(0, 32))]),
    format: "der",
    type: "pkcs8",
  });
  return sign(null, Buffer.from(challenge.message), privateKey).toString("base64");
}

test("wallet-approved metadata is published at immutable local HTTPS URLs and reread for the launch card", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "toluva-metadata-"));
  const settings = {
    solana: { cluster: "devnet" },
    supabase: {},
    metadata: { directory, publicBaseUrl: "https://metadata.toluva.test" },
  };
  const wallet = Keypair.generate();
  const imageDataUrl = `data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]).toString("base64")}`;
  const input = { name: "  Conviction Token  ", symbol: "cnv", description: " A community launch ", imageDataUrl, wallet: wallet.publicKey.toBase58() };

  try {
    assert.equal(metadataHostingStatus(settings).available, true);
    const challenge = createMetadataChallenge(input, settings, NOW);
    const approval = { ...challenge, signature: signChallenge(challenge, wallet) };
    const fetchImpl = async (url) => new Response(await readFile(path.join(directory, new URL(url).pathname.replace(/^\/metadata\//, ""))), { status: 200 });
    assert.deepEqual(verifyMetadataAuthorization(approval, settings, NOW), {
      name: "Conviction Token", symbol: "CNV", description: "A community launch", imageDataUrl,
    });

    const first = await publishTokenMetadata(approval, { settings, now: NOW, fetchImpl });
    const second = await publishTokenMetadata(approval, { settings, now: NOW, fetchImpl });
    assert.equal(first.uri, second.uri);
    assert.match(first.uri, /^https:\/\/metadata\.toluva\.test\/metadata\/tokens\/[a-f0-9]{64}\.json$/);
    assert.match(first.image, /^https:\/\/metadata\.toluva\.test\/metadata\/images\/[a-f0-9]{64}\.jpg$/);
    assert.equal(first.metadata.image, first.image);
    assert.deepEqual(await readHostedTokenMetadata(first.uri, { settings }), {
      name: "Conviction Token", symbol: "CNV", description: "A community launch", image: first.image,
    });
    assert.equal((await readLocalMetadataAsset(first.uri.split("/metadata/")[1], settings)).contentType, "application/json; charset=utf-8");

    const tokenFile = path.join(directory, "tokens", path.basename(new URL(first.uri).pathname));
    const publishedBytes = await readFile(tokenFile);
    await writeFile(tokenFile, Buffer.concat([publishedBytes, Buffer.from("tampered")]));
    assert.equal(await readHostedTokenMetadata(first.uri, { settings }), null);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("metadata approval rejects changed content, wrong wallet, bad signature and expiry", async () => {
  const settings = { solana: { cluster: "devnet" }, supabase: {}, metadata: { directory: "/tmp/toluva-test", publicBaseUrl: "https://metadata.toluva.test" } };
  const wallet = Keypair.generate();
  const challenge = createMetadataChallenge({ name: "Example", symbol: "EX", description: "", wallet: wallet.publicKey.toBase58() }, settings, NOW);
  const approval = { ...challenge, signature: signChallenge(challenge, wallet) };
  assert.throws(() => verifyMetadataAuthorization({ ...approval, payload: { ...approval.payload, name: "Another" } }, settings, NOW), /does not match/);
  assert.throws(() => verifyMetadataAuthorization({ ...approval, wallet: Keypair.generate().publicKey.toBase58() }, settings, NOW), /does not match/);
  assert.throws(() => verifyMetadataAuthorization({ ...approval, signature: Buffer.alloc(64).toString("base64") }, settings, NOW), /did not approve/);
  assert.throws(() => verifyMetadataAuthorization(approval, settings, NOW + 301_000), /expired/);
  assert.throws(() => createMetadataChallenge({ name: "Example", symbol: "EX", imageDataUrl: "data:image/jpeg;base64,ZmFrZQ==", wallet: wallet.publicKey.toBase58() }, settings, NOW), /valid JPEG/);
  assert.equal(metadataHostingStatus({ supabase: {}, metadata: {} }).available, false);
});

test("publishing stops before launch when the configured HTTPS asset cannot be read", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "toluva-metadata-unreachable-"));
  const settings = { solana: { cluster: "devnet" }, supabase: {}, metadata: { directory, publicBaseUrl: "https://unreachable.toluva.test" } };
  const wallet = Keypair.generate();
  try {
    const challenge = createMetadataChallenge({ name: "Example", symbol: "EX", wallet: wallet.publicKey.toBase58() }, settings, NOW);
    const approval = { ...challenge, signature: signChallenge(challenge, wallet) };
    await assert.rejects(publishTokenMetadata(approval, { settings, now: NOW, fetchImpl: async () => new Response("missing", { status: 404 }) }), /not publicly readable/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
