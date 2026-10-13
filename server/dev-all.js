import { spawn } from "node:child_process";

const children = [];

function run(name, command, args, env = {}) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  children.push(child);

  child.on("exit", (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      shutdown(code);
    }
  });
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

run("api", "node", ["server/index.js"]);
run("web", "npm", ["run", "dev:web", "--", "--host", "127.0.0.1"], {
  VITE_TOLUVA_API_URL: process.env.VITE_TOLUVA_API_URL || "http://127.0.0.1:8787",
});
