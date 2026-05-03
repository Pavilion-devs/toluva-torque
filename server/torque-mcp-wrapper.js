#!/usr/bin/env node
import { spawn } from "node:child_process";
import { loadEnv } from "./load-env.js";

loadEnv();

if (!process.env.TORQUE_API_KEY && process.env.TORQUE_MCP_API_KEY) {
  process.env.TORQUE_API_KEY = process.env.TORQUE_MCP_API_KEY;
}

if (!process.env.TORQUE_API_KEY) {
  console.error("Missing TORQUE_MCP_API_KEY or TORQUE_API_KEY in local .env.");
  process.exit(1);
}

const child = spawn("npx", ["--yes", "@torque-labs/mcp@latest"], {
  env: process.env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
