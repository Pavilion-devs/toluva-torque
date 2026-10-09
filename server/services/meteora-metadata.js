import { createHash, createPublicKey, verify } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PublicKey } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

const MAX_IMAGE_BYTES = 256 * 1024;
const MAX_METADATA_BYTES = 16 * 1024;
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const ASSET_PATH = /^(images\/[a-f0-9]{64}\.jpg|tokens\/[a-f0-9]{64}\.json)$/;

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function publicHttpsBase(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
    return url.toString().replace(/\/$/, "");
  } catch { return null; }
}

function backend(settings = config) {
  const bucket = settings.metadata?.bucket;
  if (settings.supabase?.url && settings.supabase?.serviceRoleKey && /^[a-zA-Z0-9_-]+$/.test(bucket || "")) {
    const publicBase = publicHttpsBase(`${settings.supabase.url.replace(/\/$/, "")}/storage/v1/object/public/${bucket}`);
    if (publicBase) return { type: "supabase", bucket, publicBase, settings };
  }
  const publicBase = publicHttpsBase(settings.metadata?.publicBaseUrl);
  if (settings.metadata?.directory && publicBase) {
    return { type: "local", directory: path.resolve(settings.metadata.directory), publicBase: `${publicBase}/metadata`, settings };
  }
  return null;
}

export function metadataHostingStatus(settings = config) {
  const selected = backend(settings);
  return {
    available: Boolean(selected),
    storage: selected?.type || null,
    maxImageBytes: MAX_IMAGE_BYTES,
    message: selected ? null : "Token metadata hosting is not configured. Supply a public HTTPS metadata URI or configure Toluva storage.",
  };
}

export function normalizeMetadataInput(input) {
  const name = String(input?.name || "").trim();
  const symbol = String(input?.symbol || "").trim().toUpperCase();
  const description = String(input?.description || "").trim();
  if (!name || name.length > 32) throw requestError("Token name must be 1–32 characters.");
  if (!/^[A-Z0-9]{2,10}$/.test(symbol)) throw requestError("Symbol must be 2–10 letters or numbers.");
  if (description.length > 280) throw requestError("Description must be at most 280 characters.");

  const imageDataUrl = input?.imageDataUrl || null;
  if (imageDataUrl !== null) {
    if (typeof imageDataUrl !== "string" || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(imageDataUrl)) {
      throw requestError("Token artwork must be a JPEG image.");
    }
    const image = Buffer.from(imageDataUrl.slice("data:image/jpeg;base64,".length), "base64");
    if (image.length < 5 || image.length > MAX_IMAGE_BYTES || image[0] !== 0xff || image[1] !== 0xd8 || image[2] !== 0xff
        || image[image.length - 2] !== 0xff || image[image.length - 1] !== 0xd9) {
      throw requestError("Token artwork must be a valid JPEG under 256 KB.");
    }
  }
  return { name, symbol, description, imageDataUrl };
}

export function metadataAuthorizationMessage(payload, wallet, expiresAt, cluster = config.solana.cluster) {
  return [
    "Toluva token metadata publication",
    `Network: ${cluster}`,
    `Wallet: ${wallet}`,
    `Content SHA-256: ${sha256(JSON.stringify(payload))}`,
    `Expires: ${expiresAt}`,
  ].join("\n");
}

function validatedWallet(value) {
  try { return new PublicKey(value).toBase58(); }
  catch { throw requestError("A valid Solana wallet address is required."); }
}

export function createMetadataChallenge(input, settings = config, now = Date.now()) {
  if (!backend(settings)) throw requestError("Token metadata hosting is unavailable.", 503);
  const payload = normalizeMetadataInput(input);
  const wallet = validatedWallet(input.wallet);
  const expiresAt = Math.floor(now / 1000) + 300;
  return { payload, wallet, expiresAt, message: metadataAuthorizationMessage(payload, wallet, expiresAt, settings.solana.cluster) };
}

export function verifyMetadataAuthorization(input, settings = config, now = Date.now()) {
  const payload = normalizeMetadataInput(input.payload);
  const wallet = validatedWallet(input.wallet);
  const expiresAt = Number(input.expiresAt);
  const current = Math.floor(now / 1000);
  if (!Number.isInteger(expiresAt) || expiresAt < current || expiresAt > current + 300) {
    throw requestError("Metadata approval expired. Review and sign it again.");
  }
  const message = metadataAuthorizationMessage(payload, wallet, expiresAt, settings.solana.cluster);
  if (input.message !== message) throw requestError("Metadata approval does not match the token details.");
  const signature = Buffer.from(String(input.signature || ""), "base64");
  if (signature.length !== 64) throw requestError("A valid wallet message signature is required.");
  const publicKey = createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, new PublicKey(wallet).toBuffer()]),
    format: "der",
    type: "spki",
  });
  if (!verify(null, Buffer.from(message, "utf8"), publicKey, signature)) {
    throw requestError("The connected wallet did not approve these token details.");
  }
  return payload;
}

async function storeLocal(selected, assetPath, bytes) {
  const file = path.join(selected.directory, assetPath);
  await mkdir(path.dirname(file), { recursive: true });
  try { await writeFile(file, bytes, { flag: "wx" }); }
  catch (error) { if (error.code !== "EEXIST") throw error; }
  const stored = await readFile(file);
  if (sha256(stored) !== sha256(bytes)) throw new Error("Stored metadata asset differs from the approved content.");
}

async function verifyPublicAsset(publicUrl, bytes, fetchImpl) {
  let response;
  try { response = await fetchImpl(publicUrl, { signal: AbortSignal.timeout(5000) }); }
  catch { throw new Error("Published metadata URL could not be reached. Check the public HTTPS storage domain."); }
  if (!response.ok) throw new Error("Published metadata asset is not publicly readable. Check the storage bucket or API domain.");
  const published = Buffer.from(await response.arrayBuffer());
  if (sha256(published) !== sha256(bytes)) throw new Error("Published metadata asset differs from the approved content.");
}

async function storeSupabase(selected, assetPath, bytes, contentType) {
  const client = createClient(selected.settings.supabase.url, selected.settings.supabase.serviceRoleKey);
  const storage = client.storage.from(selected.bucket);
  const { error } = await storage.upload(assetPath, bytes, { contentType, upsert: false, cacheControl: "31536000" });
  const duplicate = error && (Number(error.statusCode || error.status) === 409 || /duplicate|already exists/i.test(error.message || ""));
  if (error && !duplicate) throw new Error(`Metadata storage failed: ${error.message}`);
}

async function storeAsset(selected, assetPath, bytes, contentType, fetchImpl) {
  if (selected.type === "local") await storeLocal(selected, assetPath, bytes);
  else await storeSupabase(selected, assetPath, bytes, contentType);
  const publicUrl = `${selected.publicBase}/${assetPath}`;
  await verifyPublicAsset(publicUrl, bytes, fetchImpl);
  return publicUrl;
}

export async function publishTokenMetadata(input, { settings = config, now = Date.now(), fetchImpl = fetch } = {}) {
  const selected = backend(settings);
  if (!selected) throw requestError("Token metadata hosting is unavailable.", 503);
  const payload = verifyMetadataAuthorization(input, settings, now);
  let imageUrl = "";
  if (payload.imageDataUrl) {
    const image = Buffer.from(payload.imageDataUrl.slice("data:image/jpeg;base64,".length), "base64");
    imageUrl = await storeAsset(selected, `images/${sha256(image)}.jpg`, image, "image/jpeg", fetchImpl);
  }
  const document = {
    name: payload.name,
    symbol: payload.symbol,
    description: payload.description,
    image: imageUrl,
    attributes: [],
    properties: { files: imageUrl ? [{ uri: imageUrl, type: "image/jpeg" }] : [], category: "image" },
  };
  const bytes = Buffer.from(JSON.stringify(document));
  if (bytes.length > MAX_METADATA_BYTES) throw requestError("Token metadata is too large.");
  const uri = `${selected.publicBase}/tokens/${sha256(bytes)}.json`;
  if (uri.length > 200) throw requestError("The metadata URL is too long for a DBC token launch.", 500);
  await storeAsset(selected, `tokens/${sha256(bytes)}.json`, bytes, "application/json", fetchImpl);
  return { uri, image: imageUrl || null, metadata: document };
}

export async function readLocalMetadataAsset(assetPath, settings = config) {
  const selected = backend(settings);
  if (selected?.type !== "local" || !ASSET_PATH.test(assetPath)) return null;
  try {
    const bytes = await readFile(path.join(selected.directory, assetPath));
    const expected = assetPath.split("/")[1].split(".")[0];
    if (sha256(bytes) !== expected) return null;
    return { bytes, contentType: assetPath.endsWith(".json") ? "application/json; charset=utf-8" : "image/jpeg" };
  } catch { return null; }
}

export async function readHostedTokenMetadata(uri, { settings = config, fetchImpl = fetch } = {}) {
  const selected = backend(settings);
  if (!selected || typeof uri !== "string" || !uri.startsWith(`${selected.publicBase}/`)) return null;
  const assetPath = uri.slice(selected.publicBase.length + 1);
  if (!/^tokens\/[a-f0-9]{64}\.json$/.test(assetPath)) return null;
  try {
    let bytes;
    if (selected.type === "local") bytes = (await readLocalMetadataAsset(assetPath, settings))?.bytes;
    else {
      const response = await fetchImpl(uri);
      if (!response.ok) return null;
      bytes = Buffer.from(await response.arrayBuffer());
    }
    if (!bytes || bytes.length > MAX_METADATA_BYTES || sha256(bytes) !== assetPath.slice(7, 71)) return null;
    const document = JSON.parse(bytes.toString("utf8"));
    if (typeof document.name !== "string" || typeof document.symbol !== "string" || typeof document.description !== "string") return null;
    const image = typeof document.image === "string" && /^images\/[a-f0-9]{64}\.jpg$/.test(document.image.slice(selected.publicBase.length + 1)) && document.image.startsWith(`${selected.publicBase}/`)
      ? document.image : null;
    return { name: document.name, symbol: document.symbol, description: document.description, image };
  } catch { return null; }
}
