import { rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const exclusive = { commerce: ["tf-recommend"] };
const names = process.argv.slice(2);
if (names.length === 0) {
  console.error("usage: node tools/scripts/prune.mjs <app> [app...]");
  process.exit(1);
}

for (const name of names) {
  rmSync(`apps/${name}`, { recursive: true, force: true });
  for (const lib of exclusive[name] ?? []) {
    rmSync(`libs/${lib}`, { recursive: true, force: true });
  }
}

if (existsSync("compose.yaml")) {
  const source = readFileSync("compose.yaml", "utf8");
  const next = names.reduce((text, name) => text.replace(new RegExp(`  # service:${name}[\\s\\S]*?  # end:${name}\\n`, "g"), ""), source);
  writeFileSync("compose.yaml", next);
}

console.log(`pruned ${names.join(", ")}`);
