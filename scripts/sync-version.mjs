#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const version = pkg.version;

const serverTs = readFileSync("src/server.ts", "utf8");
writeFileSync(
  "src/server.ts",
  serverTs.replace(/version:\s*"[^"]*"/, `version: "${version}"`)
);

const serverJson = JSON.parse(readFileSync("server.json", "utf8"));
serverJson.version = version;
for (const p of serverJson.packages ?? []) {
  p.version = version;
}
writeFileSync("server.json", `${JSON.stringify(serverJson, null, 2)}\n`);

console.log(`Synced version ${version} to server.ts and server.json`);
