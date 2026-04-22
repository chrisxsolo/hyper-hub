import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

const targetPath = path.join(process.cwd(), "node_modules", "next", "dist", "server", "server-utils.js");
const mapPath = `${targetPath}.map`;

if (await exists(targetPath)) {
  process.exit(0);
}

if (!(await exists(mapPath))) {
  console.warn("Skipping Next.js repair: missing source map for server-utils.js");
  process.exit(0);
}

const map = JSON.parse(await fs.readFile(mapPath, "utf8"));
const source = map.sourcesContent?.[0];

if (!source) {
  throw new Error("Could not repair Next.js install: server-utils.js source is missing from the sourcemap.");
}

const ts = require("typescript");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2019,
    importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    esModuleInterop: false,
    sourceMap: false,
    inlineSourceMap: false,
    newLine: ts.NewLineKind.LineFeed,
  },
});

if (!output.outputText.trim()) {
  throw new Error("Could not repair Next.js install: TypeScript produced an empty server-utils.js file.");
}

await fs.writeFile(targetPath, output.outputText, "utf8");

require(targetPath);

console.log(`Repaired missing Next.js runtime file: ${path.relative(process.cwd(), targetPath)}`);
