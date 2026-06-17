// Load .env.local into process.env so key-gated integration tests can run
// locally without exporting secrets. Unit tests don't depend on this.
import { readFileSync } from "node:fs";

try {
  const env = readFileSync(new URL("./.env.local", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && m[2] && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
} catch {
  /* no .env.local — unit tests still run */
}
